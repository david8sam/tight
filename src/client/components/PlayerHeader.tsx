import React from 'react';

import { Grid, makeStyles, Typography, useTheme } from '@material-ui/core';

import { GamePlayer } from 'common/Game';

import { useAppContext } from '../Context';
import InitiativeLabel from './InitiativeLabel';

const useStyles = makeStyles(theme => ({
    card: {
        border: `${theme.spacing(0.25)}px solid ${theme.palette.text.primary}`,
        margin: `${theme.spacing(0.5)}px ${theme.spacing(1)}px`,
        position: 'relative',
    },
    cardContent: {
        padding: 0,
        '&:last-child': {
            paddingBottom: 0,
        },
    },
    playerInfo: {
        padding: `0px ${theme.spacing(1)}px`,
    },
}));

export interface PlayerHeaderProps {
    player: GamePlayer;
    hideInitiative?: boolean;
}

function PlayerHeader(props: PlayerHeaderProps) {
    const theme = useTheme();
    const classes = useStyles(props);
    const { state } = useAppContext();

    const { strategyCards } = state;
    const { player, hideInitiative = false } = props;
    const { name, faction, strategyCard } = player;

    const card = hideInitiative ? null : strategyCards.find(s => s.initiative === strategyCard);
    const playerColor = player.color || '#fff';
    const color = theme.palette.getContrastText(playerColor);
    const backgroundColor = playerColor;

    return (
        <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            classes={{ root: classes.playerInfo }}
            style={{ color, backgroundColor }}
        >
            {card ? <InitiativeLabel card={card} infoIconColor={color} /> : null}
            <Typography>{`${name} (${faction})`}</Typography>
        </Grid>
    );
}

export default PlayerHeader;
