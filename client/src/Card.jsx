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
  feral_cat: '😼',
  alter_future: '🔮',
  targeted_attack: '🎯',
  imploding_kitten: '☠️',
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
  feral_cat: 'Feral Cat',
  alter_future: 'Alter Future',
  targeted_attack: 'Target Attack',
  imploding_kitten: 'Imploding Kitten',
};

const RULES = {
  bomb: 'Draw it = you die unless you have a Defuse. End of game for you.',
  defuse: 'Play it when you draw a Bomb. Put the Bomb back in the deck at any position you choose.',
  skip: 'End your turn without drawing a card. If under Attack, only skips 1 of the 2 turns.',
  attack: 'End your turn without drawing. Next player must take 2 turns. Stacks if attacked back.',
  favor: 'Pick a player. They must give you 1 card of their choice from their hand.',
  shuffle: 'Shuffle the draw pile. Useful when you fear a Bomb is near the top.',
  see_future: 'Privately peek at the top 3 cards of the deck. Order shown is draw order.',
  nope: 'Cancel any action (NOT Bombs/Defuses). Stackable: Nope a Nope = action plays. Can be played any time.',
  cat_taco: 'A pair (2 same) lets you steal a RANDOM card from another player. A triple lets you NAME a card to take.',
  cat_beard: 'A pair (2 same) lets you steal a RANDOM card from another player. A triple lets you NAME a card to take.',
  cat_potato: 'A pair (2 same) lets you steal a RANDOM card from another player. A triple lets you NAME a card to take.',
  cat_rainbow: 'A pair (2 same) lets you steal a RANDOM card from another player. A triple lets you NAME a card to take.',
  cat_melon: 'A pair (2 same) lets you steal a RANDOM card from another player. A triple lets you NAME a card to take.',
  feral_cat: 'Wild cat. Counts as ANY Cat card to form pairs or triples. Cannot be played alone.',
  alter_future: 'Privately view top 3 of the deck AND rearrange them in any order. (Party Pack)',
  targeted_attack: 'Like Attack — end your turn without drawing — BUT you pick any player to take 2 turns. (Party Pack)',
  imploding_kitten: 'One hidden in deck. First draw: place it back face-up anywhere. Second time anyone draws it: instant explosion, NO defuse works.',
};

export default function Card({ card, selected, onClick, showHelp }) {
  return (
    <div
      className={`card ${card.type} ${selected ? 'selected' : ''}`}
      onClick={onClick}
      title={showHelp ? RULES[card.type] : undefined}
    >
      <div className="icon">{ICONS[card.type] || '?'}</div>
      <div className="name">{LABELS[card.type] || card.type}</div>
    </div>
  );
}

export { LABELS, ICONS, RULES };
