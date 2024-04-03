import React from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button, ButtonProps, Grid, Typography } from '@mui/material';

import { StrategyCard } from 'common/Game';
import {
    Accordion,
    AccordionDetails,
    AccordionDetailsProps,
    AccordionProps,
    AccordionSummary,
    AccordionSummaryProps,
} from '../components/Accordion';
import StrategyCardDetails from './StrategyCardDetails';

export interface StrategyCardProps {
    card: StrategyCard;
    owner?: string;
    PanelProps?: AccordionProps;
    SummaryProps?: AccordionSummaryProps;
    DetailsProps?: AccordionDetailsProps;
    hideButton?: boolean;
    ButtonProps?: ButtonProps;
    buttonLabel?: React.ReactNode;
}

function StrategyCard(props: StrategyCardProps) {
    const { card, owner, hideButton, ButtonProps, buttonLabel, PanelProps, SummaryProps, DetailsProps } = props;
    const { name, initiative, primary, secondary, notes, version } = card;

    let button = null;
    if (!hideButton) {
        button = (
            <Button sx={{ marginRight: 1 }} color="primary" variant="contained" {...ButtonProps}>
                {buttonLabel}
            </Button>
        );
    }

    return (
        <Accordion key={name} {...PanelProps}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} {...SummaryProps}>
                <Grid container direction="column">
                    <Grid item>
                        <Grid container direction="row" alignItems="center">
                            {button}
                            <Typography>{`${initiative} - ${name.toUpperCase()}`}</Typography>
                        </Grid>
                    </Grid>
                    {owner && (
                        <Grid item sx={{ paddingTop: 1 }}>
                            <Typography display="flex" justifyContent="center">
                                {owner}
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            </AccordionSummary>
            <AccordionDetails {...DetailsProps}>
                <StrategyCardDetails primary={primary} secondary={secondary} notes={notes} version={version} />
            </AccordionDetails>
        </Accordion>
    );
}

export default StrategyCard;
