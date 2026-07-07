import React, { useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SyncIcon from '@mui/icons-material/Sync';
import SyncDisabledIcon from '@mui/icons-material/SyncDisabled';
import { AccordionProps, Button, IconButton, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import { GameFaction } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';
import usePlanetMap from '../hooks/usePlanetMap';
import { getPlanetValue } from '../utils/planet';

import { Accordion, AccordionDetails, AccordionSummary } from './Accordion';
import ClaimPlanetDialog from './ClaimPlanetDialog';
import PlanetDisc from './PlanetDisc';

interface FactionPlanetsProps {
    faction: GameFaction;
    disabled?: boolean;
    AccordionProps?: Partial<AccordionProps>;
}

const useStyles = makeStyles()(theme => ({
    rows: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        padding: theme.spacing(0.375, 0),
    },
    exhausted: {
        opacity: theme.game.opacity.exhausted,
    },
    name: {
        flex: 1,
        minWidth: 0,
        fontSize: 12.5,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    stat: {
        fontFamily: '"Orbitron", sans-serif',
        fontSize: 12.5,
        fontWeight: 600,
        width: 22,
        textAlign: 'center',
        flexShrink: 0,
    },
    empty: {
        fontSize: 12,
        color: theme.palette.text.disabled,
        padding: theme.spacing(0.5, 0),
    },
    addButton: {
        alignSelf: 'flex-start',
        marginTop: theme.spacing(0.5),
    },
}));

function FactionPlanets({ faction, disabled = false, AccordionProps }: FactionPlanetsProps) {
    const { classes, cx } = useStyles();
    const theme = useTheme();
    const { sendData } = useAppContext();
    const { game, gameId } = useGameInfo();
    const planetMap = usePlanetMap();

    const [claimOpen, setClaimOpen] = useState(false);

    if (!game || !planetMap) {
        return null;
    }

    const onToggleRefresh = (planetId: string, refreshed: boolean) => {
        sendData({
            type: refreshed ? MessageType.EXHAUST_PLANET : MessageType.REFRESH_PLANET,
            data: { gameId, factionName: faction.name, planetId: [planetId] },
        });
    };

    return (
        <>
            <Accordion disableMargin {...AccordionProps}>
                <AccordionSummary disableMargin expandIcon={<ExpandMoreIcon />}>
                    <Typography>{`${faction.planets.length} Planets`}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ padding: `0px ${theme.spacing()}` }}>
                    <div className={classes.rows}>
                        {faction.planets.length === 0 && <span className={classes.empty}>No planets yet.</span>}
                        {faction.planets.map(name => {
                            const gamePlanet = game.planets[name];
                            if (!gamePlanet) {
                                return null;
                            }

                            const merged = { ...planetMap[name], ...gamePlanet, name };
                            const { refreshed } = gamePlanet;

                            return (
                                <div key={name} className={cx(classes.row, !refreshed && classes.exhausted)}>
                                    <PlanetDisc name={name} size={18} />
                                    <span className={classes.name} title={name}>
                                        {name}
                                    </span>
                                    <span className={classes.stat} style={{ color: theme.game.resource.soft }}>
                                        {getPlanetValue(merged, 'resources') ?? 0}
                                    </span>
                                    <span className={classes.stat} style={{ color: theme.game.influence.soft }}>
                                        {getPlanetValue(merged, 'influence') ?? 0}
                                    </span>
                                    <Tooltip title={refreshed ? 'Exhaust' : 'Refresh'}>
                                        <span>
                                            <IconButton
                                                size="small"
                                                disabled={disabled}
                                                onClick={() => onToggleRefresh(name, refreshed)}
                                            >
                                                {refreshed ? (
                                                    <SyncDisabledIcon sx={{ fontSize: 15 }} />
                                                ) : (
                                                    <SyncIcon sx={{ fontSize: 15 }} color="success" />
                                                )}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </div>
                            );
                        })}
                        <Button
                            className={classes.addButton}
                            size="small"
                            startIcon={<AddIcon />}
                            disabled={disabled}
                            onClick={() => setClaimOpen(true)}
                        >
                            Add planet
                        </Button>
                    </div>
                </AccordionDetails>
            </Accordion>
            {claimOpen && (
                <ClaimPlanetDialog
                    open={claimOpen}
                    onClose={() => setClaimOpen(false)}
                    planetMap={planetMap}
                    claimFactionName={faction.name}
                />
            )}
        </>
    );
}

export default FactionPlanets;
