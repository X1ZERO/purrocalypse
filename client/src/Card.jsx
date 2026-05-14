const ICONS = {
  bomb: '💥',
  defuse: '🧯',
  skip: '⏭️',
  attack: '⚔️',
  favor: '🙏',
  shuffle: '🔀',
  see_future: '🔮',
  nope: '🚫',
  cat_taco: '🌮',
  cat_beard: '🧔',
  cat_potato: '🥔',
  cat_rainbow: '🌈',
  cat_melon: '🍉',
  half_bomb_a: '◐',
  half_bomb_b: '◑',
};

const LABELS = {
  bomb: 'Bomb Cat',
  defuse: 'Defuse',
  skip: 'Skip',
  attack: 'Attack',
  favor: 'Favor',
  shuffle: 'Shuffle',
  see_future: 'See Future',
  nope: 'Nope!',
  cat_taco: 'Tacocat',
  cat_beard: 'Beard Cat',
  cat_potato: 'Potato Cat',
  cat_rainbow: 'Rainbow Cat',
  cat_melon: 'Melon Cat',
  half_bomb_a: 'Half-Bomb L',
  half_bomb_b: 'Half-Bomb R',
};

export default function Card({ card, selected, onClick }) {
  return (
    <div
      className={`card ${card.type} ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="icon">{ICONS[card.type] || '?'}</div>
      <div className="name">{LABELS[card.type] || card.type}</div>
    </div>
  );
}

export { LABELS, ICONS };
