import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import CloseIcon from '@mui/icons-material/Close';
import {
    AppBar,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    IconButton,
    SxProps,
    Theme,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material';

import useGameInfo from '../hooks/useGameInfo';
import api from '../utils/api';

import NewGameForm, { GameOptions, DEFAULT_GAME_OPTIONS } from './NewGameForm';

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

interface RestartGameDialogProps {
    open: boolean;
    onClose: () => void;
}

export default function RestartGameDialog(props: RestartGameDialogProps) {
    const { open, onClose } = props;

    const [restartingGame, setRestartingGame] = useState(false);

    const { game } = useGameInfo();

    const { numPlayers, numRounds, numVictoryPoints, publicObjectives } = game || DEFAULT_GAME_OPTIONS;
    const [gameOptions, setGameOptions] = useState<GameOptions>({
        numPlayers,
        numRounds,
        numVictoryPoints,
        publicObjectives,
    });

    const navigate = useNavigate();

    if (!game) {
        return null;
    }

    const onCancel = () => {
        onClose?.();
    };

    const onRestart = () => {
        setRestartingGame(true);
        api.gameRestart({ id: game.id, ...gameOptions }).then(gameCode => {
            if (gameCode) {
                navigate(`/${gameCode}`);
            }

            setRestartingGame(false);
            onClose?.();
        });
    };

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
                <Toolbar>
                    <Typography variant="h6" sx={styles.title}>
                        Restart Game?
                    </Typography>
                </Toolbar>
            </AppBar>
            <DialogContent dividers>
                <Box display="flex" flexDirection="column">
                    <Typography>
                        Restarting the game will reset all progress. Update any game settings below and click "Restart
                        Game" to continue.
                    </Typography>
                    <Toolbar />
                    <Button variant="contained" fullWidth onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ marginTop: 2 }}
                        color="error"
                        onClick={onRestart}
                        disabled={restartingGame}
                    >
                        {restartingGame ? (
                            <CircularProgress variant="indeterminate" size={30} sx={{ marginRight: 2 }} />
                        ) : null}
                        Restart Game
                    </Button>
                </Box>
                <Toolbar />
                <NewGameForm gameOptions={gameOptions} onChange={options => setGameOptions(options)} />
            </DialogContent>
        </Dialog>
    );
}
