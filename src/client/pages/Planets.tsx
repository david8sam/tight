import React, { useEffect, useMemo, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SyncIcon from '@mui/icons-material/Sync';
import SyncDisabledIcon from '@mui/icons-material/SyncDisabled';
import { IconButton, MenuItem, TextField, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import { isPlayerSpectator } from 'common/Game';
import { MessageType } from 'common/message';
import { PlanetMap } from 'common/Planet';

import AddPlanetDialog from '../components/AddPlanetDialog';
import ClaimPlanetDialog from '../components/ClaimPlanetDialog';
import EditPlanetDialog from '../components/EditPlanetDialog';
import PlanetIconInfoButton from '../components/PlanetIconInfoButton';
import PlanetList from '../components/PlanetList';
import { PageContainer, StatPill } from '../components/ui';
import { useAppContext } from '../Context';
import useAutoNavigate from '../hooks/useAutoNavigate';
import useGameInfo from '../hooks/useGameInfo';
import { PlanetData } from '../types';
import api from '../utils/api';
import { getPlanetValue } from '../utils/planet';

const ALL_FACTIONS = '';

const useStyles = makeStyles()(theme => ({
    toolbar: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        marginBottom: theme.spacing(1.5),
        flexWrap: 'wrap',
    },
    filter: {
        flex: 1,
        minWidth: 180,
    },
    totals: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: theme.spacing(1),
        marginTop: theme.spacing(1.5),
        justifyContent: 'center',
    },
}));

function Planets() {
    const { classes } = useStyles();
    const theme = useTheme();
    const { sendData } = useAppContext();
    const { game, gameId, playerId } = useGameInfo();

    const [planetMap, setPlanetMap] = useState<PlanetMap>({});
    const [pending, setPending] = useState(true);
    const [claimOpen, setClaimOpen] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [editPlanet, setEditPlanet] = useState<PlanetData | null>(null);

    // The viewer's own faction (first, if playing multiple)
    const myFactionName = useMemo(() => {
        const faction = playerId && game ? game.factions.find(f => f.playerIds.includes(playerId)) : null;
        return faction?.name || '';
    }, [game, playerId]);

    // Owner filter defaults to the viewer's faction; spectators see all planets
    const [factionFilter, setFactionFilter] = useState(myFactionName || ALL_FACTIONS);

    useAutoNavigate({ to: `/`, condition: () => !gameId || !playerId, deps: [gameId, playerId] });

    useEffect(() => {
        api.planetList().then(planets => {
            setPlanetMap(planets);
            setPending(false);
        });
    }, []);

    if (pending || !game) {
        return null;
    }

    const isSpectator = isPlayerSpectator(game, playerId);
    const canInteract = !isSpectator;

    const filteredFactions =
        factionFilter === ALL_FACTIONS ? game.factions : game.factions.filter(f => f.name === factionFilter);

    // Merge static planet data with per-game state for every owned planet in the filter
    const planets: PlanetData[] = filteredFactions.flatMap(faction =>
        faction.planets
            .map(name => ({ ...planetMap[name], ...game.planets[name], name }))
            .filter(p => p.owner === faction.name),
    );

    // Refreshed planets contribute to totals; tech skips require an unexhausted planet
    const totals = { resources: 0, influence: 0, biotic: 0, warfare: 0, propulsion: 0, cybernetic: 0 };
    planets.forEach(planet => {
        if (!planet.refreshed) {
            return;
        }

        totals.resources += getPlanetValue(planet, 'resources') ?? 0;
        totals.influence += getPlanetValue(planet, 'influence') ?? 0;
        totals.biotic += getPlanetValue(planet, 'biotic') ?? 0;
        totals.warfare += getPlanetValue(planet, 'warfare') ?? 0;
        totals.propulsion += getPlanetValue(planet, 'propulsion') ?? 0;
        totals.cybernetic += getPlanetValue(planet, 'cybernetic') ?? 0;
    });

    const onToggleRefresh = (planet: PlanetData) => {
        if (!planet.owner) {
            return;
        }

        sendData({
            type: planet.refreshed ? MessageType.EXHAUST_PLANET : MessageType.REFRESH_PLANET,
            data: { gameId, factionName: planet.owner, planetId: [planet.name] },
        });
    };

    const onRefreshAll = (refresh: boolean) => {
        filteredFactions.forEach(faction => {
            const planetIds = faction.planets.filter(name =>
                refresh ? !game.planets[name].refreshed : game.planets[name].refreshed,
            );
            if (planetIds.length) {
                sendData({
                    type: refresh ? MessageType.REFRESH_PLANET : MessageType.EXHAUST_PLANET,
                    data: { gameId, factionName: faction.name, planetId: planetIds },
                });
            }
        });
    };

    const exhaustedCount = planets.filter(p => !p.refreshed).length;

    // Claims go to the selected faction when it's the viewer's; otherwise to the viewer's faction
    const claimFactionName = factionFilter && factionFilter === myFactionName ? factionFilter : myFactionName;

    return (
        <PageContainer>
            <div className={classes.toolbar}>
                <TextField
                    className={classes.filter}
                    select
                    size="small"
                    label="Owner"
                    value={factionFilter}
                    onChange={e => setFactionFilter(e.target.value)}
                >
                    <MenuItem value={ALL_FACTIONS}>All factions</MenuItem>
                    {game.factions.map(f => (
                        <MenuItem key={f.name} value={f.name}>
                            {f.name}
                        </MenuItem>
                    ))}
                </TextField>
                <Tooltip title="Refresh all">
                    <span>
                        <IconButton disabled={!canInteract || exhaustedCount === 0} onClick={() => onRefreshAll(true)}>
                            <SyncIcon />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Exhaust all">
                    <span>
                        <IconButton
                            disabled={!canInteract || exhaustedCount === planets.length || planets.length === 0}
                            onClick={() => onRefreshAll(false)}
                        >
                            <SyncDisabledIcon />
                        </IconButton>
                    </span>
                </Tooltip>
                <PlanetIconInfoButton />
                <Tooltip title="Bulk add/remove">
                    <span>
                        <IconButton disabled={!canInteract || !claimFactionName} onClick={() => setBulkOpen(true)}>
                            <EditIcon />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Add planet">
                    <span>
                        <IconButton
                            color="primary"
                            disabled={!canInteract || !claimFactionName}
                            onClick={() => setClaimOpen(true)}
                        >
                            <AddIcon />
                        </IconButton>
                    </span>
                </Tooltip>
            </div>

            <PlanetList
                planets={planets}
                canInteract={canInteract}
                onToggleRefresh={onToggleRefresh}
                onEdit={setEditPlanet}
            />

            <div className={classes.totals}>
                <StatPill color={theme.game.resource.main}>Resources {totals.resources}</StatPill>
                <StatPill color={theme.game.influence.main}>Influence {totals.influence}</StatPill>
                {totals.biotic > 0 && <StatPill color={theme.game.specialty.biotic}>Biotic {totals.biotic}</StatPill>}
                {totals.warfare > 0 && (
                    <StatPill color={theme.game.specialty.warfare}>Warfare {totals.warfare}</StatPill>
                )}
                {totals.propulsion > 0 && (
                    <StatPill color={theme.game.specialty.propulsion}>Propulsion {totals.propulsion}</StatPill>
                )}
                {totals.cybernetic > 0 && (
                    <StatPill color={theme.game.specialty.cybernetic}>Cybernetic {totals.cybernetic}</StatPill>
                )}
            </div>

            {claimOpen && claimFactionName && (
                <ClaimPlanetDialog
                    open={claimOpen}
                    onClose={() => setClaimOpen(false)}
                    planetMap={planetMap}
                    claimFactionName={claimFactionName}
                />
            )}
            {bulkOpen && claimFactionName && (
                <AddPlanetDialog
                    open={bulkOpen}
                    onClose={() => setBulkOpen(false)}
                    planetMap={planetMap}
                    factionName={claimFactionName}
                />
            )}
            {editPlanet && <EditPlanetDialog open onClose={() => setEditPlanet(null)} planet={editPlanet} />}
        </PageContainer>
    );
}

export default Planets;
