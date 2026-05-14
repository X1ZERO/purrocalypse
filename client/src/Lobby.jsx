import { useState } from 'react';
import { emit } from './socket.js';

export default function Lobby({ name, setName, joined, onJoined }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  const hello = async () => {
    setErr('');
    try {
      const stored = localStorage.getItem('pid');
      const r = await emit('hello', { name, playerId: stored });
      localStorage.setItem('pid', r.playerId);
      return r.playerId;
    } catch (e) {
      setErr(e.message);
      throw e;
    }
  };

  const create = async () => {
    try {
      await hello();
      const r = await emit('room:create', {});
      onJoined(r.roomId);
    } catch (e) { setErr(e.message); }
  };

  const join = async () => {
    try {
      if (!code) return setErr('Enter room code');
      await hello();
      const r = await emit('room:join', { roomId: code.toUpperCase() });
      onJoined(r.roomId);
    } catch (e) { setErr(e.message); }
  };

  if (joined) return null;

  return (
    <div className="panel">
      <h2>Join the chaos</h2>
      <div className="row" style={{ marginBottom: 12 }}>
        <input
          placeholder="Your nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
        />
      </div>
      <div className="row">
        <button onClick={create} disabled={!name.trim()}>Create room</button>
        <input
          placeholder="Room code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={4}
          style={{ maxWidth: 140 }}
        />
        <button onClick={join} disabled={!name.trim() || !code}>Join</button>
      </div>
      {err && <p style={{ color: 'var(--danger)' }}>{err}</p>}
    </div>
  );
}
