import React from 'react';

import {
    Accordion as MuiAccordion,
    AccordionProps as MuiAccordionProps,
    AccordionActions as MuiAccordionActions,
    AccordionActionsProps as MuiAccordionActionsProps,
    AccordionDetails as MuiAccordionDetails,
    AccordionDetailsProps as MuiAccordionDetailsProps,
    AccordionSummary as MuiAccordionSummary,
    AccordionSummaryProps as MuiAccordionSummaryProps,
} from '@mui/material';
import { withStyles } from '@mui/styles';

// Re-export all other unmodified accordion related components
export {
    MuiAccordionActions as AccordionActions,
    MuiAccordionActionsProps as AccordionActionsProps,
    MuiAccordionDetails as AccordionDetails,
    MuiAccordionDetailsProps as AccordionDetailsProps,
};

const AccordionNoMargin = withStyles({
    root: {
        '&.Mui-expanded': {
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
    const { disableMargin, ...AcoordionProps } = props;
    const Component = disableMargin ? AccordionNoMargin : MuiAccordion;

    return <Component {...AcoordionProps} />;
}

const AccordionSummaryNoMargin = withStyles({
    root: {},
    expanded: {},
    focusVisible: {},
    disabled: {},
    content: {
        margin: 0,
        '&Mui-expanded': {
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
