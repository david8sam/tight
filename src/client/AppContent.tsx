import React from 'react';

import { Skeleton } from '@material-ui/lab';
import { Theme } from '@material-ui/core/styles/createMuiTheme';
import { makeStyles } from '@material-ui/styles';

import Router from './Router';

const useStyle = makeStyles((theme: Theme) => ({
    content: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
}));

export interface AppContentProps {
    loading: boolean;
}

function AppContent(props: AppContentProps) {
    const classes = useStyle(props);
    const { loading } = props;
    return <div className={classes.content}>{loading ? <Skeleton variant="rect" height="100%" /> : <Router />}</div>;
}

export default AppContent;
