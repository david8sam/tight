import React, { useState } from 'react';

import {
    AppBar,
    Button,
    Dialog,
    DialogContent,
    FormControl,
    Grid,
    IconButton,
    TextField,
    Toolbar,
    Tooltip,
    Typography,
    Theme,
    Divider,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import CloseIcon from '@material-ui/icons/Close';

import { Game, Objective, PUBLIC_OBJECTIVES_PLACEHOLDER } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import PublicObjectives from './PublicObjectives';

type GameOptions = {
    name: string;
    publicObjectives?: Objective[];
};

export interface NewGameDialogProps {
    open: boolean;
    onClose: () => void;
}

function generateNextName(games: Game[]) {
    let suffix = 1;
    let name = `Game${suffix}`;
    while (games.find(g => g.name === name)) {
        name = `Game${++suffix}`;
    }

    return name;
}

const useStyles = makeStyles((theme: Theme) => ({
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
    divider: {
        margin: `${theme.spacing(2)}px 0px`,
    },
}));

function NewGameDialog(props: NewGameDialogProps) {
    const classes = useStyles(props);
    const { open, onClose } = props;
    const {
        state: { games, accountId },
        sendData,
    } = useAppContext();

    const playerGames = Object.values(games).filter(g => g.creator === accountId);

    const [gameOptions, setGameOptions] = useState<GameOptions>(() => ({
        name: generateNextName(playerGames),
        publicObjectives: PUBLIC_OBJECTIVES_PLACEHOLDER,
    }));

    const onCancel = () => {
        onClose();
    };

    const onSave = () => {
        sendData({ type: MessageType.CREATE_GAME, data: { playerId: accountId, ...gameOptions } });
        onClose();
    };

    const onNameChange = (name: string) => setGameOptions(v => ({ ...v, name }));

    const hasPOs = Boolean(gameOptions.publicObjectives?.length);
    const gameExists = Boolean(playerGames.find(g => g.name === gameOptions.name));
    const nameError = !gameOptions.name || gameExists;

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
                    Create New Game
                </Typography>
                <Button disabled={nameError || !hasPOs} autoFocus color="inherit" onClick={onSave}>
                    Save
                </Button>
            </AppBar>
            <DialogContent dividers>
                <Grid container justifyContent="center" alignItems="center">
                    <Grid item xs>
                        <FormControl fullWidth>
                            <TextField
                                variant="outlined"
                                fullWidth
                                value={gameOptions.name}
                                onChange={e => onNameChange(e && e.target && e.target.value)}
                                required
                                error={nameError}
                                helperText={gameExists ? 'Name already exists' : ''}
                                label="Name"
                            />
                        </FormControl>
                        <Divider variant="fullWidth" orientation="horizontal" className={classes.divider} />
                        <PublicObjectives
                            creatable
                            deletable
                            editable
                            publicObjectives={gameOptions.publicObjectives}
                            onChange={publicObjectives => setGameOptions({ ...gameOptions, publicObjectives })}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
}

export default NewGameDialog;
