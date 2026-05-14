import { useState } from 'react';
import { emit } from './socket.js';
import Card, { LABELS } from './Card.jsx';
import Rules from './Rules.jsx';

function AlterUI({ cards, onSubmit }) {
  const [order, setOrder] = useState(cards.map((c) => c.id));
  const byId = Object.fromEntries(cards.map((c) => [c.id, c]));
  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    const next = order.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    setOrder(next);
  };
  return (
    <div className="panel">
      <h4>🔮 Alter the Future — reorder top 3 (top of deck = leftmost)</h4>
      <div className="peek">
        {order.map((id, i) => (
          <div key={id} style={{ textAlign: 'center' }}>
            <Card card={byId[id]} onClick={() => {}} />
            <div style={{ marginTop: 6 }}>
              <button className="secondary" onClick={() => move(i, -1)} disabled={i === 0}>◀</button>
              <button className="secondary" onClick={() => move(i, 1)} disabled={i === order.length - 1} style={{ marginLeft: 4 }}>▶</button>
            </div>
          </div>
        ))}
      </div>
      <button className="gold" onClick={() => onSubmit(order)} style={{ marginTop: 12 }}>Confirm order</button>
    </div>
  );
}

const CAT_TYPES = ['cat_taco', 'cat_beard', 'cat_potato', 'cat_rainbow', 'cat_melon'];
const isCatLike = (t) => CAT_TYPES.includes(t) || t === 'feral_cat';

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
  const implodeOnMe = state.pendingImplosionPlace?.playerId === myId;
  const favorOnMe =
    state.pendingAction?.type === 'favor_pick' && state.pendingAction.target === myId;
  const hasDefuse = state.yourHand.some((c) => c.type === 'defuse');

  const toggle = (cardId) => {
    setSelected((s) => s.includes(cardId) ? s.filter((x) => x !== cardId) : [...s, cardId]);
  };

  const validatePlay = () => {
    const cards = state.yourHand.filter((c) => selected.includes(c.id));
    if (cards.length === 0) return null;
    const types = cards.map((c) => c.type);
    if (cards.length === 1) {
      const t = types[0];
      if (t === 'feral_cat') return false;
      return { needTarget: t === 'favor' || t === 'targeted_attack' };
    }
    const isCatCombo = (n) => {
      if (types.length !== n) return false;
      if (!types.every(isCatLike)) return false;
      const reals = types.filter((t) => t !== 'feral_cat');
      if (reals.length === 0) return false;
      return reals.every((t) => t === reals[0]);
    };
    if (isCatCombo(2)) return { needTarget: true };
    if (isCatCombo(3)) return { needTarget: true, needNamed: true };
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

  const placeKitten = async () => {
    const pos = parseInt(insertPos, 10);
    try {
      await emit('game:placeImploding', { insertPos: isNaN(pos) ? 0 : pos });
      setInsertPos('');
    } catch (e) { alert(e.message); }
  };

  const nope = async () => {
    try { await emit('game:nope', {}); }
    catch (e) { alert(e.message); }
  };

  const passVote = async () => {
    try { await emit('game:pass', {}); }
    catch (e) { alert(e.message); }
  };

  const favorGive = async (cardId) => {
    try { await emit('game:favorGive', { cardId }); }
    catch (e) { alert(e.message); }
  };

  const submitAlter = async (orderedIds) => {
    try { await emit('game:alterCommit', { orderedIds }); }
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
      {implodeOnMe && (
        <div className="banner danger">
          ☠️ You revealed the IMPLODING KITTEN! Place it back FACE-UP in the deck. Everyone will see where you put it. (Next time anyone draws it = instant death.)
          <div style={{ marginTop: 8 }}>
            <input
              placeholder="Depth from top (0 = top, blank = top)"
              value={insertPos}
              onChange={(e) => setInsertPos(e.target.value)}
              style={{ maxWidth: 260, marginRight: 8 }}
            />
            <button className="gold" onClick={placeKitten}>Place back</button>
          </div>
        </div>
      )}

      {state.revealedKitten && !implodeOnMe && (
        <div className="banner danger">
          ☠️ Imploding Kitten is in the deck — <strong>{state.revealedKitten.depth} cards from top</strong>. Next time anyone draws it, they die instantly (no defuse).
        </div>
      )}

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
          <div style={{ marginTop: 6, fontSize: '0.9rem' }}>
            Nopes: {state.pendingAction.nopes} • Votes:{' '}
            {state.pendingAction.nopes + state.pendingAction.passes}/{state.pendingAction.eligibleCount}
            {state.pendingAction.eligibleCount === 0 && ' (no one has Nope — auto-resolve)'}
          </div>
          {state.pendingAction.youCanVote && !state.pendingAction.youVoted && state.pendingAction.type !== 'favor_pick' && (
            <div style={{ marginTop: 8 }}>
              <button onClick={nope}>NOPE! 🚫</button>
              <button className="secondary" onClick={passVote} style={{ marginLeft: 8 }}>Pass ✋</button>
            </div>
          )}
          {state.pendingAction.youVoted && (
            <div style={{ marginTop: 6, color: 'var(--gold)' }}>You voted — waiting for others...</div>
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

      <div style={{ textAlign: 'right', marginBottom: 8 }}>
        <Rules />
      </div>

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

      {state.yourAlter && (
        <AlterUI cards={state.yourAlter} onSubmit={submitAlter} />
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
              showHelp
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
