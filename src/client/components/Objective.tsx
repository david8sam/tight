import React, { MouseEvent, useState } from 'react';

import { Grid, IconButton, TextField, Theme, Toolbar, Tooltip, Typography } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { makeStyles } from '@material-ui/styles';

import { calculateVictoryPoints, GamePlayer, getPlayersInGame, Objective } from 'common/Game';

import useAccountInfo from '../hooks/useAccountInfo';

import { Accordion, AccordionDetails, AccordionProps, AccordionSummary } from './Accordion';
import EditObjectiveDialog from './EditObjectiveDialog';
import PlayerAvatar from './PlayerAvatar';

const AVATAR_SIZE = 30;

const useStyles = makeStyles((theme: Theme) => ({
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
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        textTransform: 'uppercase',
        fontSize: 12,
    },
}));

export interface ObjectiveProps {
    objective: Objective;
    editable?: boolean;
    onChange?: (objective: Objective) => void;
    deletable?: boolean;
    onDelete?: (objective: Objective) => void;
    showPlayers?: boolean;
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
        showPlayers = false,
        AccordionProps,
    } = props;
    const { description, id, vp } = objective;
    const [editOpen, setEditOpen] = useState(false);

    const { game } = useAccountInfo();
    const players: GamePlayer[] = [];
    if (showPlayers && game && id > -1) {
        getPlayersInGame(game).forEach(p => {
            if (p.publicObjectives[id - 1] === true) {
                players.push(p);
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
                                    <IconButton onClick={onDeleteClick}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {editable && (
                                <Tooltip title="Edit">
                                    <IconButton onClick={onEditOpenClick}>
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Toolbar>
                        <Toolbar className={classes.toolbar} disableGutters>
                            {players.map(player => (
                                <div key={player.id} className={classes.avatarContainer}>
                                    {/* Prevent click from expanding accordion */}
                                    <PlayerAvatar
                                        player={player}
                                        title={
                                            game
                                                ? `${player.name} ${calculateVictoryPoints(game, player.id)} VPs`
                                                : undefined
                                        }
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
