import React, { MouseEvent, useState } from 'react';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Grid, IconButton, TextField, Toolbar, Tooltip, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { calculateVictoryPoints, GameFaction, Objective } from 'common/Game';

import { useAppContext } from '../Context';
import { Accordion, AccordionDetails, AccordionProps, AccordionSummary } from './Accordion';
import EditObjectiveDialog from './EditObjectiveDialog';
import FactionAvatar from './FactionAvatar';

const useStyles = makeStyles(theme => ({
    disabledText: {
        color: theme.palette.text.primary,
    },
    summaryContent: {
        alignItems: 'center',
    },
    toolbar: {
        minHeight: 0,
    },
    avatarContainer: {
        paddingRight: theme.spacing(),
        paddingBottom: theme.spacing(),
    },
}));

export interface ObjectiveProps {
    objective: Objective;
    editable?: boolean;
    onChange?: (objective: Objective) => void;
    deletable?: boolean;
    onDelete?: (objective: Objective) => void;
    showFactions?: boolean;
    AccordionProps?: Omit<AccordionProps, 'children'>;
}

export default function Objective(props: ObjectiveProps) {
    const classes = useStyles(props);
    const {
        deletable = false,
        editable = false,
        objective,
        onChange,
        onDelete,
        showFactions = false,
        AccordionProps,
    } = props;
    const { description, id, vp } = objective;
    const [editOpen, setEditOpen] = useState(false);
    const {
        state: { game },
    } = useAppContext();

    const factions: GameFaction[] = [];
    if (showFactions && game && id > -1) {
        game.factions.forEach(f => {
            if (f.publicObjectives[id - 1] === true) {
                factions.push(f);
            }
        });
    }

    const onDeleteClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(objective);
        }
    };

    const onEditOpenClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setEditOpen(true);
    };

    const onSaveObjective = (o: Objective) => {
        if (onChange) {
            onChange(o);
        }

        setEditOpen(false);
    };

    return (
        <>
            <Accordion disableMargin {...AccordionProps}>
                <AccordionSummary
                    classes={{ content: classes.summaryContent }}
                    disableMargin
                    expandIcon={<ExpandMoreIcon />}
                >
                    <Grid container direction="column">
                        <Toolbar className={classes.toolbar} disableGutters>
                            <Typography>{`Objective ${id < 0 ? `S${-id}` : id} (${vp} VP)`}</Typography>
                            {deletable && (
                                <Tooltip title="Delete">
                                    <IconButton onClick={onDeleteClick} size="large">
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {editable && (
                                <Tooltip title="Edit">
                                    <IconButton onClick={onEditOpenClick} size="large">
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Toolbar>
                        <Toolbar className={classes.toolbar} disableGutters>
                            {factions.map(faction => (
                                <div key={faction.name} className={classes.avatarContainer}>
                                    <FactionAvatar
                                        faction={faction}
                                        title={
                                            game
                                                ? `${faction.name}: ${calculateVictoryPoints(game, faction.name)} VPs`
                                                : undefined
                                        }
                                        // Prevent click from expanding accordion
                                        onClick={e => e.stopPropagation()}
                                    />
                                </div>
                            ))}
                        </Toolbar>
                    </Grid>
                </AccordionSummary>
                <AccordionDetails>
                    <TextField
                        InputProps={{ classes: { disabled: classes.disabledText } }}
                        disabled
                        fullWidth
                        multiline
                        variant="outlined"
                        label="Description"
                        value={description}
                        // Workaround for known MUI TextField label overlap limitation:
                        // https://mui.com/components/text-fields/#limitations
                        InputLabelProps={{ shrink: Boolean(description) }}
                    />
                </AccordionDetails>
            </Accordion>
            {editOpen && (
                <EditObjectiveDialog
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    onSave={onSaveObjective}
                    defaultObjective={objective}
                />
            )}
        </>
    );
}
