import React, { useRef, useState } from 'react';

import InfoIcon from '@mui/icons-material/Info';
import {
    Divider,
    Grid,
    IconButton,
    IconButtonProps,
    Popover,
    Toolbar,
    ToolbarProps,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';
import { makeStyles } from '@mui/styles';

import { calculateVictoryPoints, GameClientData } from 'common/Game';

import { getFactionColors } from '../utils/faction';
import TextWithTooltip from './TextWithTooltip';

const useStyle = makeStyles(theme => ({
    infoPaper: {
        padding: theme.spacing(2),
        borderRadius: theme.spacing(),
    },
    divider: {
        margin: `${theme.spacing()} 0px`,
    },
    faction: {
        padding: theme.spacing(),
    },
    turn: {
        width: '30%',
    },
    round: {
        width: '30%',
    },
}));

export interface GameInfoToolbarProps extends ToolbarProps {
    game: GameClientData;
    onInfoClick?: IconButtonProps['onClick'];
}

export default function GameInfoToolbar(props: GameInfoToolbarProps) {
    const theme = useTheme();
    const classes = useStyle(props);

    const { game, onInfoClick, ...toolbarProps } = props;
    const { factions, numRounds, numVictoryPoints, status } = game;

    const vpMap = factions.reduce((r, f) => {
        r[f.name] = calculateVictoryPoints(game, f.name);
        return r;
    }, {} as Record<string, number>);

    // Sort by VP
    const leaderboard = [...factions].sort((a, b) => {
        const result = vpMap[b.name] - vpMap[a.name];
        return result === 0 ? a.strategyCard - b.strategyCard : result;
    });

    const [infoOpen, setInfoOpen] = useState(false);
    const infoRef = useRef<HTMLButtonElement>(null);

    const { started, round } = status;

    const onInfoButtonClick: IconButtonProps['onClick'] = e => {
        setInfoOpen(true);
        if (onInfoClick) {
            onInfoClick(e);
        }
    };

    return (
        <Toolbar {...toolbarProps}>
            <Grid container justifyContent="space-between" alignItems="center">
                <Grid item>
                    <Grid container justifyContent="center" alignItems="center">
                        <Typography variant="h6">{game.id}</Typography>
                        <Tooltip title="Game Info">
                            <IconButton ref={infoRef} onClick={onInfoButtonClick} size="large">
                                <InfoIcon />
                            </IconButton>
                        </Tooltip>
                    </Grid>
                </Grid>
                {started && (
                    <Grid item className={classes.round}>
                        <Typography variant="h6" align="right">{`Round: ${round}`}</Typography>
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
                slotProps={{ paper: { className: classes.infoPaper } }}
            >
                <Grid container direction="column">
                    <Typography>{`Rounds: ${numRounds}`}</Typography>
                    <Typography>{`VP to win: ${numVictoryPoints}`}</Typography>
                    {game.status.started && (
                        <>
                            <Divider className={classes.divider} />
                            {leaderboard.map(f => (
                                <TextWithTooltip
                                    key={f.name}
                                    text={`${f.name}: ${vpMap[f.name]} VP `}
                                    title={f.name}
                                    style={getFactionColors(theme, f)}
                                    className={classes.faction}
                                />
                            ))}
                        </>
                    )}
                </Grid>
            </Popover>
        </Toolbar>
    );
}
