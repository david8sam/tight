import React from 'react';
import { Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { UnitCountMap } from 'common/Faction';

import { Accordion, AccordionDetails, AccordionProps, AccordionSummary } from './Accordion';
import UnitsCountTable from './UnitsTable';

export interface FactionStartingUnitsAccordionProps extends Omit<AccordionProps, 'children'> {
    startingUnits?: UnitCountMap;
}

export default function FactionStartingUnitsAccordion(props: FactionStartingUnitsAccordionProps) {
    const { startingUnits, ...AccordionProps } = props;
    if (!startingUnits) {
        return null;
    }

    return (
        <Accordion {...AccordionProps}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Starting Units</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <UnitsCountTable unitsCountMap={startingUnits} />
            </AccordionDetails>
        </Accordion>
    );
}
