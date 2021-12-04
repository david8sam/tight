import React from 'react';

import { Leader, LeaderType } from 'common/Faction';

import { AccordionProps } from './Accordion';
import AccordionTextFields, { AccordionTextFieldsProps } from './AccordionTextFields';

function addLeader(texts: AccordionTextFieldsProps['texts'], leader: Leader, divider: boolean) {
    if (!texts) {
        return;
    }

    const { type, name, unlock, ability } = leader;

    texts.push({ label: 'Type', value: LeaderType[type] });
    texts.push({ label: 'Name', value: name });
    texts.push({ label: 'Unlock Criteria', value: unlock });
    texts.push({ label: 'Ability', value: ability, divider });
}

export interface LeadersAccordionProps extends Omit<AccordionProps, 'children'> {
    leaders?: Leader[];
}

export default function LeadersAccordion(props: LeadersAccordionProps) {
    const { leaders, ...otherProps } = props;
    if (!leaders) {
        return null;
    }

    const texts: AccordionTextFieldsProps['texts'] = [];
    leaders.forEach((l, i) => addLeader(texts, l, i < leaders.length - 1));

    return <AccordionTextFields {...otherProps} summary="Leaders" texts={texts} />;
}
