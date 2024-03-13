import React, { useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import { IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { useAppContext } from '../Context';
import GamesTable from '../components/GamesTable';
import NewGameDialog from '../components/NewGameDialog';

const useStyle = makeStyles(() => ({
    title: {
        flex: '1 1 100%',
    },
}));

export default function ManageGames() {
    const classes = useStyle();
    const { state } = useAppContext();
    const { games } = state;

    const [openCreateDialog, setOpenCreateDialog] = useState(false);

    return (
        <>
            {openCreateDialog ? (
                <NewGameDialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} />
            ) : null}
            <Toolbar>
                <Typography classes={{ root: classes.title }} variant="subtitle1">
                    MANAGE GAMES
                </Typography>
                <Tooltip title="Create">
                    <IconButton onClick={() => setOpenCreateDialog(true)} size="large">
                        <AddIcon />
                    </IconButton>
                </Tooltip>
            </Toolbar>
            <GamesTable games={games} />
        </>
    );
}
