import React, { useState } from 'react';

import {
    AppBar,
    Button,
    Dialog,
    DialogContent,
    IconButton,
    makeStyles,
    Toolbar,
    Tooltip,
    Typography,
    Theme,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { useAppContext } from '../Context';
import { MessageType } from 'common/message';

import PlanetsTable from './PlanetsTable';

interface AddPlanetDialogProps {
    open: boolean;
    onClose: () => void;
    gameId: string;
    playerId: string;
}

const useStyle = makeStyles(theme => ({
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
    const classes = useStyle(props);
    const { open, onClose } = props;
    const {
        state: { games = {} },
        sendData,
    } = useAppContext();

    const { gameId, playerId } = props;

    const game = games[gameId];
    const player = game?.players && game.players[playerId];
    const planetNames = player && player.planets;

    const [selection, setSelection] = useState(planetNames || []);

    const onCancel = () => {
        onClose();
    };

    const onSave = () => {
        const lostPlanets = planetNames.filter(n => !selection.includes(n));
        if (lostPlanets.length) {
            sendData({ type: MessageType.PLAYER_LOST_PLANET, data: { gameId, playerId, planetId: lostPlanets } });
        }

        const takenPlanets = selection.filter(s => !planetNames.includes(s));
        if (takenPlanets.length) {
            sendData({ type: MessageType.PLAYER_TAKE_PLANET, data: { gameId, playerId, planetId: takenPlanets } });
        }

        onClose();
    };

    return (
        <Dialog open={open} fullScreen>
            <AppBar classes={{ root: classes.appBar }}>
                <Toolbar>
                    <Tooltip title="Close">
                        <IconButton onClick={onCancel}>
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
                    columns={['name', 'owner']}
                    showFilterByName
                    showFilterByOwner
                    gameId={gameId}
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
