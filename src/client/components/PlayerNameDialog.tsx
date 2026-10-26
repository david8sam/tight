import React, { useId, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import CloseIcon from '@mui/icons-material/Close';
import {
    AppBar,
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    FormControl,
    Grid,
    IconButton,
    MenuItem,
    SxProps,
    TextField,
    TextFieldProps,
    Theme,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material';

import { isPlayerName, MAX_PLAYER_NAME_LENGTH } from 'common/playerName';
import { MessageType } from 'common/message';

import useGameInfo from '../hooks/useGameInfo';

import { useAppContext } from '../Context';
import { ActionType } from '../reducer';

import GameInfoToolbar from './GameInfoToolbar';

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

const NEW_PLAYER_OPTION = 'new';
const EXISTING_PLAYER_PREFIX = 'player:';

type PlayerSelection = { kind: 'new'; name: string } | { kind: 'existing'; name: string };

interface PlayerNameDialogProps {
    open: boolean;
    onClose?: (canceled: boolean) => void;
}

export default function PlayerNameDialog(props: PlayerNameDialogProps) {
    const selectId = useId();
    const { open, onClose } = props;

    const { sendData, dispatch } = useAppContext();
    const { game, gameId, playerId } = useGameInfo();

    const [selection, setSelection] = useState<PlayerSelection>(
        playerId ? { kind: 'existing', name: playerId } : { kind: 'new', name: '' },
    );
    const selectedPlayerId = selection.name;
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (joining && game?.players.includes(selectedPlayerId)) {
            setJoining(false);
            onClose?.(false);
            dispatch({ type: ActionType.setPlayerId, payload: selectedPlayerId });
            navigate(`/${gameId}/status`);
        }
    }, [game, joining, selectedPlayerId]);

    useEffect(() => {
        if (!open) {
            setJoining(false);
            setJoinError(false);
        }
        if (!open || !joining) return;
        const timer = setTimeout(() => {
            setJoining(false);
            setJoinError(true);
        }, 15000);
        return () => clearTimeout(timer);
    }, [open, joining]);

    if (!game) {
        return null;
    }

    const onJoinClick = (e: React.SyntheticEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!gameId || joining || !isPlayerName(selectedPlayerId)) {
            return;
        }

        setJoinError(false);
        const sent = sendData({
            type: MessageType.GAME_ADD_PLAYER,
            data: { gameId, playerId: selectedPlayerId },
        });

        setJoining(sent);
        setJoinError(!sent);
    };

    const onCancel = () => {
        setJoining(false);
        onClose?.(true);
    };

    const onPlayerNameChange: TextFieldProps['onChange'] = e => {
        const value = e.target.value;
        setSelection(value === NEW_PLAYER_OPTION
            ? { kind: 'new', name: '' }
            : { kind: 'existing', name: value.slice(EXISTING_PLAYER_PREFIX.length) });
    };

    return (
        <Dialog PaperProps={{ 'aria-label': 'Player' }} open={open} onClose={onCancel} fullScreen>
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
                        Player
                    </Typography>
                </Toolbar>
            </AppBar>
            <DialogContent dividers>
                {joinError && (
                    <Alert severity="error">
                        Could not confirm your player joined. Check the connection and try again.
                    </Alert>
                )}
                <GameInfoToolbar game={game} sx={{ marginBottom: 1 }} hideRestartButton hidePairButton />
                <Grid container direction="column" justifyContent="center" alignItems="center" spacing={2}>
                    <Grid item sx={styles.gridItem}>
                        <FormControl fullWidth variant="standard">
                            <TextField
                                id={selectId}
                                label="Select Player"
                                disabled={joining}
                                select
                                value={
                                    selection.kind === 'new' ? NEW_PLAYER_OPTION : `${EXISTING_PLAYER_PREFIX}${selection.name}`
                                }
                                fullWidth
                                variant="outlined"
                                onChange={onPlayerNameChange}
                            >
                                <MenuItem key={NEW_PLAYER_OPTION} value={NEW_PLAYER_OPTION} divider>
                                    Create New Player
                                </MenuItem>
                                {game.players.map(playerId => (
                                    <MenuItem key={`${EXISTING_PLAYER_PREFIX}${playerId}`} value={`${EXISTING_PLAYER_PREFIX}${playerId}`}>
                                        {playerId}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </FormControl>
                    </Grid>
                    {selection.kind === 'new' && (
                        <Grid item sx={styles.gridItem}>
                            <FormControl fullWidth variant="standard">
                                <TextField
                                    color="primary"
                                    variant="outlined"
                                    label="Enter Name"
                                    value={selection.name}
                                    inputProps={{ maxLength: MAX_PLAYER_NAME_LENGTH }}
                                    InputProps={{ readOnly: joining }}
                                    error={Boolean(selectedPlayerId) && !isPlayerName(selectedPlayerId)}
                                    helperText={
                                        selectedPlayerId && !isPlayerName(selectedPlayerId)
                                            ? 'Choose a different name, up to 80 characters.'
                                            : ''
                                    }
                                    onChange={e => setSelection({ kind: 'new', name: e.target.value })}
                                />
                            </FormControl>
                        </Grid>
                    )}
                    <Grid item sx={styles.gridItem}>
                        <FormControl fullWidth variant="standard">
                            <Button
                                disabled={!isPlayerName(selectedPlayerId)}
                                aria-disabled={!isPlayerName(selectedPlayerId) || joining}
                                aria-busy={joining}
                                aria-label="Continue"
                                sx={styles.joinButton}
                                color="primary"
                                variant="contained"
                                size="large"
                                onClick={onJoinClick}
                            >
                                {joining ? <CircularProgress aria-label="Joining game" size={24} /> : 'Continue'}
                            </Button>
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
}
