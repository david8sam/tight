import React from 'react';
import { Grid, Toolbar, Typography } from '@mui/material';

import { GameJoinStatus, Objective as ObjectiveType } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import GameInfoToolbar from '../components/GameInfoToolbar';
import Objective from '../components/Objective';
import PublicObjectives from '../components/PublicObjectives';
import useAccountInfo from '../hooks/useAccountInfo';
import useAutoNavigate from '../hooks/useAutoNavigate';

function StrategyCards() {
    const { game, gameId, player, playerId } = useAccountInfo();
    const { sendData } = useAppContext();

    useAutoNavigate({ to: `/player/${playerId}/manage-games`, condition: () => !gameId, deps: [gameId] });

    if (!game || !player || !playerId) {
        return null;
    }

    const { secretObjectives } = player;

    const onPublicObjectivesChange = (publicObjectives: ObjectiveType[]) => {
        sendData({
            type: MessageType.GAME_SET_PUBLIC_OBJECTIVES,
            data: { gameId, publicObjectives },
        });
    };

    const onSecretObjectiveChange = (objective: ObjectiveType) => {
        const so = secretObjectives[-objective.id - 1];
        so.objective = objective;
        sendData({
            type: MessageType.PLAYER_SET_SECRET_OBJECTIVE,
            data: {
                gameId,
                playerId,
                secretObjectives,
            },
        });
    };

    const isPlayer = player.joinStatus === GameJoinStatus.PLAYER;
    const editable = player.joinStatus !== GameJoinStatus.SPECTATOR;

    return (
        <Grid container direction="column">
            <GameInfoToolbar game={game} />
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
                            <Typography variant="h6">My Secret Objectives</Typography>
                        </Grid>
                    </Toolbar>
                    <Grid item>
                        {secretObjectives.map(so => (
                            <Objective
                                key={so.objective.id}
                                editable={editable}
                                objective={so.objective}
                                onChange={onSecretObjectiveChange}
                            />
                        ))}
                    </Grid>
                </>
            )}
        </Grid>
    );
}

export default StrategyCards;
