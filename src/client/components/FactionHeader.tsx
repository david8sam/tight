import React from 'react';

import { Grid, Typography, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { GameFaction, formatFactionName } from 'common/Game';

import useGameInfo from '../hooks/useGameInfo';

import InitiativeLabel from './InitiativeLabel';

const useStyles = makeStyles(theme => ({
    card: {
        border: `${theme.spacing(0.25)} solid ${theme.palette.text.primary}`,
        margin: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
        position: 'relative',
    },
    cardContent: {
        padding: 0,
        '&:last-child': {
            paddingBottom: 0,
        },
    },
    factionInfo: {
        padding: `0px ${theme.spacing(1)}`,
    },
}));

export interface FactionHeaderProps {
    faction: GameFaction;
    hideInitiative?: boolean;
}

function FactionHeader(props: FactionHeaderProps) {
    const theme = useTheme();
    const classes = useStyles(props);
    const { game, strategyCards } = useGameInfo();

    if (!game) {
        return null;
    }

    const { faction, hideInitiative = false } = props;
    const { strategyCard } = faction;

    const card = hideInitiative ? null : strategyCards.find(s => s.initiative === strategyCard);
    const factionColor = faction.color || '#fff';
    const color = theme.palette.getContrastText(factionColor);
    const backgroundColor = factionColor;

    const title = formatFactionName(game, faction.name);

    return (
        <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            classes={{ root: classes.factionInfo }}
            style={{ color, backgroundColor }}
        >
            {card ? <InitiativeLabel card={card} infoIconColor={color} /> : null}
            <Typography>{title}</Typography>
        </Grid>
    );
}

export default FactionHeader;
