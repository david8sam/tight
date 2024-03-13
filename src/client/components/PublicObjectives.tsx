import React, { useRef, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import {
    Button,
    Divider,
    Grid,
    IconButton,
    ListItemIcon,
    MenuItem,
    MenuList,
    Popover,
    Toolbar,
    Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';

import { generateBlankObjective, generateBlankPublicObjectives, Objective as ObjectiveType } from 'common/Game';
import EditObjectiveDialog from './EditObjectiveDialog';
import Objective from './Objective';

const useStyle = makeStyles(theme => ({
    poToolbar: {
        width: '100%',
    },
    collapseButton: {
        marginRight: theme.spacing(),
    },
}));

export interface PublicObjectivesProps {
    creatable?: boolean;
    deletable?: boolean;
    editable?: boolean;
    publicObjectives?: ObjectiveType[];
    onChange?: (objectives: ObjectiveType[]) => void;
    showPlayers?: boolean;
}

function PublicObjectives(props: PublicObjectivesProps) {
    const classes = useStyle(props);
    const {
        creatable = false,
        deletable = false,
        editable = false,
        publicObjectives = [],
        onChange,
        showPlayers,
    } = props;
    const [createNewObjective, setCreateNewObjective] = useState(false);
    const [optionsOpen, setOptionsOpen] = useState(false);
    const optionsRef = useRef<HTMLButtonElement>(null);

    // index === public objective ID - 1
    const [expanded, setExpanded] = useState<boolean[]>(Array(publicObjectives.length).fill(false));

    const onObjectiveDelete = (o: ObjectiveType) => {
        if (onChange) {
            const newPublicObjectives = publicObjectives.filter(po => po.id !== o.id);
            newPublicObjectives.forEach((po, index) => (po.id = index + 1));
            onChange(newPublicObjectives);
        }
    };

    const onObjectiveChange = (o: ObjectiveType) => {
        if (!onChange) {
            return;
        }

        const index = publicObjectives.findIndex(po => po.id === o.id);
        if (index > -1) {
            const newPublicObjectives = [...publicObjectives];
            newPublicObjectives[index] = { ...publicObjectives[index], ...o };
            onChange(newPublicObjectives);
        }
    };

    const onSaveObjective = (o: ObjectiveType) => {
        if (onChange) {
            const newPublicObjectives = [...publicObjectives, o];
            onChange(newPublicObjectives);
        }
    };

    const onExpandChange = (id: number | null, expand: boolean) => {
        const newExpanded = [...expanded];
        if (id === null) {
            // All
            newExpanded.fill(expand);
        } else {
            // index === id - 1
            newExpanded[id - 1] = expand;
        }

        setExpanded(newExpanded);
    };

    const onAddObjective = () => {
        setOptionsOpen(false);
        setCreateNewObjective(true);
    };

    const onResetAll = () => {
        setOptionsOpen(false);
        if (onChange) {
            onChange(generateBlankPublicObjectives());
        }
    };

    return (
        <>
            <Grid container direction="column">
                <Toolbar>
                    <Grid container justifyContent="center">
                        <Typography variant="h6">Public Objectives</Typography>
                    </Grid>
                </Toolbar>
                <Toolbar className={classes.poToolbar}>
                    <Grid container justifyContent="space-between" alignItems="center" spacing={1}>
                        <Grid item>
                            <Button
                                className={classes.collapseButton}
                                size="small"
                                color="primary"
                                variant="contained"
                                disabled={expanded.every(e => !e)}
                                onClick={() => onExpandChange(null, false)}
                            >
                                <Typography variant="body2">Collapse</Typography>
                            </Button>
                            <Button
                                size="small"
                                color="primary"
                                variant="contained"
                                disabled={expanded.every(e => e)}
                                onClick={() => onExpandChange(null, true)}
                            >
                                <Typography variant="body2">Expand</Typography>
                            </Button>
                        </Grid>
                        {(creatable || deletable) && (
                            <Grid item>
                                <IconButton ref={optionsRef} onClick={() => setOptionsOpen(true)} size="large">
                                    <MoreVertIcon />
                                </IconButton>
                            </Grid>
                        )}
                    </Grid>
                </Toolbar>
                <Grid container direction="column">
                    {publicObjectives.map((po: ObjectiveType) => (
                        <Objective
                            key={`${po.id}`}
                            deletable={deletable}
                            editable={editable}
                            objective={po}
                            onChange={onObjectiveChange}
                            onDelete={onObjectiveDelete}
                            showPlayers={showPlayers}
                            AccordionProps={{
                                expanded: expanded[po.id - 1],
                                onChange: (_e, expand) => onExpandChange(po.id, expand),
                            }}
                        />
                    ))}
                </Grid>
            </Grid>
            {createNewObjective && (
                <EditObjectiveDialog
                    defaultObjective={generateBlankObjective(publicObjectives.length + 1)}
                    open={createNewObjective}
                    onClose={() => setCreateNewObjective(false)}
                    onSave={onSaveObjective}
                />
            )}
            <Popover
                open={optionsOpen}
                onClose={() => setOptionsOpen(false)}
                anchorEl={optionsRef.current}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuList>
                    {creatable && (
                        <MenuItem onClick={() => onAddObjective()}>
                            <ListItemIcon>
                                <AddIcon />
                            </ListItemIcon>
                            <Typography>Add</Typography>
                        </MenuItem>
                    )}
                    {deletable && <Divider />}
                    {deletable && (
                        <MenuItem onClick={() => onResetAll()}>
                            <ListItemIcon>
                                <RotateLeftIcon />
                            </ListItemIcon>
                            <Typography>Reset All</Typography>
                        </MenuItem>
                    )}
                </MenuList>
            </Popover>
        </>
    );
}

export default PublicObjectives;
