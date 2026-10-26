import React, { useRef, useState } from 'react';

import InfoIcon from '@mui/icons-material/Info';
import {
    Button,
    Grid,
    IconButton,
    IconButtonProps,
    Popover,
    Toolbar,
    ToolbarProps,
    Tooltip,
    Typography,
} from '@mui/material';

import { GameClientData } from 'common/Game';

import GameSummary from './GameSummary';
import RestartGameDialog from './RestartGameDialog';
import PairDeviceDialog from './PairDeviceDialog';
import { useSession } from '../SessionGate';

export interface GameInfoToolbarProps extends ToolbarProps {
    game: GameClientData;
    onInfoClick?: IconButtonProps['onClick'];
    hideRestartButton?: boolean;
    hidePairButton?: boolean;
}

export default function GameInfoToolbar(props: GameInfoToolbarProps) {
    const { game, onInfoClick, hideRestartButton: requestedHideRestart, hidePairButton, ...toolbarProps } = props;
    const isHost = useSession().role === 'host';
    const hideRestartButton = requestedHideRestart || !isHost;
    const [pairOpen, setPairOpen] = useState(false);
    const { status } = game;

    const [restartDialogOpen, setRestartDialogOpen] = useState(false);

    const [infoOpen, setInfoOpen] = useState(false);
    const infoRef = useRef<HTMLButtonElement>(null);

    const { started, round } = status;

    const onInfoButtonClick: IconButtonProps['onClick'] = e => {
        setInfoOpen(true);
        if (onInfoClick) {
            onInfoClick(e);
        }
    };

    const onRestartGameClick = () => {
        setRestartDialogOpen(true);
        setInfoOpen(false);
    };

    const onRestartGameDialogClose = () => {
        setRestartDialogOpen(false);
        setInfoOpen(false);
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
                    <Grid item sx={{ width: '30%' }}>
                        <Typography variant="h6" align="right">{`Round: ${round}`}</Typography>
                    </Grid>
                )}
            </Grid>
            {isHost && !hidePairButton && <Button onClick={() => setPairOpen(true)}>Pair a device</Button>}
            {isHost && !hidePairButton && (
                <PairDeviceDialog open={pairOpen} gameId={game.id} onClose={() => setPairOpen(false)} />
            )}
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
                slotProps={{ paper: { sx: { padding: 2, borderRadius: 1 } } }}
            >
                <GameSummary />
                {hideRestartButton ? null : (
                    <>
                        <Toolbar />
                        <Button fullWidth color="error" variant="contained" onClick={onRestartGameClick}>
                            Restart Game...
                        </Button>
                    </>
                )}
            </Popover>
            {hideRestartButton ? null : (
                <RestartGameDialog open={restartDialogOpen} onClose={onRestartGameDialogClose} />
            )}
        </Toolbar>
    );
}
