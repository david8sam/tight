import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import GamesTable from '../components/GamesTable';

interface MatchParams {
    id: string;
}

interface GameProps extends RouteComponentProps<MatchParams> {}

function ManageGames(props: GameProps) {
    return <GamesTable />;
}

export default ManageGames;
