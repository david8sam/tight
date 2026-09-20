import { Grid, MenuItem, TextField, Toolbar, Typography } from '@mui/material';
import React, { useMemo, useState } from 'react';

import { Objective as ObjectiveType, isPlayerSpectator } from 'common/Game';
import { MessageType } from 'common/message';

import GameInfoToolbar from '../components/GameInfoToolbar';
import Objective from '../components/Objective';
import PublicObjectives from '../components/PublicObjectives';
import useAutoNavigate from '../hooks/useAutoNavigate';
import useGameInfo from '../hooks/useGameInfo';

import { useAppContext } from '../Context';

function StrategyCards() {
    const { game, gameId, playerId } = useGameInfo();
    const { sendData } = useAppContext();
    const [factionName, setFactionName] = useState(() => {
        const faction = playerId && game ? game.factions.find(f => f.playerIds.includes(playerId)) : null;
        return faction?.name || '';
    });

    const factionNameOptions = useMemo(() => {
        const factionsArray = playerId && game ? game.factions.filter(f => f.playerIds.includes(playerId)) : [];
        return factionsArray.map(f => f.name);
    }, [game, playerId]);

    useAutoNavigate({ to: '/', condition: () => !game || !playerId, deps: [game, playerId] });

    if (!game || !playerId) {
        return null;
    }

    const { factions } = game;
    const faction = factions.find(f => f.name === factionName);
    const { secretObjectives } = faction || {};

    const onPublicObjectivesChange = (publicObjectives: ObjectiveType[]) => {
        sendData({
            type: MessageType.GAME_SET_PUBLIC_OBJECTIVES,
            data: { gameId, publicObjectives },
        });
    };

    const onSecretObjectiveChange = (objective: ObjectiveType) => {
        if (!secretObjectives || !factionName) {
            return;
        }

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

    const isPlayer = !isPlayerSpectator(game, playerId);

    return (
        <Grid container direction="column">
            <GameInfoToolbar game={game} />
            <Grid item>
                <PublicObjectives
                    editable={isPlayer}
                    publicObjectives={game.publicObjectives}
                    onChange={onPublicObjectivesChange}
                    showFactions
                />
            </Grid>
            {/* Only players have a secret objective */}
            {isPlayer && (
                <>
                    <Toolbar>
                        <Grid container justifyContent="center">
                            <TextField
                                sx={{ marginTop: 2 }}
                                fullWidth
                                select
                                label="My Secret Objectives"
                                value={factionName}
                                onChange={e => setFactionName(e.target.value)}
                            >
                                {factionNameOptions.map(name => (
                                    <MenuItem key={name} value={name}>
                                        {name}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <Typography>Other players cannot read these until the end of the game</Typography>
                        </Grid>
                    </Toolbar>
                    <Grid item>
                        {secretObjectives?.map(so => (
                            <Objective
                                key={so.objective.id}
                                editable={isPlayer}
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
