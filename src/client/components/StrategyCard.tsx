import React from 'react';

import {
    Button,
    ButtonProps,
    ExpansionPanelDetails,
    ExpansionPanelDetailsProps,
    Grid,
    Typography,
    Theme,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { makeStyles } from '@material-ui/styles';

import { StrategyCard } from 'common/Game';
import {
    ExpansionPanel,
    ExpansionPanelProps,
    ExpansionPanelSummary,
    ExpansionPanelSummaryProps,
} from '../components/ExpansionPanel';
import StrategyCardDetails from './StrategyCardDetails';

export interface StrategyCardProps {
    card: StrategyCard;
    PanelProps?: ExpansionPanelProps;
    SummaryProps?: ExpansionPanelSummaryProps;
    DetailsProps?: ExpansionPanelDetailsProps;
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
    const { name, initiative, primary, secondary } = card;

    let button = null;
    if (!hideButton) {
        button = (
            <Button classes={{ root: classes.button }} color="primary" variant="contained" {...ButtonProps}>
                {buttonLabel}
            </Button>
        );
    }

    return (
        <ExpansionPanel key={name} {...PanelProps}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} {...SummaryProps}>
                <Grid container direction="row" alignItems="center">
                    {button}
                    <Typography>{`${initiative}. ${name.toUpperCase()}`}</Typography>
                </Grid>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails {...DetailsProps}>
                <StrategyCardDetails primary={primary} secondary={secondary} />
            </ExpansionPanelDetails>
        </ExpansionPanel>
    );
}

export default StrategyCard;
