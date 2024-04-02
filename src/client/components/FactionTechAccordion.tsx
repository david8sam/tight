import React from 'react';

import { FactionTech } from 'common/Faction';

import AccordionTextFields, { AccordionTextFieldsProps } from './AccordionTextFields';
import TechPrerequisites from './TechPrerequisites';

export interface FactionTechAccordionProps extends Omit<AccordionTextFieldsProps, 'summary' | 'texts'> {
    factionTech: FactionTech[] | undefined | null;
}

export default function FactionTechAccordion(props: FactionTechAccordionProps) {
    const { factionTech, ...otherProps } = props;
    if (!factionTech) {
        return null;
    }

    const texts: AccordionTextFieldsProps['texts'] = factionTech.map((tech, i) => ({
        label: tech.name,
        value: tech.description,
        children: <TechPrerequisites prereq={tech.prerequisites} />,
        divider: i < factionTech.length - 1,
    }));

    return <AccordionTextFields {...otherProps} summary="Faction Tech" texts={texts} />;
}
