import React from 'react';

import { Button, Checkbox, FormControlLabel, FormGroup, Grid, Switch, Toolbar } from '@material-ui/core';

import { useAppContext } from '../Context';
import useAccountInfo from '../hooks/useAccountInfo';
import { MessageType } from 'common/message';

export default function AgendaPhase() {
    const { sendData } = useAppContext();
    const { game, gameId } = useAccountInfo();
    if (!game) {
        return null;
    }

    const onRefreshAll = () => {
        const players = Object.values(game.players);
        players.forEach(p => {
            const { id: playerId, planets } = p;
            sendData({ type: MessageType.PLAYER_REFRESH_PLANET, data: { gameId, playerId, planets } });
        });
    };

    const onCustodiansRemoved = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const data: Record<string, unknown> = { gameId, custodiansRemoved: e.target.checked };
        if (!e.target.checked) {
            data.agenda1Voted = false;
            data.agenda2Voted = false;
        }

        sendData({ type: MessageType.GAME_SET_CUSTODIANS_REMOVED, data });
    };

    const onAgendaVoted = (e: React.ChangeEvent<HTMLInputElement>, first: boolean): void => {
        const data: Record<string, unknown> = { gameId };
        if (first) {
            data.agenda1Voted = e.target.checked;
            if (!e.target.checked) {
                data.agenda2Voted = false;
            }
        } else {
            data.agenda2Voted = e.target.checked;
        }
        sendData({ type: MessageType.GAME_SET_AGENDA_VOTED, data });
    };

    const {
        status: { custodiansRemoved, agenda1Voted, agenda2Voted },
    } = game;

    return (
        <Grid container direction="column">
            <Toolbar>
                <FormControlLabel
                    control={<Switch checked={custodiansRemoved} onChange={onCustodiansRemoved} color="primary" />}
                    label={custodiansRemoved ? 'Mecatol Rex Custodians Removed' : 'Mecatol Rex Custodians Remain'}
                />
            </Toolbar>
            <Toolbar>
                <FormGroup>
                    <FormControlLabel
                        disabled={!custodiansRemoved}
                        control={
                            <Checkbox checked={agenda1Voted} onChange={e => onAgendaVoted(e, true)} color="primary" />
                        }
                        label="First Agenda"
                    />
                    <FormControlLabel
                        disabled={!agenda1Voted}
                        control={
                            <Checkbox checked={agenda2Voted} onChange={e => onAgendaVoted(e, false)} color="primary" />
                        }
                        label="Second Agenda"
                    />
                </FormGroup>
            </Toolbar>
            <Toolbar />
            <Toolbar>
                <Button color="primary" variant="contained" fullWidth onClick={() => onRefreshAll()}>
                    Refresh Everyone's Planets
                </Button>
            </Toolbar>
        </Grid>
    );
}
