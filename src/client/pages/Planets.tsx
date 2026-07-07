import React, { useEffect, useMemo, useRef, useState } from 'react';

import EditIcon from '@mui/icons-material/Edit';
import SyncIcon from '@mui/icons-material/Sync';
import SyncDisabledIcon from '@mui/icons-material/SyncDisabled';
import { AppBar, Divider, IconButton, MenuItem, TextField, Toolbar, Tooltip, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { debounce, isEmpty } from 'lodash-es';

import { GamePlanetMap } from 'common/Game';
import { MessageType } from 'common/message';
import { PlanetMap } from 'common/Planet';

import AddPlanetDialog from '../components/AddPlanetDialog';
import PlanetIconInfoButton from '../components/PlanetIconInfoButton';
import PlanetsTable from '../components/PlanetsTable';
import TotalsTable, { TotalsTableProps } from '../components/TotalsTable';
import useAutoNavigate from '../hooks/useAutoNavigate';
import useGameInfo from '../hooks/useGameInfo';
import { SendDataFunction } from '../hooks/useWebSocket';
import api from '../utils/api';
import { getPlanetValue } from '../utils/planet';

import { useAppContext } from '../Context';

const useStyle = makeStyles()(() => ({
    appBar: {
        top: 0,
    },
    title: {
        flex: '1 1 100%',
    },
}));

interface PlanetStateMap {
    [name: string]: string;
}

interface SyncPlanetsParms {
    sendData: SendDataFunction;
    refreshed: PlanetStateMap;
    exhausted: PlanetStateMap;
    gameId: string;
    factionName: string;
    planets: GamePlanetMap;
}

function syncPlanetsFunc({ sendData, refreshed, exhausted, gameId, factionName, planets }: SyncPlanetsParms) {
    const refreshedArray = Object.keys(refreshed).filter(r => !planets[r].refreshed);
    if (refreshedArray.length) {
        sendData({
            type: MessageType.REFRESH_PLANET,
            data: { gameId, factionName, planetId: refreshedArray },
        });
    }

    const exhaustedArray = Object.keys(exhausted).filter(e => planets[e].refreshed);
    if (exhaustedArray.length) {
        sendData({
            type: MessageType.EXHAUST_PLANET,
            data: { gameId, factionName, planetId: exhaustedArray },
        });
    }
}

function Planets() {
    const { classes } = useStyle();
    const { sendData } = useAppContext();
    const { game, gameId, playerId } = useGameInfo();
    const [planetMap, setPlanetMap] = useState<PlanetMap>({});
    const [pending, setPending] = useState(true);
    const [factionName, setFactionName] = useState(() => {
        const faction = playerId && game ? game.factions.find(f => f.playerIds.includes(playerId)) : null;
        return faction?.name || '';
    });

    const factionNameOptions = useMemo(() => {
        const factionsArray = playerId && game ? game.factions.filter(f => f.playerIds.includes(playerId)) : [];
        return factionsArray.map(f => f.name);
    }, [game, playerId]);

    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [planetState, setPlanetState] = useState({
        refreshed: {} as PlanetStateMap,
        exhausted: {} as PlanetStateMap,
    });

    const serverSyncRef = useRef(false);

    // Delay sending updates to the server until all changes are done.
    const syncPlanets = useMemo(
        () =>
            debounce((args: SyncPlanetsParms) => {
                // Don't send updates to server if currently syncing from server.
                if (!serverSyncRef.current) {
                    syncPlanetsFunc(args);
                }
            }, 2000),
        [],
    );

    // Get all planets owned by this faction
    const gamePlanets = game?.planets;
    const faction = game?.factions.find(f => f.name === factionName);
    const factionPlanetNames = faction?.planets || [];

    useAutoNavigate({ to: `/`, condition: () => !gameId || !playerId, deps: [gameId, playerId] });

    useEffect(() => {
        api.planetList().then(planets => {
            setPlanetMap(planets);
            setPending(false);
        });
    }, []);

    // Sync with store data
    useEffect(
        () => {
            serverSyncRef.current = true;

            if (!gamePlanets) {
                if (!isEmpty(planetState.refreshed) && !isEmpty(planetState.exhausted)) {
                    setPlanetState({ refreshed: {}, exhausted: {} });
                }

                serverSyncRef.current = false;
                return;
            }

            let hasChange: boolean = false;

            const refreshed: PlanetStateMap = {};
            const exhausted: PlanetStateMap = {};
            factionPlanetNames.forEach(p => {
                if (gamePlanets[p].refreshed) {
                    refreshed[p] = p;
                    hasChange = hasChange || Boolean(planetState.refreshed[p]) === false;
                } else {
                    exhausted[p] = p;
                    hasChange = hasChange || Boolean(planetState.exhausted[p]) === false;
                }
            });

            if (!hasChange) {
                const totalPlanets =
                    Object.keys(planetState.refreshed).length + Object.keys(planetState.exhausted).length;
                hasChange = hasChange || totalPlanets !== factionPlanetNames.length;
            }

            if (hasChange) {
                setPlanetState({ refreshed, exhausted });
            }

            serverSyncRef.current = false;
        },
        // Update on any planet change from the server
        [gamePlanets, factionPlanetNames],
    );

    if (pending) {
        return null;
    }

    // Compute totals
    const refreshedPlanets = Object.keys(planetState.refreshed);
    const exhaustedPlanets = Object.keys(planetState.exhausted);
    const totals: TotalsTableProps = {
        resources: 0,
        influence: 0,
        biotic: 0,
        warfare: 0,
        propulsion: 0,
        cybernetic: 0,
    };

    factionPlanetNames.forEach(p => {
        const planet = { ...planetMap[p], ...gamePlanets?.[p] };
        const refreshed = refreshedPlanets.includes(p);

        totals.resources += refreshed ? getPlanetValue(planet, 'resources') : 0;
        totals.influence += refreshed ? getPlanetValue(planet, 'influence') : 0;

        // Must exhaust planet to use tech bonus (New in TI4)
        totals.biotic += refreshed ? getPlanetValue(planet, 'biotic') ?? 0 : 0;
        totals.warfare += refreshed ? getPlanetValue(planet, 'warfare') ?? 0 : 0;
        totals.propulsion += refreshed ? getPlanetValue(planet, 'propulsion') ?? 0 : 0;
        totals.cybernetic += refreshed ? getPlanetValue(planet, 'cybernetic') ?? 0 : 0;
    });

    // Handle click events to refresh or exhaust planets
    const onPlanetClick = (name: string) => {
        const planet = gamePlanets && gamePlanets[name];
        if (!planet || !gameId || !factionName) {
            return;
        }

        const refreshed: PlanetStateMap = { ...planetState.refreshed };
        const exhausted: PlanetStateMap = { ...planetState.exhausted };
        if (refreshed[name]) {
            delete refreshed[name];
            exhausted[name] = name;
        } else {
            delete exhausted[name];
            refreshed[name] = name;
        }

        syncPlanets({ sendData, gameId, factionName, exhausted, refreshed, planets: gamePlanets });
        setPlanetState({ refreshed, exhausted });
    };

    // Handle refresh or exahust all planets
    const onRefreshAll = (refresh: boolean) => {
        if (!gameId || !factionName) {
            return;
        }

        // Convert array to object map
        const planets = factionPlanetNames.reduce((a: PlanetStateMap, n: string) => {
            a[n] = n;
            return a;
        }, {});

        let refreshed = {};
        let exhausted = {};
        if (refresh) {
            refreshed = planets;
        } else {
            exhausted = planets;
        }

        syncPlanets({ sendData, gameId, factionName, exhausted, refreshed, planets: gamePlanets || {} });
        setPlanetState({ refreshed, exhausted });
    };

    return (
        <>
            <AppBar className={classes.appBar} color="inherit" position="sticky">
                <Toolbar>
                    <TextField
                        sx={{ marginTop: 2 }}
                        fullWidth
                        select
                        label={factionNameOptions.length ? 'My Factions' : 'No Factions'}
                        value={factionName}
                        onChange={e => setFactionName(e.target.value)}
                    >
                        {factionNameOptions.map(name => (
                            <MenuItem key={name} value={name}>
                                {name}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Tooltip title="Refresh All Planets">
                        <span>
                            <IconButton
                                disabled={exhaustedPlanets.length === 0 || factionPlanetNames.length === 0}
                                onClick={() => onRefreshAll(true)}
                                size="large"
                            >
                                <SyncIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="Exhaust All Planets">
                        <span>
                            <IconButton
                                disabled={exhaustedPlanets.length === factionPlanetNames.length}
                                onClick={() => onRefreshAll(false)}
                                size="large"
                            >
                                <SyncDisabledIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Divider orientation="vertical" />
                    <PlanetIconInfoButton />
                    <Divider orientation="vertical" />
                    <Tooltip title="Add/Remove Planets">
                        <span>
                            <IconButton
                                disabled={!gameId || !factionName}
                                onClick={() => setOpenAddDialog(true)}
                                size="large"
                            >
                                <EditIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Toolbar>
                <TotalsTable {...totals} />
            </AppBar>
            {factionName && (
                <PlanetsTable
                    planetMap={planetMap}
                    columns={['name', 'resources', 'influence']}
                    filterByPlanetOnly
                    factionName={factionName}
                    PlanetNameCellProps={{ owner: factionName }}
                    onPlanetClick={onPlanetClick}
                    selection={exhaustedPlanets}
                />
            )}
            {openAddDialog && factionName ? (
                <AddPlanetDialog
                    open={openAddDialog}
                    onClose={() => setOpenAddDialog(false)}
                    planetMap={planetMap}
                    factionName={factionName}
                />
            ) : null}
        </>
    );
}

export default Planets;
