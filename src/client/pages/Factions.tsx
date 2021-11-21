import React, { ChangeEvent, useEffect, useState } from 'react';

import { Grid, IconButton, Toolbar, Tooltip, Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';

import { Faction } from 'common/Faction';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';
import FactionInfo from '../components/FactionInfo';
import FactionSelect from '../components/FactionSelect';

const useStyles = makeStyles((theme: Theme) => ({
    toolbar: {
        width: '100%',
        margin: `${theme.spacing(1)}px 0px`,
    },
}));

function Factions(props: object) {
    const classes = useStyles(props);
    const { gameId, game, playerId } = useAccountInfo();

    // TODO: also use this page to allow player to select a faction during player setup.

    const { state, sendData } = useAppContext();
    const { factionNames, factionInfo: factionInfoStore } = state;
    const [factionInfoState, setFactionInfo] = useState<Faction | null>(null);
    const [pending, setPending] = useState(false);

    // Initialize by selecting the first faction.
    useEffect(() => {
        if (factionInfoState || factionInfoStore) {
            // Only need to wait until state is initilaized from the server.
            return;
        }

        if (!pending && factionNames.length && !factionInfoState) {
            sendData({ type: MessageType.FACTION_GET, data: { factionName: factionNames[0] } });
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

        const storeName = factionInfoStore && factionInfoStore.name;
        const stateName = factionInfoState && factionInfoState.name;
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
        <Grid container alignItems="center" justifyContent="space-between">
            <Toolbar classes={{ root: classes.toolbar }} disableGutters>
                <Tooltip title={prevFaction}>
                    <IconButton onClick={() => onFactionChange(prevFaction)}>
                        <ArrowBackIcon />
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
                        <ArrowForwardIcon />
                    </IconButton>
                </Tooltip>
            </Toolbar>
            <FactionInfo data={factionInfoState} />
        </Grid>
    );
}

export default Factions;
