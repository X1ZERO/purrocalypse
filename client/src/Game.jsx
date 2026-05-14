import { useState } from 'react';
import { emit } from './socket.js';
import Card, { LABELS } from './Card.jsx';

const CAT_TYPES = ['cat_taco', 'cat_beard', 'cat_potato', 'cat_rainbow', 'cat_melon'];

export default function Game({ state, lobby, myId }) {
  const [selected, setSelected] = useState([]);
  const [targetPick, setTargetPick] = useState(null);
  const [namedPick, setNamedPick] = useState(null);
  const [insertPos, setInsertPos] = useState('');

  if (!state) return null;

  const me = state.players.find((p) => p.id === myId);
  const myTurn = state.turnPlayerId === myId;
  const others = state.players.filter((p) => p.id !== myId && p.alive);
  const bombOnMe = state.pendingExplosion?.playerId === myId;
  const favorOnMe =
    state.pendingAction?.type === 'favor_pick' && state.pendingAction.target === myId;
  const hasNope = state.yourHand.some((c) => c.type === 'nope');
  const hasDefuse = state.yourHand.some((c) => c.type === 'defuse');

  const toggle = (cardId) => {
    setSelected((s) => s.includes(cardId) ? s.filter((x) => x !== cardId) : [...s, cardId]);
  };

  const validatePlay = () => {
    const cards = state.yourHand.filter((c) => selected.includes(c.id));
    if (cards.length === 0) return null;
    const types = cards.map((c) => c.type);
    if (cards.length === 1) return { needTarget: types[0] === 'favor' };
    const allSame = types.every((t) => t === types[0]);
    if (cards.length === 2 && allSame && CAT_TYPES.includes(types[0]))
      return { needTarget: true };
    if (cards.length === 3 && allSame && CAT_TYPES.includes(types[0]))
      return { needTarget: true, needNamed: true };
    if (
      cards.length === 2 &&
      types.includes('half_bomb_a') &&
      types.includes('half_bomb_b')
    )
      return { needTarget: true };
    return false;
  };

  const validity = validatePlay();

  const playSelected = async () => {
    if (!validity) return;
    if (validity.needTarget && others.length > 0) {
      setTargetPick({ cardIds: [...selected], needNamed: validity.needNamed });
      return;
    }
    await doPlay({ cardIds: selected });
  };

  const doPlay = async ({ cardIds, target, cardType }) => {
    try {
      await emit('game:play', { cardIds, target, cardType });
      setSelected([]);
      setTargetPick(null);
      setNamedPick(null);
    } catch (e) { alert(e.message); }
  };

  const drawNow = async () => {
    try { await emit('game:draw', {}); }
    catch (e) { alert(e.message); }
  };

  const defuseBomb = async () => {
    const pos = parseInt(insertPos, 10);
    try {
      await emit('game:defuse', { insertPos: isNaN(pos) ? undefined : pos });
      setInsertPos('');
    } catch (e) { alert(e.message); }
  };

  const explodeMe = async () => {
    try { await emit('game:explode', {}); }
    catch (e) { alert(e.message); }
  };

  const nope = async () => {
    try { await emit('game:nope', {}); }
    catch (e) { alert(e.message); }
  };

  const favorGive = async (cardId) => {
    try { await emit('game:favorGive', { cardId }); }
    catch (e) { alert(e.message); }
  };

  if (state.over) {
    const winner = state.players.find((p) => p.id === state.winnerId);
    return (
      <div className="panel">
        <h2>🏆 Game over</h2>
        <p>Winner: <strong>{winner?.name || 'nobody'}</strong></p>
        <button onClick={() => window.location.reload()}>New game</button>
      </div>
    );
  }

  return (
    <>
      {bombOnMe && (
        <div className="banner danger">
          💥 You drew a BOMB!
          {hasDefuse ? (
            <div style={{ marginTop: 8 }}>
              <input
                placeholder="Insert depth (0 = top, blank = bottom)"
                value={insertPos}
                onChange={(e) => setInsertPos(e.target.value)}
                style={{ maxWidth: 260, marginRight: 8 }}
              />
              <button className="gold" onClick={defuseBomb}>Defuse</button>
              <button className="danger" onClick={explodeMe} style={{ marginLeft: 8 }}>
                Give up (explode)
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 8 }}>
              No defuse. <button className="danger" onClick={explodeMe}>Explode</button>
            </div>
          )}
        </div>
      )}

      {state.pendingAction && !favorOnMe && (
        <div className="banner">
          Pending: <strong>{state.pendingAction.type}</strong> by {state.players.find((p) => p.id === state.pendingAction.by)?.name}
          {' '} (Nopes: {state.pendingAction.nopes})
          {hasNope && state.pendingAction.by !== myId && state.pendingAction.type !== 'favor_pick' && (
            <button onClick={nope} style={{ marginLeft: 12 }}>NOPE!</button>
          )}
        </div>
      )}

      {favorOnMe && (
        <div className="banner">
          Favor target — pick a card to give away:
          <div className="hand" style={{ marginTop: 8 }}>
            {state.yourHand.map((c) => (
              <Card key={c.id} card={c} onClick={() => favorGive(c.id)} />
            ))}
          </div>
        </div>
      )}

      <div className="panel">
        <h3>Players</h3>
        <div className="players-list">
          {state.players.map((p) => (
            <div
              key={p.id}
              className={`player-chip ${!p.alive ? 'dead' : ''} ${p.isStreaker ? 'streaker' : ''} ${p.id === state.turnPlayerId ? 'current' : ''} ${p.id === lobby.hostId ? 'host' : ''}`}
            >
              {p.name} ({p.handCount} cards)
              {p.id === myId ? ' [YOU]' : ''}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, color: 'var(--muted)' }}>
          Turn: <strong>{state.players.find((p) => p.id === state.turnPlayerId)?.name}</strong>
          {' • '}Turns left: {state.turnsLeft}
          {' • '}Deck: {state.deckCount}
        </div>
      </div>

      <div className="center-stack">
        <div
          className="pile draw-pile"
          onClick={myTurn && !state.pendingAction && !bombOnMe ? drawNow : undefined}
          title={myTurn ? 'Click to draw and end turn' : ''}
        >
          🂠 {state.deckCount}
        </div>
        <div className="pile discard-pile">
          {state.discardTop ? LABELS[state.discardTop.type] : 'empty'}
        </div>
      </div>

      {state.yourPeek && (
        <div className="panel">
          <h4>🔮 Top of deck (next is leftmost):</h4>
          <div className="peek">
            {state.yourPeek.map((c) => (
              <Card key={c.id} card={c} onClick={() => {}} />
            ))}
          </div>
        </div>
      )}

      <div className="panel">
        <h3>Your hand</h3>
        <div className="hand">
          {state.yourHand.length === 0 && me?.isStreaker && (
            <p style={{ color: 'var(--gold)' }}>You're the Streaker — no hand. Just draw on your turn.</p>
          )}
          {state.yourHand.map((c) => (
            <Card
              key={c.id}
              card={c}
              selected={selected.includes(c.id)}
              onClick={() => toggle(c.id)}
            />
          ))}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button
            onClick={playSelected}
            disabled={!validity || !myTurn || bombOnMe || state.pendingAction}
          >
            Play selected ({selected.length})
          </button>
          <button
            className="secondary"
            onClick={() => setSelected([])}
            disabled={selected.length === 0}
          >
            Clear
          </button>
          {myTurn && !bombOnMe && !state.pendingAction && (
            <span style={{ color: 'var(--gold)' }}>Your turn — play cards then draw.</span>
          )}
        </div>
      </div>

      {targetPick && (
        <div className="target-picker">
          <div className="panel">
            <h3>Pick a target</h3>
            <div className="players-list">
              {others.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (targetPick.needNamed) {
                      setNamedPick({ ...targetPick, target: p.id });
                      setTargetPick(null);
                    } else {
                      doPlay({ cardIds: targetPick.cardIds, target: p.id });
                    }
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button className="secondary" onClick={() => setTargetPick(null)} style={{ marginTop: 12 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {namedPick && (
        <div className="target-picker">
          <div className="panel">
            <h3>Name a card type to take</h3>
            <div className="row">
              {['skip', 'attack', 'favor', 'shuffle', 'see_future', 'nope', 'defuse',
                'cat_taco', 'cat_beard', 'cat_potato', 'cat_rainbow', 'cat_melon'].map((t) => (
                <button
                  key={t}
                  className="secondary"
                  onClick={() => doPlay({
                    cardIds: namedPick.cardIds,
                    target: namedPick.target,
                    cardType: t,
                  })}
                >
                  {LABELS[t]}
                </button>
              ))}
            </div>
            <button className="secondary" onClick={() => setNamedPick(null)} style={{ marginTop: 12 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        <h4>Log</h4>
        <div className="log">
          {state.log.map((l, i) => (
            <div key={i} className="log-line">{l}</div>
          ))}
        </div>
      </div>
    </>
  );
}
