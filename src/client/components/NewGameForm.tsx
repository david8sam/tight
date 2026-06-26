import React, { useEffect, useState } from 'react';
import { Divider, FormControl, Grid, InputLabel, MenuItem, Select, SxProps, Theme } from '@mui/material';

import { generateBlankPublicObjectives, Objective } from 'common/Game';

import PublicObjectives from './PublicObjectives';

export type GameOptions = {
    numPlayers: number;
    numRounds: number;
    numVictoryPoints: number;
    publicObjectives?: Objective[];
};

export const DEFAULT_GAME_OPTIONS: GameOptions = {
    numPlayers: 8,
    numRounds: 10,
    numVictoryPoints: 10,
    publicObjectives: generateBlankPublicObjectives(),
} as const;

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

const styles: Record<string, SxProps<Theme>> = {
    gridItem: {
        width: '100%',
    },
};

interface NewGameFormProps {
    gameOptions?: GameOptions;
    onChange: (options: GameOptions) => void;
}

function NewGameForm(props: NewGameFormProps) {
    const { gameOptions = DEFAULT_GAME_OPTIONS, onChange } = props;
    const { numPlayers, numRounds, numVictoryPoints, publicObjectives } = gameOptions;

    const onGameOptionChange = (newOptions: Partial<GameOptions>) => onChange({ ...gameOptions, ...newOptions });

    return (
        <>
            <Grid container direction="column" justifyContent="center" alignItems="center" spacing={2}>
                <Grid sx={styles.gridItem}>
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
                <Grid sx={styles.gridItem}>
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
                <Grid sx={styles.gridItem}>
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
                <Grid sx={styles.gridItem}>
                    <Divider variant="fullWidth" orientation="horizontal" />
                </Grid>
                <Grid sx={styles.gridItem}>
                    <PublicObjectives
                        creatable
                        deletable
                        editable
                        publicObjectives={publicObjectives}
                        onChange={publicObjectives => onGameOptionChange({ publicObjectives })}
                    />
                </Grid>
            </Grid>
        </>
    );
}

export default NewGameForm;
