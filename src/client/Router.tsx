import React from 'react';
import { BrowserRouter, Redirect, Route, Switch, RouteComponentProps } from 'react-router-dom';

import loadable, { LoadableComponent } from '@loadable/component';

import Header from './components/Header';
import AccountWrapper from './pages/AccountWrapper';

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

function renderPlayerPage(props: RouteComponentProps<MatchParams>, page: LoadableComponent<any>) {
    return <AccountWrapper {...props} Page={page} />;
}

function Router(props: object) {
    return (
        <BrowserRouter>
            <Header />
            <Switch>
                <Route exact path="/" component={Home} />
                <Route exact path="/player/:id/game" render={props => renderPlayerPage(props, Game)} />
                <Route exact path="/player/:id/manage-games" render={props => renderPlayerPage(props, ManageGames)} />
                <Route exact path="/player/:id/planets" render={props => renderPlayerPage(props, Planets)} />
                <Route exact path="/player/:id/factions" render={props => renderPlayerPage(props, Factions)} />
                <Route
                    exact
                    path="/player/:id/strategy-cards"
                    render={props => renderPlayerPage(props, StrategyCards)}
                />
                <Route exact path="/player/:id" render={props => renderPlayerPage(props, Player)} />
                <Route>
                    <Redirect to="/" />
                </Route>
            </Switch>
        </BrowserRouter>
    );
}

export default Router;
