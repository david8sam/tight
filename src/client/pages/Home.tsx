import React, { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LoginIcon from '@mui/icons-material/Login';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import StyleIcon from '@mui/icons-material/Style';
import { Button, Chip, CircularProgress, TextField, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import NewGameDialog from '../components/NewGameDialog';
import { PageContainer, Panel, SectionHeader } from '../components/ui';
import { PHASE_LABELS } from '../constants';
import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';
import { ActionType } from '../reducer';
import api from '../utils/api';

const useStyles = makeStyles()(theme => ({
    hero: {
        textAlign: 'center',
        padding: theme.spacing(5, 0, 4),
    },
    wordmark: {
        fontWeight: 800,
        letterSpacing: '0.14em',
        lineHeight: 1,
    },
    subtitle: {
        color: theme.palette.text.secondary,
        marginTop: theme.spacing(1.25),
        letterSpacing: '0.02em',
    },
    cards: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(272px, 1fr))',
        gap: theme.spacing(1.75),
    },
    card: {
        display: 'flex',
        flexDirection: 'column',
        padding: theme.spacing(2.25),
    },
    createCard: {
        borderColor: alpha(theme.palette.primary.main, 0.4),
        boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.18)}`,
    },
    cardIcon: {
        width: 38,
        height: 38,
        borderRadius: theme.game.radius.control + 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing(1.5),
    },
    createIcon: {
        backgroundColor: alpha(theme.palette.primary.main, 0.16),
        color: theme.palette.primary.main,
    },
    joinIcon: {
        backgroundColor: alpha(theme.game.speaker, 0.14),
        color: theme.game.speaker,
    },
    cardBody: {
        color: theme.palette.text.secondary,
        fontSize: 12.5,
        lineHeight: 1.55,
        margin: theme.spacing(0.5, 0, 1.75),
        flex: 1,
    },
    joinRow: {
        display: 'flex',
        gap: theme.spacing(1),
    },
    codeInput: {
        flex: 1,
        '& input': {
            fontFamily: '"Orbitron", sans-serif',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
        },
    },
    section: {
        marginTop: theme.spacing(3),
    },
    sectionHeader: {
        marginBottom: theme.spacing(1),
    },
    gameRow: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: theme.spacing(1, 1.5),
        padding: theme.spacing(1.25, 1.5),
    },
    gameId: {
        fontFamily: '"Orbitron", sans-serif',
        fontSize: 12,
        letterSpacing: '0.08em',
        padding: theme.spacing(0.5, 1.125),
        borderRadius: theme.game.radius.control,
        backgroundColor: alpha(theme.palette.primary.main, 0.14),
        color: theme.palette.primary.light,
    },
    gameMeta: {
        color: theme.palette.text.secondary,
        fontSize: 12.5,
        flex: 1,
        minWidth: 140,
    },
    references: {
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: theme.spacing(1.25),
        marginTop: theme.spacing(4),
        paddingTop: theme.spacing(2.5),
        borderTop: `1px solid ${theme.palette.divider}`,
    },
}));

function Home() {
    const { classes, cx } = useStyles();
    const navigate = useNavigate();
    const { dispatch } = useAppContext();
    const { game, gameId, playerId } = useGameInfo();

    const [createOpen, setCreateOpen] = useState(false);
    const [code, setCode] = useState('');
    const [joinError, setJoinError] = useState(false);
    const [joining, setJoining] = useState(false);

    const joinGame = (id: string, asNewPlayer = false) => {
        setJoining(true);
        setJoinError(false);

        api.gameValidate({ gameId: id })
            .then(exists => {
                if (exists) {
                    if (asNewPlayer) {
                        dispatch({ type: ActionType.setPlayerId, payload: undefined });
                    }
                    navigate(`/${id}`);
                } else {
                    setJoinError(true);
                }
            })
            .finally(() => setJoining(false));
    };

    const onJoinSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (code.length === 4 && !joining) {
            joinGame(code);
        }
    };

    let gameMeta = 'Setup';
    if (game?.status.ended) {
        gameMeta = 'Ended';
    } else if (game?.status.started) {
        gameMeta = `Round ${game.status.round} · ${PHASE_LABELS[game.status.phase]}`;
    }

    return (
        <PageContainer maxWidth={760}>
            <div className={classes.hero}>
                <Typography className={classes.wordmark} variant="h2" component="h1">
                    TIGHT
                </Typography>
                <Typography className={classes.subtitle} variant="body2">
                    Twilight Imperium Game Helper and Tracker
                </Typography>
            </div>

            <div className={classes.cards}>
                <Panel className={cx(classes.card, classes.createCard)}>
                    <div className={cx(classes.cardIcon, classes.createIcon)}>
                        <AddIcon />
                    </div>
                    <Typography variant="h6">Create game</Typography>
                    <Typography className={classes.cardBody} variant="body2">
                        Set players, rounds, and victory points, then share the code at the table.
                    </Typography>
                    <Button color="primary" variant="contained" onClick={() => setCreateOpen(true)}>
                        New game
                    </Button>
                </Panel>

                <Panel className={classes.card}>
                    <div className={cx(classes.cardIcon, classes.joinIcon)}>
                        <LoginIcon />
                    </div>
                    <Typography variant="h6">Join game</Typography>
                    <Typography className={classes.cardBody} variant="body2">
                        Enter a game code to join at the table.
                    </Typography>
                    <form className={classes.joinRow} onSubmit={onJoinSubmit}>
                        <TextField
                            className={classes.codeInput}
                            size="small"
                            placeholder="CODE"
                            error={joinError}
                            helperText={joinError ? 'Invalid game code' : ''}
                            value={code}
                            onChange={e => {
                                setCode(e.target.value.toUpperCase());
                                setJoinError(false);
                            }}
                            slotProps={{ htmlInput: { maxLength: 4 } }}
                        />
                        <Button type="submit" variant="outlined" disabled={code.length !== 4 || joining}>
                            {joining ? <CircularProgress size={20} /> : 'Join'}
                        </Button>
                    </form>
                </Panel>
            </div>

            {game && gameId && (
                <div className={classes.section}>
                    <SectionHeader className={classes.sectionHeader}>Current game</SectionHeader>
                    <Panel className={classes.gameRow}>
                        <span className={classes.gameId}>{gameId}</span>
                        <span className={classes.gameMeta}>
                            {game.numPlayers} players · {gameMeta}
                            {playerId ? ` · Playing as ${playerId}` : ''}
                        </span>
                        <Button size="small" onClick={() => joinGame(gameId, true)}>
                            New player
                        </Button>
                        <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => joinGame(gameId)}>
                            {game.status.ended ? 'Results' : 'Resume'}
                        </Button>
                    </Panel>
                </div>
            )}

            <div className={classes.references}>
                <Chip icon={<MenuBookIcon />} label="Faction reference" onClick={() => navigate('/factions')} />
                <Chip icon={<StyleIcon />} label="Strategy cards" onClick={() => navigate('/strategy-cards')} />
            </div>

            {createOpen && <NewGameDialog open={createOpen} onClose={() => setCreateOpen(false)} />}
        </PageContainer>
    );
}

export default Home;
