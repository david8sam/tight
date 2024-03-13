import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Divider, List, ListItem, ListItemText, SwipeableDrawer, SwipeableDrawerProps } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { LoginStatus } from 'common/Account';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import { ActionType } from '../reducer';
import useAccountInfo from '../hooks/useAccountInfo';
import { GameJoinStatus } from 'common/Game';

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
    const { sendData, dispatch } = useAppContext();
    const { open, onOpen, onClose, ...drawerProps } = props;

    const navigate = useNavigate();
    const { loggedIn, game, player, playerId } = useAccountInfo();

    const onOptionClick = (e: React.SyntheticEvent<{}, Event>, id: string, isPlayerPage?: boolean) => {
        onClose(e);

        if (isPlayerPage) {
            if (playerId) {
                navigate(`/player/${playerId}/${id}`);
            }
        } else {
            navigate(`/${id}`);
        }
    };

    const onLogin = (e: React.SyntheticEvent<{}, Event>) => {
        navigate('/');
        onClose(e);
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

    const inGame = Boolean(player);
    const isPlayer = player ? player.joinStatus === GameJoinStatus.PLAYER : false;

    return (
        <SwipeableDrawer open={open} onOpen={onOpen} onClose={onClose} {...drawerProps}>
            <div className={classes.drawer}>
                <List>
                    <ListItem key="game" button disabled={!inGame} onClick={e => onOptionClick(e, 'game', true)}>
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary="Game Status" />
                    </ListItem>
                    <ListItem
                        key="objectives"
                        button
                        disabled={!inGame}
                        onClick={e => onOptionClick(e, 'objectives', true)}
                    >
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary="Objectives" />
                    </ListItem>
                    <ListItem
                        key="planets"
                        button
                        disabled={!game || !game.status.started || !isPlayer}
                        onClick={e => onOptionClick(e, 'planets', true)}
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
                        onClick={e => onOptionClick(e, 'manage-games', true)}
                    >
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary="Manage Games" />
                    </ListItem>

                    <ListItem>
                        <Divider classes={{ root: classes.divider }} />
                    </ListItem>

                    <ListItem key="factions" button onClick={e => onOptionClick(e, 'factions', loggedIn)}>
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary="Factions" />
                    </ListItem>
                    <ListItem key="strategy-cards" button onClick={e => onOptionClick(e, 'strategy-cards', loggedIn)}>
                        <ListItemText primaryTypographyProps={{ variant: 'h5' }} primary="Strategy Cards" />
                    </ListItem>

                    <ListItem>
                        <Divider classes={{ root: classes.divider }} />
                    </ListItem>

                    <ListItem key="loginout" button onClick={loggedIn ? onLogout : onLogin}>
                        <ListItemText
                            primaryTypographyProps={{ variant: 'h5' }}
                            primary={loggedIn ? 'Logout' : 'Login'}
                        />
                    </ListItem>
                </List>
            </div>
        </SwipeableDrawer>
    );
}

export default Drawer;
