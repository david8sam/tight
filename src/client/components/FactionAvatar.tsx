import React from 'react';

import { Avatar, AvatarProps, Tooltip, Typography, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { GameFaction } from 'common/Game';

import useTooltipOnClick from '../hooks/useTooltipOnClick';

const AVATAR_SIZE = 30;

const useStyles = makeStyles(() => ({
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        textTransform: 'uppercase',
        fontSize: 12,
    },
}));

export interface FactionAvatarProps {
    faction: GameFaction;
    title?: string;
    onClick?: AvatarProps['onClick'];
}

export default function FactionAvatar(props: FactionAvatarProps) {
    const theme = useTheme();
    const classes = useStyles(props);
    const { faction, title = '', onClick } = props;

    const [open, onOpen, onClose] = useTooltipOnClick({ onTooltipOpen: onClick });

    const { color: pc, name } = faction;
    const backgroundColor = pc || '#fff';
    const color = theme.palette.getContrastText(backgroundColor);

    const nameParts = name.split(' ');
    const firstWord = nameParts.find(p => p.toLowerCase() !== 'the') || nameParts[0];

    return (
        <Tooltip title={title || name} open={open} onClose={onClose}>
            <Avatar className={classes.avatar} style={{ color, backgroundColor }} onClick={onOpen}>
                <Typography>{String(firstWord[0])}</Typography>
            </Avatar>
        </Tooltip>
    );
}
