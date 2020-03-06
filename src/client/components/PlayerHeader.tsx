import React, { MouseEvent, useState } from 'react';

import { Card, CardContent, Grid, Typography, Theme, Tooltip, IconButton, Popover } from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import { makeStyles, useTheme } from '@material-ui/styles';

import { GamePlayer, StrategyCard, StrategyCardIndex } from 'common/Game';

import { useAppContext } from '../Context';
import StrategyCardDetails from '../components/StrategyCardDetails';

const useStyles = makeStyles((theme: Theme) => ({
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
    infoIconGrid: {
        width: 'auto',
    },
    infoIcon: {
        padding: theme.spacing(0.5),
    },
}));

export interface PlayerHeaderProps {
    player: GamePlayer;
}

function PlayerHeader(props: PlayerHeaderProps) {
    const theme: Theme = useTheme();
    const classes = useStyles(props);
    const { state } = useAppContext();
    const { strategyCards } = state;

    const [openedCard, setOpenedCard] = useState(StrategyCardIndex.NONE);
    const [cardPopoverAnchor, setCardPopoverAnchor] = useState<HTMLButtonElement | null>(null);

    const { player } = props;

    const { id: playerId, strategyCard } = player;
    const card = strategyCards[strategyCard];

    const playerColor = player.color || '#fff';
    const color = theme.palette.getContrastText(playerColor);
    const backgroundColor = playerColor;

    const onCardInfoClick = (e: MouseEvent<HTMLButtonElement>, card: StrategyCard) => {
        setOpenedCard(card.initiative);
        setCardPopoverAnchor(e.currentTarget);
    };

    const onCardInfoClose = (e: MouseEvent<HTMLButtonElement>) => {
        setOpenedCard(StrategyCardIndex.NONE);
        setCardPopoverAnchor(null);
    };

    return (
        <Grid
            container
            justify="space-between"
            alignItems="center"
            classes={{ root: classes.playerInfo }}
            style={{ color, backgroundColor }}
        >
            <Grid classes={{ root: classes.infoIconGrid }} container justify="flex-start" alignItems="center">
                <Typography>{`${card.initiative}. ${card.name}`}</Typography>
                <Tooltip title="Strategy Card Details">
                    <IconButton classes={{ root: classes.infoIcon }} onClick={e => onCardInfoClick(e, card)}>
                        <InfoIcon style={{ color }} />
                    </IconButton>
                </Tooltip>
                <Popover
                    open={card.initiative === openedCard}
                    onClose={onCardInfoClose}
                    anchorEl={cardPopoverAnchor}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                >
                    <Card variant="outlined">
                        <CardContent>
                            <StrategyCardDetails primary={card.primary} secondary={card.secondary} />
                        </CardContent>
                    </Card>
                </Popover>
            </Grid>
            <Typography>{playerId}</Typography>
        </Grid>
    );
}

export default PlayerHeader;
