import { Grid } from '@mui/material';
import React from 'react';

import FactionsSetup from '../components/FactionsSetup';
import GameInfoToolbar from '../components/GameInfoToolbar';
import useGameInfo from '../hooks/useGameInfo';

/**
 * Player info and edit page
 */
function Players() {
    const { game } = useGameInfo();

    if (!game) {
        return null;
    }

    return (
        <Grid container direction="column">
            <GameInfoToolbar game={game} />
            <Grid>
                <FactionsSetup disableFactionSelect disableColorNone />
            </Grid>
        </Grid>
    );
}

export default Players;
