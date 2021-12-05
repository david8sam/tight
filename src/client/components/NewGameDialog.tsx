import React, { useState } from 'react';

import {
    AppBar,
    Button,
    Dialog,
    DialogContent,
    Divider,
    FormControl,
    Grid,
    IconButton,
    Select,
    TextField,
    Toolbar,
    Tooltip,
    Typography,
    Theme,
    MenuItem,
    InputLabel,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import CloseIcon from '@material-ui/icons/Close';

import { Game, generateBlankPublicObjectives, Objective } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import PublicObjectives from './PublicObjectives';

type GameOptions = {
    name: string;
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
    gridItem: {
        width: '100%',
    },
}));

function NewGameDialog(props: NewGameDialogProps) {
    const classes = useStyles(props);
    const { open, onClose } = props;
    const {
        state: { games, account },
        sendData,
    } = useAppContext();

    const accountId = account?.id;
    const playerGames = Object.values(games).filter(g => g.creator === accountId);

    const [gameOptions, setGameOptions] = useState<GameOptions>(() => ({
        name: generateNextName(playerGames),
        numPlayers: 8,
        numRounds: 10,
        numVictoryPoints: 10,
        publicObjectives: generateBlankPublicObjectives(),
    }));

    const onCancel = () => {
        onClose();
    };

    const onSave = () => {
        sendData({ type: MessageType.CREATE_GAME, data: { playerId: accountId, ...gameOptions } });
        onClose();
    };

    const onGameOptionChange = (options: Partial<GameOptions>) => setGameOptions(v => ({ ...v, ...options }));

    const { name, numPlayers, numRounds, numVictoryPoints, publicObjectives } = gameOptions;
    const gameExists = Boolean(playerGames.find(g => g.name === gameOptions.name));
    const nameError = !name || gameExists;
    const poError = !publicObjectives?.length;
    const hasError = nameError || poError;

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
                <Button disabled={hasError} autoFocus color="inherit" onClick={onSave}>
                    Save
                </Button>
            </AppBar>
            <DialogContent dividers>
                <Grid container direction="column" justifyContent="center" alignItems="center" spacing={2}>
                    <Grid item className={classes.gridItem}>
                        <FormControl fullWidth>
                            <TextField
                                variant="outlined"
                                fullWidth
                                value={name}
                                onChange={e => onGameOptionChange({ name: e?.target?.value })}
                                required
                                error={nameError}
                                helperText={gameExists ? 'Name already exists' : ''}
                                label="Name"
                            />
                        </FormControl>
                    </Grid>
                    <Grid item className={classes.gridItem}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel id="num-players">Number of Players</InputLabel>
                            <Select
                                labelId="num-players"
                                value={numPlayers}
                                onChange={e => onGameOptionChange({ numPlayers: Number(e?.target?.value) })}
                                label="Number of Players"
                            >
                                {NUM_PLAYER_OPTIONS.map(({ label, value }) => (
                                    <MenuItem button key={value} value={value}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item className={classes.gridItem}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel id="num-rounds">Number of Rounds</InputLabel>
                            <Select
                                labelId="num-rounds"
                                value={numRounds}
                                onChange={e => onGameOptionChange({ numRounds: Number(e?.target?.value) })}
                                label="Number of Players"
                            >
                                {NUM_ROUNDS_OPTIONS.map(({ label, value }) => (
                                    <MenuItem button key={value} value={value}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item className={classes.gridItem}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel id="num-vps">Victory Points To Win</InputLabel>
                            <Select
                                labelId="num-vps"
                                value={numVictoryPoints}
                                onChange={e => onGameOptionChange({ numVictoryPoints: Number(e?.target?.value) })}
                                label="Victory Points To Win"
                            >
                                {NUM_VP_OPTIONS.map(({ label, value }) => (
                                    <MenuItem button key={value} value={value}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item className={classes.gridItem}>
                        <Divider variant="fullWidth" orientation="horizontal" />
                    </Grid>
                    <Grid item className={classes.gridItem}>
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
