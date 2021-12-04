import React, { MouseEvent } from 'react';

import { Grid, Toolbar, Typography } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import {
    buildStrategyCardOwners,
    GameJoinStatus,
    getNaaluPlayer,
    StrategyCard as StrategyCardType,
    strategyCardHasOwner,
    StrategyCardIndex,
} from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import AssignStrategyCardTable from '../components/AssignStrategyCardTable';
import useAccountInfo from '../hooks/useAccountInfo';
import { Accordion, AccordionDetails, AccordionSummary } from './Accordion';
import NaaluZeroSelect from './NaaluZeroSelect';
import StrategyCard from './StrategyCard';

function StrategyPhase() {
    const { state, sendData } = useAppContext();
    const { strategyCards } = state;

    const { game, gameId, player, playerId } = useAccountInfo();
    if (!game || !player) {
        return null;
    }

    const stratCardOwners = buildStrategyCardOwners(game);

    const onTakeCardClick = (e: MouseEvent<HTMLButtonElement>, strategyCard: StrategyCardIndex) => {
        e.stopPropagation();

        const take = stratCardOwners[strategyCard] !== playerId;
        const type = take ? MessageType.PLAYER_TAKE_STRATEGY_CARD : MessageType.PLAYER_RETURN_STRATEGY_CARD;

        sendData({ type, data: { gameId, playerId, strategyCard } });
    };

    const isAdmin = player.joinStatus === GameJoinStatus.ADMIN;
    const isSpectator = player.joinStatus === GameJoinStatus.SPECTATOR;

    let naaluZeroSelect = null;
    if (!isSpectator && getNaaluPlayer(game)) {
        naaluZeroSelect = (
            <>
                <Toolbar />
                <Toolbar>
                    <Grid container justifyContent="space-between" alignItems="center" spacing={1}>
                        <Grid item xs={3}>
                            <Typography align="center">Naalu "0":</Typography>
                        </Grid>
                        <Grid item xs={9}>
                            <NaaluZeroSelect fullWidth />
                        </Grid>
                    </Grid>
                </Toolbar>
            </>
        );
    }

    return (
        <Grid container direction="column">
            {strategyCards.map((card?: StrategyCardType) => {
                if (!card) {
                    return null;
                }

                const { initiative, name } = card;
                const cardOwner = stratCardOwners[initiative];
                let buttonLabel = cardOwner === playerId ? 'Return' : cardOwner || 'Take';

                // Admins can't take/return cards with buttons, should the Assign UI instead.
                let disabled =
                    isAdmin ||
                    isSpectator ||
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
            {naaluZeroSelect}
            <Toolbar />
            {!isSpectator && (
                <Accordion disableMargin>
                    <AccordionSummary disableMargin expandIcon={<ExpandMoreIcon />}>
                        <Typography>Assign Cards</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <AssignStrategyCardTable />
                    </AccordionDetails>
                </Accordion>
            )}
        </Grid>
    );
}

export default StrategyPhase;
