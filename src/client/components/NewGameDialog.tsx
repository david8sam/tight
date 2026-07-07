import React, { useState } from 'react';
import { useNavigate } from 'react-router';

import CloseIcon from '@mui/icons-material/Close';
import { Button, CircularProgress, Dialog, DialogContent, IconButton, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { useAppContext } from '../Context';
import { ActionType } from '../reducer';
import api from '../utils/api';

import NewGameForm, { GameOptions, DEFAULT_GAME_OPTIONS } from './NewGameForm';

export interface NewGameDialogProps {
    open: boolean;
    onClose: () => void;
}

const useStyles = makeStyles()(theme => ({
    title: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing(1.75, 2, 1),
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
    },
}));

function NewGameDialog(props: NewGameDialogProps) {
    const { classes } = useStyles();
    const { dispatch } = useAppContext();
    const { open, onClose } = props;

    const [gameOptions, setGameOptions] = useState<GameOptions>(() => ({ ...DEFAULT_GAME_OPTIONS }));
    const [creatingGame, setCreatingGame] = useState(false);

    const navigate = useNavigate();

    const onSave = () => {
        setCreatingGame(true);
        api.gameCreate(gameOptions).then(gameCode => {
            if (gameCode) {
                dispatch({ type: ActionType.setPlayerId, payload: null });
                navigate(`/${gameCode}`);
            }

            setCreatingGame(false);
            onClose();
        });
    };

    const { publicObjectives } = gameOptions;
    const hasError = !publicObjectives?.length;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <div className={classes.title}>
                <Typography variant="h6">Create game</Typography>
                <IconButton size="small" onClick={onClose}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </div>
            <DialogContent className={classes.content}>
                <NewGameForm gameOptions={gameOptions} onChange={options => setGameOptions(options)} />
                <Button
                    color="primary"
                    variant="contained"
                    size="large"
                    disabled={hasError || creatingGame}
                    onClick={onSave}
                >
                    {creatingGame ? <CircularProgress size={24} /> : 'Create game'}
                </Button>
            </DialogContent>
        </Dialog>
    );
}

export default NewGameDialog;
