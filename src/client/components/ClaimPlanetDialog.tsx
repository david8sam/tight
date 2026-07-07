import React, { useMemo, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import SearchIcon from '@mui/icons-material/Search';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Button, Dialog, DialogContent, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import { MessageType } from 'common/message';
import { PlanetMap, Traits } from 'common/Planet';

import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';
import { getPlanetValue } from '../utils/planet';

import PlanetDisc from './PlanetDisc';
import { Legendary } from './PlanetIcons';
import { FactionColorChip } from './ui';

const MAX_RESULTS = 10;

const ICON_SX = { width: 18, height: 18, fontSize: 11 };

export interface ClaimPlanetDialogProps {
    open: boolean;
    onClose: () => void;
    planetMap: PlanetMap;
    /** The faction that new claims are assigned to */
    claimFactionName: string;
}

const useStyles = makeStyles()(theme => ({
    title: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing(1.75, 2, 1),
    },
    search: {
        '& input': {
            fontFamily: '"Orbitron", sans-serif',
            letterSpacing: '0.04em',
        },
    },
    claimingAs: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.75),
        padding: theme.spacing(1, 0.25, 0.5),
        color: theme.palette.text.secondary,
        fontSize: 11.5,
    },
    results: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(0.25),
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1.25),
        padding: theme.spacing(1, 1.25),
        borderRadius: theme.game.radius.control + 2,
        '&:hover': {
            backgroundColor: theme.game.surface.highlight,
        },
    },
    rowMain: {
        flex: 1,
        minWidth: 0,
    },
    rowName: {
        fontFamily: '"Orbitron", sans-serif',
        fontSize: 13,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.75),
    },
    match: {
        color: theme.palette.primary.light,
    },
    rowSub: {
        fontSize: 10.5,
        color: theme.palette.text.disabled,
        marginTop: 2,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.5),
    },
    rowStats: {
        fontFamily: '"Orbitron", sans-serif',
        fontSize: 12.5,
        whiteSpace: 'nowrap',
    },
    hint: {
        textAlign: 'center',
        color: theme.palette.text.disabled,
        padding: theme.spacing(3, 1),
    },
}));

const TRAIT_LABELS: Record<Traits, string> = {
    [Traits.CULTURAL]: 'Cultural',
    [Traits.HAZARDOUS]: 'Hazardous',
    [Traits.INDUSTRIAL]: 'Industrial',
};

function ClaimPlanetDialog({ open, onClose, planetMap, claimFactionName }: ClaimPlanetDialogProps) {
    const { classes } = useStyles();
    const theme = useTheme();
    const { sendData } = useAppContext();
    const { game, gameId } = useGameInfo();

    const [query, setQuery] = useState('');

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) {
            return [];
        }

        return Object.values(planetMap)
            .filter(p => p.name.toLowerCase().includes(q))
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(0, MAX_RESULTS);
    }, [planetMap, query]);

    if (!game) {
        return null;
    }

    const claimFaction = game.factions.find(f => f.name === claimFactionName);

    const claim = (planetId: string, currentOwner: string | null) => {
        if (currentOwner && currentOwner !== claimFactionName) {
            sendData({
                type: MessageType.LOST_PLANET,
                data: { gameId, factionName: currentOwner, planetId: [planetId] },
            });
        }
        sendData({
            type: MessageType.TAKE_PLANET,
            data: { gameId, factionName: claimFactionName, planetId: [planetId] },
        });
    };

    const remove = (planetId: string) => {
        sendData({
            type: MessageType.LOST_PLANET,
            data: { gameId, factionName: claimFactionName, planetId: [planetId] },
        });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <div className={classes.title}>
                <Typography variant="h6">Add planet</Typography>
                <IconButton size="small" onClick={onClose}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </div>
            <DialogContent>
                <TextField
                    className={classes.search}
                    autoFocus
                    fullWidth
                    size="small"
                    placeholder="Search planets"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <div className={classes.claimingAs}>
                    {claimFaction && <FactionColorChip faction={claimFaction} />}
                    Claiming as {claimFactionName}
                    {query && <span style={{ marginLeft: 'auto' }}>{results.length} matches</span>}
                </div>

                {query ? (
                    <div className={classes.results}>
                        {results.map(planet => {
                            const { name } = planet;
                            const gamePlanet = game.planets[name];
                            const owner = gamePlanet?.owner ?? null;
                            const ownerFaction = owner ? game.factions.find(f => f.name === owner) : null;
                            const mine = owner === claimFactionName;

                            const matchIndex = name.toLowerCase().indexOf(query.trim().toLowerCase());
                            const matchEnd = matchIndex + query.trim().length;

                            const trait = getPlanetValue(planet, 'trait') as Traits | undefined;

                            let action = (
                                <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => claim(name, owner)}
                                >
                                    Claim
                                </Button>
                            );
                            if (mine) {
                                action = (
                                    <Button
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                        startIcon={<RemoveIcon />}
                                        onClick={() => remove(name)}
                                    >
                                        Remove
                                    </Button>
                                );
                            } else if (owner) {
                                action = (
                                    <Button
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                        startIcon={<SwapHorizIcon />}
                                        onClick={() => claim(name, owner)}
                                    >
                                        Take
                                    </Button>
                                );
                            }

                            return (
                                <div key={name} className={classes.row}>
                                    <PlanetDisc
                                        name={name}
                                        size={30}
                                        fallbackColor={trait ? theme.game.trait[trait] : undefined}
                                    />
                                    <div className={classes.rowMain}>
                                        <span className={classes.rowName}>
                                            {matchIndex >= 0 ? (
                                                <span>
                                                    {name.slice(0, matchIndex)}
                                                    <span className={classes.match}>
                                                        {name.slice(matchIndex, matchEnd)}
                                                    </span>
                                                    {name.slice(matchEnd)}
                                                </span>
                                            ) : (
                                                name
                                            )}
                                            {planet.legendary && <Legendary sx={ICON_SX} />}
                                        </span>
                                        <span className={classes.rowSub}>
                                            {ownerFaction ? (
                                                <>
                                                    Held by <FactionColorChip faction={ownerFaction} label={owner} />
                                                </>
                                            ) : (
                                                <>
                                                    {trait ? TRAIT_LABELS[trait] : 'No type'}
                                                    {planet.home ? ` · Home of ${planet.home}` : ''}
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    <span className={classes.rowStats}>
                                        <span style={{ color: theme.game.resource.soft }}>
                                            {getPlanetValue(planet, 'resources')}
                                        </span>
                                        <span style={{ color: theme.palette.text.disabled }}> / </span>
                                        <span style={{ color: theme.game.influence.soft }}>
                                            {getPlanetValue(planet, 'influence')}
                                        </span>
                                    </span>
                                    {action}
                                </div>
                            );
                        })}
                        {results.length === 0 && (
                            <Typography className={classes.hint} variant="body2">
                                No planets match "{query}".
                            </Typography>
                        )}
                    </div>
                ) : (
                    <Typography className={classes.hint} variant="body2">
                        Type a planet name to claim it for your faction.
                    </Typography>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default ClaimPlanetDialog;
