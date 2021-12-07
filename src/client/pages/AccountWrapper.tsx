import React, { ElementType, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';

import { Skeleton } from '@material-ui/lab';

import { MessageType } from 'common/message';
import { LoginStatus } from 'common/Account';

import { useAppContext } from '../Context';
import { ActionType } from '../reducer';

export interface AccountWrapperProps {
    Page: ElementType;
}

function AccountWrapper(props: AccountWrapperProps) {
    const { state, dispatch, sendData } = useAppContext();
    const { initialized, reconnecting, accountsInfo, loginStatus } = state;

    const navigate = useNavigate();
    const params = useParams();

    const { Page } = props;
    const name = params.id;

    const isValidPlayer = name ? accountsInfo[name] : false;

    useEffect(() => {
        if (
            !initialized ||
            reconnecting ||
            loginStatus === LoginStatus.LOGIN_PENDING ||
            loginStatus === LoginStatus.LOGOUT_PENDING
        ) {
            return;
        }

        if (!name || !isValidPlayer) {
            navigate('/');
        } else if (name && loginStatus === LoginStatus.LOGGED_OUT) {
            dispatch({
                type: ActionType.setLoginStatus,
                payload: { status: LoginStatus.LOGIN_PENDING, accountId: name },
            });
            sendData({ type: MessageType.ACCOUNT_LOGIN, data: { accountId: name } });
        }
    }, [initialized, reconnecting, loginStatus, name, isValidPlayer]);

    // TDOD: Render something more useful or just nothing at all?
    // Wait for player to log in
    if (
        !initialized ||
        reconnecting ||
        !isValidPlayer ||
        loginStatus === LoginStatus.LOGIN_PENDING ||
        loginStatus === LoginStatus.LOGOUT_PENDING
    ) {
        return <Skeleton variant="rect" height="100%" />;
    }

    return <Page />;
}

export default AccountWrapper;
