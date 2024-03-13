import { isEqual } from 'lodash-es';
import React, { useEffect, useRef, useState } from 'react';

import {
    Avatar,
    Button,
    Card,
    CardActions,
    CardContent,
    Checkbox,
    FormControlLabel,
    Grid,
    IconButton,
    Popover,
    Typography,
} from '@mui/material';

import { Objective } from 'common/Game';
import ObjectiveForm from './ObjectiveForm';

interface ObjectiveCheckboxProps {
    objective: Objective;
    checked: boolean;
    color: string;
    backgroundColor: string;
    editable?: boolean;
    disabled?: boolean;
    allowShowSecret?: boolean;
    onChange: (id: number, checked: boolean) => void;
    onSave?: (objective: Objective) => void;
}

function ObjectiveCheckbox(props: ObjectiveCheckboxProps) {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [infoOpen, setInfoOpen] = useState(false);

    const {
        checked,
        editable = false,
        disabled = false,
        allowShowSecret = false,
        objective,
        onChange,
        onSave,
        color,
        backgroundColor,
    } = props;
    const { id } = objective;
    const isSecret = id < 0;

    const [editObjective, setEditObjective] = useState<Objective>({ ...objective });

    useEffect(() => {
        setEditObjective(objective);
    }, [objective]);

    const onInfoOpen = () => setInfoOpen(!isSecret || (isSecret && allowShowSecret));

    const onCancelEdit = () => {
        // Reset and close form.
        setEditObjective(objective);
        setInfoOpen(false);
    };

    const onSaveObjective = () => {
        if (onSave) {
            onSave(editObjective);
        }

        setInfoOpen(false);
    };

    const canSave = !isEqual(objective, editObjective);

    return (
        <>
            <FormControlLabel
                key={id}
                control={
                    <Checkbox
                        disabled={disabled}
                        checked={checked}
                        onChange={e => onChange(id, e.target.checked)}
                        color="primary"
                    />
                }
                label={
                    <IconButton ref={buttonRef} onClick={onInfoOpen} size="large">
                        <Avatar style={{ color, backgroundColor }}>
                            <Typography>{id < 0 ? `S${-id}` : id}</Typography>
                        </Avatar>
                    </IconButton>
                }
            />
            <Popover
                open={infoOpen}
                onClose={() => setInfoOpen(false)}
                anchorEl={buttonRef.current}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <Card variant="outlined">
                    <CardContent>
                        <ObjectiveForm disabled={disabled} objective={editObjective} onChange={setEditObjective} />
                    </CardContent>
                    {editable && onSave && (
                        <CardActions>
                            <Grid container justifyContent="space-between">
                                <Button color="primary" variant="contained" onClick={onCancelEdit}>
                                    <Typography>Cancel</Typography>
                                </Button>
                                <Button
                                    color="primary"
                                    variant="contained"
                                    onClick={onSaveObjective}
                                    disabled={disabled || !canSave}
                                >
                                    <Typography>Save</Typography>
                                </Button>
                            </Grid>
                        </CardActions>
                    )}
                </Card>
            </Popover>
        </>
    );
}

export default ObjectiveCheckbox;
