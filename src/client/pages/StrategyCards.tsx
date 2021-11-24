import React from 'react';
import { Grid } from '@material-ui/core';

import { StrategyCard as StrategyCardType } from 'common/Game';

import { useAppContext } from '../Context';
import StrategyCard from '../components/StrategyCard';

function StrategyCards() {
    const { state } = useAppContext();
    const { strategyCards } = state;
    const cards = strategyCards.filter(c => Boolean(c));

    return (
        <Grid container direction="column">
            {cards.map((card: StrategyCardType) => (
                <StrategyCard key={card.initiative} card={card} hideButton />
            ))}
        </Grid>
    );
}

export default StrategyCards;
