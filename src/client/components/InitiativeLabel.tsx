import React, { MouseEvent, useState } from 'react';

import { Card, CardContent, Grid, Typography, Theme, Tooltip, IconButton, Popover } from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import { makeStyles } from '@material-ui/styles';

import { StrategyCard, StrategyCardIndex } from 'common/Game';

import StrategyCardDetails from '../components/StrategyCardDetails';

const useStyles = makeStyles((theme: Theme) => ({
    infoIconGrid: {
        width: 'auto',
    },
    infoIcon: {
        padding: theme.spacing(0.5),
    },
}));

export interface InitiativeLabelProps {
    card: StrategyCard;
    infoIconColor: string;
}

function InitiativeLabel(props: InitiativeLabelProps) {
    const classes = useStyles(props);

    const [openedCard, setOpenedCard] = useState(StrategyCardIndex.NONE);
    const [cardPopoverAnchor, setCardPopoverAnchor] = useState<HTMLButtonElement | null>(null);

    const { card, infoIconColor } = props;
    const { initiative, name, primary, secondary, version, notes } = card;

    const onCardInfoClick = (e: MouseEvent<HTMLButtonElement>, card: StrategyCard) => {
        setOpenedCard(card.initiative);
        setCardPopoverAnchor(e.currentTarget);
    };

    const onCardInfoClose = (e: MouseEvent<HTMLButtonElement>) => {
        setOpenedCard(StrategyCardIndex.NONE);
        setCardPopoverAnchor(null);
    };

    return (
        <Grid classes={{ root: classes.infoIconGrid }} container justifyContent="flex-start" alignItems="center">
            <Typography>{`${initiative} - ${name}`}</Typography>
            <Tooltip title="Strategy Card Details">
                <IconButton classes={{ root: classes.infoIcon }} onClick={e => onCardInfoClick(e, card)}>
                    <InfoIcon style={{ color: infoIconColor }} />
                </IconButton>
            </Tooltip>
            <Popover
                open={initiative === openedCard}
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
                        <StrategyCardDetails primary={primary} secondary={secondary} version={version} notes={notes} />
                    </CardContent>
                </Card>
            </Popover>
        </Grid>
    );
}

export default InitiativeLabel;
