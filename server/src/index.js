import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  startGame,
  broadcast,
  actions,
} from './rooms.js';

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.get('/health', (_, res) => res.json({ ok: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, '../../client/dist');

app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/socket.io')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  let playerId = null;
  let roomId = null;
  let name = 'Player';

  const safe = (fn) => async (...args) => {
    const ack = args[args.length - 1];
    try {
      const result = await fn(...args);
      if (typeof ack === 'function') ack({ ok: true, result });
    } catch (e) {
      if (typeof ack === 'function') ack({ ok: false, error: e.message });
    }
  };

  socket.on(
    'hello',
    safe(({ name: n, playerId: pid }) => {
      playerId = pid || nanoid(10);
      name = (n || 'Player').slice(0, 20);
      socket.join(`p:${playerId}`);
      return { playerId, name };
    })
  );

  socket.on(
    'room:create',
    safe(() => {
      if (!playerId) throw new Error('Say hello first');
      const room = createRoom(playerId, name);
      roomId = room.id;
      socket.join(room.id);
      broadcast(room, io);
      return { roomId: room.id };
    })
  );

  socket.on(
    'room:join',
    safe(({ roomId: rid }) => {
      if (!playerId) throw new Error('Say hello first');
      const room = joinRoom(rid, playerId, name);
      roomId = room.id;
      socket.join(room.id);
      broadcast(room, io);
      return { roomId: room.id };
    })
  );

  socket.on(
    'room:start',
    safe(() => {
      if (!roomId) throw new Error('No room');
      const room = startGame(roomId, playerId);
      broadcast(room, io);
      return { ok: true };
    })
  );

  const requireRoom = () => {
    if (!roomId) throw new Error('No room');
    const room = getRoom(roomId);
    if (!room) throw new Error('Room gone');
    return room;
  };

  socket.on(
    'game:play',
    safe(({ cardIds, target, cardType }) => {
      const room = requireRoom();
      actions.play(room, io, playerId, cardIds, { target, cardType });
    })
  );

  socket.on(
    'game:nope',
    safe(() => {
      const room = requireRoom();
      actions.nope(room, io, playerId);
    })
  );

  socket.on(
    'game:pass',
    safe(() => {
      const room = requireRoom();
      actions.pass(room, io, playerId);
    })
  );

  socket.on(
    'game:favorGive',
    safe(({ cardId }) => {
      const room = requireRoom();
      actions.favorGive(room, io, playerId, cardId);
    })
  );

  socket.on(
    'game:alterCommit',
    safe(({ orderedIds }) => {
      const room = requireRoom();
      actions.alterCommit(room, io, playerId, orderedIds);
    })
  );

  socket.on(
    'game:draw',
    safe(() => {
      const room = requireRoom();
      actions.draw(room, io, playerId);
    })
  );

  socket.on(
    'game:defuse',
    safe(({ insertPos }) => {
      const room = requireRoom();
      actions.defuse(room, io, playerId, insertPos);
    })
  );

  socket.on(
    'game:explode',
    safe(() => {
      const room = requireRoom();
      actions.explode(room, io, playerId);
    })
  );

  socket.on('disconnect', () => {
    if (roomId && playerId) {
      const room = leaveRoom(roomId, playerId);
      if (room) broadcast(room, io);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Purrocalypse server on :${PORT}`);
});
