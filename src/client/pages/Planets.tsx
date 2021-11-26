import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Divider, IconButton, Toolbar, Tooltip, Typography } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import SyncIcon from '@material-ui/icons/Sync';
import SyncDisabledIcon from '@material-ui/icons/SyncDisabled';
import { makeStyles } from '@material-ui/styles';

import debounce from 'lodash/debounce';
import isEmpty from 'lodash/isEmpty';

import { GamePlanetMap } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import AddPlanetDialog from '../components/AddPlanetDialog';
import PlanetIconInfoButton from '../components/PlanetIconInfoButton';
import PlanetsTable from '../components/PlanetsTable';
import TotalsTable, { TotalsTableProps } from '../components/TotalsTable';
import useAccountInfo from '../hooks/useAccountInfo';
import useAutoNavigate from '../hooks/useAutoNavigate';
import { SendDataFunction } from '../hooks/useWebSocket';

const useStyle = makeStyles(theme => ({
    title: {
        flex: '1 1 100%',
    },
    tableBody: {
        '& .Mui-selected': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        '& .Mui-selected:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
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
    playerId: string;
    planets: GamePlanetMap;
}

function syncPlanetsFunc({ sendData, refreshed, exhausted, gameId, playerId, planets }: SyncPlanetsParms) {
    const refreshedArray = Object.keys(refreshed).filter(r => !planets[r].refreshed);
    if (refreshedArray.length) {
        sendData({
            type: MessageType.PLAYER_REFRESH_PLANET,
            data: { gameId, playerId, planetId: refreshedArray },
        });
    }

    const exhaustedArray = Object.keys(exhausted).filter(e => planets[e].refreshed);
    if (exhaustedArray.length) {
        sendData({
            type: MessageType.PLAYER_EXHAUST_PLANET,
            data: { gameId, playerId, planetId: exhaustedArray },
        });
    }
}

function Planets() {
    const classes = useStyle();
    const {
        state: { planets: planetDB = {} },
        sendData,
    } = useAppContext();

    const { game, gameId, player, playerId } = useAccountInfo();

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

    // Get all planets owned by this player
    const gamePlanets = game ? game.planets : ({} as GamePlanetMap);
    const playerPlanetNames = (player && player.planets) || [];

    useAutoNavigate({ to: `/player/${playerId}/manage-games`, condition: () => !gameId, deps: [gameId] });

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
            playerPlanetNames.forEach(p => {
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
                hasChange = hasChange || totalPlanets !== playerPlanetNames.length;
            }

            if (hasChange) {
                setPlanetState({ refreshed, exhausted });
            }

            serverSyncRef.current = false;
        },
        // Update on any planet change from the server
        [gamePlanets],
    );

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

    playerPlanetNames.forEach(p => {
        const planet = planetDB && planetDB[p];
        if (!planet) {
            return;
        }

        const refreshed = refreshedPlanets.includes(p);

        totals.resources += refreshed ? planet.resources : 0;
        totals.influence += refreshed ? planet.influence : 0;

        // Must exhaust planet to use tech bonus (New in TI4)
        totals.biotic += refreshed && planet.biotic ? planet.biotic : 0;
        totals.warfare += refreshed && planet.warfare ? planet.warfare : 0;
        totals.propulsion += refreshed && planet.propulsion ? planet.propulsion : 0;
        totals.cybernetic += refreshed && planet.cybernetic ? planet.cybernetic : 0;
    });

    // Handle click events to refresh or exhaust planets
    const onPlanetClick = (name: string) => {
        const planet = gamePlanets && gamePlanets[name];
        if (!planet || !gameId || !playerId) {
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

        syncPlanets({ sendData, gameId, playerId, exhausted, refreshed, planets: gamePlanets });
        setPlanetState({ refreshed, exhausted });
    };

    // Handle refresh or exahust all planets
    const onRefreshAll = (refresh: boolean) => {
        if (!gameId || !playerId) {
            return;
        }

        // Convert array to object map
        const planets = playerPlanetNames.reduce((a: PlanetStateMap, n: string) => {
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

        syncPlanets({ sendData, gameId, playerId, exhausted, refreshed, planets: gamePlanets });
        setPlanetState({ refreshed, exhausted });
    };

    return (
        <>
            <Toolbar>
                <Typography classes={{ root: classes.title }} variant="subtitle1">
                    MY PLANETS
                </Typography>
                <Tooltip title="Refresh All Planets">
                    <span>
                        <IconButton
                            disabled={exhaustedPlanets.length === 0 || playerPlanetNames.length === 0}
                            onClick={() => onRefreshAll(true)}
                        >
                            <SyncIcon />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Exhaust All Planets">
                    <span>
                        <IconButton
                            disabled={exhaustedPlanets.length === playerPlanetNames.length}
                            onClick={() => onRefreshAll(false)}
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
                        <IconButton disabled={!gameId || !playerId} onClick={() => setOpenAddDialog(true)}>
                            <EditIcon />
                        </IconButton>
                    </span>
                </Tooltip>
            </Toolbar>
            <TotalsTable {...totals} />
            <PlanetsTable
                columns={['name', 'resources', 'influence']}
                showFilterByName
                gameId={gameId}
                playerId={playerId}
                onPlanetClick={onPlanetClick}
                selection={exhaustedPlanets}
                classes={{ tableBody: classes.tableBody }}
            />
            {openAddDialog && playerId ? (
                <AddPlanetDialog
                    gameId={gameId as string}
                    playerId={playerId}
                    open={openAddDialog}
                    onClose={() => setOpenAddDialog(false)}
                />
            ) : null}
        </>
    );
}

export default Planets;
