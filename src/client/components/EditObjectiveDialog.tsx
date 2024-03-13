import React, { useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { AppBar, Button, Dialog, DialogContent, Grid, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { Objective } from 'common/Game';

import ObjectiveForm from './ObjectiveForm';

export interface EditObjectiveDialogProps {
    open: boolean;
    defaultObjective: Objective;
    onClose: () => void;
    onSave: (objective: Objective) => void;
}

const useStyles = makeStyles(theme => ({
    appBar: {
        flexDirection: 'row',
        position: 'relative',
        alignItems: 'center',
        paddingRight: theme.spacing(2),
    },
    title: {
        marginLeft: theme.spacing(2),
        flex: 1,
    },
    formControl: {
        paddingBottom: theme.spacing(2),
    },
}));

function EditObjectiveDialog(props: EditObjectiveDialogProps) {
    const classes = useStyles(props);
    const { defaultObjective, open, onClose, onSave } = props;
    const [objective, setObjective] = useState<Objective>({ ...defaultObjective });

    const onSaveObjective = () => {
        if (objective) {
            onSave(objective);
        }

        onClose();
    };

    return (
        <Dialog open={open} fullScreen>
            <AppBar classes={{ root: classes.appBar }}>
                <Toolbar>
                    <Tooltip title="Close">
                        <IconButton onClick={onClose} size="large">
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
                <Typography variant="h6" className={classes.title}>
                    Edit Objective
                </Typography>
                <Button autoFocus color="inherit" onClick={e => onSaveObjective()}>
                    Save
                </Button>
            </AppBar>
            <DialogContent dividers>
                <Grid container justifyContent="center" alignItems="center">
                    <Grid item xs>
                        <ObjectiveForm objective={objective} onChange={setObjective} />
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
}

export default EditObjectiveDialog;
