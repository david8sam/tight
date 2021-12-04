import React, { useMemo, useRef, useState } from 'react';

import {
    Divider,
    Grid,
    IconButton,
    IconButtonProps,
    makeStyles,
    Popover,
    Theme,
    Toolbar,
    Tooltip,
    Typography,
    useTheme,
} from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';

import { calculateVictoryPoints, Game, GamePlayer, getPlayersInGame } from 'common/Game';
import TextWithTooltip from './TextWithTooltip';

function getPlayerColors(theme: Theme, player: GamePlayer): { color: string; backgroundColor: string } {
    const playerColor = player.color || '#fff';
    const color = theme.palette.getContrastText(playerColor);
    const backgroundColor = playerColor;
    return { color, backgroundColor };
}

const useStyle = makeStyles(theme => ({
    infoPaper: {
        padding: theme.spacing(2),
        borderRadius: theme.spacing(),
    },
    divider: {
        margin: `${theme.spacing()}px 0px`,
    },
    player: {
        padding: theme.spacing(),
    },
}));

export interface GameInfoToolbarProps {
    game: Game;
    onInfoClick?: IconButtonProps['onClick'];
}

export default function GameInfoToolbar(props: GameInfoToolbarProps) {
    const theme = useTheme();
    const classes = useStyle(props);

    const { game, onInfoClick } = props;
    const { creator, numRounds, numVictoryPoints } = game;
    const playersArray = getPlayersInGame(game);

    const vpMap = playersArray.reduce((r, p) => {
        r[p.id] = calculateVictoryPoints(game, p.id);
        return r;
    }, {} as Record<string, number>);

    // Sort by VP
    const leaderboard = playersArray.sort((a, b) => {
        const result = vpMap[b.id] - vpMap[a.id];
        return result === 0 ? a.strategyCard - b.strategyCard : result;
    });

    const [infoOpen, setInfoOpen] = useState(false);
    const infoRef = useRef<HTMLButtonElement>(null);

    const onInfoButtonClick: IconButtonProps['onClick'] = e => {
        setInfoOpen(true);
        if (onInfoClick) {
            onInfoClick(e);
        }
    };

    return (
        <Toolbar>
            <Grid container justifyContent="center" alignItems="center" spacing={1}>
                <Typography variant="h6">{game.name}</Typography>
                <Tooltip title="Game Info">
                    <IconButton ref={infoRef} onClick={onInfoButtonClick}>
                        <InfoIcon />
                    </IconButton>
                </Tooltip>
            </Grid>
            <Popover
                open={infoOpen}
                onClose={() => setInfoOpen(false)}
                anchorEl={infoRef.current}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                PaperProps={{ className: classes.infoPaper }}
            >
                <Grid container direction="column">
                    <Typography>{`Creator: ${creator}`}</Typography>
                    <Typography>{`Rounds: ${numRounds}`}</Typography>
                    <Typography>{`VP to win: ${numVictoryPoints}`}</Typography>
                    {game.status.started && (
                        <>
                            <Divider className={classes.divider} />
                            {leaderboard.map(p => (
                                <TextWithTooltip
                                    key={p.id}
                                    text={`${p.name} ${vpMap[p.id]} VP `}
                                    title={p.name}
                                    style={getPlayerColors(theme, p)}
                                    className={classes.player}
                                />
                            ))}
                        </>
                    )}
                </Grid>
            </Popover>
        </Toolbar>
    );
}
