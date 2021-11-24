import React, { useState } from 'react';

import { Button, Grid, IconButton, Toolbar, Typography } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';

import { Objective as ObjectiveType } from 'common/Game';
import EditObjectiveDialog from './EditObjectiveDialog';
import Objective from './Objective';

export interface PublicObjectivesProps {
    creatable?: boolean;
    deletable?: boolean;
    editable?: boolean;
    publicObjectives?: ObjectiveType[];
    onChange?: (objectives: ObjectiveType[]) => void;
    showPlayers?: boolean;
}

function PublicObjectives(props: PublicObjectivesProps) {
    const {
        creatable = false,
        deletable = false,
        editable = false,
        publicObjectives = [],
        onChange,
        showPlayers,
    } = props;
    const [createNewObjective, setCreateNewObjective] = useState(false);
    // index === public objective ID - 1
    const [expanded, setExpanded] = useState<boolean[]>(Array(publicObjectives.length).fill(false));

    let toolbar = null;
    if (creatable) {
        toolbar = (
            <Toolbar disableGutters>
                <IconButton onClick={() => setCreateNewObjective(true)}>
                    <AddIcon />
                    <Typography>Public Objective</Typography>
                </IconButton>
            </Toolbar>
        );
    }

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

    return (
        <>
            <Grid container direction="column">
                {toolbar}
                <Toolbar>
                    <Grid container justifyContent="space-evenly">
                        <Button
                            size="small"
                            color="primary"
                            variant="contained"
                            disabled={expanded.every(e => !e)}
                            onClick={() => onExpandChange(null, false)}
                        >
                            <Typography>Collapse All</Typography>
                        </Button>
                        <Button
                            size="small"
                            color="primary"
                            variant="contained"
                            disabled={expanded.every(e => e)}
                            onClick={() => onExpandChange(null, true)}
                        >
                            <Typography>Expand All</Typography>
                        </Button>
                    </Grid>
                </Toolbar>
                {publicObjectives.map((po: ObjectiveType) => (
                    <Objective
                        key={`${po.id}-${po.name}`}
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
            {createNewObjective && (
                <EditObjectiveDialog
                    defaultObjective={{ id: publicObjectives.length + 1, vp: 1, name: 'Objective' }}
                    open={createNewObjective}
                    onClose={() => setCreateNewObjective(false)}
                    onSave={onSaveObjective}
                />
            )}
        </>
    );
}

export default PublicObjectives;
