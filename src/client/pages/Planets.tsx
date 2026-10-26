import React, { useId, useCallback, useMemo, useState } from 'react';

import EditIcon from '@mui/icons-material/Edit';
import SyncIcon from '@mui/icons-material/Sync';
import SyncDisabledIcon from '@mui/icons-material/SyncDisabled';
import { AppBar, Divider, IconButton, MenuItem, TextField, Toolbar, Tooltip, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { MessageType } from 'common/message';

import AddPlanetDialog from '../components/AddPlanetDialog';
import PlanetIconInfoButton from '../components/PlanetIconInfoButton';
import PlanetsTable from '../components/PlanetsTable';
import TotalsTable, { TotalsTableProps } from '../components/TotalsTable';
import useAutoNavigate from '../hooks/useAutoNavigate';
import useGameInfo from '../hooks/useGameInfo';
import api from '../utils/api';
import useRemoteData from '../hooks/useRemoteData';
import LoadFailure from '../components/LoadFailure';
import { getPlanetValue } from '../utils/planet';

import { useAppContext } from '../Context';
import { HEADER_HEIGHT } from '../constants';

const useStyle = makeStyles(() => ({
    appBar: {
        top: HEADER_HEIGHT,
    },
    title: {
        flex: '1 1 100%',
    },
}));

function Planets() {
    const selectId = useId();
    const classes = useStyle();
    const { sendData } = useAppContext();
    const { game, gameId, playerId, canEditTable, canEditPublicFaction } = useGameInfo();
    const load = useCallback((signal: AbortSignal) => api.planetList(undefined, { signal }), []);
    const { resource, retry } = useRemoteData(load);
    const pending = resource.kind === 'loading';
    const planetMap = resource.kind === 'loaded' ? resource.data : {};
    const [factionName, setFactionName] = useState(() => {
        const faction = playerId && game ? game.factions.find(f => f.playerIds.includes(playerId)) : null;
        return faction?.name || (canEditTable ? game?.factions[0]?.name : '') || '';
    });

    const factionNameOptions = useMemo(() => {
        const factionsArray = game ? game.factions.filter(f => canEditTable || (playerId && f.playerIds.includes(playerId))) : [];
        return factionsArray.map(f => f.name);
    }, [game, playerId, canEditTable]);

    const [openAddDialog, setOpenAddDialog] = useState(false);
    // Get all planets owned by this faction
    const gamePlanets = game?.planets;
    const faction = game?.factions.find(f => f.name === factionName);
    const factionPlanetNames = faction?.planets || [];

    useAutoNavigate({ to: `/`, condition: () => !gameId || !playerId, deps: [gameId, playerId] });

    if (resource.kind === 'error') return <LoadFailure retry={retry} />;
    if (pending) {
        return null;
    }

    // Compute totals
    const refreshedPlanets = factionPlanetNames.filter(name => gamePlanets?.[name]?.refreshed);
    const exhaustedPlanets = factionPlanetNames.filter(name => !gamePlanets?.[name]?.refreshed);
    const editable = canEditPublicFaction(factionName);
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
        totals.biotic += refreshed ? (getPlanetValue(planet, 'biotic') ?? 0) : 0;
        totals.warfare += refreshed ? (getPlanetValue(planet, 'warfare') ?? 0) : 0;
        totals.propulsion += refreshed ? (getPlanetValue(planet, 'propulsion') ?? 0) : 0;
        totals.cybernetic += refreshed ? (getPlanetValue(planet, 'cybernetic') ?? 0) : 0;
    });

    const onPlanetClick = (name: string) => {
        const planet = gamePlanets?.[name];
        if (!planet || !gameId || !editable) return;
        sendData({
            type: planet.refreshed ? MessageType.EXHAUST_PLANET : MessageType.REFRESH_PLANET,
            data: { gameId, factionName, planetId: name },
        });
    };

    const onRefreshAll = (refresh: boolean) => {
        if (!gameId || !editable) return;
        const planetIds = refresh ? exhaustedPlanets : refreshedPlanets;
        if (planetIds.length)
            sendData({
                type: refresh ? MessageType.REFRESH_PLANET : MessageType.EXHAUST_PLANET,
                data: { gameId, factionName, planetId: planetIds },
            });
    };

    return (
        <>
            <AppBar className={classes.appBar} color="inherit" position="sticky">
                <Toolbar>
                    <TextField
                        sx={{ marginTop: 2 }}
                        fullWidth
                        select
                        id={selectId}
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
                                aria-label="Refresh All Planets"
                                disabled={!editable || exhaustedPlanets.length === 0 || factionPlanetNames.length === 0}
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
                                aria-label="Exhaust All Planets"
                                disabled={!editable || exhaustedPlanets.length === factionPlanetNames.length}
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
                                aria-label="Add/Remove Planets"
                                disabled={!editable}
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
                    disabled={!editable}
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
