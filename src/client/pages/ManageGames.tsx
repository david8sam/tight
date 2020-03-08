import React, { useState } from 'react';

import { IconButton, Toolbar, Tooltip, Typography } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { makeStyles } from '@material-ui/styles';

import { useAppContext } from '../Context';
import GamesTable from '../components/GamesTable';
import NewGameDialog from '../components/NewGameDialog';

const useStyle = makeStyles(theme => ({
    title: {
        flex: '1 1 100%',
    },
}));

export default function ManageGames(props: object) {
    const classes = useStyle(props);
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
                    GAMES
                </Typography>
                <Tooltip title="Create">
                    <IconButton onClick={() => setOpenCreateDialog(true)}>
                        <AddIcon />
                    </IconButton>
                </Tooltip>
            </Toolbar>
            <GamesTable games={games} />
        </>
    );
}
