import React from 'react';

import {
    ExpansionPanel as MuiExpansionPanel,
    ExpansionPanelProps as MuiExpansionPanelProps,
    ExpansionPanelSummary as MuiExpansionPanelSummary,
    ExpansionPanelSummaryProps as MuiExpansionPanelSummaryProps,
} from '@material-ui/core';
import { withStyles } from '@material-ui/styles';

const ExpansionPanelNoMargin = withStyles({
    root: {
        '&$expanded': {
            margin: 0,
        },
    },
    rounded: {},
    expanded: {},
    disabled: {},
})(MuiExpansionPanel);

export interface ExpansionPanelProps extends MuiExpansionPanelProps {
    disableMargin?: boolean;
}

export function ExpansionPanel(props: ExpansionPanelProps) {
    const { disableMargin, ...PanelProps } = props;
    const Panel = disableMargin ? ExpansionPanelNoMargin : MuiExpansionPanel;

    return <Panel {...PanelProps} />;
}

const ExpansionPanelSummaryNoMargin = withStyles({
    root: {},
    expanded: {},
    focused: {},
    disabled: {},
    content: {
        margin: 0,
        '&$expanded': {
            margin: 0,
        },
    },
    expandIcon: {},
})(MuiExpansionPanelSummary);

export interface ExpansionPanelSummaryProps extends MuiExpansionPanelSummaryProps {
    disableMargin?: boolean;
}

export function ExpansionPanelSummary(props: ExpansionPanelSummaryProps) {
    const { disableMargin, ...SummaryProps } = props;
    const Component = disableMargin ? ExpansionPanelSummaryNoMargin : MuiExpansionPanelSummary;

    return <Component {...SummaryProps} />;
}
