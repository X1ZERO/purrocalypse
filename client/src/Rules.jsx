import { useState } from 'react';
import { LABELS, ICONS, RULES } from './Card.jsx';

const ORDER = [
  'bomb', 'defuse', 'nope',
  'skip', 'attack', 'targeted_attack',
  'favor', 'shuffle', 'see_future', 'alter_future',
  'cat_taco', 'cat_beard', 'cat_potato', 'cat_rainbow', 'cat_melon', 'feral_cat',
  'half_bomb_a', 'half_bomb_b',
];

export default function Rules() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="secondary" onClick={() => setOpen(true)}>📖 Rules</button>
      {open && (
        <div className="target-picker" onClick={() => setOpen(false)}>
          <div className="panel rules-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>📖 How to play</h2>
              <button className="secondary" onClick={() => setOpen(false)}>✕</button>
            </div>
            <h3>Goal</h3>
            <p>Be the last player not exploded. Draw cards on your turn. If you draw a Bomb Cat, use a Defuse or you're out.</p>
            <h3>Your turn</h3>
            <ol>
              <li>Play any number of cards (or none).</li>
              <li>End your turn by drawing 1 card from the deck.</li>
              <li>Pass to the next player on your left.</li>
            </ol>
            <h3>Cards</h3>
            <div className="rules-grid">
              {ORDER.map((t) => (
                <div key={t} className="rules-row">
                  <div className={`card mini ${t}`}>
                    <div className="icon">{ICONS[t]}</div>
                    <div className="name">{LABELS[t]}</div>
                  </div>
                  <div className="rules-text">{RULES[t]}</div>
                </div>
              ))}
            </div>
            <h3>Combos</h3>
            <ul>
              <li><strong>Cat pair</strong> (2 same cats): steal a random card from a target.</li>
              <li><strong>Cat triple</strong> (3 same cats): name a card type; take it from target if they have it.</li>
              <li><strong>Feral Cat</strong>: counts as any cat to complete a pair/triple. Needs at least 1 matching real cat.</li>
              <li><strong>Half-Bomb L + R</strong>: instantly KO any player. (Can be Noped.)</li>
            </ul>
            <h3>Streaker</h3>
            <p>One random player starts with no hand. They just draw + play each turn — fully exposed.</p>
            <h3>Nope window</h3>
            <p>After most actions, there's a 3.5s window for anyone to play Nope. Stack multiple Nopes to cancel each other (odd = canceled, even = passes).</p>
            <button onClick={() => setOpen(false)} style={{ marginTop: 12 }}>Got it</button>
          </div>
        </div>
      )}
    </>
  );
}
