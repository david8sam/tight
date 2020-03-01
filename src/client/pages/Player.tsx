import React, { useEffect } from 'react';
import { RouteComponentProps } from 'react-router-dom';

import { useAppContext } from '../Context';
import { ActionType } from '../reducer';

interface MatchParams {
    id: string;
}

interface PlayerProps extends RouteComponentProps<MatchParams> {}

function Player(props: PlayerProps) {
    const name = props.match.params.id;

    return <div>{`Player: ${name}`}</div>;
}

export default Player;
