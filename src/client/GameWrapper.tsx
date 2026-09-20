import React, { ElementType, ReactElement, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

import { CircularProgress, Grid } from '@mui/material';

import { MessageType } from 'common/message';

import useGameInfo from './hooks/useGameInfo';
import api from './utils/api';

import { useAppContext } from './Context';
import { ActionType } from './reducer';

export interface GameWrapperProps {
    Page: ElementType;
}

/**
 * Wrapper to manage reading session store data and loading game and player
 * data before rendering the page.
 */
export default function GameWrapper(props: GameWrapperProps): ReactElement {
    const [gameLoaded, setGameLoaded] = useState(false);

    const {
        state: { initialized },
        dispatch,
        sendData,
    } = useAppContext();
    const { game, gameId, playerId, strategyCards } = useGameInfo();
    const strategyCardsLoaded = strategyCards.length > 0;

    const navigate = useNavigate();
    const params = useParams();
    useLocation();

    const { pathname } = window.location;
    const gameIdParam = params.gameId;

    const { Page } = props;

    const sessionGameId = sessionStorage.getItem('gameId');
    const gameIdToLoad = gameIdParam || sessionGameId;
    const pathnameLowerCase = pathname.toLowerCase();
    const isGamePage = gameIdToLoad ? pathnameLowerCase.includes(gameIdToLoad.toLowerCase()) : false;
    const isStatusPage = isGamePage && pathnameLowerCase.includes('/status');

    useEffect(() => {
        // Must also wait for the app to be initialized from server data
        // before modifying app state to prevent overwriting data
        if (!initialized || strategyCards.length !== 0) {
            return;
        }

        api.strategyCardList().then(cards => {
            dispatch({ type: ActionType.setStrategyCards, payload: cards });
        });
    }, [initialized, strategyCards]);

    // Ensure game data is loaded from the server.
    useEffect(() => {
        if (!initialized || !gameIdToLoad) {
            return;
        }

        if (gameIdToLoad === gameId) {
            setGameLoaded(true);
            return;
        }

        // Need to load the game
        setGameLoaded(false);
        api.gameValidate({ gameId: gameIdToLoad }).then(exists => {
            if (exists) {
                // Handle page refresh.
                // If same game, use same player ID if exists.
                // If different game, clear player ID so it'll bring up the player select dialog.
                if (sessionGameId !== gameIdToLoad) {
                    sessionStorage.setItem('gameId', gameIdToLoad || '');
                    dispatch({ type: ActionType.setPlayerId, payload: '' });
                }

                const sessionPlayerId = sessionStorage.getItem('playerId');
                if (playerId !== sessionPlayerId) {
                    dispatch({ type: ActionType.setPlayerId, payload: playerId });
                }

                sendData({
                    type: MessageType.GAME_LOAD,
                    data: { gameId: gameIdToLoad, playerId },
                });
            } else {
                sessionStorage.setItem('gameId', '');
                sessionStorage.setItem('playerId', '');
                navigate(`/${gameIdToLoad}/deleted`);
            }
        });
    }, [initialized, gameIdToLoad, gameId, playerId]);

    useEffect(() => {
        // Ensure local state is synced to the game loaded status
        if (gameId && gameId === gameIdParam) {
            setGameLoaded(true);

            // Redirect status page to the results page if the game has ended
            if (isStatusPage && game?.status.ended) {
                navigate(`/${gameId}/results`);
            }
        }
    }, [game, gameId, gameIdParam, isStatusPage]);

    // If path is just the game ID, redirect to main status page.
    useEffect(() => {
        if (gameId && pathnameLowerCase === `/${gameId.toLowerCase()}`) {
            navigate(`/${gameId}/status`);
        }
    }, [pathname]);

    // Wait until the app is initialized, strategy cards are fetched, and
    // if there is an active game, it is fully loaded.
    if (!initialized || !strategyCardsLoaded || (gameIdToLoad && !gameLoaded)) {
        return (
            <Grid sx={{ height: '100%' }} container justifyContent="center" alignItems="center" direction="column">
                <CircularProgress size="50vw" />
            </Grid>
        );
    }

    return <Page />;
}
