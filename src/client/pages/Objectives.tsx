import React from 'react';
import { Grid, Toolbar, Typography } from '@material-ui/core';

import { GameJoinStatus, Objective as ObjectiveType } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import Objective from '../components/Objective';
import PublicObjectives from '../components/PublicObjectives';
import useAccountInfo from '../hooks/useAccountInfo';

function StrategyCards() {
    const { game, gameId, player, playerId } = useAccountInfo();
    const { sendData } = useAppContext();

    if (!game || !player || !playerId) {
        return null;
    }

    const { secretObjective } = player;

    const onPublicObjectivesChange = (publicObjectives: ObjectiveType[]) => {
        sendData({
            type: MessageType.GAME_SET_PUBLIC_OBJECTIVES,
            data: { gameId, publicObjectives },
        });
    };

    const onSecretObjectiveChange = (objective: ObjectiveType) => {
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

    const isPlayer = player.joinStatus === GameJoinStatus.PLAYER;
    const editable = player.joinStatus !== GameJoinStatus.SPECTATOR;

    return (
        <Grid container direction="column">
            <Toolbar>
                <Grid container justifyContent="center">
                    <Typography variant="h6">Public Objectives</Typography>
                </Grid>
            </Toolbar>
            <Grid item>
                <PublicObjectives
                    editable={editable}
                    publicObjectives={game.publicObjectives}
                    onChange={onPublicObjectivesChange}
                    showPlayers
                />
            </Grid>
            {/* Only players have a secret objective */}
            {isPlayer && (
                <>
                    <Toolbar>
                        <Grid container justifyContent="center">
                            <Typography variant="h6">My Secret Objective</Typography>
                        </Grid>
                    </Toolbar>
                    <Grid item>
                        <Objective
                            editable={editable}
                            objective={secretObjective.objective}
                            onChange={onSecretObjectiveChange}
                        />
                    </Grid>
                </>
            )}
        </Grid>
    );
}

export default StrategyCards;
