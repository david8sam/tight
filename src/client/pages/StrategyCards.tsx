import React from 'react';

import { makeStyles } from 'tss-react/mui';

import { StrategyCard as StrategyCardType } from 'common/Game';

import StrategyCard from '../components/StrategyCard';
import { PageContainer } from '../components/ui';
import useGameInfo from '../hooks/useGameInfo';

const useStyles = makeStyles()(theme => ({
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1),
    },
}));

function StrategyCards() {
    const { classes } = useStyles();
    const { strategyCards } = useGameInfo();

    return (
        <PageContainer maxWidth={760}>
            <div className={classes.list}>
                {strategyCards.map((card: StrategyCardType) => (
                    <StrategyCard key={card.initiative} card={card} hideButton />
                ))}
            </div>
        </PageContainer>
    );
}

export default StrategyCards;
