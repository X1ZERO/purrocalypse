import { nanoid } from 'nanoid';

export const CARD_TYPES = {
  BOMB: 'bomb',
  DEFUSE: 'defuse',
  SKIP: 'skip',
  ATTACK: 'attack',
  FAVOR: 'favor',
  SHUFFLE: 'shuffle',
  SEE_FUTURE: 'see_future',
  NOPE: 'nope',
  CAT_TACO: 'cat_taco',
  CAT_BEARD: 'cat_beard',
  CAT_POTATO: 'cat_potato',
  CAT_RAINBOW: 'cat_rainbow',
  CAT_MELON: 'cat_melon',
  HALF_BOMB_A: 'half_bomb_a',
  HALF_BOMB_B: 'half_bomb_b',
};

export const CAT_TYPES = [
  CARD_TYPES.CAT_TACO,
  CARD_TYPES.CAT_BEARD,
  CARD_TYPES.CAT_POTATO,
  CARD_TYPES.CAT_RAINBOW,
  CARD_TYPES.CAT_MELON,
];

export const CARD_LABEL = {
  bomb: 'Bomb Cat',
  defuse: 'Defuse',
  skip: 'Skip',
  attack: 'Attack',
  favor: 'Favor',
  shuffle: 'Shuffle',
  see_future: 'See Future',
  nope: 'Nope',
  cat_taco: 'Tacocat',
  cat_beard: 'Beard Cat',
  cat_potato: 'Potato Cat',
  cat_rainbow: 'Rainbow Cat',
  cat_melon: 'Melon Cat',
  half_bomb_a: 'Half-Bomb (Left)',
  half_bomb_b: 'Half-Bomb (Right)',
};

const mk = (type, count) =>
  Array.from({ length: count }, () => ({ id: nanoid(8), type }));

export function buildDeck(playerCount) {
  const deck = [
    ...mk(CARD_TYPES.SKIP, 4),
    ...mk(CARD_TYPES.ATTACK, 4),
    ...mk(CARD_TYPES.FAVOR, 4),
    ...mk(CARD_TYPES.SHUFFLE, 4),
    ...mk(CARD_TYPES.SEE_FUTURE, 5),
    ...mk(CARD_TYPES.NOPE, 5),
    ...mk(CARD_TYPES.CAT_TACO, 4),
    ...mk(CARD_TYPES.CAT_BEARD, 4),
    ...mk(CARD_TYPES.CAT_POTATO, 4),
    ...mk(CARD_TYPES.CAT_RAINBOW, 4),
    ...mk(CARD_TYPES.CAT_MELON, 4),
    ...mk(CARD_TYPES.HALF_BOMB_A, 1),
    ...mk(CARD_TYPES.HALF_BOMB_B, 1),
  ];
  if (playerCount > 5) {
    deck.push(...mk(CARD_TYPES.SKIP, 2));
    deck.push(...mk(CARD_TYPES.ATTACK, 2));
    deck.push(...mk(CARD_TYPES.NOPE, 2));
    deck.push(...mk(CARD_TYPES.SEE_FUTURE, 2));
  }
  return deck;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
