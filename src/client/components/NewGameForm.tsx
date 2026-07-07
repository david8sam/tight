import React from 'react';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Autocomplete, Button, IconButton, MenuItem, TextField, Tooltip, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { Objective } from 'common/Game';

import { ALL_PUBLIC_OBJECTIVES, PublicObjectiveEntry } from '../data/publicObjectives';

import { SectionHeader, StatPill } from './ui';

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
    publicObjectives: [],
} as const;

function generateNumSelectOptions(size: number): number[] {
    return Array(size)
        .fill(0)
        .map((_, i) => i + 1);
}

const NUM_PLAYER_OPTIONS = generateNumSelectOptions(8);
const NUM_ROUNDS_OPTIONS = generateNumSelectOptions(20);
const NUM_VP_OPTIONS = generateNumSelectOptions(20);

const useStyles = makeStyles()(theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
    },
    numbers: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: theme.spacing(1.5),
    },
    objectiveRows: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(0.5),
    },
    objectiveRow: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        padding: theme.spacing(0.75, 1),
        borderRadius: theme.game.radius.control,
        backgroundColor: theme.game.surface.strip,
    },
    objectiveNumber: {
        fontFamily: '"Orbitron", sans-serif',
        fontSize: 11,
        color: theme.palette.text.disabled,
        width: 18,
        flexShrink: 0,
        textAlign: 'right',
    },
    objectiveText: {
        flex: 1,
        minWidth: 0,
        fontSize: 12.5,
        color: theme.palette.text.secondary,
    },
    option: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    optionDescription: {
        fontSize: 11.5,
        color: theme.palette.text.secondary,
    },
    empty: {
        textAlign: 'center',
        color: theme.palette.text.disabled,
        fontSize: 12.5,
        padding: theme.spacing(1.5, 0),
    },
    customButton: {
        alignSelf: 'flex-start',
    },
}));

interface NewGameFormProps {
    gameOptions?: GameOptions;
    onChange: (options: GameOptions) => void;
}

function NewGameForm(props: NewGameFormProps) {
    const { classes } = useStyles();
    const { gameOptions = DEFAULT_GAME_OPTIONS, onChange } = props;
    const { numPlayers, numRounds, numVictoryPoints, publicObjectives = [] } = gameOptions;

    const onGameOptionChange = (newOptions: Partial<GameOptions>) => onChange({ ...gameOptions, ...newOptions });

    // Objective ids must stay contiguous from 1 — faction publicObjectives are boolean[] indexed by id - 1
    const setObjectives = (objectives: Omit<Objective, 'id'>[]) => {
        onGameOptionChange({ publicObjectives: objectives.map((o, i) => ({ ...o, id: i + 1 })) });
    };

    const onAddObjective = (entry: PublicObjectiveEntry | null) => {
        if (entry) {
            setObjectives([...publicObjectives, { description: `${entry.name} — ${entry.description}`, vp: entry.vp }]);
        }
    };

    const onAddCustom = () => {
        setObjectives([...publicObjectives, { description: 'Custom objective', vp: 1 }]);
    };

    const onRemoveObjective = (index: number) => {
        setObjectives(publicObjectives.filter((_o, i) => i !== index));
    };

    const isAdded = (entry: PublicObjectiveEntry) =>
        publicObjectives.some(o => o.description.startsWith(`${entry.name} — `));

    return (
        <div className={classes.root}>
            <div className={classes.numbers}>
                <TextField
                    select
                    size="small"
                    label="Players"
                    value={numPlayers}
                    onChange={e => onGameOptionChange({ numPlayers: Number(e.target.value) })}
                >
                    {NUM_PLAYER_OPTIONS.map(value => (
                        <MenuItem key={value} value={value}>
                            {value}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    size="small"
                    label="Rounds"
                    value={numRounds}
                    onChange={e => onGameOptionChange({ numRounds: Number(e.target.value) })}
                >
                    {NUM_ROUNDS_OPTIONS.map(value => (
                        <MenuItem key={value} value={value}>
                            {value}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    size="small"
                    label="Victory points"
                    value={numVictoryPoints}
                    onChange={e => onGameOptionChange({ numVictoryPoints: Number(e.target.value) })}
                >
                    {NUM_VP_OPTIONS.map(value => (
                        <MenuItem key={value} value={value}>
                            {value}
                        </MenuItem>
                    ))}
                </TextField>
            </div>

            <SectionHeader>Public objectives</SectionHeader>
            <Autocomplete
                options={ALL_PUBLIC_OBJECTIVES}
                groupBy={entry => (entry.vp === 1 ? 'Stage I (1 VP)' : 'Stage II (2 VP)')}
                getOptionLabel={entry => entry.name}
                getOptionDisabled={isAdded}
                value={null}
                blurOnSelect
                onChange={(_e, entry) => onAddObjective(entry)}
                renderInput={params => <TextField {...params} size="small" label="Add objective" />}
                renderOption={(optionProps, entry) => (
                    <li {...optionProps} key={entry.name}>
                        <span className={classes.option}>
                            <Typography variant="body2">{entry.name}</Typography>
                            <span className={classes.optionDescription}>{entry.description}</span>
                        </span>
                    </li>
                )}
            />

            <div className={classes.objectiveRows}>
                {publicObjectives.length === 0 && (
                    <div className={classes.empty}>Add at least one public objective to create the game.</div>
                )}
                {publicObjectives.map((objective, i) => (
                    <div key={objective.id} className={classes.objectiveRow}>
                        <span className={classes.objectiveNumber}>{objective.id}</span>
                        <span className={classes.objectiveText}>{objective.description}</span>
                        <StatPill size="small">{objective.vp} VP</StatPill>
                        <Tooltip title="Remove">
                            <IconButton size="small" onClick={() => onRemoveObjective(i)}>
                                <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Tooltip>
                    </div>
                ))}
            </div>

            <Button className={classes.customButton} size="small" startIcon={<AddIcon />} onClick={onAddCustom}>
                Add custom objective
            </Button>
        </div>
    );
}

export default NewGameForm;
