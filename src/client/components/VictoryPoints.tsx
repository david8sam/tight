import React from 'react';

import { Grid, Tooltip, IconButton, Theme, Typography } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import MinusIcon from '@material-ui/icons/Remove';
import { makeStyles } from '@material-ui/styles';

import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';
import { MessageType } from 'common/message';

const useStyles = makeStyles((theme: Theme) => ({
    grid: {
        width: 'auto',
    },
    iconButton: {
        padding: theme.spacing(0.5),
    },
}));

interface VictoryPointsProps {
    playerId: string;
}

function VictoryPoints(props: VictoryPointsProps) {
    const classes = useStyles(props);
    const { playerId } = props;
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
                        disabled={victoryPoints < 1}
                        onClick={() => onVictoryPointsChange(victoryPoints - 1)}
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
                <IconButton
                    classes={{ root: classes.iconButton }}
                    onClick={() => onVictoryPointsChange(victoryPoints + 1)}
                >
                    <AddIcon></AddIcon>
                </IconButton>
            </Tooltip>
        </Grid>
    );
}

export default VictoryPoints;
