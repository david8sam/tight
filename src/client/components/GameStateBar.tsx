import React, { useRef, useState } from 'react';

import InfoIcon from '@mui/icons-material/Info';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import { Button, ButtonBase, Popover, Toolbar, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import { formatFactionName, getFactionTurn } from 'common/Game';

import { PHASE_LABELS } from '../constants';
import useGameInfo from '../hooks/useGameInfo';

import { FactionColorChip, PhaseBadge } from './ui';
import GameSummary from './GameSummary';
import RestartGameDialog from './RestartGameDialog';

const useStyles = makeStyles()(theme => ({
    root: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: theme.spacing(1, 2.5),
        padding: theme.spacing(1, 2),
        backgroundColor: theme.game.surface.strip,
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    gameId: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing(0.75),
        padding: theme.spacing(0.5, 1.25),
        borderRadius: theme.game.radius.control,
        backgroundColor: alpha(theme.palette.primary.main, 0.14),
        color: theme.palette.primary.light,
        fontFamily: '"Orbitron", sans-serif',
        fontSize: 12,
        letterSpacing: '0.08em',
    },
    stat: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing(0.75),
        minWidth: 0,
        color: theme.palette.text.secondary,
        fontSize: 12.5,
    },
    statLabel: {
        color: theme.palette.text.disabled,
    },
    statValue: {
        color: theme.palette.text.primary,
        fontWeight: 600,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    round: {
        fontFamily: '"Orbitron", sans-serif',
    },
    roundTotal: {
        color: theme.palette.text.disabled,
    },
    speakerIcon: {
        fontSize: 15,
        color: theme.game.speaker,
    },
    popover: {
        padding: theme.spacing(2),
        borderRadius: theme.game.radius.card,
    },
}));

function GameStateBar() {
    const { classes } = useStyles();
    const { game } = useGameInfo();

    const [infoOpen, setInfoOpen] = useState(false);
    const [restartDialogOpen, setRestartDialogOpen] = useState(false);
    const infoRef = useRef<HTMLButtonElement>(null);

    if (!game) {
        return null;
    }

    const { started, round, phase, speaker } = game.status;

    const factionTurn = getFactionTurn(game);
    const turnFaction = factionTurn && factionTurn !== 'END' ? game.factions.find(f => f.name === factionTurn) : null;
    const speakerFaction = speaker ? game.factions.find(f => f.name === speaker) : null;

    const onRestartGameClick = () => {
        setRestartDialogOpen(true);
        setInfoOpen(false);
    };

    return (
        <div className={classes.root}>
            <Tooltip title="Game info">
                <ButtonBase ref={infoRef} className={classes.gameId} onClick={() => setInfoOpen(true)}>
                    {game.id}
                    <InfoIcon sx={{ fontSize: 14 }} />
                </ButtonBase>
            </Tooltip>

            {started && (
                <>
                    <span className={classes.stat}>
                        <span className={classes.statLabel}>Round</span>
                        <span className={`${classes.statValue} ${classes.round}`}>
                            {round}
                            <span className={classes.roundTotal}> / {game.numRounds}</span>
                        </span>
                    </span>

                    <PhaseBadge label={PHASE_LABELS[phase]} state="active" />

                    {turnFaction && (
                        <span className={classes.stat}>
                            <span className={classes.statLabel}>Turn</span>
                            <FactionColorChip
                                className={classes.statValue}
                                faction={turnFaction}
                                label={formatFactionName(game, turnFaction.name)}
                            />
                        </span>
                    )}
                    {factionTurn === 'END' && (
                        <span className={classes.stat}>
                            <span className={classes.statValue}>End of round</span>
                        </span>
                    )}

                    {speakerFaction && (
                        <span className={classes.stat}>
                            <RecordVoiceOverIcon className={classes.speakerIcon} />
                            <span className={classes.statLabel}>Speaker</span>
                            <FactionColorChip
                                className={classes.statValue}
                                faction={speakerFaction}
                                label={formatFactionName(game, speakerFaction.name)}
                            />
                        </span>
                    )}
                </>
            )}

            <Popover
                open={infoOpen}
                onClose={() => setInfoOpen(false)}
                anchorEl={infoRef.current}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{ paper: { className: classes.popover } }}
            >
                <GameSummary />
                <Toolbar />
                <Button fullWidth color="error" variant="contained" onClick={onRestartGameClick}>
                    Restart Game...
                </Button>
            </Popover>
            <RestartGameDialog open={restartDialogOpen} onClose={() => setRestartDialogOpen(false)} />
        </div>
    );
}

export default GameStateBar;
