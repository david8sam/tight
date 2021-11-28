import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import loadable, { LoadableComponent } from '@loadable/component';

import Header from './components/Header';
import AccountWrapper from './pages/AccountWrapper';

const Home = loadable(() => import('./pages/Home'));
const Game = loadable(() => import('./pages/Game'));
const ManageGames = loadable(() => import('./pages/ManageGames'));
const GameResults = loadable(() => import('./pages/GameResults'));
const Objectives = loadable(() => import('./pages/Objectives'));
const Planets = loadable(() => import('./pages/Planets'));
const Factions = loadable(() => import('./pages/Factions'));
const StrategyCards = loadable(() => import('./pages/StrategyCards'));
const Player = loadable(() => import('./pages/Player'));

function renderPlayerPage(page: LoadableComponent<any>) {
    return <AccountWrapper Page={page} />;
}

function Router() {
    return (
        <BrowserRouter>
            <Header />
            <Routes>
                {/* Pages accessible to anonymous users */}
                <Route path="/" element={<Home />} />
                <Route path="factions" element={<Factions />} />
                <Route path="strategy-cards" element={<StrategyCards />} />

                {/* Logged in player specific pages */}
                <Route path="/player/:id/game" element={renderPlayerPage(Game)} />
                <Route path="/player/:id/manage-games" element={renderPlayerPage(ManageGames)} />
                <Route path="/player/:id/game-results" element={renderPlayerPage(GameResults)} />
                <Route path="/player/:id/objectives" element={renderPlayerPage(Objectives)} />
                <Route path="/player/:id/planets" element={renderPlayerPage(Planets)} />
                <Route path="/player/:id" element={renderPlayerPage(Player)} />
                <Route path="/player/:id/factions" element={renderPlayerPage(Factions)} />
                <Route path="/player/:id/strategy-cards" element={renderPlayerPage(StrategyCards)} />

                {/* Redirect all other pages to home */}
                <Route element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default Router;
