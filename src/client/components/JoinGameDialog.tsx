import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import CloseIcon from '@mui/icons-material/Close';
import {
    AppBar,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    FormControl,
    Grid,
    IconButton,
    SxProps,
    TextField,
    Theme,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material';

import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';
import { ActionType } from '../reducer';
import api from '../utils/api';

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
    gridItem: {
        width: '100%',
    },
    joinButton: {
        marginTop: 2,
    },
};

interface JoinGameDialogProps {
    open: boolean;
    onClose: () => void;
}

export default function JoinGameDialog(props: JoinGameDialogProps) {
    const { open, onClose } = props;
    const { gameId: currentGameId } = useGameInfo();
    const { dispatch } = useAppContext();

    const [gameId, setGameId] = useState('');
    const [error, setError] = useState(false);
    const [canRejoin, setCanRejoin] = useState(true);
    const [joining, setJoining] = useState(false);

    const navigate = useNavigate();

    const onCancel = () => {
        onClose();
    };

    const onJoinClick = (e: React.SyntheticEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        setJoining(true);

        api.gameValidate({ gameId: id })
            .then(exists => {
                if (exists) {
                    navigate(`/${id}`);
                } else {
                    if (id === currentGameId) {
                        setCanRejoin(false);
                    }

                    if (id === gameId) {
                        setError(true);
                    }
                }
            })
            .finally(() => setJoining(false));
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
                <Typography variant="h6" sx={styles.title}>
                    Join Game
                </Typography>
            </AppBar>
            <DialogContent dividers>
                <Grid container direction="column" justifyContent="center" alignItems="center" spacing={2}>
                    <Grid item sx={styles.gridItem}>
                        <FormControl fullWidth variant="standard">
                            <TextField
                                color="primary"
                                variant="outlined"
                                label="Game Code"
                                helperText={error ? 'Invalid Game Code' : ''}
                                error={error}
                                onChange={e => setGameId(e.target.value.toUpperCase())}
                                value={gameId}
                            />
                        </FormControl>
                    </Grid>
                    <Grid item sx={styles.gridItem}>
                        <FormControl fullWidth variant="standard">
                            <Button
                                disabled={gameId.length !== 4 || joining}
                                sx={styles.joinButton}
                                color="primary"
                                variant="contained"
                                size="large"
                                onClick={e => onJoinClick(e, gameId)}
                            >
                                {joining ? <CircularProgress size={24} /> : 'Join'}
                            </Button>
                        </FormControl>
                    </Grid>
                    {currentGameId && canRejoin && (
                        <>
                            <Grid item sx={styles.gridItem}>
                                <FormControl fullWidth variant="standard">
                                    <Button
                                        disabled={joining}
                                        sx={styles.joinButton}
                                        color="primary"
                                        variant="contained"
                                        size="large"
                                        onClick={e => onJoinClick(e, currentGameId)}
                                    >
                                        {joining ? <CircularProgress size={24} /> : `Rejoin "${currentGameId}"`}
                                    </Button>
                                </FormControl>
                            </Grid>
                            <Grid item sx={styles.gridItem}>
                                <FormControl fullWidth variant="standard">
                                    <Button
                                        disabled={joining}
                                        sx={styles.joinButton}
                                        color="primary"
                                        variant="contained"
                                        size="large"
                                        onClick={e => {
                                            dispatch({ type: ActionType.setPlayerId, payload: undefined });
                                            onJoinClick(e, currentGameId);
                                        }}
                                    >
                                        {joining ? (
                                            <CircularProgress size={24} />
                                        ) : (
                                            `Rejoin "${currentGameId}" as new player`
                                        )}
                                    </Button>
                                </FormControl>
                            </Grid>
                        </>
                    )}
                </Grid>
            </DialogContent>
        </Dialog>
    );
}
