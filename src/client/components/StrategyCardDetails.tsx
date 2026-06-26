import React from 'react';

import { Grid, TextField, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { ExpansionVersionNames, Version } from 'common/Game';

const useStyles = makeStyles()((theme) => ({
    primary: {},
    secondary: { marginTop: theme.spacing(2) },
    notes: { marginTop: theme.spacing(2) },
}));

interface StrategyCardDetailsProps {
    primary: string[];
    secondary: String[];
    notes?: string[];
    version: Version;
}

function StrategyCardDetails(props: StrategyCardDetailsProps) {
    const { classes } = useStyles();
    const { primary, secondary, version, notes } = props;
    const versionName = ExpansionVersionNames[version];

    return (
        <Grid container direction="column">
            <TextField
                classes={{ root: classes.primary }}
                InputProps={{ readOnly: true }}
                fullWidth
                multiline
                variant="outlined"
                label="Primary"
                value={`\u2022 ${primary.join('\n\u2022 ')}`}
            />
            <TextField
                classes={{ root: classes.secondary }}
                InputProps={{ readOnly: true }}
                fullWidth
                multiline
                variant="outlined"
                label="Secondary"
                value={`\u2022 ${secondary.join('\n\u2022 ')}`}
            />
            {notes && (
                <TextField
                    classes={{ root: classes.secondary }}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    multiline
                    variant="outlined"
                    label="Notes"
                    value={`\u2022 ${notes.join('\n\u2022 ')}`}
                />
            )}
            {versionName && <Typography variant="caption">{versionName}</Typography>}
        </Grid>
    );
}

export default StrategyCardDetails;
