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
    const [strategyCardsLoaded, setStrategyCardsLoaded] = useState(false);
    const [gameLoaded, setGameLoaded] = useState(false);

    const { dispatch, sendData } = useAppContext();
    const { game, gameId, playerId, strategyCards } = useGameInfo();

    const navigate = useNavigate();
    const params = useParams();
    const { pathname } = useLocation();
    const gameIdParam = params.gameId;

    const { Page } = props;

    const sessionGameId = sessionStorage.getItem('gameId');
    const gameIdToLoad = gameIdParam || sessionGameId;

    useEffect(() => {
        if (strategyCards.length !== 0) {
            setStrategyCardsLoaded(true);
            return;
        }

        setStrategyCardsLoaded(false);
        api.strategyCardList().then(cards => {
            dispatch({ type: ActionType.setStrategyCards, payload: cards });
        });
    }, [strategyCards]);

    useEffect(() => {
        if (!gameIdToLoad) {
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
                    dispatch({ type: ActionType.setPlayerId, payload: undefined });
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
    }, [gameIdToLoad]);

    useEffect(() => {
        if (game) {
            setGameLoaded(true);
        }

        if (pathname !== '/' && game?.status.ended) {
            navigate(`/${gameId}/results`);
        }
    }, [game]);

    if (!strategyCardsLoaded || (gameIdToLoad && !gameLoaded)) {
        return (
            <Grid sx={{ height: '100%' }} container justifyContent="center" alignItems="center" direction="column">
                <CircularProgress size="50vw" />
            </Grid>
        );
    }

    return <Page />;
}
