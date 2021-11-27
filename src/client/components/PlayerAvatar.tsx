import React from 'react';

import { Avatar, AvatarProps, Theme, Tooltip, Typography } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/styles';

import { GamePlayer } from 'common/Game';

import useTooltipOnClick from '../hooks/useTooltipOnClick';

const AVATAR_SIZE = 30;

const useStyles = makeStyles((theme: Theme) => ({
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        textTransform: 'uppercase',
        fontSize: 12,
    },
}));

export interface PlayerAvatarProps {
    player: GamePlayer;
    title?: string;
    onClick?: AvatarProps['onClick'];
}

export default function PlayerAvatar(props: PlayerAvatarProps) {
    const theme = useTheme<Theme>();
    const classes = useStyles(props);
    const { player, title = '', onClick } = props;

    const [open, onOpen, onClose] = useTooltipOnClick({ onTooltipOpen: onClick });

    const { color: pc, name } = player;
    const backgroundColor = pc || '#fff';
    const color = theme.palette.getContrastText(backgroundColor);

    return (
        <Tooltip title={title || name} open={open} onClose={onClose}>
            <Avatar className={classes.avatar} style={{ color, backgroundColor }} onClick={onOpen}>
                <Typography>{String(name[0])}</Typography>
            </Avatar>
        </Tooltip>
    );
}
