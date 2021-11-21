import React from 'react';

import {
    Accordion as MuiAccordion,
    AccordionProps as MuiAccordionProps,
    AccordionSummary as MuiAccordionSummary,
    AccordionSummaryProps as MuiAccordionSummaryProps,
} from '@material-ui/core';
import { withStyles } from '@material-ui/styles';

const AccordionNoMargin = withStyles({
    root: {
        '&$expanded': {
            margin: 0,
        },
    },
    rounded: {},
    expanded: {},
    disabled: {},
})(MuiAccordion);

export interface AccordionProps extends MuiAccordionProps {
    disableMargin?: boolean;
}

export function Accordion(props: AccordionProps) {
    const { disableMargin, ...PanelProps } = props;
    const Panel = disableMargin ? AccordionNoMargin : MuiAccordion;

    return <Panel {...PanelProps} />;
}

const AccordionSummaryNoMargin = withStyles({
    root: {},
    expanded: {},
    focusVisible: {},
    disabled: {},
    content: {
        margin: 0,
        '&$expanded': {
            margin: 0,
        },
    },
    expandIcon: {},
})(MuiAccordionSummary);

export interface AccordionSummaryProps extends MuiAccordionSummaryProps {
    disableMargin?: boolean;
}

export function AccordionSummary(props: AccordionSummaryProps) {
    const { disableMargin, ...SummaryProps } = props;
    const Component = disableMargin ? AccordionSummaryNoMargin : MuiAccordionSummary;

    return <Component {...SummaryProps} />;
}
