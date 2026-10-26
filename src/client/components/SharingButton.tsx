import React, { useId, useEffect, useRef, useState } from 'react';
import {
    Alert,
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
import { QRCodeSVG } from 'qrcode.react';
import { lanOrigin } from 'common/hosting';
import { useNativeHosting } from '../NativeHosting';

export default function SharingButton() {
    const selectId = useId();
    const { state, pending, refresh, change } = useNativeHosting();
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState('');
    const [error, setError] = useState(false);
    const requestFocus = useRef<HTMLElement | null>(null);
    const closeButton = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (pending) return;
        const opener = requestFocus.current;
        requestFocus.current = null;
        const target = opener?.isConnected ? opener : closeButton.current;
        const focused = document.activeElement;
        if (open && opener && target && focused !== target && focused?.contains(target)) target.focus();
    }, [open, pending]);
    useEffect(() => {
        if (state.kind === 'ready' && selected && !state.value.interfaces.some(adapter => adapter.address === selected))
            setSelected('');
    }, [state, selected]);
    if (state.kind === 'browser') return null;
    const hosting = state.kind === 'ready' ? state.value : null;
    const origin = hosting ? lanOrigin(hosting) : null;
    const apply = async (address: string | null) => {
        if (pending) return;
        const opener = document.activeElement;
        requestFocus.current = opener instanceof HTMLElement ? opener : null;
        setError(false);
        try {
            await change(address);
        } catch {
            setError(true);
        }
    };
    return (
        <>
            <Button
                color="inherit"
                sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                onClick={() => {
                    setError(false);
                    setOpen(true);
                }}
            >
                Wi-Fi sharing
            </Button>
            <Dialog open={open} onClose={() => !pending && setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Share TIGHT over Wi-Fi</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Typography>
                            Connect this PC and the players' phones to the same trusted private Wi-Fi network.
                        </Typography>
                        {(state.kind === 'failed' || error) && (
                            <Alert severity="error">
                                Could not update Wi-Fi sharing. Refresh networks and try again. If that address is busy,
                                choose another network or restart TIGHT.
                            </Alert>
                        )}
                        {hosting?.restoreError && (
                            <Alert severity="warning">
                                {hosting.restoreError === 'unavailable'
                                    ? 'Your previously shared network is no longer available. Choose a current network below to resume sharing.'
                                    : 'Wi-Fi sharing could not resume. Choose a current network below and start sharing again.'}
                            </Alert>
                        )}
                        {hosting && (
                            <>
                                <Typography>
                                    {hosting.mode === 'lan'
                                        ? 'Wi-Fi sharing is on. Your game continues in this window.'
                                        : 'Local only. Other devices cannot connect yet.'}
                                </Typography>
                                {!hosting.interfaces.length && (
                                    <Alert severity="info">
                                        No private network was found. Connect to Wi-Fi or Ethernet, then refresh
                                        networks.
                                    </Alert>
                                )}
                                <TextField
                                    select
                                    id={selectId}
                                    label="Wi-Fi or Ethernet network"
                                    value={selected}
                                    disabled={pending}
                                    onChange={event => setSelected(event.target.value)}
                                >
                                    <MenuItem value="">Choose a network</MenuItem>
                                    {hosting.interfaces.map(adapter => (
                                        <MenuItem key={adapter.address} value={adapter.address}>
                                            {adapter.name} ({adapter.address})
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <Button
                                    disabled={!selected}
                                    aria-disabled={pending || !selected}
                                    aria-busy={pending}
                                    sx={{ '&[aria-disabled="true"]': { color: 'action.disabled', bgcolor: 'action.disabledBackground' } }}
                                    variant="contained"
                                    onClick={() => { if (selected) void apply(selected); }}
                                >
                                    Start sharing on this network
                                </Button>
                                {hosting.mode === 'lan' && (
                                    <Button
                                        aria-disabled={pending}
                                        aria-busy={pending}
                                        sx={{ '&[aria-disabled="true"]': { color: 'action.disabled' } }}
                                        color="error"
                                        onClick={() => void apply(null)}
                                    >
                                        Stop Wi-Fi sharing
                                    </Button>
                                )}
                                {hosting.mode === 'lan' &&
                                    !hosting.interfaces.some(adapter => adapter.address === hosting.address) && (
                                        <Alert severity="warning">
                                            The shared network address changed. Choose a current network and start
                                            sharing again.
                                        </Alert>
                                    )}
                                {origin && (
                                    <>
                                        <TextField
                                            label="Lobby address"
                                            value={origin}
                                            InputProps={{ readOnly: true }}
                                            onFocus={event => event.target.select()}
                                        />
                                        <QRCodeSVG
                                            role="img"
                                            aria-label="Wi-Fi lobby QR code"
                                            value={`${origin}/`}
                                            size={192}
                                            marginSize={4}
                                            style={{ alignSelf: 'center', maxWidth: '100%', height: 'auto' }}
                                        />
                                        <Typography>
                                            Already-paired devices can scan this code to reconnect. For a new device,
                                            open your game and choose "Pair a device" to create its private invitation.
                                        </Typography>
                                    </>
                                )}
                                <Typography variant="body2">
                                    If Windows Firewall asks, allow TIGHT on Private networks. Keep TIGHT open while
                                    people play. No router settings are needed.
                                </Typography>
                            </>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button disabled={pending} onClick={() => void refresh()}>
                        Refresh networks
                    </Button>
                    <Button
                        ref={closeButton}
                        aria-disabled={pending}
                        sx={{ '&[aria-disabled="true"]': { color: 'action.disabled' } }}
                        onClick={() => { if (!pending) setOpen(false); }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
