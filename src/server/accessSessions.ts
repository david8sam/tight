import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { IncomingMessage } from 'node:http';
import { z } from 'zod';
import { GuestSession, Session } from 'common/session.js';
import { Game, GameClientData, GameChangeData, GameFaction } from 'common/Game.js';
import { MessageType } from 'common/message.js';
import { ClientCommand } from './commandSchemas.js';
import { findAccessSession, getGame, mutateGame, saveAccessSession, revokeAccessSessions } from './database/game.js';
import { markGameDirty } from './dirty.js';

export const SESSION_COOKIE = 'tight-session';
const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const mint = () => randomBytes(32).toString('base64url');
const hash = (token: string) => createHash('sha256').update(token).digest('hex');
const same = (left: string, right: string) => timingSafeEqual(Buffer.from(hash(left)), Buffer.from(hash(right)));
type Invitation = { session: GuestSession; expiresAt: number };

/** One backend owns host credentials and invitations; durable guest grants belong to the game store. */
export class AccessSessions {
    readonly hostToken: string;
    readonly hostClaimToken = mint();
    private hostClaimed = false;
    private invitations = new Map<string, Invitation>();
    private consumed = new Map<string, Invitation & { credentialHash: string }>();
    constructor(hostToken = mint()) {
        this.hostToken = tokenSchema.parse(hostToken);
    }

    token(request: IncomingMessage): string | null {
        const values = (request.headers.cookie || '')
            .split(';')
            .map(value => value.trim())
            .filter(value => value.startsWith(`${SESSION_COOKIE}=`))
            .map(value => value.slice(SESSION_COOKIE.length + 1));
        if (values.length !== 1 || !tokenSchema.safeParse(values[0]).success) return null;
        return values[0];
    }
    resolve(token: string | null): Session {
        if (!token || !tokenSchema.safeParse(token).success) return { role: 'unpaired' };
        if (same(token, this.hostToken)) return { role: 'host' };
        return findAccessSession(hash(token)) || { role: 'unpaired' };
    }
    claimHost(token: string, currentToken: string | null): string | null {
        if (!tokenSchema.safeParse(token).success || !same(token, this.hostClaimToken)) return null;
        if (this.hostClaimed && (!currentToken || !same(currentToken, this.hostToken))) return null;
        this.hostClaimed = true;
        return this.hostToken;
    }
    invite(session: GuestSession): { token: string; expiresAt: number } | null {
        if (!getGame(session.gameId)) return null;
        const now = Date.now();
        for (const [token, invite] of this.invitations) if (invite.expiresAt <= now) this.invitations.delete(token);
        for (const [token, invite] of this.consumed) if (invite.expiresAt <= now) this.consumed.delete(token);
        if (this.invitations.size >= 100) return null;
        const token = mint();
        const expiresAt = now + 5 * 60 * 1000;
        this.invitations.set(hash(token), { session, expiresAt });
        return { token, expiresAt };
    }
    revoke(gameId: string): void {
        revokeAccessSessions(gameId);
        for (const [token, invite] of this.invitations)
            if (invite.session.gameId === gameId) this.invitations.delete(token);
        for (const [token, invite] of this.consumed) if (invite.session.gameId === gameId) this.consumed.delete(token);
    }
    claimInvite(token: string, currentToken: string | null): { token: string; session: GuestSession } | null {
        if (!tokenSchema.safeParse(token).success) return null;
        const key = hash(token);
        const previous = this.consumed.get(key);
        if (
            previous &&
            previous.expiresAt > Date.now() &&
            currentToken &&
            hash(currentToken) === previous.credentialHash &&
            this.resolve(currentToken).role !== 'unpaired'
        )
            return { token: currentToken, session: previous.session };
        const invitation = this.invitations.get(key);
        if (!invitation || invitation.expiresAt <= Date.now()) {
            this.invitations.delete(key);
            return null;
        }
        const { session } = invitation;
        const game = getGame(session.gameId);
        if (!game) {
            this.invitations.delete(key);
            return null;
        }
        if (session.role === 'player') {
            if (!game.players[session.playerId] && Object.keys(game.players).length >= 32) return null;
            mutateGame(game.id, () => {
                game.players[session.playerId] = { id: session.playerId };
            });
            markGameDirty(game.id, { players: true });
        }
        const credential = mint();
        saveAccessSession(hash(credential), session);
        this.invitations.delete(key);
        this.consumed.set(key, { ...invitation, credentialHash: hash(credential) });
        if (this.consumed.size > 100) {
            const oldest = this.consumed.keys().next().value;
            if (oldest) this.consumed.delete(oldest);
        }
        return { token: credential, session };
    }
}

export function mayReadGame(session: Session, gameId: string): boolean {
    return (
        session.role === 'host' ||
        ((session.role === 'player' || session.role === 'spectator') && session.gameId === gameId)
    );
}

export function authorizeCommand(session: Session, command: ClientCommand, game: Game): string | null {
    if (session.role === 'host') return null;
    if (!mayReadGame(session, game.id)) return 'Pair this device with the host first';
    if (session.role !== 'player') return 'Spectators cannot change the game';
    if (command.type === MessageType.GAME_ADD_PLAYER)
        return command.data.playerId === session.playerId ? null : 'Cannot select another player';
    if (session.tableEditing) {
        switch (command.type) {
            case MessageType.GAME_SET_PUBLIC_OBJECTIVES:
            case MessageType.GAME_STATUS_SET:
            case MessageType.GAME_NEXT_ROUND:
            case MessageType.GAME_SET_SPEAKER:
            case MessageType.GAME_SET_CUSTODIANS_REMOVED:
            case MessageType.GAME_SET_AGENDA_VOTED:
            case MessageType.UPDATE_PLANET:
            case MessageType.TAKE_NAALU_ZERO_TOKEN:
            case MessageType.TAKE_STRATEGY_CARD:
            case MessageType.RETURN_STRATEGY_CARD:
            case MessageType.FLIP_STRATEGY_CARD:
            case MessageType.PASS_TURN:
            case MessageType.SET_PUBLIC_OBJECTIVES:
            case MessageType.SET_VICTORY_POINTS:
            case MessageType.TAKE_PLANET:
            case MessageType.LOST_PLANET:
            case MessageType.EXHAUST_PLANET:
            case MessageType.REFRESH_PLANET:
            case MessageType.EXHAUST_PLANET_ABILITY:
            case MessageType.REFRESH_PLANET_ABILITY:
                return null;
        }
    }
    switch (command.type) {
        case MessageType.TAKE_NAALU_ZERO_TOKEN:
        case MessageType.TAKE_STRATEGY_CARD:
        case MessageType.RETURN_STRATEGY_CARD:
        case MessageType.FLIP_STRATEGY_CARD:
        case MessageType.PASS_TURN:
        case MessageType.SET_PUBLIC_OBJECTIVES:
        case MessageType.SET_SECRET_OBJECTIVE:
        case MessageType.SET_VICTORY_POINTS:
        case MessageType.TAKE_PLANET:
        case MessageType.LOST_PLANET:
        case MessageType.EXHAUST_PLANET:
        case MessageType.REFRESH_PLANET:
        case MessageType.EXHAUST_PLANET_ABILITY:
        case MessageType.REFRESH_PLANET_ABILITY:
            return game.factions.some(
                faction => faction.name === command.data.factionName && faction.playerIds.includes(session.playerId),
            )
                ? null
                : 'Only your assigned factions can be changed';
        default:
            return 'Only the host can administer this game';
    }
}

function visibleFaction(faction: GameFaction, session: Session, ended: boolean): GameFaction {
    if (ended || session.role === 'host' || (session.role === 'player' && faction.playerIds.includes(session.playerId)))
        return faction;
    return {
        ...faction,
        secretObjectives: faction.secretObjectives.map(secret =>
            secret.cleared
                ? secret
                : {
                      ...secret,
                      objective: { ...secret.objective, description: '' },
                  },
        ),
    };
}
export function visibleGame(game: GameClientData, session: Session): GameClientData {
    return { ...game, factions: game.factions.map(faction => visibleFaction(faction, session, game.status.ended)) };
}
export function visibleChange(change: GameChangeData, session: Session): GameChangeData {
    const game = getGame(change.id);
    if (!game) return change;
    const factions = change.status ? game.factions : change.factions;
    return {
        ...change,
        ...(change.created ? { created: visibleGame(change.created, session) } : {}),
        ...(factions ? { factions: factions.map(faction => visibleFaction(faction, session, game.status.ended)) } : {}),
    };
}
