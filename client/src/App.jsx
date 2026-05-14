import { useEffect, useState } from 'react';
import { socket, emit } from './socket.js';
import Lobby from './Lobby.jsx';
import Game from './Game.jsx';

export default function App() {
  const [name, setName] = useState(localStorage.getItem('name') || '');
  const [joined, setJoined] = useState(null);
  const [lobby, setLobby] = useState(null);
  const [state, setState] = useState(null);
  const [myId, setMyId] = useState(localStorage.getItem('pid'));
  const [connected, setConnected] = useState(false);

  useEffect(() => { localStorage.setItem('name', name); }, [name]);

  useEffect(() => {
    socket.connect();
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('room:lobby', (l) => setLobby(l));
    socket.on('game:state', (s) => setState(s));
    return () => { socket.removeAllListeners(); socket.disconnect(); };
  }, []);

  useEffect(() => {
    if (connected && !myId && name) {
      emit('hello', { name }).then((r) => {
        setMyId(r.playerId);
        localStorage.setItem('pid', r.playerId);
      });
    }
  }, [connected, myId, name]);

  const startGame = async () => {
    try { await emit('room:start', {}); }
    catch (e) { alert(e.message); }
  };

  const isHost = lobby?.hostId === myId;
  const started = !!state;

  return (
    <div className="app">
      <h1>🐱💥 Purrocalypse</h1>
      <p className="subtitle">
        {connected ? '🟢 Connected' : '🔴 Disconnected'}
        {joined && ` • Room ${joined}`}
        {myId && ` • You: ${name}`}
      </p>

      <Lobby
        name={name}
        setName={setName}
        joined={joined}
        onJoined={setJoined}
      />

      {joined && lobby && !started && (
        <div className="panel">
          <h2>Room: <code style={{ color: 'var(--gold)' }}>{joined}</code></h2>
          <p>Share this code with friends to join.</p>
          <h3>Players ({lobby.players.length}/10)</h3>
          <div className="players-list">
            {lobby.players.map((p) => (
              <div key={p.id} className={`player-chip ${p.id === lobby.hostId ? 'host' : ''}`}>
                {p.name}{p.id === myId ? ' [YOU]' : ''}
              </div>
            ))}
          </div>
          {isHost ? (
            <div style={{ marginTop: 16 }}>
              <button onClick={startGame} disabled={lobby.players.length < 2}>
                Start game ({lobby.players.length < 2 ? 'need 2+' : 'go!'})
              </button>
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', marginTop: 12 }}>
              Waiting for host to start...
            </p>
          )}
        </div>
      )}

      {started && <Game state={state} lobby={lobby} myId={myId} />}
    </div>
  );
}
