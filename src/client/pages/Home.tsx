import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, CircularProgress, Container, FormControl, makeStyles, TextField, Typography } from '@material-ui/core';
import { Theme } from '@material-ui/core/styles/createTheme';

import { LoginStatus } from 'common/Account';
import { MessageType } from 'common/message';

import useAccountInfo from '../hooks/useAccountInfo';

import { useAppContext } from '../Context';
import { ActionType } from '../reducer';

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
    },
    loginContainer: {
        margin: `${theme.spacing(4)}px ${theme.spacing(1)}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    loginButton: {
        marginTop: theme.spacing(2),
    },
}));

function Home() {
    const classes = useStyles();
    const {
        state: { loginStatus, accountsInfo, theme },
        dispatch,
        sendData,
    } = useAppContext();
    const [name, setName] = useState('');
    const navigate = useNavigate();
    const { game, loggedIn, playerId } = useAccountInfo();

    const onLoginClick = (e: React.SyntheticEvent) => {
        e.preventDefault();
        e.stopPropagation();

        dispatch({
            type: ActionType.setLoginStatus,
            payload: { status: LoginStatus.LOGIN_PENDING, accountId: name },
        });
        sendData({ type: MessageType.ACCOUNT_LOGIN, data: { accountId: name, settings: { theme } } });
    };

    useEffect(() => {
        if (loggedIn) {
            navigate(game ? `/player/${playerId}/game` : `/player/${playerId}/manage-games`);
        }
    }, [loggedIn]);

    const accountInUse = playerId !== name && accountsInfo[name]?.loggedIn;

    return (
        <Container classes={{ root: classes.root }}>
            <Typography variant="h3" align="center">
                Twilight Imperium Game Helper / Tracker
            </Typography>
            <Typography variant="h3" align="center" gutterBottom>
                (TIGHT)
            </Typography>
            <form className={classes.loginContainer} onSubmit={accountInUse ? e => e.preventDefault() : onLoginClick}>
                <FormControl>
                    <TextField
                        color="primary"
                        variant="outlined"
                        label="Enter Name"
                        error={accountInUse}
                        helperText={accountInUse ? 'Name is in use' : ''}
                        onChange={e => setName(e.target.value)}
                    />
                </FormControl>
                <FormControl>
                    <Button
                        disabled={accountInUse || !Boolean(name) || loginStatus === LoginStatus.LOGIN_PENDING}
                        classes={{ root: classes.loginButton }}
                        color="primary"
                        variant="contained"
                        size="large"
                        onClick={onLoginClick}
                    >
                        {loginStatus === LoginStatus.LOGIN_PENDING ? (
                            <CircularProgress size={24} />
                        ) : (
                            'Create Account / Login'
                        )}
                    </Button>
                </FormControl>
            </form>
        </Container>
    );
}

export default Home;
