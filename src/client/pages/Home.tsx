import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { Button, CircularProgress, Container, FormControl, TextField, Typography } from '@material-ui/core';
import { Theme } from '@material-ui/core/styles/createMuiTheme';
import { makeStyles } from '@material-ui/styles';

import { LoginStatus } from 'common/Account';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import { ActionType } from '../reducer';

const useStyles = makeStyles((theme: Theme) => ({
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

function Home(props: object) {
    const classes = useStyles(props);
    const {
        state: { loginStatus },
        dispatch,
        sendData,
    } = useAppContext();
    const [name, setName] = useState('');
    const [loginClicked, setLoginClicked] = useState(false);
    const history = useHistory();

    const onLoginClick = (e: React.SyntheticEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setLoginClicked(true);
        dispatch({ type: ActionType.setLoginStatus, payload: { status: LoginStatus.LOGIN_PENDING, accountId: name } });
        sendData({ type: MessageType.ACCOUNT_LOGIN, data: { accountId: name } });
    };

    useEffect(() => {
        if (!name || !loginClicked) {
            return;
        }

        if (loginStatus === LoginStatus.LOGGED_IN) {
            history.push(`/player/${name}/game`);
        }
    });

    return (
        <Container classes={{ root: classes.root }}>
            <Typography variant="h3" align="center">
                Twilight Imperium Game Helper / Tracker
            </Typography>
            <Typography variant="h3" align="center" gutterBottom>
                (TIGHT)
            </Typography>
            <form className={classes.loginContainer} onSubmit={onLoginClick}>
                <FormControl>
                    <TextField
                        color="primary"
                        variant="outlined"
                        label="Enter Name"
                        onChange={e => setName(e.target.value)}
                    />
                </FormControl>
                <FormControl>
                    <Button
                        disabled={!Boolean(name) || loginStatus === LoginStatus.LOGIN_PENDING}
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
