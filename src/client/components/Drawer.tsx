import React from 'react';
import { useNavigate } from 'react-router-dom';

import {
    Divider,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    SwipeableDrawer,
    SwipeableDrawerProps,
} from '@mui/material';
import { makeStyles } from '@mui/styles';

import useGameInfo from '../hooks/useGameInfo';

const useStyle = makeStyles(() => ({
    drawer: {
        width: 250,
    },
    divider: {
        width: '100%',
        height: 2,
    },
}));

interface DrawerProps extends SwipeableDrawerProps {}

function Drawer(props: DrawerProps) {
    const classes = useStyle(props);
    const { open, onOpen, onClose, ...drawerProps } = props;

    const navigate = useNavigate();

    const { game, gameId } = useGameInfo();

    const onOptionClick = (e: React.SyntheticEvent<{}, Event>, id: string, isGamePage?: boolean) => {
        onClose(e);

        if (isGamePage) {
            if (gameId) {
                navigate(`/${gameId}/${id}`);
            }
        } else {
            navigate(`/${id}`);
        }
    };

    return (
        <SwipeableDrawer open={open} onOpen={onOpen} onClose={onClose} {...drawerProps}>
            <div className={classes.drawer}>
                <List>
                    <ListItemButton key="home" onClick={e => onOptionClick(e, '')}>
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary="Home" />
                    </ListItemButton>

                    <ListItem>
                        <Divider classes={{ root: classes.divider }} />
                    </ListItem>

                    <ListItemButton key="status" disabled={!game} onClick={e => onOptionClick(e, 'status', true)}>
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary={`Status`} />
                    </ListItemButton>
                    <ListItemButton key="players" disabled={!game} onClick={e => onOptionClick(e, 'players', true)}>
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary={`Players`} />
                    </ListItemButton>
                    <ListItemButton
                        key="objectives"
                        disabled={!game}
                        onClick={e => onOptionClick(e, 'objectives', true)}
                    >
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary="Objectives" />
                    </ListItemButton>
                    <ListItemButton
                        key="planets"
                        disabled={!game?.status.started}
                        onClick={e => onOptionClick(e, 'planets', true)}
                    >
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary="My Planets" />
                    </ListItemButton>

                    <ListItem>
                        <Divider classes={{ root: classes.divider }} />
                    </ListItem>

                    <ListItemButton key="factions" onClick={e => onOptionClick(e, 'factions')}>
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary="Factions" />
                    </ListItemButton>
                    <ListItemButton key="strategy-cards" onClick={e => onOptionClick(e, 'strategy-cards')}>
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary="Strategy Cards" />
                    </ListItemButton>
                </List>
            </div>
        </SwipeableDrawer>
    );
}

export default Drawer;
