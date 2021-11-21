import React from 'react';
import { useParams } from 'react-router-dom';

function Player() {
    const params = useParams();
    const name = params.id;

    // TODO: More stuff

    return <div>{`Player: ${name}`}</div>;
}

export default Player;
