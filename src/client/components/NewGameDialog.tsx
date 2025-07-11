import React, { useState } from 'react';
import { useNavigate } from 'react-router';

import CloseIcon from '@mui/icons-material/Close';
import {
    AppBar,
    Button,
    Dialog,
    DialogContent,
    IconButton,
    SxProps,
    Theme,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material';

import { useAppContext } from '../Context';
import { ActionType } from '../reducer';

import api from '../utils/api';

import NewGameForm, { GameOptions, DEFAULT_GAME_OPTIONS } from './NewGameForm';

export interface NewGameDialogProps {
    open: boolean;
    onClose: () => void;
}

const styles: Record<string, SxProps<Theme>> = {
    appBar: {
        flexDirection: 'row',
        position: 'relative',
        alignItems: 'center',
        paddingRight: 2,
    },
    title: {
        marginLeft: 2,
        flex: 1,
    },
};

function NewGameDialog(props: NewGameDialogProps) {
    const { dispatch } = useAppContext();
    const { open, onClose } = props;

    const [gameOptions, setGameOptions] = useState<GameOptions>(() => ({ ...DEFAULT_GAME_OPTIONS }));
    const [creatingGame, setCreatingGame] = useState(false);

    const navigate = useNavigate();

    const onCancel = () => {
        onClose();
    };

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
        <Dialog open={open} fullScreen>
            <AppBar sx={styles.appBar}>
                <Toolbar>
                    <Tooltip title="Close">
                        <IconButton onClick={onCancel} size="large">
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
                <Typography variant="h6" sx={styles.title}>
                    Create New Game
                </Typography>
                <Button disabled={hasError || creatingGame} autoFocus color="inherit" onClick={onSave}>
                    Save
                </Button>
            </AppBar>
            <DialogContent dividers>
                <NewGameForm gameOptions={gameOptions} onChange={options => setGameOptions(options)} />
            </DialogContent>
        </Dialog>
    );
}

export default NewGameDialog;
