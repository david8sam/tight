import React from 'react';

import { Ability } from 'common/Faction';
import AccordionTextFields, { AccordionTextFieldsProps } from './AccordionTextFields';

export interface FactionAbilitiesAccordionProps extends Omit<AccordionTextFieldsProps, 'summary' | 'texts'> {
    abilities: Ability[] | undefined | null;
}

export default function FactionAbilitiesAccordion(props: FactionAbilitiesAccordionProps) {
    const { abilities, ...otherProps } = props;
    if (!abilities) {
        return null;
    }

    const texts: AccordionTextFieldsProps['texts'] = abilities.map(ability => ({
        label: ability.name,
        value: ability.description,
    }));

    return <AccordionTextFields {...otherProps} summary="Abilities" texts={texts} />;
}
