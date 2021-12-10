import React, { ChangeEvent, useEffect, useState } from 'react';

import { AppBar, Button, Grid, IconButton, Theme, Toolbar, Tooltip, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';

import { Faction } from 'common/Faction';
import { MessageType } from 'common/message';

import { HEADER_HEIGHT } from '../constants';
import { useAppContext } from '../Context';
import FactionInfo, { FactionInfoProps, FactionAccordionIndex } from '../components/FactionInfo';
import FactionSelect from '../components/FactionSelect';
import useAccountInfo from '../hooks/useAccountInfo';

// Num accordions
const COUNT = Object.keys(FactionAccordionIndex).length;

const useStyles = makeStyles((theme: Theme) => ({
    appBar: {
        top: HEADER_HEIGHT,
    },
    toolbar: {
        width: '100%',
        margin: `${theme.spacing(1)}px 0px`,
    },
}));

function Factions() {
    const classes = useStyles();

    const { state, sendData } = useAppContext();
    const { player } = useAccountInfo();
    const { factionNames, factionInfo: factionInfoStore } = state;
    const [factionInfoState, setFactionInfo] = useState<Faction | null>(null);
    const [pending, setPending] = useState(false);

    const [expanded, setExpanded] = useState<boolean[]>(Array(COUNT).fill(false));

    const onExpandedChange: FactionInfoProps['onExpandedChange'] = (index, e, expand) => {
        const newExpanded = [...expanded];
        newExpanded[index] = expand;
        setExpanded(newExpanded);
    };

    // Initialize by selecting the first faction.
    useEffect(() => {
        if (factionInfoState || factionInfoStore) {
            // Only need to wait until state is initilaized from the server.
            return;
        }

        if (!pending && factionNames.length && !factionInfoState) {
            const factionName = player?.faction ?? factionNames[0];
            sendData({ type: MessageType.FACTION_GET, data: { factionName } });
            setPending(true);
        } else if (pending && factionInfoState) {
            setPending(false);
        }
    });

    // Effect to update the state from store change.
    useEffect(() => {
        if (factionInfoStore === null && factionInfoState !== null) {
            setFactionInfo(null);
        }

        const storeName = factionInfoStore?.name;
        const stateName = factionInfoState?.name;
        if ((storeName && !stateName) || storeName !== stateName) {
            setFactionInfo(factionInfoStore);
        }
    }, [factionInfoStore, factionInfoState]);

    // Don't render until we have enough data.
    const factionName = factionInfoState && factionInfoState.name;
    if (factionNames.length === 0 || !factionName) {
        return null;
    }

    const onFactionChange = (factionName: string) => {
        sendData({ type: MessageType.FACTION_GET, data: { factionName } });
    };

    const index = factionNames.indexOf(factionName);
    const lastIndex = factionNames.length - 1;
    const prevFaction = index === 0 ? factionNames[lastIndex] : factionNames[index - 1];
    const nextFaction = index === lastIndex ? factionNames[0] : factionNames[index + 1];

    return (
        <>
            <AppBar className={classes.appBar} color="inherit" position="sticky">
                <Toolbar classes={{ root: classes.toolbar }} disableGutters>
                    <Tooltip title={prevFaction}>
                        <IconButton onClick={() => onFactionChange(prevFaction)}>
                            <NavigateBeforeIcon />
                        </IconButton>
                    </Tooltip>
                    <FactionSelect
                        fullWidth
                        factionNames={factionNames}
                        value={factionName}
                        onChange={(e: ChangeEvent<{ value: unknown }>) => onFactionChange(e.target.value as string)}
                    />
                    <Tooltip title={nextFaction}>
                        <IconButton onClick={() => onFactionChange(nextFaction)}>
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
            <FactionInfo faction={factionInfoState} expanded={expanded} onExpandedChange={onExpandedChange} />
        </>
    );
}

export default Factions;
