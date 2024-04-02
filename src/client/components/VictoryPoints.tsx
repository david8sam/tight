import React from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AccordionProps, Grid, Typography, useTheme } from '@mui/material';

import { calculateVictoryPoints, Objective } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';

import { Accordion, AccordionDetails, AccordionSummary } from './Accordion';
import ObjectiveCheckbox from './ObjectiveCheckbox';
import VictoryPointsExtra from './VictoryPointsExtra';

interface VictoryPointsProps {
    AccordionProps?: Partial<AccordionProps>;
    allowShowSecret?: boolean;
    disabled?: boolean;
    hideExtraVp?: boolean;
    factionName: string;
}

function VictoryPoints(props: VictoryPointsProps) {
    const theme = useTheme();
    // const classes = useStyles(props);
    const { factionName, allowShowSecret = false, disabled = false, AccordionProps, hideExtraVp } = props;
    const { sendData } = useAppContext();
    const { game, gameId, playerId } = useGameInfo();

    const faction = game?.factions.find(f => f.name === factionName);
    if (!game || !faction) {
        return null;
    }

    const { publicObjectives: gamePOs, status } = game;
    const { color: factionColor, publicObjectives, secretObjectives } = faction;

    const pc = factionColor || '#fff';
    const color = theme.palette.getContrastText(pc);
    const backgroundColor = pc;

    const onPublicObjectiveCheck = (id: number, cleared: boolean) => {
        const newPublicObjectives = [...publicObjectives];
        newPublicObjectives[id - 1] = cleared;
        sendData({
            type: MessageType.SET_PUBLIC_OBJECTIVES,
            data: { gameId, factionName, publicObjectives: newPublicObjectives },
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
        const so = secretObjectives[-id - 1];
        so.cleared = cleared;
        sendData({
            type: MessageType.SET_SECRET_OBJECTIVE,
            data: { gameId, factionName, secretObjectives },
        });
    };

    const onSecretObjectiveSave = (objective: Objective) => {
        const so = secretObjectives[-objective.id - 1];
        so.objective = objective;
        sendData({
            type: MessageType.SET_SECRET_OBJECTIVE,
            data: {
                gameId,
                factionName,
                secretObjectives,
            },
        });
    };

    const isCurrentFaction = playerId ? faction.playerIds.includes(playerId) : false;
    const totalvp = calculateVictoryPoints(game, factionName);

    return (
        <Accordion disableMargin {...AccordionProps}>
            <AccordionSummary disableMargin expandIcon={<ExpandMoreIcon />}>
                <Typography>{`${totalvp} Victory Points`}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ padding: `0px ${theme.spacing()}` }}>
                <Grid container justifyContent="flex-start" alignItems="center" sx={{ width: 'auto' }}>
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
                    {secretObjectives.map(so => (
                        <ObjectiveCheckbox
                            key={so.objective.id}
                            color={color}
                            backgroundColor={backgroundColor}
                            editable
                            disabled={disabled}
                            allowShowSecret={allowShowSecret || isCurrentFaction || so.cleared || status.ended}
                            objective={so.objective}
                            checked={so.cleared}
                            onChange={onSecretObjectiveCheck}
                            onSave={onSecretObjectiveSave}
                        />
                    ))}
                    {!hideExtraVp && <VictoryPointsExtra factionName={factionName} disabled={disabled} />}
                </Grid>
            </AccordionDetails>
        </Accordion>
    );
}

export default VictoryPoints;
