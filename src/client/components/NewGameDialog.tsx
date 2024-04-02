import React, { useState } from 'react';
import { useNavigate } from 'react-router';

import CloseIcon from '@mui/icons-material/Close';
import {
    AppBar,
    Button,
    Dialog,
    DialogContent,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    SxProps,
    Theme,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';

import { generateBlankPublicObjectives, Objective } from 'common/Game';

import { useAppContext } from '../Context';
import { ActionType } from '../reducer';

import api from '../utils/api';

import PublicObjectives from './PublicObjectives';

type GameOptions = {
    numPlayers: number;
    numRounds: number;
    numVictoryPoints: number;
    publicObjectives?: Objective[];
};

function generateNumSelectOptions(size: number): { label: string; value: number }[] {
    return Array(size)
        .fill(0)
        .map((_, i) => ({ label: `${i + 1}`, value: i + 1 }));
}

const NUM_PLAYER_OPTIONS = generateNumSelectOptions(8);
const NUM_ROUNDS_OPTIONS = generateNumSelectOptions(20);
const NUM_VP_OPTIONS = generateNumSelectOptions(20);

export interface NewGameDialogProps {
    open: boolean;
    onClose: () => void;
}

const useStyles = makeStyles(theme => ({
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
    gridItem: {
        width: '100%',
    },
}));

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
};

function NewGameDialog(props: NewGameDialogProps) {
    const { dispatch } = useAppContext();
    const { open, onClose } = props;

    const [gameOptions, setGameOptions] = useState<GameOptions>(() => ({
        numPlayers: 8,
        numRounds: 10,
        numVictoryPoints: 10,
        publicObjectives: generateBlankPublicObjectives(),
    }));

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

    const onGameOptionChange = (options: Partial<GameOptions>) => setGameOptions(v => ({ ...v, ...options }));

    const { numPlayers, numRounds, numVictoryPoints, publicObjectives } = gameOptions;
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
                <Grid container direction="column" justifyContent="center" alignItems="center" spacing={2}>
                    <Grid item sx={styles.gridItem}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel id="num-players">Number of Players</InputLabel>
                            <Select
                                variant="standard"
                                labelId="num-players"
                                value={numPlayers}
                                onChange={e => onGameOptionChange({ numPlayers: Number(e?.target?.value) })}
                                label="Number of Players"
                            >
                                {NUM_PLAYER_OPTIONS.map(({ label, value }) => (
                                    <MenuItem key={value} value={value}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item sx={styles.gridItem}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel id="num-rounds">Number of Rounds</InputLabel>
                            <Select
                                variant="standard"
                                labelId="num-rounds"
                                value={numRounds}
                                onChange={e => onGameOptionChange({ numRounds: Number(e?.target?.value) })}
                                label="Number of Players"
                            >
                                {NUM_ROUNDS_OPTIONS.map(({ label, value }) => (
                                    <MenuItem key={value} value={value}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item sx={styles.gridItem}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel id="num-vps">Victory Points To Win</InputLabel>
                            <Select
                                variant="standard"
                                labelId="num-vps"
                                value={numVictoryPoints}
                                onChange={e => onGameOptionChange({ numVictoryPoints: Number(e?.target?.value) })}
                                label="Victory Points To Win"
                            >
                                {NUM_VP_OPTIONS.map(({ label, value }) => (
                                    <MenuItem key={value} value={value}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item sx={styles.gridItem}>
                        <Divider variant="fullWidth" orientation="horizontal" />
                    </Grid>
                    <Grid item sx={styles.gridItem}>
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
