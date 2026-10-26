import React, { ElementType, ReactElement, useEffect, useState } from 'react';
import { sessionHints } from './utils/sessionHints';
import { useLocation, useNavigate, useParams } from 'react-router';

import { Button, CircularProgress, Grid, Typography } from '@mui/material';

import { MessageType } from 'common/message';

import useGameInfo from './hooks/useGameInfo';
import api from './utils/api';

import { useAppContext } from './Context';
import { ActionType } from './reducer';

export interface GameWrapperProps {
    Page: ElementType;
}

/**
 * Wrapper to manage reading optional tab hints and loading game and player
 * data before rendering the page.
 */
export default function GameWrapper(props: GameWrapperProps): ReactElement {
    const [gameLoaded, setGameLoaded] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [catalogError, setCatalogError] = useState(false);
    const [loadAttempt, setLoadAttempt] = useState(0);

    const {
        state: { initialized, snapshotSequence },
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

    const sessionGameId = sessionHints.getItem('gameId');
    const gameIdToLoad = gameIdParam;
    const pathnameLowerCase = pathname.toLowerCase();
    const isGamePage = gameIdToLoad ? pathnameLowerCase.includes(gameIdToLoad.toLowerCase()) : false;
    const isStatusPage = isGamePage && pathnameLowerCase.includes('/status');

    useEffect(() => {
        // Must also wait for the app to be initialized from server data
        // before modifying app state to prevent overwriting data
        if (!initialized || strategyCards.length !== 0) {
            return;
        }

        const controller = new AbortController();
        setCatalogError(false);
        api.strategyCardList(undefined, { signal: controller.signal })
            .then(cards => {
                if (!controller.signal.aborted) dispatch({ type: ActionType.setStrategyCards, payload: cards });
            })
            .catch(() => {
                if (!controller.signal.aborted) setCatalogError(true);
            });
        return () => controller.abort();
    }, [initialized, strategyCards, loadAttempt]);

    // Ensure game data is loaded from the server.
    useEffect(() => {
        if (!initialized || !gameIdToLoad) {
            return;
        }

        if (gameIdToLoad === gameId) {
            setLoadError(false);
            setGameLoaded(true);
            return;
        }

        setGameLoaded(false);
        setLoadError(false);
        const controller = new AbortController();
        api.gameValidate({ gameId: gameIdToLoad }, { signal: controller.signal })
            .then(exists => {
                if (controller.signal.aborted) return;
                if (exists) {
                    const nextPlayerId =
                        sessionGameId === gameIdToLoad ? sessionHints.getItem('playerId') || null : null;
                    sessionHints.setItem('gameId', gameIdToLoad);
                    if (playerId !== nextPlayerId) dispatch({ type: ActionType.setPlayerId, payload: nextPlayerId });
                    sendData({ type: MessageType.GAME_LOAD, data: { gameId: gameIdToLoad, playerId: nextPlayerId } });
                } else {
                    sessionHints.removeItem('gameId');
                    sessionHints.removeItem('playerId');
                    navigate(`/${gameIdToLoad}/deleted`);
                }
            })
            .catch(() => {
                if (!controller.signal.aborted) setLoadError(true);
            });
        return () => {
            controller.abort();
        };
    }, [initialized, snapshotSequence, gameIdToLoad, gameId, playerId, loadAttempt]);

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

    if (catalogError || (gameIdToLoad && loadError)) {
        return (
            <Grid container direction="column" alignItems="center" sx={{ p: 3 }}>
                <Typography role="alert">Could not load game data. Check the host connection and try again.</Typography>
                <Button onClick={() => setLoadAttempt(value => value + 1)}>Retry loading game</Button>
            </Grid>
        );
    }

    // Wait until the app is initialized, strategy cards are fetched, and
    // if there is an active game, it is fully loaded.
    if (!initialized || !strategyCardsLoaded || (gameIdToLoad && (!gameLoaded || gameId !== gameIdToLoad))) {
        return (
            <Grid sx={{ height: '100%' }} container justifyContent="center" alignItems="center" direction="column">
                <CircularProgress aria-label="Loading game" size="50vw" />
            </Grid>
        );
    }

    return <Page />;
}
