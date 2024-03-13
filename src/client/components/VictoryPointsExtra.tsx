import React from 'react';

import AddIcon from '@mui/icons-material/Add';
import MinusIcon from '@mui/icons-material/Remove';
import { Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { MessageType } from 'common/message';
import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';

const useStyles = makeStyles(theme => ({
    grid: {
        width: 'auto',
    },
    iconButton: {
        padding: theme.spacing(0.5),
    },
}));

interface VictoryPointsExtraProps {
    playerId: string;
    disabled?: boolean;
}

function VictoryPointsExtra(props: VictoryPointsExtraProps) {
    const classes = useStyles(props);
    const { playerId, disabled = false } = props;
    const { sendData } = useAppContext();
    const { game, gameId } = useAccountInfo();

    if (!game) {
        return null;
    }

    const player = game.players[playerId];
    const { victoryPoints } = player;

    const onVictoryPointsChange = (victoryPoints: number) => {
        sendData({ type: MessageType.PLAYER_SET_VICTORY_POINTS, data: { gameId, playerId, victoryPoints } });
    };

    return (
        <Grid container justifyContent="center" alignItems="center" classes={{ root: classes.grid }}>
            <Tooltip title="Minus VP">
                <span>
                    <IconButton
                        classes={{ root: classes.iconButton }}
                        disabled={disabled || victoryPoints < 1}
                        onClick={() => onVictoryPointsChange(victoryPoints - 1)}
                        size="large"
                    >
                        <MinusIcon />
                    </IconButton>
                </span>
            </Tooltip>
            <Grid
                container
                direction="column"
                justifyContent="center"
                alignItems="center"
                classes={{ root: classes.grid }}
            >
                <Typography>{`${victoryPoints} VP`}</Typography>
            </Grid>
            <Tooltip title="Add VP">
                <span>
                    <IconButton
                        classes={{ root: classes.iconButton }}
                        onClick={() => onVictoryPointsChange(victoryPoints + 1)}
                        disabled={disabled}
                        size="large"
                    >
                        <AddIcon />
                    </IconButton>
                </span>
            </Tooltip>
        </Grid>
    );
}

export default VictoryPointsExtra;
