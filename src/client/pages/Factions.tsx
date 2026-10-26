import React, { useCallback, useEffect, useRef, useState } from 'react';

import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { AppBar, Button, CircularProgress, Grid, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';


import FactionInfo, { FactionAccordionIndex, FactionInfoProps } from '../components/FactionInfo';
import FactionSelect, { FactionSelectSource } from '../components/FactionSelect';
import api from '../utils/api';
import useRemoteData from '../hooks/useRemoteData';
import LoadFailure from '../components/LoadFailure';

import { HEADER_HEIGHT } from '../constants';

type ReferenceControl = 'previous' | 'next' | FactionSelectSource;

// Numeric enum values identify sections; reverse-map names are not additional sections.
const COUNT = Object.values(FactionAccordionIndex).filter(value => typeof value === 'number').length;

const useStyles = makeStyles(theme => ({
    appBar: {
        top: HEADER_HEIGHT,
    },
    toolbar: {
        width: '100%',
        margin: `${theme.spacing(1)} 0px`,
    },
}));

function Factions() {
    const classes = useStyles();

    const [selectedName, setSelectedName] = useState('');
    const focusOrigin = useRef<ReferenceControl | null>(null);
    // MUI Select exposes a focus handle, not its display element.
    const selectionInput = useRef<Pick<HTMLElement, 'focus'>>(null);
    const randomButton = useRef<HTMLButtonElement>(null);
    const previousButton = useRef<HTMLButtonElement>(null);
    const nextButton = useRef<HTMLButtonElement>(null);
    const retryButton = useRef<HTMLButtonElement>(null);
    const load = useCallback(async (signal: AbortSignal) => {
        const names = await api.factionListNames(undefined, { signal });
        const name = selectedName || names[0];
        const [faction] = await api.factionGetFaction({ name }, { signal });
        if (!faction) throw new Error('Faction not found');
        return { names, faction, name };
    }, [selectedName]);
    const { resource, retry } = useRemoteData(load);
    useEffect(() => {
        const origin = focusOrigin.current;
        if (!origin || resource.kind === 'loading') return;
        const controls = {
            previous: previousButton.current,
            next: nextButton.current,
            selection: selectionInput.current,
            random: randomButton.current,
        };
        const target = resource.kind === 'error' ? retryButton.current : controls[origin];
        // Loading removes the toolbar. Preserve focus deliberately moved elsewhere.
        const focused = document.activeElement;
        if (target && (focused === document.body || focused === document.documentElement)) target.focus();
        if (resource.kind === 'loaded') focusOrigin.current = null;
    }, [resource]);
    const pending = resource.kind === 'loading';
    const factionInfo = resource.kind === 'loaded' ? resource.data.faction : null;
    const factionNames = resource.kind === 'loaded' ? resource.data.names : [];
    const displayName = resource.kind === 'loaded' ? resource.data.name : selectedName;

    const [expanded, setExpanded] = useState<boolean[]>(Array(COUNT).fill(false));

    const onExpandedChange: FactionInfoProps['onExpandedChange'] = (index, e, expand) => {
        const newExpanded = [...expanded];
        newExpanded[index] = expand;
        setExpanded(newExpanded);
    };

    const retryLoad = () => {
        if (!focusOrigin.current && document.activeElement === retryButton.current) focusOrigin.current = 'selection';
        retry();
    };
    if (resource.kind === 'error') return <LoadFailure retry={retryLoad} buttonRef={retryButton} />;
    if (pending) return <CircularProgress aria-label="Loading factions" />;
    const onFactionChange = (name: string, origin: ReferenceControl | null) => {
        focusOrigin.current = origin;
        setSelectedName(name);
    };

    const index = factionNames.indexOf(displayName);
    const lastIndex = factionNames.length - 1;
    const prevFaction = index === 0 ? factionNames[lastIndex] : factionNames[index - 1];
    const nextFaction = index === lastIndex ? factionNames[0] : factionNames[index + 1];

    return (
        <>
            <AppBar className={classes.appBar} color="inherit" position="sticky">
                <Toolbar classes={{ root: classes.toolbar }} disableGutters>
                    <Tooltip title={prevFaction}>
                        <IconButton ref={previousButton} onClick={event => onFactionChange(
                            prevFaction, document.activeElement === event.currentTarget ? 'previous' : null,
                        )} size="large">
                            <NavigateBeforeIcon />
                        </IconButton>
                    </Tooltip>
                    <FactionSelect
                        inputRef={selectionInput}
                        randomizeRef={randomButton}
                        fullWidth
                        factionNames={factionNames}
                        value={displayName}
                        onChange={onFactionChange}
                        hideNone
                    />
                    <Tooltip title={nextFaction}>
                        <IconButton ref={nextButton} onClick={event => onFactionChange(
                            nextFaction, document.activeElement === event.currentTarget ? 'next' : null,
                        )} size="large">
                            <NavigateNextIcon />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
                <Toolbar>
                    <Grid container direction="row" justifyContent="flex-start" spacing={1}>
                        <Grid item>
                            <Button
                                size="small"
                                color="primary"
                                variant="contained"
                                disabled={expanded.every(e => !e)}
                                onClick={() => setExpanded(Array(COUNT).fill(false))}
                            >
                                <Typography variant="body2">Collapse</Typography>
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                size="small"
                                color="primary"
                                variant="contained"
                                disabled={expanded.every(e => e)}
                                onClick={() => setExpanded(Array(COUNT).fill(true))}
                            >
                                <Typography variant="body2">Expand</Typography>
                            </Button>
                        </Grid>
                    </Grid>
                </Toolbar>
            </AppBar>
            {pending ? (
                <Grid sx={{ height: '100%' }} container justifyContent="center" alignItems="center" direction="column">
                    <CircularProgress aria-label="Loading faction details" size={'50vw'} />
                </Grid>
            ) : (
                <FactionInfo faction={factionInfo} expanded={expanded} onExpandedChange={onExpandedChange} />
            )}
        </>
    );
}

export default Factions;
