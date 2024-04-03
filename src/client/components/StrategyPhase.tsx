import React, { MouseEvent, useEffect, useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Grid, Toolbar, Typography } from '@mui/material';

import {
    StrategyCardIndex,
    StrategyCard as StrategyCardType,
    buildStrategyCardOwners,
    getFactionTurn,
    getNaalu,
    isPlayerSpectator,
} from 'common/Game';
import { MessageType } from 'common/message';

import AssignStrategyCardTable from '../components/AssignStrategyCardTable';
import useGameInfo from '../hooks/useGameInfo';
import api from '../utils/api';

import { useAppContext } from '../Context';
import { Accordion, AccordionDetails, AccordionSummary } from './Accordion';
import NaaluZeroSelect from './NaaluZeroSelect';
import StrategyCard, { StrategyCardProps } from './StrategyCard';

function StrategyPhase() {
    const { sendData } = useAppContext();
    const [strategyCards, setStrategryCards] = useState<StrategyCardType[]>([]);

    useEffect(() => {
        api.strategyCardList().then(cards => setStrategryCards(cards));
    }, []);

    const { game, gameId, playerId } = useGameInfo();
    if (!game) {
        return null;
    }

    const factionName = getFactionTurn(game);
    const stratCardOwners = buildStrategyCardOwners(game);
    const isSpectator = isPlayerSpectator(game, playerId);

    const onTakeCardClick = (e: MouseEvent<HTMLButtonElement>, strategyCard: StrategyCardIndex) => {
        e.stopPropagation();

        const owner = stratCardOwners[strategyCard];
        const take = !Boolean(owner);
        const type = take ? MessageType.TAKE_STRATEGY_CARD : MessageType.RETURN_STRATEGY_CARD;

        sendData({ type, data: { gameId, factionName: take ? factionName : owner, strategyCard } });
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
            {strategyCards.map((card?: StrategyCardType) => {
                if (!card) {
                    return null;
                }

                const { initiative, name } = card;
                const cardOwner = stratCardOwners[initiative];
                let buttonLabel = cardOwner ? 'Return' : 'Take';

                const ButtonProps: NonNullable<StrategyCardProps['ButtonProps']> = {
                    disabled: isSpectator || (factionName === 'END' && !Boolean(cardOwner)),
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
