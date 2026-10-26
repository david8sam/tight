import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { sessionHints } from './utils/sessionHints';
import { Session, sessionSchema } from 'common/session';
import { readResponse } from './utils/request';

const SessionContext = createContext<Session>({ role: 'unpaired' });
export const useSession = () => useContext(SessionContext);
type Gate =
    | { kind: 'loading' }
    | { kind: 'failed'; message: string }
    | { kind: 'retrying'; message: string }
    | { kind: 'checking' }
    | { kind: 'ready'; session: Session };

export default function SessionGate({ children }: React.PropsWithChildren) {
    const [claim] = useState(() => {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        const host = fragment.get('host');
        const pair = fragment.get('pair');
        if (host || pair) history.replaceState(null, '', window.location.pathname + window.location.search);
        return host ? { operation: 'host', token: host } : pair ? { operation: 'claim', token: pair } : null;
    });
    const [gate, setGate] = useState<Gate>({ kind: 'loading' });
    const [attempt, setAttempt] = useState(0);
    const claimAccepted = useRef(false);
    const active = useRef<AbortController | null>(null);
    const requestFocus = useRef<HTMLElement | null>(null);
    const actionButton = useRef<HTMLButtonElement>(null);
    const pending = gate.kind === 'retrying' || gate.kind === 'checking';
    useEffect(() => {
        if (gate.kind === 'loading' || gate.kind === 'retrying' || gate.kind === 'checking') return;
        const opener = requestFocus.current;
        requestFocus.current = null;
        const target = actionButton.current;
        const focused = document.activeElement;
        if (opener && target && focused !== target && focused?.contains(target)) target.focus();
    }, [gate]);
    useEffect(() => {
        const openInvitation = () => {
            const fragment = new URLSearchParams(window.location.hash.slice(1));
            // A replacement identity needs fresh session and game state throughout the app.
            if (fragment.get('host') || fragment.get('pair')) window.location.reload();
        };
        window.addEventListener('hashchange', openInvitation);
        return () => window.removeEventListener('hashchange', openInvitation);
    }, []);
    useEffect(() => {
        const controller = active.current || new AbortController();
        active.current = controller;
        const load = async () => {
            if (claim && !claimAccepted.current) {
                await readResponse(
                    `/api/session/${claim.operation}`,
                    {
                        method: 'POST',
                        signal: controller.signal,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: claim.token }),
                    },
                    async response => {
                        if (!response.ok) {
                            if (response.status === 429)
                                throw new Error('Too many pairing attempts. Wait a moment and try again with this link.');
                            if (response.status !== 400 && response.status !== 403)
                                throw new Error('The host could not complete pairing. Check the host and try again with this link.');
                            throw new Error(
                                'This host link or invitation is invalid, expired, or already used. Ask the host for a new link.',
                            );
                        }
                        // The success headers installed the cookie even if reading the body now fails.
                        claimAccepted.current = true;
                        await response.json();
                    },
                );
            }
            return readResponse('/api/session', { signal: controller.signal }, async response => {
                if (!response.ok)
                    throw new Error('Could not check this device. Check the host connection and try again.');
                const data: unknown = await response.json();
                return sessionSchema.parse(data);
            });
        };
        load()
            .then(session => {
                if (controller.signal.aborted) return;
                if (session.role === 'player' || session.role === 'spectator') {
                    sessionHints.setItem('gameId', session.gameId);
                    if (session.role === 'player') sessionHints.setItem('playerId', session.playerId);
                    else sessionHints.removeItem('playerId');
                    if (claim || window.location.pathname === '/')
                        history.replaceState(null, '', `/${session.gameId}/status`);
                }
                setGate({ kind: 'ready', session });
            })
            .catch(error => {
                if (!controller.signal.aborted)
                    setGate({
                        kind: 'failed',
                        message: error instanceof Error ? error.message : 'Could not pair this device.',
                    });
            })
            .finally(() => {
                if (active.current === controller) active.current = null;
            });
        return () => {
            controller.abort();
            if (active.current === controller) active.current = null;
        };
    }, [claim, attempt]);
    const retry = () => {
        if (active.current || (gate.kind !== 'failed' && !(gate.kind === 'ready' && gate.session.role === 'unpaired'))) return;
        // Reserve ownership before React starts the effect, so rapid input cannot cancel/restart it.
        active.current = new AbortController();
        const opener = document.activeElement;
        requestFocus.current = opener instanceof HTMLElement ? opener : null;
        setGate(gate.kind === 'failed' ? { kind: 'retrying', message: gate.message } : { kind: 'checking' });
        setAttempt(value => value + 1);
    };
    if (gate.kind === 'loading') return <main aria-busy="true">Connecting to the host...</main>;
    if (gate.kind === 'failed' || gate.kind === 'retrying')
        return (
            <main>
                <p role="alert">{gate.message}</p>
                <button
                    ref={actionButton}
                    aria-disabled={pending}
                    aria-busy={pending}
                    style={{ color: pending ? 'GrayText' : undefined }}
                    onClick={retry}
                >
                    Try again
                </button>
                {pending && <p role="status">Checking this device...</p>}
            </main>
        );
    if (gate.kind === 'checking' || gate.session.role === 'unpaired')
        return (
            <main>
                <h1>Pair this device with TIGHT</h1>
                <p>Ask the host for a player or spectator invitation. The game code alone does not grant access.</p>
                <button
                    ref={actionButton}
                    aria-disabled={pending}
                    aria-busy={pending}
                    style={{ color: pending ? 'GrayText' : undefined }}
                    onClick={retry}
                >
                    Check pairing
                </button>
                {pending && <p role="status">Checking this device...</p>}
            </main>
        );
    return <SessionContext.Provider value={gate.session}>{children}</SessionContext.Provider>;
}
