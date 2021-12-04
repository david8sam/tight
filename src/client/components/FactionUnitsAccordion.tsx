import React from 'react';

import { FactionUnit } from 'common/Faction';

import { AccordionProps } from './Accordion';
import AccordionTextFields, { AccordionTextFieldsProps } from './AccordionTextFields';
import TechPrerequisites from './TechPrerequisites';

export interface FactionUnitsAccordionProps extends Omit<AccordionProps, 'children'> {
    factionUnits?: FactionUnit[];
}

export default function FactionUnitsAccordion(props: FactionUnitsAccordionProps) {
    const { factionUnits, ...otherProps } = props;
    if (!factionUnits) {
        return null;
    }

    const texts: AccordionTextFieldsProps['texts'] = [];
    factionUnits.forEach((u, i) => {
        const { type, cost, combat, move, capacity, name, abilities, prerequisites } = u;

        texts.push({ label: 'Name', value: name });
        texts.push({ label: 'Unit Type', value: type });
        if (cost) {
            texts.push({ label: 'Cost', value: Array.isArray(cost) ? cost.join('x') : cost });
        }
        if (combat) {
            texts.push({ label: 'Combat', value: Array.isArray(combat) ? `${combat.join(' (x')})` : combat });
        }
        if (move) {
            texts.push({ label: 'Move', value: move });
        }
        if (capacity) {
            texts.push({ label: 'Capacity', value: capacity });
        }
        if (abilities) {
            texts.push({
                label: 'Abilities',
                value: `\u2022 ${abilities.join('\n\u2022 ')}`,
                children: <TechPrerequisites prereq={prerequisites} />,
            });
        }

        if (i < factionUnits.length - 1) {
            texts[texts.length - 1].divider = true;
        }
    });

    return <AccordionTextFields {...otherProps} summary="Faction Units" texts={texts} />;
}
