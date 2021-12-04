import React, { ChangeEvent, useState } from 'react';
import { AccordionProps, Button, Grid, Toolbar, Typography } from '@material-ui/core';

import { Faction } from 'common/Faction';

import AccordionTextFields from './AccordionTextFields';
import FactionAbilitiesAccordion from './FactionAbilitiesAccordion';
import FactionStartingUnitsAccordion from './FactionStartingUnitsAccordion';
import FactionTechAccordion from './FactionTechAccordion';
import FactionUnitsAccordion from './FactionUnitsAccordion';
import FlagshipAccordion from './FlagshipAccordion';
import LeadersAccordion from './LeadersAccordion';
import MechAccordion from './MechAccordion';

// Num accordions
const COUNT = 10;

export interface FactionInfoProps {
    faction: Faction | null;
}

function FactionInfo(props: FactionInfoProps) {
    const { faction } = props;
    const {
        name,
        abilities,
        promissoryNotes,
        factionTech,
        factionUnits,
        startingUnits,
        startingTech,
        commodities,
        flagship,
        mech,
        leaders,
    } = faction || {};

    const [expandedStates, setExpandedStates] = useState<boolean[]>(Array(COUNT).fill(false));

    const onExpandedChange = (index: number, e: ChangeEvent<{}>, expanded: boolean) => {
        const newExpandedStates = [...expandedStates];
        newExpandedStates[index] = expanded;
        setExpandedStates(newExpandedStates);
    };

    const getAccordionProps = (index: number): { expanded: boolean; onChange: AccordionProps['onChange'] } => ({
        expanded: expandedStates[index],
        onChange: (...args) => onExpandedChange(index, ...args),
    });

    return (
        <Grid container direction="column">
            <Toolbar>
                <Grid container direction="row" justifyContent="flex-start" spacing={1}>
                    <Grid item>
                        <Button
                            size="small"
                            color="primary"
                            variant="contained"
                            disabled={expandedStates.every(e => !e)}
                            onClick={() => setExpandedStates(Array(COUNT).fill(false))}
                        >
                            <Typography variant="body2">Collapse</Typography>
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button
                            size="small"
                            color="primary"
                            variant="contained"
                            disabled={expandedStates.every(e => e)}
                            onClick={() => setExpandedStates(Array(COUNT).fill(true))}
                        >
                            <Typography variant="body2">Expand</Typography>
                        </Button>
                    </Grid>
                </Grid>
            </Toolbar>
            <FactionStartingUnitsAccordion {...getAccordionProps(0)} startingUnits={startingUnits} />
            <AccordionTextFields
                {...getAccordionProps(1)}
                summary="Starting Tech"
                texts={startingTech ? [{ label: 'Tech', value: `\u2022 ${startingTech.join('\n\u2022 ')}` }] : null}
            />
            <AccordionTextFields
                {...getAccordionProps(2)}
                summary="Commodities"
                texts={commodities ? [{ value: commodities }] : null}
            />
            <FactionAbilitiesAccordion {...getAccordionProps(3)} abilities={abilities} />
            <AccordionTextFields
                {...getAccordionProps(4)}
                summary="Promissory Note"
                texts={promissoryNotes ? promissoryNotes.map(n => ({ label: n.name, value: n.description })) : null}
            />
            <FactionTechAccordion {...getAccordionProps(5)} factionTech={factionTech} />
            <FactionUnitsAccordion {...getAccordionProps(6)} factionUnits={factionUnits} />
            <FlagshipAccordion {...getAccordionProps(7)} flagship={flagship} />
            <MechAccordion {...getAccordionProps(8)} mech={mech} />
            <LeadersAccordion {...getAccordionProps(9)} leaders={leaders} />
        </Grid>
    );
}

export default FactionInfo;
