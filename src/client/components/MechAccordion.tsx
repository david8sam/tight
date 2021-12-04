import React from 'react';

import { Mech } from 'common/Faction';

import { AccordionProps } from './Accordion';
import AccordionTextFields, { AccordionTextFieldsProps } from './AccordionTextFields';

export interface MechAccordionProps extends Omit<AccordionProps, 'children'> {
    mech?: Mech | Mech[];
}

export default function MechAccordion(props: MechAccordionProps) {
    const { mech, ...otherProps } = props;
    if (!mech) {
        return null;
    }

    const mechArray = Array.isArray(mech) ? mech : [mech];

    const texts: AccordionTextFieldsProps['texts'] = [];
    mechArray.forEach((m, i) => {
        texts.push({ label: 'Name', value: m.name });
        texts.push({ label: 'Description', value: m.description });
        if (m.abilities) {
            texts.push({ label: 'Abilities', value: `\u2022 ${m.abilities.join('\n\u2022 ')}` });
        }
        texts.push({ label: 'Cost', value: m.cost });
        texts.push({
            label: 'Combat',
            value: Array.isArray(m.combat) ? `${m.combat.join(' x(')})` : `${m.combat}`,
            divider: mechArray.length > 1 && i < mechArray.length - 1,
        });
    });

    return <AccordionTextFields {...otherProps} summary="Mech" texts={texts} />;
}
