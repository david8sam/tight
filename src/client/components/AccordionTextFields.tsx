import React, { ReactNode } from 'react';
import { Divider, Grid, makeStyles, TextField, TextFieldProps, Typography } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { Accordion, AccordionDetails, AccordionProps, AccordionSummary } from './Accordion';

const useStyles = makeStyles(theme => ({
    gridItem: {
        marginBottom: theme.spacing(2),
    },
    disabledText: {
        color: theme.palette.text.primary,
    },
    divider: {
        height: 2,
        backgroundColor: 'black',
    },
}));

export interface AccordionTextFieldsProps extends Omit<AccordionProps, 'children'> {
    summary: string;
    texts: (TextFieldProps & { children?: ReactNode; divider?: boolean })[] | null | undefined;
}

export default function AccordionTextFields(props: AccordionTextFieldsProps) {
    const classes = useStyles(props);
    const { summary, texts, ...AccordionProps } = props;

    if (!texts) {
        return null;
    }

    return (
        <Accordion {...AccordionProps}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{summary}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Grid container direction="column">
                    {texts.map(({ divider, children, ...text }, i) => (
                        <Grid key={i} container direction="column">
                            <Grid item className={classes.gridItem}>
                                <TextField
                                    key={i}
                                    InputProps={{ classes: { disabled: classes.disabledText } }}
                                    disabled
                                    fullWidth
                                    multiline
                                    variant="outlined"
                                    {...text}
                                    // Workaround for known MUI TextField label overlap limitation:
                                    // https://mui.com/components/text-fields/#limitations
                                    InputLabelProps={{ ...text.InputLabelProps, shrink: Boolean(text.value) }}
                                />
                            </Grid>
                            {children ? (
                                <Grid item className={classes.gridItem}>
                                    {children}
                                </Grid>
                            ) : null}
                            {divider ? (
                                <Grid item className={classes.gridItem}>
                                    <Divider className={classes.divider} />
                                </Grid>
                            ) : null}
                        </Grid>
                    ))}
                </Grid>
            </AccordionDetails>
        </Accordion>
    );
}
