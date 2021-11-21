import React, { useEffect } from 'react';
import { RouteComponentProps, useHistory } from 'react-router-dom';

import { Skeleton } from '@material-ui/lab';

import { MessageType } from 'common/message';
import { LoginStatus } from 'common/Account';

import { useAppContext } from '../Context';
import { ActionType } from '../reducer';

interface MatchParams {
    id: string;
}

interface AccountWrapperProps extends RouteComponentProps<MatchParams> {
    Page: React.ElementType;
}

function AccountWrapper(props: AccountWrapperProps) {
    const { state, dispatch, sendData } = useAppContext();
    const { initialized, accounts, loginStatus } = state;

    const history = useHistory();

    const { Page, ...pageProps } = props;
    const name = pageProps.match.params.id;

    useEffect(() => {
        if (!initialized) {
            return;
        }

        if (name && loginStatus === LoginStatus.LOGGED_OUT) {
            dispatch({
                type: ActionType.setLoginStatus,
                payload: { status: LoginStatus.LOGIN_PENDING, accountId: name },
            });
            sendData({ type: MessageType.ACCOUNT_LOGIN, data: { accountId: name } });
        }
    }, [initialized, name]);

    // Wait for player to log in
    if (!initialized || loginStatus === LoginStatus.LOGIN_PENDING || loginStatus === LoginStatus.LOGOUT_PENDING) {
        return <Skeleton variant="rect" height="100%" />;
    }

    if (!accounts[name]) {
        history.push('/');
    }

    return <Page {...pageProps} />;
}

export default AccountWrapper;
