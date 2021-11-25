import React, { useState } from 'react';

import { Avatar, AvatarProps, Theme, Tooltip, Typography } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/styles';

import { calculateVictoryPoints, Game, GamePlayer } from 'common/Game';

const AVATAR_SIZE = 30;

const useStyles = makeStyles((theme: Theme) => ({
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        textTransform: 'uppercase',
        fontSize: 12,
    },
}));

export interface ObjectivePlayerAvatarProps {
    game: Game | null;
    player: GamePlayer;
    onOpen?: AvatarProps['onClick'];
}

export default function ObjectivePlayerAvatar(props: ObjectivePlayerAvatarProps) {
    const theme = useTheme<Theme>();
    const classes = useStyles(props);

    const [open, setOpen] = useState(false);
    const { game, player, onOpen } = props;

    const { color: pc, id, name } = player;
    const backgroundColor = pc || '#fff';
    const color = theme.palette.getContrastText(backgroundColor);

    const onTooltipOpen: AvatarProps['onClick'] = e => {
        setOpen(true);
        if (onOpen) {
            onOpen(e);
        }
    };

    const title = game ? `${name} - ${calculateVictoryPoints(game, id)} VPs` : name;

    return (
        <Tooltip title={title} open={open} onClose={() => setOpen(false)}>
            <Avatar className={classes.avatar} style={{ color, backgroundColor }} onClick={onTooltipOpen}>
                <Typography>{String(name[0])}</Typography>
            </Avatar>
        </Tooltip>
    );
}
