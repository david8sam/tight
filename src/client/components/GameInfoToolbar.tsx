import React, { useRef, useState } from 'react';

import InfoIcon from '@mui/icons-material/Info';
import { Grid, IconButton, IconButtonProps, Popover, Toolbar, ToolbarProps, Tooltip, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { GameClientData } from 'common/Game';

import GameSummary from './GameSummary';

const useStyle = makeStyles(theme => ({
    infoPaper: {
        padding: theme.spacing(2),
        borderRadius: theme.spacing(),
    },
}));

export interface GameInfoToolbarProps extends ToolbarProps {
    game: GameClientData;
    onInfoClick?: IconButtonProps['onClick'];
}

export default function GameInfoToolbar(props: GameInfoToolbarProps) {
    const classes = useStyle(props);

    const { game, onInfoClick, ...toolbarProps } = props;
    const { status } = game;

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
                    <Grid item sx={{ width: '30%' }}>
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
                slotProps={{ paper: { sx: { padding: 2, borderRadius: 1 } } }}
            >
                <GameSummary />
            </Popover>
        </Toolbar>
    );
}
