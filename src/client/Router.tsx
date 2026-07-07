import React, { ComponentType, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { CircularProgress, Grid } from '@mui/material';

import AppShell from './components/AppShell';
import GameWrapper from './GameWrapper';

const Home = React.lazy(() => import('./pages/Home'));
const Game = React.lazy(() => import('./pages/Game'));
const GameDeleted = React.lazy(() => import('./pages/GameDeleted'));
const Players = React.lazy(() => import('./pages/Players'));
const GameResults = React.lazy(() => import('./pages/GameResults'));
const Objectives = React.lazy(() => import('./pages/Objectives'));
const Planets = React.lazy(() => import('./pages/Planets'));
const Factions = React.lazy(() => import('./pages/Factions'));
const StrategyCards = React.lazy(() => import('./pages/StrategyCards'));

const PageFallback = (
    <Grid sx={{ height: '100%' }} container justifyContent="center" alignItems="center" direction="column">
        <CircularProgress size="50vw" />
    </Grid>
);

function renderGamePage(page: ComponentType) {
    return <GameWrapper Page={page} />;
}

function Router() {
    return (
        <BrowserRouter>
            <AppShell>
                <Suspense fallback={PageFallback}>
                    <Routes>
                        {/* Pages accessible to anonymous users */}
                        <Route path="/" element={renderGamePage(Home)} />
                        <Route path="/factions" element={renderGamePage(Factions)} />
                        <Route path="/strategy-cards" element={renderGamePage(StrategyCards)} />

                        <Route path="/:gameId" element={renderGamePage(Game)} />
                        <Route path="/:gameId/status" element={renderGamePage(Game)} />
                        <Route path="/:gameId/players" element={renderGamePage(Players)} />
                        <Route path="/:gameId/results" element={renderGamePage(GameResults)} />
                        <Route path="/:gameId/objectives" element={renderGamePage(Objectives)} />
                        <Route path="/:gameId/planets" element={renderGamePage(Planets)} />
                        <Route path="/:gameId/deleted" element={<GameDeleted />} />

                        {/* Redirect all other pages to home */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Suspense>
            </AppShell>
        </BrowserRouter>
    );
}

export default Router;
