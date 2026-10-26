import React, { useEffect, useId, useState } from 'react';
import {
    Accordion, AccordionDetails, AccordionSummary, Alert, Button, List, ListItem, ListItemText, Stack, Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { GameConnections, gameConnectionsSchema } from 'common/gameConnections';
import { readResponse } from '../utils/request';

type ConnectionState = { kind: 'loading' } | { kind: 'failed' } | { kind: 'ready'; value: GameConnections };

function ConnectionList({ gameId }: { gameId: string }) {
    const [state, setState] = useState<ConnectionState>({ kind: 'loading' });
    const [refresh, setRefresh] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout> | undefined;
        const load = async () => {
            try {
                const value = await readResponse(
                    `/api/session/connections?gameId=${encodeURIComponent(gameId)}`,
                    { signal: controller.signal, cache: 'no-store' },
                    async response => {
                        if (!response.ok) throw new Error('Could not load connected devices');
                        const data: unknown = await response.json();
                        return gameConnectionsSchema.parse(data);
                    },
                );
                if (!controller.signal.aborted) setState({ kind: 'ready', value });
            } catch {
                if (!controller.signal.aborted) setState({ kind: 'failed' });
            } finally {
                if (!controller.signal.aborted) timer = setTimeout(() => void load(), 5000);
            }
        };
        void load();
        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [gameId, refresh]);
    return (
        <Stack spacing={1}>
            <Typography variant="body2">
                Paired devices appear while connected to this game. Multiple tabs in the same paired browser count once.
                This list refreshes about every five seconds. A lost connection may take longer to disappear.
            </Typography>
            {state.kind === 'loading' && <Typography role="status">Loading connected devices...</Typography>}
            {state.kind === 'failed' && <Alert severity="error">Could not load connected devices. Try again.</Alert>}
            {state.kind === 'ready' && (
                <>
                    <Typography>Players connected: {state.value.players.length}</Typography>
                    {state.value.players.length === 0 ? (
                        <Typography variant="body2">No paired players are connected.</Typography>
                    ) : (
                        <List aria-label="Connected players" disablePadding>
                            {state.value.players.map(player => (
                                <ListItem key={player.playerId} disableGutters>
                                    <ListItemText
                                        primary={player.playerId}
                                        secondary={player.tableEditing ? 'Table-wide public editing' : 'Assigned factions only'}
                                        sx={{ overflowWrap: 'anywhere' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                    <Typography>Spectator devices connected: {state.value.spectators}</Typography>
                </>
            )}
            <Button
                aria-disabled={state.kind === 'loading'}
                aria-busy={state.kind === 'loading'}
                sx={{ '&[aria-disabled="true"]': { color: 'action.disabled' } }}
                onClick={() => {
                    if (state.kind === 'loading') return;
                    setState({ kind: 'loading' });
                    setRefresh(value => value + 1);
                }}
            >
                {state.kind === 'failed' ? 'Retry connected devices' : 'Refresh connected devices'}
            </Button>
        </Stack>
    );
}

export default function ConnectedDevices({ gameId, accessChanges }: { gameId: string; accessChanges: number }) {
    const [expanded, setExpanded] = useState(false);
    const id = useId();
    return (
        <Accordion expanded={expanded} onChange={(_event, value) => setExpanded(value)} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} id={`${id}-heading`} aria-controls={`${id}-content`}>
                Connected devices
            </AccordionSummary>
            <AccordionDetails id={`${id}-content`}>
                {expanded && <ConnectionList key={`${gameId}:${accessChanges}`} gameId={gameId} />}
            </AccordionDetails>
        </Accordion>
    );
}
