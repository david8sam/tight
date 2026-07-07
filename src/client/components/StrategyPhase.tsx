import React, { MouseEvent, useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button, Collapse, IconButton, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import {
    StrategyCardIndex,
    StrategyCard as StrategyCardType,
    buildStrategyCardOwners,
    getFactionTurn,
    getNaalu,
    isPlayerSpectator,
} from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';

import AssignStrategyCardTable from './AssignStrategyCardTable';
import { Accordion, AccordionDetails, AccordionSummary } from './Accordion';
import NaaluZeroSelect from './NaaluZeroSelect';
import StrategyCardDetails from './StrategyCardDetails';
import { FactionColorChip, Panel, SectionHeader } from './ui';

function getCardOwnwer(
    card: StrategyCardIndex,
    stratCardOwners: string[],
): { owner: string | undefined; card: StrategyCardIndex } {
    let owner = stratCardOwners[card];
    let actualCard = card;

    // Special case for 2 versions of diplomacy.
    if (card === StrategyCardIndex.DIPLOMACY && !owner && stratCardOwners[StrategyCardIndex.DIPLOMACY_2]) {
        owner = stratCardOwners[StrategyCardIndex.DIPLOMACY_2];
        actualCard = StrategyCardIndex.DIPLOMACY_2;
    } else if (card === StrategyCardIndex.DIPLOMACY_2 && !owner && stratCardOwners[StrategyCardIndex.DIPLOMACY]) {
        owner = stratCardOwners[StrategyCardIndex.DIPLOMACY];
        actualCard = StrategyCardIndex.DIPLOMACY;
    }

    return { owner, card: actualCard };
}

const useStyles = makeStyles()(theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1),
        padding: theme.spacing(1.5),
    },
    cardRow: {
        padding: theme.spacing(1, 1.25),
    },
    rowHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1.25),
        cursor: 'pointer',
        minWidth: 0,
    },
    initiative: {
        width: 22,
        height: 22,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
    },
    name: {
        fontFamily: '"Orbitron", sans-serif',
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.03em',
        flexShrink: 0,
    },
    owner: {
        minWidth: 0,
        flex: 1,
        color: theme.palette.text.secondary,
        fontSize: 12.5,
    },
    spacer: {
        flex: 1,
    },
    expandIcon: {
        transition: theme.transitions.create('transform', { duration: theme.transitions.duration.shortest }),
    },
    expanded: {
        transform: 'rotate(180deg)',
    },
    details: {
        paddingTop: theme.spacing(1),
    },
    naalu: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1.5),
        padding: theme.spacing(1, 1.25),
    },
    naaluLabel: {
        whiteSpace: 'nowrap',
    },
}));

function StrategyPhase() {
    const { classes, cx } = useStyles();
    const theme = useTheme();
    const { sendData } = useAppContext();
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    const { game, gameId, playerId, strategyCards } = useGameInfo();
    if (!game) {
        return null;
    }

    const factionName = getFactionTurn(game);
    const stratCardOwners = buildStrategyCardOwners(game);
    const isSpectator = isPlayerSpectator(game, playerId);

    const onTakeCardClick = (e: MouseEvent<HTMLButtonElement>, strategyCard: StrategyCardIndex) => {
        e.stopPropagation();

        const { owner, card } = getCardOwnwer(strategyCard, stratCardOwners);
        const take = !Boolean(owner);
        const type = take ? MessageType.TAKE_STRATEGY_CARD : MessageType.RETURN_STRATEGY_CARD;

        sendData({ type, data: { gameId, factionName: take ? factionName : owner, strategyCard: card } });
    };

    return (
        <div className={classes.root}>
            {strategyCards.map((card?: StrategyCardType) => {
                if (!card) {
                    return null;
                }

                const { initiative, name, primary, secondary, notes, version } = card;
                const { owner: cardOwner } = getCardOwnwer(initiative, stratCardOwners);
                const ownerFaction = cardOwner ? game.factions.find(f => f.name === cardOwner) : null;
                const isExpanded = expandedCard === name;

                return (
                    <Panel key={name} className={classes.cardRow}>
                        <div className={classes.rowHeader} onClick={() => setExpandedCard(isExpanded ? null : name)}>
                            <span
                                className={classes.initiative}
                                style={{
                                    backgroundColor: card.color,
                                    color: theme.palette.getContrastText(card.color),
                                }}
                            >
                                {initiative}
                            </span>
                            <Typography className={classes.name} component="span">
                                {name}
                            </Typography>
                            {ownerFaction ? (
                                <FactionColorChip className={classes.owner} faction={ownerFaction} label={cardOwner} />
                            ) : (
                                <span className={classes.spacer} />
                            )}
                            <Button
                                size="small"
                                color="primary"
                                variant={cardOwner ? 'outlined' : 'contained'}
                                disabled={isSpectator || (factionName === 'END' && !Boolean(cardOwner))}
                                onClick={e => onTakeCardClick(e, initiative)}
                            >
                                {cardOwner ? 'Return' : 'Take'}
                            </Button>
                            <IconButton
                                size="small"
                                onClick={e => {
                                    e.stopPropagation();
                                    setExpandedCard(isExpanded ? null : name);
                                }}
                            >
                                <ExpandMoreIcon
                                    className={cx(classes.expandIcon, isExpanded && classes.expanded)}
                                    fontSize="small"
                                />
                            </IconButton>
                        </div>
                        <Collapse in={isExpanded}>
                            <div className={classes.details}>
                                <StrategyCardDetails
                                    primary={primary}
                                    secondary={secondary}
                                    notes={notes}
                                    version={version}
                                />
                            </div>
                        </Collapse>
                    </Panel>
                );
            })}

            {getNaalu(game) && !isSpectator && (
                <Panel className={classes.naalu}>
                    <Typography className={classes.naaluLabel} variant="body2">
                        Naalu "0":
                    </Typography>
                    <NaaluZeroSelect fullWidth />
                </Panel>
            )}

            {!isSpectator && (
                <Accordion disableMargin>
                    <AccordionSummary disableMargin expandIcon={<ExpandMoreIcon />}>
                        <SectionHeader>Assign cards</SectionHeader>
                    </AccordionSummary>
                    <AccordionDetails>
                        <AssignStrategyCardTable />
                    </AccordionDetails>
                </Accordion>
            )}
        </div>
    );
}

export default StrategyPhase;
