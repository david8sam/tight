import { Grid } from '@mui/material';
import React from 'react';

import { StrategyCard as StrategyCardType } from 'common/Game';

import StrategyCard from '../components/StrategyCard';
import useGameInfo from '../hooks/useGameInfo';

function StrategyCards() {
    const { strategyCards } = useGameInfo();

    return (
        <Grid container direction="column">
            {strategyCards.map((card: StrategyCardType) => (
                <StrategyCard key={card.initiative} card={card} hideButton />
            ))}
        </Grid>
    );
}

export default StrategyCards;
