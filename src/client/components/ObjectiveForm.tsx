import React, { ChangeEvent, FocusEvent } from 'react';

import { FormControl, TextField, Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

import { Objective } from 'common/Game';

export interface ObjectiveFormProps {
    objective: Objective;
    onChange: (objective: Objective) => void;
    disabled?: boolean;
}

const useStyles = makeStyles((theme: Theme) => ({
    formControl: {
        paddingBottom: theme.spacing(2),
    },
}));

function ObjectiveForm(props: ObjectiveFormProps) {
    const classes = useStyles(props);
    const { objective, onChange, disabled = false } = props;

    const onVpChange = (e: ChangeEvent<HTMLInputElement> | FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange({ ...objective, vp: Number(e?.target?.value) });

    return (
        <>
            <FormControl className={classes.formControl} fullWidth>
                <TextField
                    disabled={disabled}
                    variant="outlined"
                    fullWidth
                    value={objective.name}
                    onChange={e => onChange({ ...objective, name: e?.target?.value ?? '' })}
                    required
                    error={!Boolean(objective.name)}
                    label="Name"
                />
            </FormControl>
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
            <FormControl className={classes.formControl} fullWidth>
                <TextField
                    disabled={disabled}
                    variant="outlined"
                    fullWidth
                    value={objective.vp || ''} // Clear field if 0
                    type="number"
                    onChange={onVpChange}
                    onBlur={onVpChange}
                    required
                    error={!objective.vp}
                    label="Victory Points"
                />
            </FormControl>
        </>
    );
}

export default ObjectiveForm;
