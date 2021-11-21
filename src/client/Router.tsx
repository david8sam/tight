import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import loadable, { LoadableComponent } from '@loadable/component';

import Header from './components/Header';
import AccountWrapper, { AccountWrapperProps } from './pages/AccountWrapper';

const Home = loadable(() => import('./pages/Home'));
const Game = loadable(() => import('./pages/Game'));
const ManageGames = loadable(() => import('./pages/ManageGames'));
const Planets = loadable(() => import('./pages/Planets'));
const Factions = loadable(() => import('./pages/Factions'));
const StrategyCards = loadable(() => import('./pages/StrategyCards'));
const Player = loadable(() => import('./pages/Player'));

interface MatchParams {
    id: string;
}

function renderPlayerPage(props: Record<string, unknown>, page: LoadableComponent<any>) {
    return <AccountWrapper {...props} Page={page} />;
}

function Router(props: Record<string, unknown>) {
    return (
        <BrowserRouter>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/player/:id/game" element={renderPlayerPage(props, Game)} />
                <Route path="/player/:id/manage-games" element={renderPlayerPage(props, ManageGames)} />
                <Route path="/player/:id/planets" element={renderPlayerPage(props, Planets)} />
                <Route path="/player/:id/factions" element={renderPlayerPage(props, Factions)} />
                <Route path="/player/:id/strategy-cards" element={renderPlayerPage(props, StrategyCards)} />
                <Route path="/player/:id" element={renderPlayerPage(props, Player)} />
                <Route element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default Router;
