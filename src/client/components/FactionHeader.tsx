import React from 'react';
import { Grid, SxProps, Typography, useTheme } from '@mui/material';

import { GameFaction, formatFactionName } from 'common/Game';

import useGameInfo from '../hooks/useGameInfo';
import InitiativeLabel from './InitiativeLabel';

export interface FactionHeaderProps {
    faction: GameFaction;
    hideInitiative?: boolean;
    sx?: SxProps;
    prefixText?: string;
    hideInitiativeNumber?: boolean;
}

function FactionHeader(props: FactionHeaderProps) {
    const theme = useTheme();
    const { game, strategyCards } = useGameInfo();

    if (!game) {
        return null;
    }

    const { faction, hideInitiative = false, sx, prefixText, hideInitiativeNumber } = props;
    const { strategyCard } = faction;

    const card = hideInitiative ? null : strategyCards.find(s => s.initiative === strategyCard);
    const cardBackgroundColor = card?.color || '#fff';
    const cardColor = theme.palette.getContrastText(cardBackgroundColor);
    const factionBackgroundColor = faction.color;
    const factionColor = theme.palette.getContrastText(factionBackgroundColor);

    const title = formatFactionName(game, faction.name);
    const factionStyle = card
        ? {
              color: factionColor,
              backgroundColor: factionBackgroundColor,
              padding: '0px 4px',
              margin: '4px 0px',
              border: `1px solid ${factionColor}`,
          }
        : undefined;

    return (
        <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            style={{
                color: card ? cardColor : factionColor,
                backgroundColor: card ? cardBackgroundColor : factionBackgroundColor,
            }}
            sx={{ padding: `0px ${theme.spacing(1)}`, ...sx }}
        >
            {prefixText ? <Typography sx={{ whiteSpace: 'pre' }}>{prefixText}</Typography> : null}
            {card ? (
                <InitiativeLabel card={card} infoIconColor={cardColor} hideInitiativeNumber={hideInitiativeNumber} />
            ) : null}
            <Typography sx={factionStyle}>{title}</Typography>
        </Grid>
    );
}

export default FactionHeader;
