import React, { MouseEvent, useState } from 'react';

import { ExpansionPanelDetails, Grid, Toolbar, Typography } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { StrategyCard as StrategyCardType, StrategyCardIndex } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import AssignStrategyCardTable from '../components/AssignStrategyCardTable';
import { ExpansionPanel, ExpansionPanelSummary } from '../components/ExpansionPanel';
import StrategyCard from '../components/StrategyCard';
import useAccountInfo from '../hooks/useAccountInfo';

function StrategyPhase(props: object) {
    const { state, sendData } = useAppContext();
    const { strategyCards } = state;

    const { game, gameId, player, playerId } = useAccountInfo();
    if (!game || !player) {
        return null;
    }

    const playersArray = Object.values(game.players);
    const stratCardOwners: string[] = [''];
    playersArray.forEach(p => (p.strategyCard ? (stratCardOwners[p.strategyCard] = p.name) : null));

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

                const buttonLabel = cardOwner === playerId ? 'Return' : cardOwner || 'Take';
                const ButtonProps = {
                    disabled:
                        (Boolean(player.strategyCard) && cardOwner !== playerId) ||
                        (Boolean(cardOwner) && cardOwner !== playerId),
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
