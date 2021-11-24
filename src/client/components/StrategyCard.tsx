import React from 'react';

import { Button, ButtonProps, Grid, Typography, Theme } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { makeStyles } from '@material-ui/styles';

import { StrategyCard } from 'common/Game';
import {
    Accordion,
    AccordionProps,
    AccordionDetails,
    AccordionDetailsProps,
    AccordionSummary,
    AccordionSummaryProps,
} from '../components/Accordion';
import StrategyCardDetails from './StrategyCardDetails';

export interface StrategyCardProps {
    card: StrategyCard;
    PanelProps?: AccordionProps;
    SummaryProps?: AccordionSummaryProps;
    DetailsProps?: AccordionDetailsProps;
    hideButton?: boolean;
    ButtonProps?: ButtonProps;
    buttonLabel?: React.ReactNode;
}

const useStyles = makeStyles((theme: Theme) => ({
    button: {
        marginRight: theme.spacing(1),
    },
}));

function StrategyCard(props: StrategyCardProps) {
    const classes = useStyles(props);
    const { card, hideButton, ButtonProps, buttonLabel, PanelProps, SummaryProps, DetailsProps } = props;
    const { name, initiative, primary, secondary, notes, version } = card;

    let button = null;
    if (!hideButton) {
        button = (
            <Button classes={{ root: classes.button }} color="primary" variant="contained" {...ButtonProps}>
                {buttonLabel}
            </Button>
        );
    }

    return (
        <Accordion key={name} {...PanelProps}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} {...SummaryProps}>
                <Grid container direction="row" alignItems="center">
                    {button}
                    <Typography>{`${initiative} - ${name.toUpperCase()}`}</Typography>
                </Grid>
            </AccordionSummary>
            <AccordionDetails {...DetailsProps}>
                <StrategyCardDetails primary={primary} secondary={secondary} notes={notes} version={version} />
            </AccordionDetails>
        </Accordion>
    );
}

export default StrategyCard;
