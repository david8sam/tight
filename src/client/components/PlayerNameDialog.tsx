import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import CloseIcon from '@mui/icons-material/Close';
import {
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    IconButton,
    MenuItem,
    TextField,
    TextFieldProps,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';
import { ActionType } from '../reducer';

const CREATE_NEW_PLAYER_VALUE = 'Create New Player';

interface PlayerNameDialogProps {
    open: boolean;
    onClose?: (canceled: boolean) => void;
}

const useStyles = makeStyles()(theme => ({
    title: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing(1),
        padding: theme.spacing(1.75, 2, 1),
    },
    titleText: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1.25),
        minWidth: 0,
    },
    gameId: {
        fontFamily: '"Orbitron", sans-serif',
        fontSize: 12,
        letterSpacing: '0.08em',
        padding: theme.spacing(0.5, 1.125),
        borderRadius: theme.game.radius.control,
        backgroundColor: alpha(theme.palette.primary.main, 0.14),
        color: theme.palette.primary.light,
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
    },
}));

export default function PlayerNameDialog(props: PlayerNameDialogProps) {
    const { classes } = useStyles();
    const { open, onClose } = props;

    const { sendData, dispatch } = useAppContext();
    const { game, gameId, playerId } = useGameInfo();

    const [isNewPlayer, setIsNewPlayer] = useState(!Boolean(playerId));
    const [selectedPlayerId, setSelectedPlayerId] = useState(playerId ?? '');
    const [joining, setJoining] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (joining && game?.players.includes(selectedPlayerId)) {
            setJoining(false);
            dispatch({ type: ActionType.setPlayerId, payload: selectedPlayerId });
            navigate(`/${gameId}/status`);
        }
    }, [game, joining, selectedPlayerId]);

    if (!game) {
        return null;
    }

    const onJoinClick = (e: React.SyntheticEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!gameId) {
            return;
        }

        setJoining(true);

        sendData({
            type: MessageType.GAME_ADD_PLAYER,
            data: { gameId, playerId: selectedPlayerId },
        });

        onClose?.(false);
    };

    const onPlayerNameChange: TextFieldProps['onChange'] = e => {
        const newName = e.target.value;
        setSelectedPlayerId(newName);
        setIsNewPlayer(newName === CREATE_NEW_PLAYER_VALUE);
    };

    return (
        <Dialog open={open} onClose={() => onClose?.(true)} fullWidth maxWidth="xs">
            <div className={classes.title}>
                <span className={classes.titleText}>
                    <Typography variant="h6">Join game</Typography>
                    <span className={classes.gameId}>{gameId}</span>
                </span>
                <IconButton size="small" onClick={() => onClose?.(true)}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </div>
            <DialogContent className={classes.content}>
                <TextField
                    label="Select Player"
                    select
                    value={game.players.includes(selectedPlayerId) ? selectedPlayerId : CREATE_NEW_PLAYER_VALUE}
                    fullWidth
                    onChange={onPlayerNameChange}
                >
                    <MenuItem key={CREATE_NEW_PLAYER_VALUE} value={CREATE_NEW_PLAYER_VALUE} divider>
                        Create New Player
                    </MenuItem>
                    {game.players.map(playerId => (
                        <MenuItem key={playerId} value={playerId}>
                            {playerId}
                        </MenuItem>
                    ))}
                </TextField>
                {isNewPlayer && (
                    <TextField
                        autoFocus
                        fullWidth
                        color="primary"
                        label="Enter Name"
                        onChange={e => setSelectedPlayerId(e.target.value)}
                    />
                )}
                <Button
                    disabled={!Boolean(selectedPlayerId) || selectedPlayerId === CREATE_NEW_PLAYER_VALUE || joining}
                    color="primary"
                    variant="contained"
                    size="large"
                    onClick={onJoinClick}
                >
                    {joining ? <CircularProgress size={24} /> : 'Continue'}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
