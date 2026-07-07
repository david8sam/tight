import { isEqual } from 'lodash-es';
import React, { useEffect, useRef, useState } from 'react';

import {
    Avatar,
    Button,
    ButtonBase,
    Card,
    CardActions,
    CardContent,
    Checkbox,
    Grid,
    Popover,
    Typography,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';

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

const useStyles = makeStyles()(theme => ({
    root: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.75),
        width: '100%',
    },
    avatar: {
        width: 28,
        height: 28,
        fontSize: 12,
    },
    description: {
        flex: 1,
        minWidth: 0,
        textAlign: 'left',
        fontSize: 13,
        color: theme.palette.text.secondary,
        borderRadius: theme.game.radius.control,
        padding: theme.spacing(0.5, 0.75),
        justifyContent: 'flex-start',
    },
    hidden: {
        fontStyle: 'italic',
        color: theme.palette.text.disabled,
    },
}));

function ObjectiveCheckbox(props: ObjectiveCheckboxProps) {
    const { classes, cx } = useStyles();
    const rowRef = useRef<HTMLButtonElement>(null);
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
    const showText = !isSecret || allowShowSecret;

    const [editObjective, setEditObjective] = useState<Objective>({ ...objective });

    useEffect(() => {
        setEditObjective(objective);
    }, [objective]);

    const onInfoOpen = () => setInfoOpen(showText);

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

    let description = objective.description || 'No description';
    if (!showText) {
        description = 'Hidden secret objective';
    }

    return (
        <>
            <div className={classes.root}>
                <Checkbox
                    disabled={disabled}
                    checked={checked}
                    onChange={e => onChange(id, e.target.checked)}
                    color="primary"
                    size="small"
                />
                <Avatar className={classes.avatar} style={{ color, backgroundColor }}>
                    {id < 0 ? `S${-id}` : id}
                </Avatar>
                <ButtonBase
                    ref={rowRef}
                    className={cx(classes.description, !showText && classes.hidden)}
                    onClick={onInfoOpen}
                    disabled={!showText}
                >
                    {description}
                </ButtonBase>
            </div>
            <Popover
                open={infoOpen}
                onClose={() => setInfoOpen(false)}
                anchorEl={rowRef.current}
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
                                <Button color="primary" variant="outlined" onClick={onCancelEdit}>
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
