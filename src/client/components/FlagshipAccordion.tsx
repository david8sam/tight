import React from 'react';

import { Flagship } from 'common/Faction';

import { AccordionProps } from './Accordion';
import AccordionTextFields, { AccordionTextFieldsProps } from './AccordionTextFields';
import TechPrerequisites from './TechPrerequisites';

export interface FlagshipAccordionProps extends Omit<AccordionProps, 'children'> {
    flagship?: Flagship | Flagship[];
}

export default function FlagshipAccordion(props: FlagshipAccordionProps) {
    const { flagship, ...otherProps } = props;
    if (!flagship) {
        return null;
    }

    const flagshipArray = Array.isArray(flagship) ? flagship : [flagship];

    const texts: AccordionTextFieldsProps['texts'] = [];
    flagshipArray.forEach((f, i) => {
        const { combat, prerequisites } = f;
        const combatValue = Array.isArray(combat) ? `${combat.join(' (x')})` : combat;

        texts.push({ label: 'Name', value: f.name });
        texts.push({ label: 'Cost', value: f.cost });
        texts.push({ label: 'Combat', value: combatValue });
        texts.push({ label: 'Move', value: f.move });
        texts.push({ label: 'Capacity', value: f.capacity });
        texts.push({
            label: 'Abilities',
            value: `\u2022 ${f.abilities.join('\n\u2022 ')}`,
            children: prerequisites ? <TechPrerequisites prereq={prerequisites} /> : undefined,
            divider: flagshipArray.length > 1 && i < flagshipArray.length - 1,
        });
    });

    return <AccordionTextFields {...otherProps} summary="Flagship" texts={texts} />;
}
