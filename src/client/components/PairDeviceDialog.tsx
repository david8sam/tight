import React, { useId, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Checkbox,
    FormControlLabel,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { isPlayerName, MAX_PLAYER_NAME_LENGTH } from 'common/playerName';
import { z } from 'zod';
import { QRCodeSVG } from 'qrcode.react';
import { lanOrigin } from 'common/hosting';
import { useNativeHosting } from '../NativeHosting';
import useDialogRequest from '../hooks/useDialogRequest';
import { readResponse } from '../utils/request';
import ConnectedDevices from './ConnectedDevices';

const invitationSchema = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/), expiresAt: z.number() });
type Invitation = { kind: 'empty' } | ({ kind: 'ready' } & z.infer<typeof invitationSchema>) | { kind: 'expired' };
export default function PairDeviceDialog({
    gameId,
    open,
    onClose,
}: {
    gameId: string;
    open: boolean;
    onClose: () => void;
}) {
    const selectId = useId();
    const closeButton = useRef<HTMLButtonElement>(null);
    const disconnectButton = useRef<HTMLButtonElement>(null);
    const restoreDisconnectFocus = useRef(false);
    const { state: native } = useNativeHosting();
    const sharingOrigin = native.kind === 'ready' ? lanOrigin(native.value) : null;
    const baseOrigin = sharingOrigin || window.location.origin;
    const localOnly = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(baseOrigin).hostname);
    const networkMissing = native.kind === 'ready' && native.value.mode === 'lan' && !sharingOrigin;
    const [name, setName] = useState('');
    const [role, setRole] = useState<'player' | 'spectator'>('player');
    const [tableEditing, setTableEditing] = useState(false);
    const [invitation, setInvitation] = useState<Invitation>({ kind: 'empty' });
    const link = invitation.kind === 'ready' ? `${baseOrigin}/#pair=${invitation.token}` : '';
    const [confirmRevoke, setConfirmRevoke] = useState(false);
    const [revoked, setRevoked] = useState(false);
    const [accessChanges, setAccessChanges] = useState(0);
    const { pending, error, run, cancel } = useDialogRequest(open, closeButton);
    useEffect(() => {
        if (!restoreDisconnectFocus.current) return;
        restoreDisconnectFocus.current = false;
        const target = disconnectButton.current;
        if (open && !confirmRevoke && target && document.activeElement?.contains(target)) target.focus();
    }, [open, confirmRevoke]);
    useEffect(() => {
        setInvitation({ kind: 'empty' });
        setRevoked(false);
        setConfirmRevoke(false);
    }, [open, name, role, tableEditing, baseOrigin]);
    useEffect(() => {
        if (!open || invitation.kind !== 'ready') return;
        let timer: ReturnType<typeof setTimeout>;
        const check = () => {
            clearTimeout(timer);
            const remaining = invitation.expiresAt - Date.now();
            if (remaining <= 0) {
                setInvitation(current => current === invitation ? { kind: 'expired' } : current);
            } else {
                timer = setTimeout(check, remaining);
            }
        };
        check();
        window.addEventListener('focus', check);
        document.addEventListener('visibilitychange', check);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('focus', check);
            document.removeEventListener('visibilitychange', check);
        };
    }, [open, invitation]);
    useEffect(() => {
        setTableEditing(false);
    }, [open, name, role]);
    const close = () => {
        cancel();
        onClose();
    };
    const create = () =>
        run(
            signal =>
                readResponse(
                    '/api/session/invite',
                    {
                        method: 'POST',
                        signal,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(role === 'player' ? { role, gameId, playerId: name, ...(tableEditing ? { tableEditing: true } : {}) } : { role, gameId }),
                    },
                    async response => {
                        if (!response.ok) throw new Error('Could not invite this device');
                        const data: unknown = await response.json();
                        return invitationSchema.parse(data);
                    },
                ),
            issued => setInvitation({ kind: 'ready', ...issued }),
        );
    const revoke = () =>
        run(
            signal =>
                readResponse(
                    '/api/session/revoke',
                    {
                        method: 'POST',
                        signal,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ gameId }),
                    },
                    async response => {
                        if (!response.ok) throw new Error('Could not revoke access');
                        await response.json();
                    },
                ),
            () => {
                setConfirmRevoke(false);
                setInvitation({ kind: 'empty' });
                setRevoked(true);
                setAccessChanges(value => value + 1);
            },
        );
    return (
        <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
            <DialogTitle>Pair a device with game {gameId}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Typography>
                        Choose the person who will use this device. Give the invitation only to that person. It expires
                        after five minutes and works once.
                    </Typography>
                    {open && <ConnectedDevices gameId={gameId} accessChanges={accessChanges} />}
                    <TextField
                        select
                        id={selectId}
                        label="Device permission"
                        value={role}
                        disabled={pending}
                        onChange={event => setRole(event.target.value === 'spectator' ? 'spectator' : 'player')}
                    >
                        <MenuItem value="player">Player</MenuItem>
                        <MenuItem value="spectator">Spectator, read only</MenuItem>
                    </TextField>
                    {role === 'player' && (
                        <TextField
                            label="Player name"
                            value={name}
                            disabled={pending}
                            inputProps={{ maxLength: MAX_PLAYER_NAME_LENGTH }}
                            onChange={event => setName(event.target.value)}
                        />
                    )}
                    {role === 'player' && (
                        <Typography variant="body2">
                            Use an existing name to replace a lost device. Its previous access will be revoked. Assign
                            the player to a faction from the Players screen.
                        </Typography>
                    )}
                    {role === 'player' && (
                        <>
                            <FormControlLabel
                                control={<Checkbox checked={tableEditing} disabled={pending} onChange={event => setTableEditing(event.target.checked)} />}
                                label="Allow table-wide editing"
                            />
                            <Typography variant="body2">
                                This device can edit every faction's public scores, planets and strategy cards, public
                                objectives, and table turn, phase, round, speaker and agenda controls. Other players'
                                private objectives, faction assignments, game start/end, saved games and device access
                                remain restricted. Leave unchecked for ordinary player access.
                            </Typography>
                            <Typography variant="body2">
                                To remove this permission or recover a lost device, create a new invitation with the same
                                player name and the permission you want. Claiming it disconnects the previous device.
                                Disconnect paired devices below to revoke everyone's access immediately.
                            </Typography>
                        </>
                    )}
                    {error && (
                        <Alert severity="error">
                            Could not update device access. Check the connection and try again.
                        </Alert>
                    )}
                    {revoked && (
                        <Alert severity="success">
                            All paired devices have been disconnected. Create new invitations for the people who should
                            rejoin.
                        </Alert>
                    )}
                    {invitation.kind === 'expired' && (
                        <Alert severity="info">
                            This invitation has expired. Create a new invitation for the intended device.
                            Devices that already joined keep their access.
                        </Alert>
                    )}
                    {localOnly && native.kind === 'ready' && (
                        <Alert severity="info">
                            Open Wi-Fi sharing at the top of the window and start sharing on your private network. Then
                            create a new invitation here to show its phone QR code.
                        </Alert>
                    )}
                    {link && (
                        <TextField
                            label="One-use invitation link"
                            value={link}
                            InputProps={{ readOnly: true }}
                            onFocus={event => event.target.select()}
                            helperText={
                                localOnly
                                    ? 'This link works only on this PC. Turn on Wi-Fi sharing to invite phones.'
                                    : 'Scan this invitation on the intended device. It works once and expires in five minutes.'
                            }
                        />
                    )}
                    {link && !localOnly && (
                        <QRCodeSVG
                            role="img"
                            aria-label="Player invitation QR code"
                            value={link}
                            size={192}
                            marginSize={4}
                            style={{ alignSelf: 'center', maxWidth: '100%', height: 'auto' }}
                        />
                    )}
                    {networkMissing && (
                        <Alert severity="warning">
                            Choose a current network in Wi-Fi sharing before creating an invitation.
                        </Alert>
                    )}
                    {confirmRevoke ? (
                        <Alert severity="warning">
                            Disconnect every paired player and spectator and cancel unused invitations? Saved games
                            remain on this PC.
                            <Button disabled={pending} onClick={() => {
                                restoreDisconnectFocus.current = true;
                                setConfirmRevoke(false);
                            }}>
                                Keep devices connected
                            </Button>
                            <Button color="error" disabled={pending} onClick={revoke}>
                                Revoke device access
                            </Button>
                        </Alert>
                    ) : (
                        <Button ref={disconnectButton} color="error" disabled={pending} onClick={() => setConfirmRevoke(true)}>
                            Disconnect paired devices
                        </Button>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button ref={closeButton} onClick={close}>Close</Button>
                <Button
                    onClick={create}
                    disabled={pending || networkMissing || (role === 'player' && !isPlayerName(name))}
                >
                    Create invitation
                </Button>
            </DialogActions>
        </Dialog>
    );
}
