import { isNil } from 'lodash-es';

import {
    buildStrategyCardOwners,
    getNextFaction,
    getFactionOrder,
    Phase,
    strategyCardHasOwner,
    StrategyCardIndex,
    Game,
} from 'common/Game.js';
import { MessageType } from 'common/message.js';

import * as GameDB from './database/game.js';
import * as PlanetDB from './database/planet/index.js';

import { formatChangePlanets, markGameDirty } from './dirty.js';
import { logWS } from './log.js';
import { WebSocketServer, WebSocket, getWebSocketLogId } from './WebSocket.js';

function addPlayer(ws: WebSocket, game: Game, playerId: string | null, factionName?: string | null) {
    if (!playerId) {
        return;
    }

    ws.playerId = playerId;

    let players = false;
    let factions = false;

    if (!game.players[playerId]) {
        game.players[playerId] = { id: playerId };
        players = true;
    }

    const faction = game.factions.find(f => f.name === factionName);
    if (faction && !faction?.playerIds.includes(playerId)) {
        faction.playerIds.push(playerId);
        faction.playerIds.sort();
        factions = true;
    }

    markGameDirty(game.id, { factions, players });
}

export interface handleMessageParams {
    wss: WebSocketServer;
    ws: WebSocket;
    message: string;
}

// TODO: Organize better.
// Handle all messages to the WebSocket server.
export default function handleMessage({ wss, ws, message }: handleMessageParams) {
    if (!message) {
        return;
    }

    const payload = JSON.parse(message);
    const { type = null, data = null } = payload || {};
    const { gameId = null, factionName = null, ...otherData } = data || {};

    logWS(false, getWebSocketLogId(ws), payload);

    // Following actions require a game
    const game = GameDB.getGame(gameId);
    if (!game) {
        return;
    }

    switch (type) {
        case MessageType.GAME_LOAD: {
            ws.gameId = gameId;
            markGameDirty(gameId, { created: true });

            const { playerId } = otherData;
            if (playerId) {
                addPlayer(ws, game, playerId, factionName);
            }
            break;
        }

        case MessageType.GAME_ADD_PLAYER: {
            const { playerId } = otherData;
            if (playerId) {
                addPlayer(ws, game, playerId, factionName);
            }
            break;
        }

        case MessageType.GAME_UPDATE_FACTION: {
            const { order, ...factionData } = otherData;
            const { numPlayers } = game;
            if (order < numPlayers) {
                GameDB.updateFaction({ gameId, order, ...factionData });
                markGameDirty(gameId, { factions: true });
            }
            break;
        }

        case MessageType.GAME_REORDER_FACTION: {
            if (GameDB.reorderFaction({ gameId, ...otherData })) {
                markGameDirty(gameId, { factions: true, status: true });
            }
            break;
        }

        case MessageType.START_GAME:
            // Initialize players with their home planets.
            game.factions.forEach(faction => {
                if (!faction) {
                    return;
                }

                const factionPlanets = PlanetDB.getFactionPlanets(faction.name);
                faction.planets = factionPlanets.map(f => f.name);
                factionPlanets.forEach(f => {
                    const gamePlanet = game.planets[f.name];
                    gamePlanet.owner = faction.name;

                    // Make sure home planets are refreshed.
                    gamePlanet.refreshed = true;
                });
            });

            game.status.started = true;
            markGameDirty(gameId);
            break;
        case MessageType.STOP_GAME:
            game.status.started = false;
            markGameDirty(gameId, { status: true });
            break;
        case MessageType.END_GAME:
            game.status.ended = data.ended ?? true;
            markGameDirty(gameId, { status: true });
            break;

        case MessageType.GAME_SET_PUBLIC_OBJECTIVES:
            game.publicObjectives = data.publicObjectives;
            markGameDirty(gameId, { publicObjectives: true });
            break;

        case MessageType.GAME_STATUS_SET: {
            const { phase, turn, pickOrder, pickTurn } = data;
            const { status } = game;

            status.phase = !isNil(phase) ? phase : status.phase;
            status.turn = !isNil(turn) ? turn : status.turn;

            status.pickTurn = !isNil(pickTurn) ? pickTurn : status.pickTurn;
            if (status.pickTurn > status.pickOrder.length - 1) {
                status.pickTurn = 0;
            }

            if (pickOrder) {
                status.pickOrder = pickOrder;
                status.speaker = pickOrder[0];
            }

            markGameDirty(gameId, { status: true });

            break;
        }

        case MessageType.GAME_SET_SPEAKER: {
            const { status } = game;
            status.speaker = data.speaker;
            status.pickTurn = 0;

            // Rotate pick order to start with speaker if necessary
            if (status.pickOrder[0] !== status.speaker) {
                const speakerIndex = status.pickOrder.indexOf(status.speaker);
                const preSpeaker = status.pickOrder.slice(0, speakerIndex);
                const postSpeaker = status.pickOrder.slice(speakerIndex);
                status.pickOrder = [...postSpeaker, ...preSpeaker];
            }

            markGameDirty(gameId, { status: true });

            break;
        }

        case MessageType.GAME_SET_CUSTODIANS_REMOVED: {
            const { status } = game;
            status.custodiansRemoved = data.custodiansRemoved;
            status.agenda1Voted = data.agenda1Voted ?? status.agenda1Voted;
            status.agenda2Voted = data.agenda2Voted ?? status.agenda2Voted;
            markGameDirty(gameId, { status: true });
            break;
        }

        case MessageType.GAME_SET_AGENDA_VOTED: {
            const { status } = game;
            status.agenda1Voted = data.agenda1Voted ?? status.agenda1Voted;
            status.agenda2Voted = data.agenda2Voted ?? status.agenda2Voted;
            markGameDirty(gameId, { status: true });
            break;
        }

        case MessageType.GAME_NEXT_ROUND: {
            if (game.status.round < 10) {
                Object.values(game.factions).forEach(f => {
                    f.strategyCard = StrategyCardIndex.NONE;
                    f.strategyCardTaken = false;
                    f.stragetyCardFlipped = false;
                    f.passed = false;
                    f.hasNaaluZeroToken = f.name === 'The Naalu Collective';
                });

                game.status.pickTurn = 0;
                game.status.turn = StrategyCardIndex.NONE;
                game.status.round += 1;
                game.status.phase = Phase.STRATEGY;
                game.status.agenda1Voted = false;
                game.status.agenda2Voted = false;

                markGameDirty(gameId, { factions: true, status: true });
            }
            break;
        }

        case MessageType.UPDATE_PLANET: {
            const { planetId, modifiers } = data || {};
            const [planet] = planetId ? GameDB.getPlanetsArray(gameId, planetId) : [];
            if (planet) {
                planet.modifiers = modifiers;
                markGameDirty(gameId, { planets: [planetId] });
            }
        }

        default:
            break;
    }

    // Following actions require a faction
    const factions = game.factions;
    const faction = factions.find(f => f.name === factionName);
    if (!faction) {
        return;
    }

    switch (type) {
        case MessageType.TAKE_NAALU_ZERO_TOKEN:
            const changedFactionNames = [factionName];
            game.factions.forEach(f => {
                if (f.hasNaaluZeroToken) {
                    f.hasNaaluZeroToken = false;
                    changedFactionNames.push(f.name);
                }
            });
            faction.hasNaaluZeroToken = true;
            game.status.turn = faction.strategyCard;
            markGameDirty(gameId, { status: true, factions: changedFactionNames });
            break;

        // Strategy Card actions
        case MessageType.TAKE_STRATEGY_CARD: {
            const owners = buildStrategyCardOwners(game);
            if (owners[data.strategyCard] === factionName || strategyCardHasOwner(owners, data.strategyCard)) {
                return;
            }

            const { status } = game;
            const { pickTurn, pickOrder } = status;

            faction.strategyCard = data.strategyCard;
            if (!faction.strategyCardTaken) {
                faction.strategyCardTaken = true;
                status.pickTurn = pickTurn === pickOrder.length - 1 ? 0 : pickTurn + 1;
            }

            status.turn = getFactionOrder(game)[0].strategyCard;
            markGameDirty(gameId, { factions: [factionName], status: true });
            break;
        }

        case MessageType.RETURN_STRATEGY_CARD: {
            // Reset card data for faction
            const returnedCard = faction.strategyCard;
            faction.strategyCard = StrategyCardIndex.NONE;
            faction.stragetyCardFlipped = false;
            markGameDirty(gameId, { factions: [factionName] });

            // If faction is returning card that is the first turn, clear out the game turn and set to next faction.
            if (game.status.turn === returnedCard) {
                game.status.turn = getFactionOrder(game)[0].strategyCard;
                markGameDirty(gameId, { status: true });
            }

            break;
        }

        case MessageType.FLIP_STRATEGY_CARD:
            faction.stragetyCardFlipped = data.flipped;
            if (!data.flipped) {
                faction.passed = false;
            }
            markGameDirty(gameId, { factions: [factionName] });
            break;

        case MessageType.PASS_TURN:
            faction.passed = data.passed;
            markGameDirty(gameId, { factions: [factionName] });

            // If current faction passed, set turn to the next faction.
            if (game.status.turn === faction.strategyCard) {
                const nextFaction = getNextFaction(game, factionName);
                game.status.turn = nextFaction ? nextFaction.strategyCard : StrategyCardIndex.END;
                markGameDirty(gameId, { status: true });
            }

            break;

        case MessageType.SET_PUBLIC_OBJECTIVES:
            faction.publicObjectives = data.publicObjectives;
            markGameDirty(gameId, { factions: [factionName] });
            break;

        case MessageType.SET_SECRET_OBJECTIVE:
            faction.secretObjectives = data.secretObjectives;
            markGameDirty(gameId, { factions: [factionName] });
            break;

        case MessageType.SET_VICTORY_POINTS:
            if (typeof data.victoryPoints === 'number') {
                faction.victoryPoints = data.victoryPoints;
                markGameDirty(gameId, { factions: [factionName] });
            }
            break;

        // Planet actions
        case MessageType.TAKE_PLANET: {
            const { planetId } = data || {};
            const planets = GameDB.getPlanetsArray(gameId, planetId);
            const { changedPlanets, changedFactions } = formatChangePlanets(planets, factionName);

            planets.forEach(p => {
                const prevOwner = p.owner;
                p.owner = factionName;
                p.refreshed = false;
                faction.planets.push(p.name);

                const previousPlayer = prevOwner && factions.find(f => f.name === prevOwner);
                if (previousPlayer) {
                    previousPlayer.planets = previousPlayer.planets.filter(pp => pp !== p.name);
                }
            });

            faction.planets.sort();
            markGameDirty(gameId, { planets: changedPlanets, factions: changedFactions });

            // TODO: Send notifications to previous owners.
            break;
        }
        case MessageType.LOST_PLANET: {
            const { planetId } = data || {};
            const planets = GameDB.getPlanetsArray(gameId, planetId);
            const { changedPlanets, changedFactions } = formatChangePlanets(planets, factionName);

            planets.forEach(p => {
                if (p.owner === factionName) {
                    p.owner = null;
                }
            });

            const planetIdArray = Array.isArray(planetId) ? planetId : [planetId];
            faction.planets = faction.planets.filter(p => !planetIdArray.includes(p)).sort();
            markGameDirty(gameId, { planets: changedPlanets, factions: changedFactions });

            break;
        }
        case MessageType.EXHAUST_PLANET: {
            const { planetId, ability } = data || {};
            const planets = GameDB.getPlanetsArray(gameId, planetId).filter(p => p.owner === factionName);
            const { changedPlanets } = formatChangePlanets(planets);

            planets.forEach(p => {
                p.refreshed = false;
                if (ability && p.refreshedAbility !== undefined) {
                    p.refreshedAbility = false;
                }
            });

            markGameDirty(gameId, { planets: changedPlanets });
            break;
        }
        case MessageType.REFRESH_PLANET: {
            const { planetId, ability } = data || {};
            const planets = GameDB.getPlanetsArray(gameId, planetId).filter(p => p.owner === factionName);
            const { changedPlanets } = formatChangePlanets(planets);

            planets.forEach(p => {
                p.refreshed = true;
                if (ability && p.refreshedAbility !== undefined) {
                    p.refreshedAbility = true;
                }
            });

            markGameDirty(gameId, { planets: changedPlanets });
            break;
        }
        case MessageType.EXHAUST_PLANET_ABILITY: {
            const { planetId } = data || {};
            const planets = GameDB.getPlanetsArray(gameId, planetId).filter(
                p => p.owner === factionName && p.refreshedAbility !== undefined,
            );
            planets.forEach(p => (p.refreshedAbility = false));

            const { changedPlanets } = formatChangePlanets(planets);
            markGameDirty(gameId, { planets: changedPlanets });
            break;
        }
        case MessageType.REFRESH_PLANET_ABILITY: {
            const { planetId } = data || {};
            const planets = GameDB.getPlanetsArray(gameId, planetId).filter(
                p => p.owner === factionName && p.refreshedAbility !== undefined,
            );
            planets.forEach(p => (p.refreshedAbility = true));

            const { changedPlanets } = formatChangePlanets(planets);
            markGameDirty(gameId, { planets: changedPlanets });
            break;
        }

        default:
            break;
    }
}
