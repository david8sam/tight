import React from 'react';

import { Grid, TextField, Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme: Theme) => ({
    primary: {
        marginBottom: theme.spacing(2),
    },
    secondary: {},
    disabledText: {
        color: theme.palette.text.primary,
    },
}));

interface StrategyCardDetailsProps {
    primary: string[];
    secondary: String[];
}

function StrategyCardDetails(props: StrategyCardDetailsProps) {
    const classes = useStyles(props);
    const { primary, secondary } = props;

    return (
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
                classes={{ root: classes.secondary }}
                InputProps={{ classes: { disabled: classes.disabledText } }}
                disabled
                fullWidth
                multiline
                variant="outlined"
                label="Secondary"
                value={`\u2022 ${secondary.join('\n\u2022 ')}`}
            />
        </Grid>
    );
}

export default StrategyCardDetails;
