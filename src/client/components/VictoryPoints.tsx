import React from 'react';

import { Container, Grid, Theme, Typography } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { makeStyles, useTheme } from '@material-ui/styles';

import { calculateVictoryPoints, Objective } from 'common/Game';
import { MessageType } from 'common/message';

import useAccountInfo from '../hooks/useAccountInfo';
import { useAppContext } from '../Context';

import { Accordion, AccordionDetails, AccordionSummary } from './Accordion';
import ObjectiveCheckbox from './ObjectiveCheckbox';
import VictoryPointsExtra from './VictoryPointsExtra';

const useStyles = makeStyles((theme: Theme) => ({
    grid: {
        width: 'auto',
    },
    iconButton: {
        padding: theme.spacing(0.5),
    },
    details: {
        padding: `0px ${theme.spacing()}px`,
    },
}));

interface VictoryPointsProps {
    playerId: string;
    allowShowSecret?: boolean;
    disabled?: boolean;
}

function VictoryPoints(props: VictoryPointsProps) {
    const theme = useTheme<Theme>();
    const classes = useStyles(props);
    const { playerId, allowShowSecret = false, disabled = false } = props;
    const { sendData } = useAppContext();
    const { game, gameId, playerId: currentPlayerId } = useAccountInfo();

    if (!game) {
        return null;
    }

    const player = game.players[playerId];
    const { publicObjectives: gamePOs } = game;
    const { color: playerColor, publicObjectives, secretObjective } = player;

    const pc = playerColor || '#fff';
    const color = theme.palette.getContrastText(pc);
    const backgroundColor = pc;

    const onPublicObjectiveCheck = (id: number, cleared: boolean) => {
        const newPublicObjectives = [...publicObjectives];
        newPublicObjectives[id - 1] = cleared;
        sendData({
            type: MessageType.PLAYER_SET_PUBLIC_OBJECTIVES,
            data: { gameId, playerId, publicObjectives: newPublicObjectives },
        });
    };

    const onPublicObjectiveSave = (objective: Objective) => {
        const index = gamePOs.findIndex(po => po.id === objective.id);
        const newPublicObjectives = [...gamePOs];
        newPublicObjectives[index] = { ...newPublicObjectives[index], ...objective };
        sendData({
            type: MessageType.GAME_SET_PUBLIC_OBJECTIVES,
            data: { gameId, publicObjectives: newPublicObjectives },
        });
    };

    const onSecretObjectiveCheck = (id: number, cleared: boolean) => {
        sendData({
            type: MessageType.PLAYER_SET_SECRET_OBJECTIVE,
            data: { gameId, playerId, secretObjective: { ...secretObjective, cleared } },
        });
    };

    const onSecretObjectiveSave = (objective: Objective) => {
        const originalObjective = secretObjective.objective;
        sendData({
            type: MessageType.PLAYER_SET_SECRET_OBJECTIVE,
            data: {
                gameId,
                playerId,
                secretObjective: { ...secretObjective, objective: { ...originalObjective, ...objective } },
            },
        });
    };

    const isCurrentPlayer = Boolean(playerId && currentPlayerId && playerId === currentPlayerId);
    const totalvp = calculateVictoryPoints(game, playerId);

    return (
        <Accordion disableMargin>
            <AccordionSummary disableMargin expandIcon={<ExpandMoreIcon />}>
                <Typography>{`${totalvp} Victory Points`}</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
                <Grid container justifyContent="flex-start" alignItems="center" classes={{ root: classes.grid }}>
                    {gamePOs.map(po => (
                        <ObjectiveCheckbox
                            key={po.id}
                            color={color}
                            backgroundColor={backgroundColor}
                            checked={publicObjectives[po.id - 1] ?? false}
                            editable
                            disabled={disabled}
                            objective={po}
                            onChange={onPublicObjectiveCheck}
                            onSave={onPublicObjectiveSave}
                        />
                    ))}
                    <ObjectiveCheckbox
                        color={color}
                        backgroundColor={backgroundColor}
                        editable
                        disabled={disabled}
                        allowShowSecret={allowShowSecret || isCurrentPlayer}
                        objective={secretObjective.objective}
                        checked={secretObjective.cleared}
                        onChange={onSecretObjectiveCheck}
                        onSave={onSecretObjectiveSave}
                    />
                    <VictoryPointsExtra playerId={playerId} disabled={disabled} />
                </Grid>
            </AccordionDetails>
        </Accordion>
    );
}

export default VictoryPoints;
