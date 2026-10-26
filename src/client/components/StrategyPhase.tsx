import React, { MouseEvent } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Grid, Toolbar, Typography } from '@mui/material';

import {
    StrategyCardIndex,
    buildStrategyCardOwners,
    getFactionTurn,
    getStrategyCardOwner,
    getNaalu,
} from 'common/Game';
import { MessageType } from 'common/message';

import AssignStrategyCardTable from '../components/AssignStrategyCardTable';
import useGameInfo from '../hooks/useGameInfo';

import { useAppContext } from '../Context';
import { Accordion, AccordionDetails, AccordionSummary } from './Accordion';
import NaaluZeroSelect from './NaaluZeroSelect';
import StrategyCard, { StrategyCardProps } from './StrategyCard';

function StrategyPhase() {
    const { sendData } = useAppContext();
    const { game, gameId, playerId, strategyCards, canEditTable, canEditPublicFaction } = useGameInfo();
    if (!game) {
        return null;
    }

    const factionName = getFactionTurn(game);
    const stratCardOwners = buildStrategyCardOwners(game);
    const isSpectator = !canEditTable;

    const onTakeCardClick = (e: MouseEvent<HTMLButtonElement>, strategyCard: StrategyCardIndex) => {
        e.stopPropagation();

        const held = getStrategyCardOwner(stratCardOwners, strategyCard);
        const owner = held?.owner;
        const card = held?.card ?? strategyCard;
        const take = !Boolean(owner);
        const type = take ? MessageType.TAKE_STRATEGY_CARD : MessageType.RETURN_STRATEGY_CARD;

        sendData({ type, data: { gameId, factionName: take ? factionName : owner, strategyCard: card } });
    };

    let naaluZeroSelect = null;
    if (getNaalu(game) && !isSpectator) {
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
            {strategyCards.map(card => {
                if (!card) {
                    return null;
                }

                const { initiative, name } = card;
                const cardOwner = getStrategyCardOwner(stratCardOwners, initiative)?.owner;
                let buttonLabel = cardOwner ? 'Return' : 'Take';

                const ButtonProps: NonNullable<StrategyCardProps['ButtonProps']> = {
                    'aria-label': `${buttonLabel} ${name}`,
                    disabled:
                        !canEditPublicFaction(cardOwner || factionName) || (factionName === 'END' && !Boolean(cardOwner)),
                    onClick: (e: MouseEvent<HTMLButtonElement>) => onTakeCardClick(e, initiative),
                };

                return (
                    <StrategyCard
                        key={name}
                        card={card}
                        owner={cardOwner}
                        ButtonProps={ButtonProps}
                        buttonLabel={buttonLabel}
                    />
                );
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
