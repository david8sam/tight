import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';

import loadable, { LoadableComponent } from '@loadable/component';

import Header from './components/Header';
import GameWrapper, { GameWrapperProps } from './GameWrapper';
import { isGameCode } from 'common/gameCode';
import NotFound from './pages/NotFound';

const Home = loadable(() => import('./pages/Home'));
const Game = loadable(() => import('./pages/Game'));
const GameDeleted = loadable(() => import('./pages/GameDeleted'));
const Players = loadable(() => import('./pages/Players'));
const GameResults = loadable(() => import('./pages/GameResults'));
const Objectives = loadable(() => import('./pages/Objectives'));
const Planets = loadable(() => import('./pages/Planets'));
const Factions = loadable(() => import('./pages/Factions'));
const StrategyCards = loadable(() => import('./pages/StrategyCards'));

function ValidatedGamePage({ Page }: GameWrapperProps) {
    const { gameId } = useParams();
    return gameId && !isGameCode(gameId) ? <NotFound /> : <GameWrapper Page={Page} />;
}

function GameRedirect() {
    const { gameId } = useParams();
    return gameId && isGameCode(gameId) ? <Navigate to={`/${gameId}/status`} replace /> : <NotFound />;
}

function renderGamePage(page: LoadableComponent<any>) {
    return <ValidatedGamePage Page={page} />;
}

function Router() {
    return (
        <BrowserRouter>
            <Header />
            <Routes>
                {/* Pages accessible to anonymous users */}
                <Route path="/" element={renderGamePage(Home)} />
                <Route path="/factions" element={renderGamePage(Factions)} />
                <Route path="/strategy-cards" element={renderGamePage(StrategyCards)} />

                <Route path="/:gameId" element={<GameRedirect />} />
                <Route path="/:gameId/status" element={renderGamePage(Game)} />
                <Route path="/:gameId/players" element={renderGamePage(Players)} />
                <Route path="/:gameId/results" element={renderGamePage(GameResults)} />
                <Route path="/:gameId/objectives" element={renderGamePage(Objectives)} />
                <Route path="/:gameId/planets" element={renderGamePage(Planets)} />
                <Route path="/:gameId/deleted" element={<GameDeleted />} />

                {/* Unknown paths show a recovery action */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default Router;
