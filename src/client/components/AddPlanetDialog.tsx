import React, { useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { AppBar, Button, Dialog, DialogContent, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { MessageType } from 'common/message';
import { PlanetMap } from 'common/Planet';

import useGameInfo from '../hooks/useGameInfo';

import { useAppContext } from '../Context';
import PlanetsTable from './PlanetsTable';

interface AddPlanetDialogProps {
    open: boolean;
    onClose: () => void;
    planetMap: PlanetMap;
    factionName: string;
}

const useStyle = makeStyles()((theme) => ({
    appBar: {
        flexDirection: 'row',
        position: 'relative',
        alignItems: 'center',
        paddingRight: theme.spacing(2),
    },
    title: {
        marginLeft: theme.spacing(2),
        flex: 1,
    },
    content: {
        padding: 0,
    },
}));

function AddPlanetDialog(props: AddPlanetDialogProps) {
    const { classes } = useStyle();
    const { open, onClose, planetMap, factionName } = props;
    const { sendData } = useAppContext();
    const { game, gameId } = useGameInfo();

    const faction = game?.factions.find(f => f.name === factionName);

    const planetNames = faction?.planets || [];
    const [selection, setSelection] = useState(planetNames);

    const onCancel = () => {
        onClose();
    };

    const onSave = () => {
        const lostPlanets = planetNames.filter(n => !selection.includes(n));
        if (lostPlanets.length) {
            sendData({ type: MessageType.LOST_PLANET, data: { gameId, factionName, planetId: lostPlanets } });
        }

        const takenPlanets = selection.filter(s => !planetNames.includes(s));
        if (takenPlanets.length) {
            sendData({ type: MessageType.TAKE_PLANET, data: { gameId, factionName, planetId: takenPlanets } });
        }

        onClose();
    };

    return (
        <Dialog open={open} fullScreen>
            <AppBar classes={{ root: classes.appBar }}>
                <Toolbar>
                    <Tooltip title="Close">
                        <IconButton onClick={onCancel} size="large">
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
                <Typography variant="h6" className={classes.title}>
                    Add/Remove Planets
                </Typography>
                <Button autoFocus color="inherit" onClick={onSave}>
                    Save
                </Button>
            </AppBar>
            <DialogContent classes={{ root: classes.content }}>
                <PlanetsTable
                    ownerFactionName={factionName}
                    planetMap={planetMap}
                    columns={['name', 'owner']}
                    showCheckbox
                    selection={selection}
                    onSelectionChange={setSelection}
                    PlanetNameCellProps={{ hideAbility: true }}
                />
            </DialogContent>
        </Dialog>
    );
}

export default AddPlanetDialog;
