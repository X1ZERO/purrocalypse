import {
  createGame,
  publicState,
  playCards,
  playNope,
  resolvePending,
  favorGive,
  alterCommit,
  drawCard,
  defuse,
  explode,
} from './game.js';

const rooms = new Map();

const NOPE_WINDOW_MS = 3500;

function code() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < 4; i++) s += letters[Math.floor(Math.random() * letters.length)];
  return s;
}

export function createRoom(hostId, hostName) {
  let id;
  do { id = code(); } while (rooms.has(id));
  const room = {
    id,
    hostId,
    players: [{ id: hostId, name: hostName }],
    game: null,
    pendingResolveTimer: null,
  };
  rooms.set(id, room);
  return room;
}

export function getRoom(id) {
  return rooms.get(id);
}

export function joinRoom(id, playerId, name) {
  const room = rooms.get(id);
  if (!room) throw new Error('Room not found');
  if (room.game) throw new Error('Game already started');
  if (room.players.length >= 10) throw new Error('Room full');
  if (room.players.some((p) => p.id === playerId)) return room;
  room.players.push({ id: playerId, name });
  return room;
}

export function leaveRoom(id, playerId) {
  const room = rooms.get(id);
  if (!room) return null;
  room.players = room.players.filter((p) => p.id !== playerId);
  if (room.game) {
    const p = room.game.players.find((x) => x.id === playerId);
    if (p) p.alive = false;
  }
  if (room.players.length === 0) {
    rooms.delete(id);
    return null;
  }
  if (room.hostId === playerId) room.hostId = room.players[0].id;
  return room;
}

export function startGame(id, hostId) {
  const room = rooms.get(id);
  if (!room) throw new Error('No room');
  if (room.hostId !== hostId) throw new Error('Only host');
  if (room.players.length < 2) throw new Error('Need 2+ players');
  room.game = createGame(room.players);
  return room;
}

export function listLobby(id) {
  const room = rooms.get(id);
  if (!room) return null;
  return {
    id: room.id,
    hostId: room.hostId,
    players: room.players,
    started: !!room.game,
  };
}

export function stateFor(room, viewerId) {
  if (!room.game) return null;
  return publicState(room.game, viewerId);
}

function scheduleResolve(room, io) {
  if (room.pendingResolveTimer) clearTimeout(room.pendingResolveTimer);
  room.pendingResolveTimer = setTimeout(() => {
    if (room.game && room.game.pendingAction && room.game.pendingAction.type !== 'favor_pick') {
      resolvePending(room.game);
      broadcast(room, io);
      if (room.game.pendingAction && room.game.pendingAction.type === 'favor_pick') {
        // wait for target to pick — no auto-resolve
      }
    }
  }, NOPE_WINDOW_MS);
}

export function broadcast(room, io) {
  io.to(room.id).emit('room:lobby', listLobby(room.id));
  for (const p of room.players) {
    io.to(`p:${p.id}`).emit('game:state', stateFor(room, p.id));
  }
}

export const actions = {
  play(room, io, playerId, cardIds, opts) {
    playCards(room.game, playerId, cardIds, opts);
    if (room.game.pendingAction) scheduleResolve(room, io);
    broadcast(room, io);
  },
  nope(room, io, playerId) {
    playNope(room.game, playerId);
    scheduleResolve(room, io);
    broadcast(room, io);
  },
  favorGive(room, io, targetId, cardId) {
    favorGive(room.game, targetId, cardId);
    broadcast(room, io);
  },
  alterCommit(room, io, playerId, orderedIds) {
    alterCommit(room.game, playerId, orderedIds);
    broadcast(room, io);
  },
  draw(room, io, playerId) {
    drawCard(room.game, playerId);
    broadcast(room, io);
  },
  defuse(room, io, playerId, insertPos) {
    defuse(room.game, playerId, insertPos);
    broadcast(room, io);
  },
  explode(room, io, playerId) {
    explode(room.game, playerId);
    broadcast(room, io);
  },
};
