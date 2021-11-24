import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Divider, List, ListItem, ListItemText, SwipeableDrawer, SwipeableDrawerProps } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

import { LoginStatus } from 'common/Account';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import { ActionType } from '../reducer';
import useAccountInfo from '../hooks/useAccountInfo';

const useStyle = makeStyles(theme => ({
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
    const { sendData, dispatch } = useAppContext();
    const { open, onOpen, onClose, ...drawerProps } = props;

    const navigate = useNavigate();
    const { loggedIn, game, playerId } = useAccountInfo();

    const onOptionClick = (e: React.SyntheticEvent<{}, Event>, id: string) => {
        onClose(e);

        if (id === 'home') {
            navigate('/');
        } else if (playerId) {
            navigate(`/player/${playerId}/${id}`);
        }
    };

    const onLogout = (e: React.SyntheticEvent<{}, Event>) => {
        dispatch({
            type: ActionType.setLoginStatus,
            payload: { status: LoginStatus.LOGOUT_PENDING, accountId: playerId },
        });
        sendData({ type: MessageType.ACCOUNT_LOGOUT, data: { accountId: playerId } });
        onClose(e);

        navigate('/');
    };

    const playerInGame = Boolean(playerId && game && game.players[playerId]);

    return (
        <SwipeableDrawer open={open} onOpen={onOpen} onClose={onClose} {...drawerProps}>
            <div className={classes.drawer}>
                <List>
                    <ListItem key="game" button disabled={!playerInGame} onClick={e => onOptionClick(e, 'game')}>
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary="Game Status" />
                    </ListItem>
                    <ListItem
                        key="objectives"
                        button
                        disabled={!playerInGame}
                        onClick={e => onOptionClick(e, 'objectives')}
                    >
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary="Objectives" />
                    </ListItem>
                    <ListItem
                        key="planets"
                        button
                        disabled={!game || !game.status.started}
                        onClick={e => onOptionClick(e, 'planets')}
                    >
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary="My Planets" />
                    </ListItem>

                    <ListItem>
                        <Divider classes={{ root: classes.divider }} />
                    </ListItem>

                    <ListItem
                        key="manage-games"
                        button
                        disabled={!loggedIn}
                        onClick={e => onOptionClick(e, 'manage-games')}
                    >
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary="Manage Games" />
                    </ListItem>
                    <ListItem key="factions" button disabled={!loggedIn} onClick={e => onOptionClick(e, 'factions')}>
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary="Factions" />
                    </ListItem>
                    <ListItem
                        key="strategy-cards"
                        button
                        disabled={!loggedIn}
                        onClick={e => onOptionClick(e, 'strategy-cards')}
                    >
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary="Strategy Cards" />
                    </ListItem>

                    <ListItem>
                        <Divider classes={{ root: classes.divider }} />
                    </ListItem>

                    <ListItem key="logout" button disabled={!playerId} onClick={onLogout}>
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary="Logout" />
                    </ListItem>
                </List>
            </div>
        </SwipeableDrawer>
    );
}

export default Drawer;
