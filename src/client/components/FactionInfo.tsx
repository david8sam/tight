import React, { ChangeEvent } from 'react';
import { AccordionProps, Grid } from '@mui/material';

import { Faction } from 'common/Faction';

import AccordionTextFields from './AccordionTextFields';
import FactionAbilitiesAccordion from './FactionAbilitiesAccordion';
import FactionStartingUnitsAccordion from './FactionStartingUnitsAccordion';
import FactionTechAccordion from './FactionTechAccordion';
import FactionUnitsAccordion from './FactionUnitsAccordion';
import FlagshipAccordion from './FlagshipAccordion';
import LeadersAccordion from './LeadersAccordion';
import MechAccordion from './MechAccordion';

export enum FactionAccordionIndex {
    StartingUnits,
    StartingTech,
    Commodities,
    Abilities,
    PromissoryNotes,
    FactionTech,
    FactionUnits,
    Flagship,
    Mech,
    Leaders,
}

export interface FactionInfoProps {
    faction: Faction | null;
    expanded: boolean[];
    onExpandedChange: (index: FactionAccordionIndex, e: ChangeEvent<{}>, expanded: boolean) => void;
}

function FactionInfo(props: FactionInfoProps) {
    const { faction, expanded, onExpandedChange } = props;
    const {
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

    const getAccordionProps = (
        index: FactionAccordionIndex,
    ): { expanded: boolean; onChange: AccordionProps['onChange'] } => ({
        expanded: expanded[index],
        onChange: (...args) => onExpandedChange(index, ...args),
    });

    return (
        <Grid container direction="column">
            <FactionStartingUnitsAccordion
                {...getAccordionProps(FactionAccordionIndex.StartingUnits)}
                startingUnits={startingUnits}
            />
            <AccordionTextFields
                {...getAccordionProps(FactionAccordionIndex.StartingTech)}
                summary="Starting Tech"
                texts={startingTech ? [{ label: 'Tech', value: `\u2022 ${startingTech.join('\n\u2022 ')}` }] : null}
            />
            <AccordionTextFields
                {...getAccordionProps(FactionAccordionIndex.Commodities)}
                summary="Commodities"
                texts={commodities ? [{ value: commodities }] : null}
            />
            <FactionAbilitiesAccordion {...getAccordionProps(FactionAccordionIndex.Abilities)} abilities={abilities} />
            <AccordionTextFields
                {...getAccordionProps(FactionAccordionIndex.PromissoryNotes)}
                summary="Promissory Note"
                texts={promissoryNotes ? promissoryNotes.map(n => ({ label: n.name, value: n.description })) : null}
            />
            <FactionTechAccordion {...getAccordionProps(FactionAccordionIndex.FactionTech)} factionTech={factionTech} />
            <FactionUnitsAccordion
                {...getAccordionProps(FactionAccordionIndex.FactionUnits)}
                factionUnits={factionUnits}
            />
            <FlagshipAccordion {...getAccordionProps(FactionAccordionIndex.Flagship)} flagship={flagship} />
            <MechAccordion {...getAccordionProps(FactionAccordionIndex.Mech)} mech={mech} />
            <LeadersAccordion {...getAccordionProps(FactionAccordionIndex.Leaders)} leaders={leaders} />
        </Grid>
    );
}

export default FactionInfo;
