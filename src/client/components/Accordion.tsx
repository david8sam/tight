import React from 'react';

import {
    Accordion as MuiAccordion,
    AccordionProps as MuiAccordionProps,
    AccordionActions as MuiAccordionActions,
    AccordionDetails as MuiAccordionDetails,
    AccordionSummary as MuiAccordionSummary,
    AccordionSummaryProps as MuiAccordionSummaryProps,
} from '@mui/material';
import type { AccordionActionsProps as MuiAccordionActionsProps } from '@mui/material/AccordionActions';
import type { AccordionDetailsProps as MuiAccordionDetailsProps } from '@mui/material/AccordionDetails';
import { styled } from '@mui/material/styles';

// Re-export all other unmodified accordion related components
export {
    MuiAccordionActions as AccordionActions,
    MuiAccordionActionsProps as AccordionActionsProps,
    MuiAccordionDetails as AccordionDetails,
    MuiAccordionDetailsProps as AccordionDetailsProps,
};

const AccordionNoMargin = styled(MuiAccordion)({
    '&.Mui-expanded': {
        margin: 0,
    },
});

export interface AccordionProps extends MuiAccordionProps {
    disableMargin?: boolean;
}

export function Accordion(props: AccordionProps) {
    const { disableMargin, ...AcoordionProps } = props;
    const Component = disableMargin ? AccordionNoMargin : MuiAccordion;

    return <Component {...AcoordionProps} />;
}

const AccordionSummaryNoMargin = styled(MuiAccordionSummary)({
    '& .MuiAccordionSummary-content': {
        margin: 0,
        '&.Mui-expanded': {
            margin: 0,
        },
    },
});

export interface AccordionSummaryProps extends MuiAccordionSummaryProps {
    disableMargin?: boolean;
}

export function AccordionSummary(props: AccordionSummaryProps) {
    const { disableMargin, ...SummaryProps } = props;
    const Component = disableMargin ? AccordionSummaryNoMargin : MuiAccordionSummary;

    return <Component {...SummaryProps} />;
}
