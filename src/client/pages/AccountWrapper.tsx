import React, { ElementType, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';

import { Skeleton } from '@mui/lab';

import { MessageType } from 'common/message';
import { LoginStatus } from 'common/Account';

import { useAppContext } from '../Context';
import { ActionType } from '../reducer';

export interface AccountWrapperProps {
    Page: ElementType;
}

function AccountWrapper(props: AccountWrapperProps) {
    const { state, dispatch, sendData } = useAppContext();
    const { initialized, accountsInfo, loginStatus } = state;

    const navigate = useNavigate();
    const params = useParams();

    const { Page } = props;
    const name = params.id;

    const isValidPlayer = name ? Boolean(accountsInfo[name]) : false;

    const cannotRender =
        !initialized || loginStatus === LoginStatus.LOGIN_PENDING || loginStatus === LoginStatus.LOGOUT_PENDING;

    useEffect(() => {
        if (cannotRender) {
            return;
        }

        if (!isValidPlayer) {
            navigate('/');
        } else if (name && loginStatus === LoginStatus.LOGGED_OUT) {
            dispatch({
                type: ActionType.setLoginStatus,
                payload: { status: LoginStatus.LOGIN_PENDING, accountId: name },
            });
            sendData({ type: MessageType.ACCOUNT_LOGIN, data: { accountId: name } });
        }
    }, [initialized, loginStatus, name, isValidPlayer]);

    // TDOD: Render something more useful or just nothing at all?
    // Wait for player to log in
    if (cannotRender || !isValidPlayer) {
        return <Skeleton variant="rectangular" height="100%" />;
    }

    return <Page />;
}

export default AccountWrapper;
