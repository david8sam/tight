import React from 'react';

import EditIcon from '@mui/icons-material/Edit';
import SyncIcon from '@mui/icons-material/Sync';
import SyncDisabledIcon from '@mui/icons-material/SyncDisabled';
import { IconButton, Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import { Traits } from 'common/Planet';

import { PlanetData } from '../types';
import useGameInfo from '../hooks/useGameInfo';
import { getPlanetValue } from '../utils/planet';

import PlanetDisc from './PlanetDisc';
import { Biotic, Cybernetic, DMZPlanet, HomePlanet, Legendary, Propulsion, Warfare } from './PlanetIcons';
import { FactionColorChip, Panel, SectionHeader } from './ui';

const TRAIT_LABELS: Record<Traits, string> = {
    [Traits.CULTURAL]: 'Cultural',
    [Traits.HAZARDOUS]: 'Hazardous',
    [Traits.INDUSTRIAL]: 'Industrial',
};

export interface PlanetListProps {
    planets: PlanetData[];
    canInteract: boolean;
    onToggleRefresh: (planet: PlanetData) => void;
    onEdit: (planet: PlanetData) => void;
}

const ICON_SX = { width: 20, height: 20, fontSize: 12 };

const useStyles = makeStyles()(theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(0.75),
    },
    headerRow: {
        display: 'grid',
        gridTemplateColumns: 'minmax(120px, 1.6fr) minmax(90px, 1.1fr) minmax(90px, 1fr) 30px 30px 74px 76px',
        gap: theme.spacing(1),
        alignItems: 'center',
        padding: theme.spacing(0.5, 1.5),
        [theme.breakpoints.down('md')]: {
            display: 'none',
        },
    },
    row: {
        display: 'grid',
        gridTemplateColumns: 'minmax(120px, 1.6fr) minmax(90px, 1.1fr) minmax(90px, 1fr) 30px 30px 74px 76px',
        gap: theme.spacing(1),
        alignItems: 'center',
        padding: theme.spacing(1, 1.5),
        [theme.breakpoints.down('md')]: {
            gridTemplateColumns: '1fr auto',
            gridTemplateAreas: '"name actions" "meta actions"',
            rowGap: theme.spacing(0.75),
        },
    },
    exhausted: {
        opacity: theme.game.opacity.exhausted,
    },
    name: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.75),
        minWidth: 0,
        [theme.breakpoints.down('md')]: {
            gridArea: 'name',
        },
    },
    nameText: {
        fontFamily: '"Orbitron", sans-serif',
        fontSize: 13,
        fontWeight: 600,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    meta: {
        display: 'contents',
        [theme.breakpoints.down('md')]: {
            gridArea: 'meta',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: theme.spacing(1, 1.5),
        },
    },
    owner: {
        fontSize: 12.5,
        color: theme.palette.text.secondary,
        minWidth: 0,
    },
    trait: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing(0.625),
        fontSize: 11,
        borderRadius: theme.game.radius.pill,
        padding: theme.spacing(0.25, 1),
        width: 'fit-content',
        whiteSpace: 'nowrap',
    },
    traitDot: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        flexShrink: 0,
    },
    stat: {
        fontFamily: '"Orbitron", sans-serif',
        fontSize: 13,
        fontWeight: 600,
        textAlign: 'center',
    },
    specs: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.5),
    },
    actions: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: theme.spacing(0.5),
        [theme.breakpoints.down('md')]: {
            gridArea: 'actions',
        },
    },
    empty: {
        textAlign: 'center',
        color: theme.palette.text.secondary,
        padding: theme.spacing(3, 1),
    },
}));

function PlanetList({ planets, canInteract, onToggleRefresh, onEdit }: PlanetListProps) {
    const { classes, cx } = useStyles();
    const theme = useTheme();
    const { game } = useGameInfo();

    if (!game) {
        return null;
    }

    if (planets.length === 0) {
        return (
            <Typography className={classes.empty} variant="body2">
                No planets yet — claim planets as you take them.
            </Typography>
        );
    }

    return (
        <div className={classes.root}>
            <div className={classes.headerRow}>
                <SectionHeader>Planet</SectionHeader>
                <SectionHeader>Owner</SectionHeader>
                <SectionHeader>Type</SectionHeader>
                <SectionHeader>R</SectionHeader>
                <SectionHeader>I</SectionHeader>
                <SectionHeader>Spec</SectionHeader>
                <span />
            </div>
            {planets.map(planet => {
                const { name, refreshed, owner } = planet;
                const ownerFaction = owner ? game.factions.find(f => f.name === owner) : null;

                const traits = ([] as Traits[]).concat(getPlanetValue(planet, 'trait') ?? []);
                const resources = getPlanetValue(planet, 'resources');
                const influence = getPlanetValue(planet, 'influence');
                const biotic = getPlanetValue(planet, 'biotic');
                const warfare = getPlanetValue(planet, 'warfare');
                const propulsion = getPlanetValue(planet, 'propulsion');
                const cybernetic = getPlanetValue(planet, 'cybernetic');
                const isDMZ = Boolean(getPlanetValue(planet, 'DMZ'));

                return (
                    <Panel key={name} className={cx(classes.row, !refreshed && classes.exhausted)}>
                        <span className={classes.name}>
                            <PlanetDisc
                                name={name}
                                size={24}
                                fallbackColor={traits[0] ? theme.game.trait[traits[0]] : undefined}
                            />
                            <Typography className={classes.nameText} component="span" title={name}>
                                {name}
                            </Typography>
                            {planet.legendary && <Legendary sx={ICON_SX} />}
                            {planet.home && <HomePlanet sx={ICON_SX} />}
                            {isDMZ && <DMZPlanet sx={ICON_SX} />}
                        </span>
                        <span className={classes.meta}>
                            <span className={classes.owner}>
                                {ownerFaction ? (
                                    <FactionColorChip faction={ownerFaction} label={owner} />
                                ) : (
                                    (owner ?? '—')
                                )}
                            </span>
                            <span>
                                {traits.length ? (
                                    traits.map(t => (
                                        <span
                                            key={t}
                                            className={classes.trait}
                                            style={{
                                                backgroundColor: alpha(theme.game.trait[t], 0.15),
                                                color: theme.game.trait[t],
                                            }}
                                        >
                                            <span
                                                className={classes.traitDot}
                                                style={{ backgroundColor: theme.game.trait[t] }}
                                            />
                                            {TRAIT_LABELS[t]}
                                        </span>
                                    ))
                                ) : (
                                    <span className={classes.owner}>—</span>
                                )}
                            </span>
                            <span className={classes.stat} style={{ color: theme.game.resource.soft }}>
                                {resources}
                            </span>
                            <span className={classes.stat} style={{ color: theme.game.influence.soft }}>
                                {influence}
                            </span>
                            <span className={classes.specs}>
                                {Boolean(biotic) && <Biotic sx={ICON_SX} />}
                                {Boolean(warfare) && <Warfare sx={ICON_SX} />}
                                {Boolean(propulsion) && <Propulsion sx={ICON_SX} />}
                                {Boolean(cybernetic) && <Cybernetic sx={ICON_SX} />}
                            </span>
                        </span>
                        <span className={classes.actions}>
                            <Tooltip title={refreshed ? 'Exhaust' : 'Refresh'}>
                                <span>
                                    <IconButton
                                        size="small"
                                        disabled={!canInteract}
                                        onClick={() => onToggleRefresh(planet)}
                                    >
                                        {refreshed ? (
                                            <SyncDisabledIcon fontSize="small" />
                                        ) : (
                                            <SyncIcon fontSize="small" color="success" />
                                        )}
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Edit planet">
                                <span>
                                    <IconButton size="small" disabled={!canInteract} onClick={() => onEdit(planet)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </span>
                    </Panel>
                );
            })}
        </div>
    );
}

export default PlanetList;
