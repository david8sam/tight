import React from 'react';

import {
    FormControl,
    InputLabel,
    makeStyles,
    MenuItem,
    Select,
    SelectProps,
    TextField,
    Theme,
} from '@material-ui/core';

import { Objective } from 'common/Game';

const NUM_VP_OPTIONS = Array(10)
    .fill(0)
    .map((_, i) => ({ label: `${i + 1}`, value: i + 1 }));

export interface ObjectiveFormProps {
    objective: Objective;
    onChange: (objective: Objective) => void;
    disabled?: boolean;
}

const useStyles = makeStyles(theme => ({
    formControl: {
        paddingBottom: theme.spacing(2),
    },
}));

function ObjectiveForm(props: ObjectiveFormProps) {
    const classes = useStyles(props);
    const { objective, onChange, disabled = false } = props;

    const onVpChange: SelectProps['onChange'] = e => onChange({ ...objective, vp: Number(e?.target?.value) });

    return (
        <>
            <FormControl className={classes.formControl} fullWidth>
                <TextField
                    disabled={disabled}
                    variant="outlined"
                    fullWidth
                    value={objective.description}
                    onChange={e => onChange({ ...objective, description: e?.target?.value ?? '' })}
                    label="Description"
                    multiline
                />
            </FormControl>
            <FormControl fullWidth variant="outlined">
                <InputLabel id="num-vps">Victory Points</InputLabel>
                <Select
                    labelId="num-vps"
                    value={objective.vp}
                    onChange={onVpChange}
                    label="Victory Points"
                    disabled={disabled}
                >
                    {NUM_VP_OPTIONS.map(({ label, value }) => (
                        <MenuItem button key={value} value={value}>
                            {label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </>
    );
}

export default ObjectiveForm;
