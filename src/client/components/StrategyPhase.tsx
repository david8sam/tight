import React, { MouseEvent, useState } from 'react';

import { Grid } from '@material-ui/core';

import { StrategyCard as StrategyCardType, StrategyCardIndex } from 'common/Game';
import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import StrategyCard from '../components/StrategyCard';
import useAccountInfo from '../hooks/useAccountInfo';

function StrategyPhase(props: object) {
    const { state, sendData } = useAppContext();
    const { strategyCards } = state;

    const { game, gameId, player, playerId } = useAccountInfo();
    if (!game || !player) {
        return null;
    }

    const { status } = game;
    const { pickOrder, pickTurn } = status;
    const picker = pickOrder[pickTurn];

    const playersArray = Object.values(game.players);
    const stratCardOwners: string[] = [''];
    playersArray.forEach(p => (p.strategyCard ? (stratCardOwners[p.strategyCard] = p.name) : null));

    const onTakeCardClick = (e: MouseEvent<HTMLButtonElement>, strategyCard: StrategyCardIndex) => {
        e.stopPropagation();

        const take = stratCardOwners[strategyCard] !== playerId;
        const type = take ? MessageType.PLAYER_TAKE_STRATEGY_CARD : MessageType.PLAYER_RETURN_STRATEGY_CARD;

        sendData({ type, data: { gameId, playerId, strategyCard } });
    };

    return (
        <Grid container direction="column">
            {strategyCards.map((card?: StrategyCardType) => {
                if (!card) {
                    return null;
                }

                const { initiative, name } = card;
                const cardOwner = stratCardOwners[initiative];

                const buttonLabel = cardOwner === playerId ? 'Return' : cardOwner || 'Take';
                const ButtonProps = {
                    disabled:
                        (Boolean(player.strategyCard) && cardOwner !== playerId) ||
                        (Boolean(cardOwner) && cardOwner !== playerId),
                    onClick: (e: MouseEvent<HTMLButtonElement>) => onTakeCardClick(e, initiative),
                };

                return <StrategyCard key={name} card={card} ButtonProps={ButtonProps} buttonLabel={buttonLabel} />;
            })}
        </Grid>
    );
}

export default StrategyPhase;
