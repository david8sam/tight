import React from 'react';

import {
    Button,
    ButtonProps,
    ExpansionPanel,
    ExpansionPanelSummary,
    Grid,
    Typography,
    ExpansionPanelDetails,
    TextField,
    Theme,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { makeStyles } from '@material-ui/styles';

import { StrategyCard } from 'common/Game';

export interface StrategyCardProps {
    card: StrategyCard;
    hideButton?: boolean;
    ButtonProps?: ButtonProps;
    buttonLabel?: React.ReactNode;
}

const useStyles = makeStyles((theme: Theme) => ({
    button: {
        marginRight: theme.spacing(1),
    },
    primary: {
        marginBottom: theme.spacing(2),
    },
    disabledText: {
        color: theme.palette.text.primary,
    },
}));

function StrategyCard(props: StrategyCardProps) {
    const classes = useStyles(props);
    const { card, hideButton, ButtonProps, buttonLabel } = props;
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
        <ExpansionPanel key={name}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                <Grid container direction="row" alignItems="center">
                    {button}
                    <Typography>{`${initiative}. ${name.toUpperCase()}`}</Typography>
                </Grid>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
                <Grid container direction="column">
                    <TextField
                        classes={{ root: classes.primary }}
                        InputProps={{ classes: { disabled: classes.disabledText } }}
                        disabled
                        fullWidth
                        multiline
                        variant="outlined"
                        label="Primary"
                        value={`\u2022 ${primary.join('\n\u2022 ')}`}
                    />
                    <TextField
                        InputProps={{ classes: { disabled: classes.disabledText } }}
                        disabled
                        fullWidth
                        multiline
                        variant="outlined"
                        label="Secondary"
                        value={`\u2022 ${secondary.join('\n\u2022 ')}`}
                    />
                </Grid>
            </ExpansionPanelDetails>
        </ExpansionPanel>
    );
}

export default StrategyCard;
