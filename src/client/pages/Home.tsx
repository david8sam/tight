import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Checkbox,
    FormControlLabel,
    TextField,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    MenuItem,
    Stack,
    Typography,
} from '@mui/material';
import { useSession } from '../SessionGate';
import { SavedGameSummary } from 'common/savedGames';
import JoinGameDialog from '../components/JoinGameDialog';
import NewGameDialog from '../components/NewGameDialog';
import { deleteSavedGame, exportSavedGame, fetchSavedGames, importSavedGame, organizeSavedGame } from '../utils/savedGames';

type SavedGames = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; games: SavedGameSummary[] };
type Notice = { severity: 'success' | 'error'; message: string } | null;

function Home() {
    const session = useSession();
    const importInput = useRef<HTMLInputElement>(null);
    const renameInput = useRef<HTMLInputElement>(null);
    const searchInput = useRef<HTMLInputElement>(null);
    const libraryHeading = useRef<HTMLHeadingElement>(null);
    const actionFocus = useRef<HTMLElement | null>(null);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openJoinDialog, setOpenJoinDialog] = useState(false);
    const [saved, setSaved] = useState<SavedGames>({ kind: 'loading' });
    const [notice, setNotice] = useState<Notice>(null);
    const [busy, setBusy] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<'recent' | 'name'>('recent');
    const [rename, setRename] = useState<{ id: string; name: string } | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [dialogPresent, setDialogPresent] = useState(false);

    useEffect(() => {
        if (busy || rename !== null || deleteId !== null || dialogPresent) return;
        const opener = actionFocus.current;
        actionFocus.current = null;
        // Disabled buttons can lose focus, and removed cards need a stable fallback.
        if (opener && document.activeElement === document.body) {
            (opener.isConnected ? opener : libraryHeading.current)?.focus();
        }
    }, [busy, rename, deleteId, dialogPresent]);

    useEffect(() => {
        if (!rename || busy || notice?.severity !== 'error') return;
        const input = renameInput.current;
        const focused = document.activeElement;
        // A disabled submit button leaves focus on the modal container or body.
        if (input && focused !== input && focused?.contains(input)) input.focus();
    }, [rename, busy, notice]);

    async function refresh(signal?: AbortSignal) {
        setNotice(null);
        // Keep ready cards mounted so closing a dialog can restore its original opener.
        setSaved(previous => previous.kind === 'ready' ? previous : { kind: 'loading' });
        try {
            const games = await fetchSavedGames(signal);
            if (!signal?.aborted) setSaved({ kind: 'ready', games });
        } catch {
            if (!signal?.aborted) setSaved({ kind: 'error' });
        }
    }
    useEffect(() => {
        if (session.role !== 'host') return;
        const controller = new AbortController();
        void refresh(controller.signal);
        return () => controller.abort();
    }, []);

    async function act(operation: () => Promise<string | void>) {
        const opener = document.activeElement;
        actionFocus.current = opener instanceof HTMLElement && opener !== document.body && !opener.closest('[role="dialog"]')
            ? opener
            : libraryHeading.current;
        setBusy(true);
        setNotice(null);
        try {
            const message = await operation();
            if (message) setNotice({ severity: 'success', message });
        } catch (error) {
            setNotice({
                severity: 'error',
                message: error instanceof Error ? error.message : 'Could not complete the action. Try again.',
            });
        } finally {
            setBusy(false);
            setDeleteId(null);
        }
    }

    const query = search.trim().toLowerCase();
    const visibleGames = saved.kind === 'ready' ? saved.games.filter(game =>
        (showArchived || !game.archived) &&
        (game.id.toLowerCase().includes(query) || (game.name || '').toLowerCase().includes(query)),
    ) : [];
    // Filtering creates a view-owned array; keep the host's last-played order by default.
    if (sort === 'name') visibleGames.sort((a, b) =>
        (a.name || a.id).localeCompare(b.name || b.id, undefined, { sensitivity: 'base' }) || a.id.localeCompare(b.id),
    );

    if (session.role === 'player' || session.role === 'spectator') return <Container sx={{ py: 4 }}>
        <Typography>You are paired with game {session.gameId} as {session.role === 'player' ? session.playerId : 'a spectator'}.</Typography>
        <Button component={Link} to={`/${session.gameId}/status`}>Return to game</Button>
    </Container>;
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" align="center" gutterBottom>
                TIGHT
            </Typography>
            <Typography align="center" gutterBottom>
                Twilight Imperium Game Helper / Tracker
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ my: 3 }}>
                <Button fullWidth variant="contained" size="large" onClick={() => setOpenCreateDialog(true)}>
                    Create Game
                </Button>
                <Button fullWidth variant="outlined" size="large" onClick={() => setOpenJoinDialog(true)}>
                    Join Game
                </Button>
            </Stack>
            <Box component="section" aria-labelledby="saved-games-heading">
                <Typography id="saved-games-heading" variant="h5" component="h2" ref={libraryHeading} tabIndex={-1}>
                    Saved games
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Games saved on this host stay here when it restarts. Export a copy to keep a separate backup.
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Button disabled={busy || saved.kind === 'loading'} onClick={() => void act(() => refresh())}>
                        Refresh saved games
                    </Button>
                    <Button onClick={() => importInput.current?.click()} disabled={busy || saved.kind === 'loading'}>
                        Import game
                    </Button>
                    <input
                        ref={importInput}
                        type="file"
                        accept=".json,application/json"
                        aria-label="Import game file"
                        hidden
                        disabled={busy || saved.kind === 'loading'}
                        onChange={event => {
                            const file = event.target.files?.[0];
                            event.target.value = '';
                            if (file)
                                void act(async () => {
                                    const id = await importSavedGame(file);
                                    await refresh();
                                    return `Imported game ${id}. Choose Resume to open it.`;
                                });
                        }}
                    />
                </Stack>
                {saved.kind === 'ready' && saved.games.length > 0 && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ my: 2 }}>
                        <TextField
                            inputRef={searchInput}
                            type="search"
                            label="Search saved games"
                            helperText="Search by name or game code."
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            fullWidth
                        />
                        <TextField
                            select
                            label="Sort saved games"
                            value={sort}
                            onChange={event => {
                                const value = event.target.value;
                                if (value === 'recent' || value === 'name') setSort(value);
                            }}
                            sx={{ minWidth: 180 }}
                        >
                            <MenuItem value="recent">Last played</MenuItem>
                            <MenuItem value="name">Name</MenuItem>
                        </TextField>
                        {search.length > 0 && <Button onClick={() => {
                            setSearch('');
                            searchInput.current?.focus();
                        }} sx={{ flexShrink: 0 }}>Clear search</Button>}
                    </Stack>
                )}
                <FormControlLabel
                    control={<Checkbox checked={showArchived} onChange={event => setShowArchived(event.target.checked)} />}
                    label="Show archived games"
                />
                {saved.kind === 'ready' && saved.games.length > 0 && visibleGames.length === 0 && (
                    <Typography role="status">{query
                        ? 'No saved games match your search.'
                        : 'No active saved games. Turn on Show archived games to restore one.'}</Typography>
                )}
                {notice && (
                    <Alert severity={notice.severity} sx={{ mb: 2 }}>
                        {notice.message}
                    </Alert>
                )}
                {busy && <Typography role="status">Working…</Typography>}
                {saved.kind === 'loading' && <Typography role="status">Loading saved games…</Typography>}
                {saved.kind === 'error' && (
                    <Alert
                        severity="error"
                        action={
                            <Button color="inherit" disabled={busy} onClick={() => void act(() => refresh())}>
                                Retry
                            </Button>
                        }
                    >
                        Could not load saved games. Check the host connection and try again.
                    </Alert>
                )}
                {saved.kind === 'ready' && saved.games.length === 0 && (
                    <Typography>No saved games yet. Create a game or import an exported copy.</Typography>
                )}
                {saved.kind === 'ready' && (
                    <Stack spacing={2}>
                        {visibleGames.map(game => (
                            <Card key={game.id} component="article" aria-label={`Saved game ${game.id}`}>
                                <CardContent>
                                    <Typography component="h3" variant="h6" sx={{ overflowWrap: 'anywhere' }}>
                                        {game.name || game.id}
                                    </Typography>
                                    {game.name && <Typography>Game code {game.id}</Typography>}
                                    {game.archived && <Typography color="text.secondary">Archived</Typography>}
                                    <Typography>
                                        {game.state === 'finished'
                                            ? 'Finished'
                                            : game.state === 'playing'
                                              ? 'In progress'
                                              : 'Setting up'}{' '}
                                        · Round {game.round} of {game.numRounds}
                                    </Typography>
                                    <Typography sx={{ overflowWrap: 'anywhere' }}>
                                        {game.players.length ? game.players.join(', ') : 'No players yet'}
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Last played {new Date(game.lastPlayed).toLocaleString()}
                                    </Typography>
                                </CardContent>
                                <CardActions sx={{ flexWrap: 'wrap', '& .MuiButton-root': { minHeight: 44 } }}>
                                    <Button
                                        component={Link}
                                        to={`/${game.id}`}
                                        disabled={busy}
                                        aria-label={`Resume ${game.id}`}
                                    >
                                        Resume
                                    </Button>
                                    <Button
                                        disabled={busy}
                                        aria-label={`Export ${game.id}`}
                                        onClick={() => void act(() => exportSavedGame(game.id))}
                                    >
                                        Export
                                    </Button>
                                    <Button disabled={busy} aria-label={`Rename ${game.id}`}
                                        onClick={() => { setNotice(null); setRename({ id: game.id, name: game.name || '' }); }}>
                                        Rename
                                    </Button>
                                    <Button disabled={busy} aria-label={`${game.archived ? 'Restore' : 'Archive'} ${game.id}`}
                                        onClick={() => void act(async () => {
                                            await organizeSavedGame(game.id, { archived: !game.archived });
                                            await refresh();
                                            return game.archived ? `Restored game ${game.id}.` : `Archived game ${game.id}. Its data and join links are preserved.`;
                                        })}>
                                        {game.archived ? 'Restore' : 'Archive'}
                                    </Button>
                                    <Button
                                        color="error"
                                        disabled={busy}
                                        aria-label={`Delete ${game.id}`}
                                        onClick={() => setDeleteId(game.id)}
                                    >
                                        Delete
                                    </Button>
                                </CardActions>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Box>
            <Dialog open={rename !== null} onClose={() => { if (!busy) setRename(null); }}
                TransitionProps={{ onEnter: () => setDialogPresent(true), onExited: () => setDialogPresent(false) }}
                aria-labelledby="rename-game-title" fullWidth maxWidth="sm">
                <DialogTitle id="rename-game-title">Rename saved game</DialogTitle>
                <Box component="form" onSubmit={event => {
                    event.preventDefault();
                    if (rename && !busy) void act(async () => {
                        await organizeSavedGame(rename.id, { name: rename.name.trim() || null });
                        await refresh();
                        setRename(null);
                        return `Renamed game ${rename.id}.`;
                    });
                }}>
                <DialogContent>
                    {notice?.severity === 'error' && <Alert severity="error">{notice.message}</Alert>}
                    <TextField autoFocus inputRef={renameInput} fullWidth margin="dense" label="Game name" value={rename?.name || ''}
                        InputProps={{ readOnly: busy }} inputProps={{ maxLength: 80 }}
                        helperText="Stored on this host. Up to 80 characters; leave blank to use the game code."
                        onChange={event => { if (rename) setRename({ ...rename, name: event.target.value }); }} />
                </DialogContent>
                <DialogActions>
                    <Button disabled={busy} onClick={() => setRename(null)}>Cancel</Button>
                    <Button disabled={busy} type="submit">Save name</Button>
                </DialogActions>
                </Box>
            </Dialog>
            <Dialog
                open={deleteId !== null}
                TransitionProps={{ onEnter: () => setDialogPresent(true), onExited: () => setDialogPresent(false) }}
                onClose={() => {
                    if (!busy) setDeleteId(null);
                }}
                aria-labelledby="delete-game-title"
            >
                <DialogTitle id="delete-game-title">Delete saved game {deleteId}?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This removes the game from this host and disconnects its players. Export a copy first if you
                        want to keep it.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button disabled={busy} onClick={() => setDeleteId(null)}>
                        Cancel
                    </Button>
                    <Button
                        color="error"
                        disabled={busy}
                        onClick={() => {
                            if (deleteId)
                                void act(async () => {
                                    await deleteSavedGame(deleteId);
                                    await refresh();
                                    return `Deleted game ${deleteId}.`;
                                });
                        }}
                    >
                        Delete saved game
                    </Button>
                </DialogActions>
            </Dialog>
            {openCreateDialog && <NewGameDialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} />}
            {openJoinDialog && <JoinGameDialog open={openJoinDialog} onClose={() => setOpenJoinDialog(false)} />}
        </Container>
    );
}
export default Home;
