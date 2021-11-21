import React, { MouseEvent, useState } from 'react';

import { ExpansionPanelDetails, Grid, Toolbar, Typography } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import {
    buildStrategyCardOwners,
    StrategyCard as StrategyCardType,
    StrategyCardIndex,
    strategyCardHasOwner,
} from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import AssignStrategyCardTable from '../components/AssignStrategyCardTable';
import { ExpansionPanel, ExpansionPanelSummary } from '../components/ExpansionPanel';
import StrategyCard from '../components/StrategyCard';
import useAccountInfo from '../hooks/useAccountInfo';

const CardsWithVersions = {
    [StrategyCardIndex.DIPLOMACY]: [StrategyCardIndex.DIPLOMACY_2],
    [StrategyCardIndex.CONSTRUCTION]: [StrategyCardIndex.CONSTRUCTION_2],
};

function StrategyPhase(props: object) {
    const { state, sendData } = useAppContext();
    const { strategyCards } = state;

    const { game, gameId, player, playerId } = useAccountInfo();
    if (!game || !player) {
        return null;
    }

    const stratCardOwners = buildStrategyCardOwners(game.players);

    const onTakeCardClick = (e: MouseEvent<HTMLButtonElement>, strategyCard: StrategyCardIndex) => {
        e.stopPropagation();

        const take = stratCardOwners[strategyCard] !== playerId;
        const type = take ? MessageType.PLAYER_TAKE_STRATEGY_CARD : MessageType.PLAYER_RETURN_STRATEGY_CARD;

        sendData({ type, data: { gameId, playerId, strategyCard } });
    };

    return (
        <Grid container direction="column">
            {strategyCards.map((card?: StrategyCardType) => {
                if (!card) {
                    return null;
                }

                const { initiative, name } = card;
                const cardOwner = stratCardOwners[initiative];
                let buttonLabel = cardOwner === playerId ? 'Return' : cardOwner || 'Take';
                let disabled =
                    (Boolean(player.strategyCard) && cardOwner !== playerId) ||
                    (Boolean(cardOwner) && cardOwner !== playerId);

                if (!cardOwner && strategyCardHasOwner(stratCardOwners, initiative)) {
                    buttonLabel = 'Nope';
                    disabled = true;
                }

                const ButtonProps = {
                    disabled,
                    onClick: (e: MouseEvent<HTMLButtonElement>) => onTakeCardClick(e, initiative),
                };

                return <StrategyCard key={name} card={card} ButtonProps={ButtonProps} buttonLabel={buttonLabel} />;
            })}
            <Toolbar />
            <ExpansionPanel disableMargin>
                <ExpansionPanelSummary disableMargin expandIcon={<ExpandMoreIcon />}>
                    <Typography>Re-assign Cards</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <AssignStrategyCardTable />
                </ExpansionPanelDetails>
            </ExpansionPanel>
        </Grid>
    );
}

export default StrategyPhase;
