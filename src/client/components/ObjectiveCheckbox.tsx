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
} from '@material-ui/core';

import { Objective, SECRET_OBJECTIVE_ID } from 'common/Game';
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
    const isSecret = id === SECRET_OBJECTIVE_ID;

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
                    <IconButton ref={buttonRef} onClick={onInfoOpen}>
                        <Avatar style={{ color, backgroundColor }}>
                            <Typography>{id === SECRET_OBJECTIVE_ID ? 'S' : id}</Typography>
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
                                    disabled={disabled || !editObjective.name || editObjective.vp < 1}
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
