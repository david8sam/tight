import React, { ReactNode } from 'react';

import { Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import { GameFaction, calculateVictoryPoints, formatFactionName } from 'common/Game';

import useGameInfo from '../hooks/useGameInfo';
import usePlanetMap from '../hooks/usePlanetMap';
import { getFactionColors } from '../utils/faction';
import { getPlanetValue } from '../utils/planet';

import FactionSigil from './FactionSigil';
import { Panel } from './ui';

export interface FactionCardProps {
    faction: GameFaction;
    /** Status pill rendered top-right (e.g. Active / Waiting / Passed) */
    statusPill?: ReactNode;
    /** Emphasis ring — it's this faction's turn */
    active?: boolean;
    /** Fade the card (passed / done) */
    dimmed?: boolean;
    /** Hide the victory-point display (e.g. during setup) */
    hideVictoryPoints?: boolean;
    /** Phase-specific actions / extra content */
    children?: ReactNode;
}

const useStyles = makeStyles()(theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1),
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing(1),
    },
    name: {
        flex: 1,
        fontFamily: '"Orbitron", sans-serif',
        fontSize: 12.5,
        fontWeight: 600,
        lineHeight: 1.32,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
    },
    pill: {
        flexShrink: 0,
    },
    stats: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing(1),
        flexWrap: 'wrap',
    },
    vp: {
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: theme.spacing(0.625),
    },
    vpValue: {
        fontFamily: '"Orbitron", sans-serif',
        fontSize: 24,
        fontWeight: 700,
        lineHeight: 1,
    },
    vpTotal: {
        fontSize: 11,
        color: theme.palette.text.disabled,
    },
    planetStats: {
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: theme.spacing(1),
        fontFamily: '"Orbitron", sans-serif',
        fontSize: 13,
        fontWeight: 600,
    },
    planetStatLabel: {
        fontFamily: '"Exo 2", sans-serif',
        fontSize: 10.5,
        fontWeight: 500,
        color: theme.palette.text.disabled,
        marginRight: 2,
    },
    strategyPill: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing(0.75),
        borderRadius: theme.game.radius.pill,
        fontSize: 11,
        fontWeight: 500,
        padding: theme.spacing(0.375, 1.125, 0.375, 0.5),
        whiteSpace: 'nowrap',
    },
    strategyFlipped: {
        opacity: 0.55,
    },
    initiative: {
        width: 16,
        height: 16,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 9,
        fontWeight: 700,
    },
}));

function FactionCard({ faction, statusPill, active, dimmed, hideVictoryPoints, children }: FactionCardProps) {
    const { classes, cx } = useStyles();
    const theme = useTheme();
    const { game, strategyCards } = useGameInfo();
    const planetMap = usePlanetMap();

    if (!game) {
        return null;
    }

    const colors = getFactionColors(theme, faction);
    const title = formatFactionName(game, faction.name);
    const vp = calculateVictoryPoints(game, faction.name);

    const card = strategyCards.find(s => s.initiative === faction.strategyCard);

    // Available (refreshed) resources and influence from the faction's planets
    let resources = 0;
    let influence = 0;
    if (planetMap) {
        faction.planets.forEach(name => {
            const gamePlanet = game.planets[name];
            if (!gamePlanet?.refreshed) {
                return;
            }

            const merged = { ...planetMap[name], ...gamePlanet, name };
            resources += getPlanetValue(merged, 'resources') ?? 0;
            influence += getPlanetValue(merged, 'influence') ?? 0;
        });
    }

    return (
        <Panel className={classes.root} accent={colors.readable} glow={active} dimmed={dimmed}>
            <div className={classes.header}>
                <FactionSigil name={faction.name} tint={colors.tint} />
                <Tooltip title={title}>
                    <Typography className={classes.name} component="h3">
                        {title}
                    </Typography>
                </Tooltip>
                {statusPill && <span className={classes.pill}>{statusPill}</span>}
            </div>

            <div className={classes.stats}>
                {!hideVictoryPoints && (
                    <span className={classes.vp}>
                        <span className={classes.vpValue} style={{ color: colors.readable }}>
                            {vp}
                        </span>
                        <span className={classes.vpTotal}>/ {game.numVictoryPoints} VP</span>
                    </span>
                )}
                {planetMap && (
                    <Tooltip title="Available resources and influence (refreshed planets)">
                        <span className={classes.planetStats}>
                            <span style={{ color: theme.game.resource.soft }}>
                                <span className={classes.planetStatLabel}>R</span>
                                {resources}
                            </span>
                            <span style={{ color: theme.game.influence.soft }}>
                                <span className={classes.planetStatLabel}>I</span>
                                {influence}
                            </span>
                        </span>
                    </Tooltip>
                )}
                {card && (
                    <span
                        className={cx(classes.strategyPill, faction.stragetyCardFlipped && classes.strategyFlipped)}
                        style={{ backgroundColor: alpha(card.color, 0.16) }}
                    >
                        <span
                            className={classes.initiative}
                            style={{
                                backgroundColor: card.color,
                                color: theme.palette.getContrastText(card.color),
                            }}
                        >
                            {card.initiative}
                        </span>
                        {card.name}
                    </span>
                )}
            </div>

            {children}
        </Panel>
    );
}

export default FactionCard;
