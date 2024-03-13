import { makeStyles } from '@mui/styles';
import { FactionTech } from 'common/Faction';
import React from 'react';
import AccordionTextFields, { AccordionTextFieldsProps } from './AccordionTextFields';
import TechPrerequisites from './TechPrerequisites';

const useStyles = makeStyles(theme => ({
    divider: {
        margin: `${theme.spacing(1)} 0px`,
    },
}));

export interface FactionTechAccordionProps extends Omit<AccordionTextFieldsProps, 'summary' | 'texts'> {
    factionTech: FactionTech[] | undefined | null;
}

export default function FactionTechAccordion(props: FactionTechAccordionProps) {
    const classes = useStyles(props);
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
