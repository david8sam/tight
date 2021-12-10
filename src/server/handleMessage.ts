import isNil from 'lodash/isNil';

import { ErrorType } from 'common/error';
import {
    buildStrategyCardOwners,
    GameJoinStatus,
    getNextPlayer,
    getPlayerOrder,
    getPlayersInGame,
    Phase,
    strategyCardHasOwner,
    StrategyCardIndex,
} from 'common/Game';
import { MessageType } from 'common/message';

import * as AccountDB from './database/account';
import * as FactionDB from './database/faction';
import * as GameDB from './database/game';
import * as PlanetDB from './database/planet';

import { dirty, formatChangePlanets, markAccountDirty, markGameDirty } from './dirty';
import { logWS } from './log';
import { sendData, WebSocketServer, WebSocket } from './WebSocket';

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
    const { accountId = null, gameId = null, playerId = null, ...otherData } = data || {};

    logWS(false, ws.accountId, payload);

    // Handle list actions immediately
    switch (type) {
        case MessageType.LIST_GAMES:
            sendData({ ws, type, data: GameDB.listGames() });
            return;
        case MessageType.LIST_PLANETS:
            sendData({ ws, type, data: PlanetDB.listPlanets() });
            return;
        case MessageType.LIST_ACCOUNTS:
            sendData({ ws, type, data: AccountDB.listAccounts() });
            return;
        case MessageType.FACTION_GET: {
            const factionInfo = FactionDB.getFaction(data.factionName);
            sendData({
                ws,
                type,
                data: factionInfo,
                error: factionInfo ? null : `Unable to find faction: "${data.factionName}"`,
            });
            return;
        }
        default:
            break;
    }

    // Player account actions
    switch (type) {
        case MessageType.ACCOUNT_ADD:
            AccountDB.addAccount(accountId);
            markAccountDirty(accountId);
            dirty.accountsInfo = true;
            break;
        case MessageType.ACCOUNT_DELETE:
            AccountDB.deleteAccount(accountId);
            dirty.accountsInfo = true;
            break;
        case MessageType.ACCOUNT_LOGIN: {
            AccountDB.login(accountId, otherData);
            ws.accountId = accountId;
            markAccountDirty(accountId);
            dirty.accountsInfo = true;
            break;
        }
        case MessageType.ACCOUNT_LOGOUT: {
            const account = AccountDB.getAccount(accountId);
            if (account && account.joinedGame) {
                const game = GameDB.getGame(account.joinedGame);
                if (game) {
                    game.players[accountId].joined = false;
                    markGameDirty(game.id, { players: [accountId] });
                }
            }

            ws.accountId = null;
            AccountDB.logout(accountId);
            markAccountDirty(accountId);
            break;
        }
        case MessageType.ACCOUNT_SET_SETTINGS: {
            const account = AccountDB.getAccount(accountId);
            if (account) {
                account.settings = {
                    ...account.settings,
                    ...data.settings,
                };

                markAccountDirty(accountId);
            }
            break;
        }
        default:
            break;
    }

    switch (type) {
        case MessageType.CREATE_GAME: {
            if (playerId) {
                const game = GameDB.createGame({ creator: playerId, ...otherData });
                markGameDirty(game.id, { created: true });
            }
            break;
        }
        default:
            break;
    }

    // Following actions require a game
    const game = GameDB.getGame(gameId);
    if (!game) {
        return;
    }

    switch (type) {
        case MessageType.DELETE_GAME: {
            if (game.creator === playerId) {
                // Remove every player account from the game
                Object.values(game.players).forEach(p => {
                    const account = AccountDB.getAccount(p.id);
                    if (account) {
                        account.joinedGame = null;
                        markAccountDirty(account.id);
                    }
                });

                // Delete game
                GameDB.deleteGame(gameId);
                markGameDirty(gameId, { deleted: true });
            }
            break;
        }

        case MessageType.START_GAME:
            // Initialize players with their home planets.
            getPlayersInGame(game).forEach(player => {
                if (player.faction) {
                    const factionPlanets = PlanetDB.getFactionPlanets(player.faction);
                    player.planets = factionPlanets.map(p => p.name);
                    factionPlanets.forEach(p => {
                        const gamePlanet = game.planets[p.name];
                        gamePlanet.owner = player.id;

                        // Make sure home planets are refreshed.
                        gamePlanet.refreshed = true;
                    });
                }
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

        case MessageType.PLAYER_JOIN_GAME: {
            const { players, status } = game;
            const { joinStatus } = otherData;

            // Anyone can join a game not started yet.
            const canAnyoneJoin = !status.started;

            // When a game has started, only previous players can re-join as players.
            const canJoinAsPlayer = status.started && joinStatus === GameJoinStatus.PLAYER && players[playerId];

            // Admins and specators can join anytime when a game has started. But not if they were a player before.
            const canJoinAsNonPlayer = status.started && joinStatus !== GameJoinStatus.PLAYER && !players[playerId];

            if (canAnyoneJoin || canJoinAsPlayer || canJoinAsNonPlayer) {
                // Add player to the game
                GameDB.addPlayer(gameId, playerId, otherData);

                let status = false;
                if (!game.status.speaker) {
                    status = true;
                    game.status.speaker = playerId;
                    game.status.pickOrder[0] = playerId;
                }
                markGameDirty(gameId, { players: [playerId], status });

                const account = AccountDB.getAccount(playerId);
                if (account) {
                    account.joinedGame = gameId;
                    markAccountDirty(account.id);
                }
            } else {
                sendData({ ws, type: MessageType.PLAYER_JOIN_GAME, error: ErrorType.GAME_UNABLE_TO_JOIN });
                return;
            }

            break;
        }
        case MessageType.PLAYER_LEAVE_GAME: {
            // Remove player from the game if in the game
            const gamePlayer = playerId && game.players[playerId];
            if (gamePlayer) {
                // Also remove if player is a nonplayer or game hasn't started yet.
                const isNonGamePlayer = gamePlayer.joinStatus !== GameJoinStatus.PLAYER;
                const deletePlayer = data.deletePlayer || !game.status.started || isNonGamePlayer;

                GameDB.removePlayer(gameId, playerId, deletePlayer);

                // Update game setup when a player leaves before game starts.
                let status = false;
                if (!game.status.started && !isNonGamePlayer) {
                    status = true;

                    game.status.pickOrder = game.status.pickOrder.filter(id => game.players[id]);
                    if (gamePlayer.id === game.status.speaker) {
                        game.status.speaker = game.status.pickOrder[0];
                    }
                }

                markGameDirty(gameId, { players: [playerId], status });
            }

            const account = AccountDB.getAccount(playerId);
            if (account) {
                account.joinedGame = null;
                markAccountDirty(account.id);
            }
            break;
        }

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
                Object.values(game.players).forEach(p => {
                    p.strategyCard = StrategyCardIndex.NONE;
                    p.strategyCardTaken = false;
                    p.stragetyCardFlipped = false;
                    p.passed = false;
                    p.hasNaaluZeroToken = p.faction === 'The Naalu Collective';
                });

                game.status.pickTurn = 0;
                game.status.turn = StrategyCardIndex.NONE;
                game.status.round += 1;
                game.status.phase = Phase.STRATEGY;
                game.status.agenda1Voted = false;
                game.status.agenda2Voted = false;

                markGameDirty(gameId, { players: true, status: true });
            }
            break;
        }

        default:
            break;
    }

    // Following actions require a player
    const players = game.players;
    const player = players && players[playerId];
    if (!player) {
        return;
    }

    switch (type) {
        // Player Setup actions
        case MessageType.PLAYER_SET_COLOR:
            player.color = data.color;
            markGameDirty(gameId, { players: [playerId] });
            break;
        case MessageType.PLAYER_SET_FACTION:
            player.faction = data.factionName;
            if (data.factionName === 'The Naalu Collective') {
                player.hasNaaluZeroToken = true;
            }
            markGameDirty(gameId, { players: [playerId] });
            break;
        case MessageType.PLAYER_TAKE_NAALU_ZERO_TOKEN:
            getPlayersInGame(game).forEach(p => (p.hasNaaluZeroToken = false));
            player.hasNaaluZeroToken = true;
            markGameDirty(gameId, { players: [playerId] });
            break;

        // Strategy Card actions
        case MessageType.PLAYER_TAKE_STRATEGY_CARD: {
            const owners = buildStrategyCardOwners(game);
            if (owners[data.strategyCard] === player.name || strategyCardHasOwner(owners, data.strategyCard)) {
                return;
            }

            const { status } = game;
            const { pickTurn, pickOrder } = status;

            player.strategyCard = data.strategyCard;
            if (!player.strategyCardTaken) {
                player.strategyCardTaken = true;
                status.pickTurn = pickTurn === pickOrder.length - 1 ? 0 : pickTurn + 1;
            }

            status.turn = getPlayerOrder(game)[0].strategyCard;
            markGameDirty(gameId, { players: [playerId], status: true });
            break;
        }

        case MessageType.PLAYER_RETURN_STRATEGY_CARD: {
            // Reset card data for player
            const returnedCard = player.strategyCard;
            player.strategyCard = StrategyCardIndex.NONE;
            player.stragetyCardFlipped = false;
            markGameDirty(gameId, { players: [playerId] });

            // If player is returning card that is the first turn, clear out the game turn and set to next player.
            if (game.status.turn === returnedCard) {
                game.status.turn = getPlayerOrder(game)[0].strategyCard;
                markGameDirty(gameId, { status: true });
            }

            break;
        }

        case MessageType.PLAYER_FLIP_STRATEGY_CARD:
            player.stragetyCardFlipped = data.flipped;
            if (!data.flipped) {
                player.passed = false;
            }
            markGameDirty(gameId, { players: [playerId] });
            break;

        case MessageType.PLAYER_PASS_TURN:
            player.passed = data.passed;
            markGameDirty(gameId, { players: [playerId] });

            // If current player passed, set turn to the next player.
            if (game.status.turn === player.strategyCard) {
                const nextPlayer = getNextPlayer(game, player.id);
                game.status.turn = nextPlayer ? nextPlayer.strategyCard : StrategyCardIndex.END;
                markGameDirty(gameId, { status: true });
            }

            break;

        case MessageType.PLAYER_SET_PUBLIC_OBJECTIVES:
            player.publicObjectives = data.publicObjectives;
            markGameDirty(gameId, { players: [playerId] });
            break;

        case MessageType.PLAYER_SET_SECRET_OBJECTIVE:
            player.secretObjective = data.secretObjective;
            markGameDirty(gameId, { players: [playerId] });
            break;

        case MessageType.PLAYER_SET_VICTORY_POINTS:
            if (typeof data.victoryPoints === 'number') {
                player.victoryPoints = data.victoryPoints;
                markGameDirty(gameId, { players: [playerId] });
            }
            break;

        // Planet actions
        case MessageType.PLAYER_TAKE_PLANET: {
            const { planetId } = data || {};
            const planets = GameDB.getPlanetsArray(gameId, planetId);
            const { changedPlanets, changedPlayers } = formatChangePlanets(planets, playerId);

            planets.forEach(p => {
                const prevOwner = p.owner;
                p.owner = playerId;
                p.refreshed = false;
                player.planets.push(p.name);

                const previousPlayer = prevOwner && players[prevOwner];
                if (previousPlayer) {
                    previousPlayer.planets = previousPlayer.planets.filter(pp => pp !== p.name);
                }
            });

            player.planets.sort();
            markGameDirty(gameId, { planets: changedPlanets, players: changedPlayers });

            // TODO: Send notifications to previous owners.
            break;
        }
        case MessageType.PLAYER_LOST_PLANET: {
            const { planetId } = data || {};
            const planets = GameDB.getPlanetsArray(gameId, planetId);
            const { changedPlanets, changedPlayers } = formatChangePlanets(planets, playerId);

            planets.forEach(p => {
                if (p.owner === playerId) {
                    p.owner = null;
                }
            });

            const planetIdArray = Array.isArray(planetId) ? planetId : [planetId];
            player.planets = player.planets.filter(p => !planetIdArray.includes(p)).sort();
            markGameDirty(gameId, { planets: changedPlanets, players: changedPlayers });

            break;
        }
        case MessageType.PLAYER_EXHAUST_PLANET: {
            const { planetId, ability } = data || {};
            const planets = GameDB.getPlanetsArray(gameId, planetId).filter(p => p.owner === playerId);
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
        case MessageType.PLAYER_REFRESH_PLANET: {
            const { planetId, ability } = data || {};
            const planets = GameDB.getPlanetsArray(gameId, planetId).filter(p => p.owner === playerId);
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
        case MessageType.PLAYER_EXHAUST_PLANET_ABILITY: {
            const { planetId } = data || {};
            const planets = GameDB.getPlanetsArray(gameId, planetId).filter(
                p => p.owner === playerId && p.refreshedAbility !== undefined,
            );
            planets.forEach(p => (p.refreshedAbility = false));

            const { changedPlanets } = formatChangePlanets(planets);
            markGameDirty(gameId, { planets: changedPlanets });
            break;
        }
        case MessageType.PLAYER_REFRESH_PLANET_ABILITY: {
            const { planetId } = data || {};
            const planets = GameDB.getPlanetsArray(gameId, planetId).filter(
                p => p.owner === playerId && p.refreshedAbility !== undefined,
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
