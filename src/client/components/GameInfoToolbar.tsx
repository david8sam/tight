import React, { useRef, useState } from 'react';

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

import {
    calculateVictoryPoints,
    Game,
    GameJoinStatus,
    GamePlayer,
    getPlayersInGame,
    Phase,
    StrategyCardIndex,
} from 'common/Game';
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
    turn: {
        width: '30%',
    },
    info: {
        width: '40%',
    },
    round: {
        width: '30%',
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
    const { creator, numRounds, numVictoryPoints, players, status } = game;

    const playersArray: GamePlayer[] = [];
    const admins: GamePlayer[] = [];
    const spectators: GamePlayer[] = [];
    Object.values(players).forEach(p => {
        switch (p.joinStatus) {
            case GameJoinStatus.PLAYER:
                playersArray.push(p);
                break;
            case GameJoinStatus.ADMIN:
                admins.push(p);
                break;
            case GameJoinStatus.SPECTATOR:
                spectators.push(p);
                break;
            default:
                break;
        }
    });

    const adminNames = admins.map(a => a.name);
    const specatorsNames = spectators.map(s => s.name);

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

    const { started, round, phase, turn, pickOrder, pickTurn } = status;

    let playerTurn = null;
    if (phase === Phase.STRATEGY) {
        playerTurn = pickOrder[pickTurn];
    } else if (turn === StrategyCardIndex.END) {
        playerTurn = 'END';
    } else {
        const player = getPlayersInGame(game).find(p => p.strategyCard === turn);
        playerTurn = player ? player.name : null;
    }

    const onInfoButtonClick: IconButtonProps['onClick'] = e => {
        setInfoOpen(true);
        if (onInfoClick) {
            onInfoClick(e);
        }
    };

    return (
        <Toolbar>
            <Grid container justifyContent="center" alignItems="center">
                {started && (
                    <Grid item className={classes.turn}>
                        <TextWithTooltip text={`Turn: ${playerTurn || ''}`} title={playerTurn || ''} />
                    </Grid>
                )}
                <Grid item className={classes.info}>
                    <Grid container justifyContent="center" alignItems="center">
                        <Typography variant="h6">{game.name}</Typography>
                        <Tooltip title="Game Info">
                            <IconButton ref={infoRef} onClick={onInfoButtonClick}>
                                <InfoIcon />
                            </IconButton>
                        </Tooltip>
                    </Grid>
                </Grid>
                {started && (
                    <Grid item className={classes.round}>
                        <Typography align="right">{`Round: ${round}`}</Typography>
                    </Grid>
                )}
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
                                    text={`${p.name}: ${vpMap[p.id]} VP `}
                                    title={p.name}
                                    style={getPlayerColors(theme, p)}
                                    className={classes.player}
                                />
                            ))}
                            {adminNames.length > 0 && (
                                <>
                                    <Divider className={classes.divider} />
                                    <Typography>{`Admins: ${adminNames.join(', ')}`}</Typography>
                                </>
                            )}
                            {specatorsNames.length > 0 && (
                                <>
                                    <Divider className={classes.divider} />
                                    <Typography>{`Spectators: ${specatorsNames.join(', ')}`}</Typography>
                                </>
                            )}
                        </>
                    )}
                </Grid>
            </Popover>
        </Toolbar>
    );
}
