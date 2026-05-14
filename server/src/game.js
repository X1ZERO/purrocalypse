import { nanoid } from 'nanoid';
import { CARD_TYPES, CAT_TYPES, buildDeck, shuffle } from './deck.js';

const mk = (type) => ({ id: nanoid(8), type });

export function createGame(players) {
  const n = players.length;
  if (n < 2 || n > 10) throw new Error('Need 2-10 players');

  let deck = buildDeck(n).filter(
    (c) => c.type !== CARD_TYPES.BOMB && c.type !== CARD_TYPES.DEFUSE
  );
  deck = shuffle(deck);

  const hands = {};
  for (const p of players) {
    hands[p.id] = [];
    for (let i = 0; i < 7; i++) hands[p.id].push(deck.pop());
    hands[p.id].push(mk(CARD_TYPES.DEFUSE));
  }

  const extraDefuses = Math.max(0, n - 1);
  for (let i = 0; i < extraDefuses; i++) deck.push(mk(CARD_TYPES.DEFUSE));
  for (let i = 0; i < n - 1; i++) deck.push(mk(CARD_TYPES.BOMB));
  deck.push({ id: nanoid(8), type: CARD_TYPES.IMPLODING_KITTEN, seenOnce: false });
  deck = shuffle(deck);

  const streakerId = players[Math.floor(Math.random() * n)].id;

  return {
    id: nanoid(6),
    players: players.map((p) => ({ ...p, alive: true })),
    hands,
    deck,
    discard: [],
    turnIdx: 0,
    turnsLeft: 1,
    streakerId,
    pendingExplosion: null, // { playerId }
    pendingImplosionPlace: null, // { playerId, cardId }
    pendingAction: null, // { type, by, target?, payload?, nopes: [], resolveAt }
    pendingAlter: null, // { playerId, cards: [...] }
    log: [],
    over: false,
    winnerId: null,
    seeFuturePeek: null, // { playerId, cards: [...] }
  };
}

export function publicState(g, viewerId) {
  return {
    id: g.id,
    players: g.players.map((p) => ({
      id: p.id,
      name: p.name,
      alive: p.alive,
      handCount: g.hands[p.id]?.length || 0,
      isStreaker: p.id === g.streakerId,
    })),
    deckCount: g.deck.length,
    discardTop: g.discard[g.discard.length - 1] || null,
    turnPlayerId: currentPlayer(g)?.id || null,
    turnsLeft: g.turnsLeft,
    pendingExplosion: g.pendingExplosion,
    pendingImplosionPlace: g.pendingImplosionPlace
      ? { playerId: g.pendingImplosionPlace.playerId }
      : null,
    revealedKitten: findRevealedKitten(g),
    pendingAction: g.pendingAction
      ? {
          type: g.pendingAction.type,
          by: g.pendingAction.by,
          target: g.pendingAction.target,
          payload: g.pendingAction.payload,
          nopes: g.pendingAction.nopes.length,
          passes: g.pendingAction.passes?.length || 0,
          eligibleCount: g.pendingAction.eligible?.length || 0,
          youCanVote: g.pendingAction.eligible?.includes(viewerId) || false,
          youVoted:
            g.pendingAction.nopes.includes(viewerId) ||
            (g.pendingAction.passes || []).includes(viewerId),
        }
      : null,
    log: g.log.slice(-30),
    over: g.over,
    winnerId: g.winnerId,
    yourHand: viewerId ? g.hands[viewerId] || [] : [],
    yourPeek:
      g.seeFuturePeek && g.seeFuturePeek.playerId === viewerId
        ? g.seeFuturePeek.cards
        : null,
    yourAlter:
      g.pendingAlter && g.pendingAlter.playerId === viewerId
        ? g.pendingAlter.cards
        : null,
  };
}

function findRevealedKitten(g) {
  for (let i = g.deck.length - 1; i >= 0; i--) {
    const c = g.deck[i];
    if (c.type === CARD_TYPES.IMPLODING_KITTEN && c.seenOnce) {
      return { depth: g.deck.length - 1 - i };
    }
  }
  return null;
}

function currentPlayer(g) {
  const alive = g.players.filter((p) => p.alive);
  if (alive.length === 0) return null;
  return g.players[g.turnIdx];
}

function advanceTurn(g) {
  const n = g.players.length;
  for (let step = 0; step < n; step++) {
    g.turnIdx = (g.turnIdx + 1) % n;
    if (g.players[g.turnIdx].alive) {
      g.turnsLeft = 1;
      g.seeFuturePeek = null;
      return;
    }
  }
}

function checkWin(g) {
  const alive = g.players.filter((p) => p.alive);
  if (alive.length <= 1) {
    g.over = true;
    g.winnerId = alive[0]?.id || null;
    g.log.push(`Game over. Winner: ${alive[0]?.name || 'nobody'}`);
  }
}

function logCard(g, msg) {
  g.log.push(msg);
}

function removeCardsFromHand(hand, cardIds) {
  const removed = [];
  const remaining = [];
  for (const c of hand) {
    if (cardIds.includes(c.id) && removed.length < cardIds.length) {
      removed.push(c);
    } else {
      remaining.push(c);
    }
  }
  return { removed, remaining };
}

export function playCards(g, playerId, cardIds, opts = {}) {
  if (g.over) throw new Error('Game over');
  const cur = currentPlayer(g);
  if (!cur || cur.id !== playerId) throw new Error('Not your turn');
  if (g.pendingExplosion) throw new Error('Resolve explosion first');
  if (g.pendingImplosionPlace) throw new Error('Place the Imploding Kitten first');
  if (g.pendingAlter) throw new Error('Finish Alter the Future first');

  const hand = g.hands[playerId];
  const { removed, remaining } = removeCardsFromHand(hand, cardIds);
  if (removed.length !== cardIds.length)
    throw new Error('Cards not in hand');

  const types = removed.map((c) => c.type);
  const isCatLike = (t) => CAT_TYPES.includes(t) || t === CARD_TYPES.FERAL_CAT;
  const isCatCombo = (n) => {
    if (types.length !== n) return false;
    if (!types.every(isCatLike)) return false;
    const reals = types.filter((t) => t !== CARD_TYPES.FERAL_CAT);
    if (reals.length === 0) return false;
    return reals.every((t) => t === reals[0]);
  };

  if (removed.length === 1) {
    const c = removed[0];
    g.hands[playerId] = remaining;
    g.discard.push(c);
    applySingleCard(g, playerId, c, opts);
  } else if (isCatCombo(2)) {
    g.hands[playerId] = remaining;
    g.discard.push(...removed);
    if (!opts.target) throw new Error('Pick a target');
    queueAction(g, {
      type: 'steal_random',
      by: playerId,
      target: opts.target,
      nopes: [],
    });
  } else if (isCatCombo(3)) {
    g.hands[playerId] = remaining;
    g.discard.push(...removed);
    if (!opts.target || !opts.cardType) throw new Error('Pick target + card');
    queueAction(g, {
      type: 'steal_named',
      by: playerId,
      target: opts.target,
      payload: { cardType: opts.cardType },
      nopes: [],
    });
  } else {
    throw new Error('Invalid combo');
  }
}

function applySingleCard(g, playerId, card, opts) {
  switch (card.type) {
    case CARD_TYPES.SKIP:
      queueAction(g, { type: 'skip', by: playerId, nopes: [] });
      break;
    case CARD_TYPES.ATTACK:
      queueAction(g, { type: 'attack', by: playerId, nopes: [] });
      break;
    case CARD_TYPES.SHUFFLE:
      queueAction(g, { type: 'shuffle', by: playerId, nopes: [] });
      break;
    case CARD_TYPES.SEE_FUTURE:
      queueAction(g, { type: 'see_future', by: playerId, nopes: [] });
      break;
    case CARD_TYPES.FAVOR:
      if (!opts.target) throw new Error('Pick a target');
      queueAction(g, { type: 'favor', by: playerId, target: opts.target, nopes: [] });
      break;
    case CARD_TYPES.TARGETED_ATTACK:
      if (!opts.target) throw new Error('Pick a target');
      queueAction(g, { type: 'targeted_attack', by: playerId, target: opts.target, nopes: [] });
      break;
    case CARD_TYPES.ALTER_FUTURE:
      queueAction(g, { type: 'alter_future', by: playerId, nopes: [] });
      break;
    case CARD_TYPES.FERAL_CAT:
      throw new Error('Feral Cat plays only as part of a cat combo');
    case CARD_TYPES.NOPE:
      throw new Error('Nope only plays on pending action');
    case CARD_TYPES.DEFUSE:
      throw new Error('Defuse plays only when you draw a bomb');
    case CARD_TYPES.BOMB:
      throw new Error('Cannot play bomb');
    default: {
      const p = g.players.find((x) => x.id === playerId);
      logCard(g, `${p.name} discards ${card.type}`);
      break;
    }
  }
}

function eligibleNopers(g, actorId) {
  return g.players
    .filter((p) => p.alive && p.id !== actorId)
    .filter((p) => g.hands[p.id].some((c) => c.type === CARD_TYPES.NOPE))
    .map((p) => p.id);
}

function queueAction(g, action) {
  action.passes = [];
  action.eligible = eligibleNopers(g, action.by);
  g.pendingAction = action;
  const by = g.players.find((p) => p.id === action.by);
  const tgt = g.players.find((p) => p.id === action.target);
  logCard(
    g,
    `${by?.name} plays ${action.type}${tgt ? ` on ${tgt.name}` : ''}`
  );
}

export function allVoted(g) {
  const a = g.pendingAction;
  if (!a) return false;
  if (a.type === 'favor_pick') return false;
  const voted = new Set([...a.nopes, ...a.passes]);
  return a.eligible.every((id) => voted.has(id));
}

export function playNope(g, playerId) {
  if (!g.pendingAction) throw new Error('Nothing to Nope');
  if (g.pendingAction.type === 'favor_pick') throw new Error('Cannot Nope a favor pick');
  const hand = g.hands[playerId];
  const idx = hand.findIndex((c) => c.type === CARD_TYPES.NOPE);
  if (idx < 0) throw new Error('No Nope in hand');
  const [card] = hand.splice(idx, 1);
  g.discard.push(card);
  g.pendingAction.nopes.push(playerId);
  g.pendingAction.passes = g.pendingAction.passes.filter((id) => id !== playerId);
  g.pendingAction.eligible = eligibleNopers(g, g.pendingAction.by);
  if (!g.pendingAction.eligible.includes(playerId) && playerId !== g.pendingAction.by) {
    g.pendingAction.eligible.push(playerId);
  }
  const p = g.players.find((x) => x.id === playerId);
  logCard(g, `${p.name} Nopes!`);
}

export function passNope(g, playerId) {
  if (!g.pendingAction) throw new Error('Nothing to pass on');
  if (g.pendingAction.type === 'favor_pick') throw new Error('Nothing to pass on');
  if (!g.pendingAction.eligible.includes(playerId))
    throw new Error('You have no Nope to vote with');
  if (g.pendingAction.passes.includes(playerId)) return;
  g.pendingAction.passes.push(playerId);
}

export function resolvePending(g) {
  const a = g.pendingAction;
  if (!a) return;
  g.pendingAction = null;
  const noped = a.nopes.length % 2 === 1;
  const by = g.players.find((p) => p.id === a.by);
  const tgt = g.players.find((p) => p.id === a.target);
  if (noped) {
    logCard(g, `${by?.name}'s ${a.type} was Noped`);
    return;
  }
  switch (a.type) {
    case 'skip': {
      logCard(g, `${by.name} plays Skip`);
      g.turnsLeft -= 1;
      if (g.turnsLeft <= 0) advanceTurn(g);
      break;
    }
    case 'attack': {
      logCard(g, `${by.name} plays Attack`);
      g.turnsLeft = 0;
      advanceTurn(g);
      g.turnsLeft = 2;
      break;
    }
    case 'shuffle': {
      logCard(g, `${by.name} plays Shuffle`);
      g.deck = shuffle(g.deck);
      break;
    }
    case 'see_future': {
      logCard(g, `${by.name} plays See Future`);
      const top = g.deck.slice(-3).reverse();
      g.seeFuturePeek = { playerId: a.by, cards: top };
      break;
    }
    case 'alter_future': {
      logCard(g, `${by.name} plays Alter the Future`);
      const top = g.deck.slice(-3).reverse();
      g.pendingAlter = { playerId: a.by, cards: top };
      break;
    }
    case 'targeted_attack': {
      const tIdx = g.players.findIndex((x) => x.id === a.target);
      if (tIdx < 0 || !g.players[tIdx].alive) break;
      logCard(g, `${by.name} plays Targeted Attack on ${tgt.name}`);
      g.turnsLeft = 0;
      g.turnIdx = (tIdx - 1 + g.players.length) % g.players.length;
      advanceTurn(g);
      g.turnsLeft = 2;
      break;
    }
    case 'favor': {
      g.pendingAction = { ...a, type: 'favor_pick', nopes: [], passes: [], eligible: [] };
      return;
    }
    case 'steal_random': {
      const targetHand = g.hands[a.target];
      if (targetHand.length === 0) {
        logCard(g, `${tgt.name} has no cards to steal`);
        break;
      }
      const i = Math.floor(Math.random() * targetHand.length);
      const [card] = targetHand.splice(i, 1);
      g.hands[a.by].push(card);
      logCard(g, `${by.name} stole a card from ${tgt.name}`);
      break;
    }
    case 'steal_named': {
      const targetHand = g.hands[a.target];
      const idx = targetHand.findIndex((c) => c.type === a.payload.cardType);
      if (idx >= 0) {
        const [card] = targetHand.splice(idx, 1);
        g.hands[a.by].push(card);
        logCard(g, `${by.name} took a ${a.payload.cardType} from ${tgt.name}`);
      } else {
        logCard(g, `${tgt.name} had no ${a.payload.cardType}`);
      }
      break;
    }
  }
}

export function alterCommit(g, playerId, orderedIds) {
  if (!g.pendingAlter || g.pendingAlter.playerId !== playerId)
    throw new Error('No alter pending');
  const ids = g.pendingAlter.cards.map((c) => c.id);
  if (orderedIds.length !== ids.length ||
      !orderedIds.every((id) => ids.includes(id)) ||
      new Set(orderedIds).size !== orderedIds.length)
    throw new Error('Invalid order');
  const byId = new Map(g.pendingAlter.cards.map((c) => [c.id, c]));
  const newTop = orderedIds.map((id) => byId.get(id));
  for (let i = 0; i < newTop.length; i++) {
    g.deck[g.deck.length - 1 - i] = newTop[i];
  }
  g.pendingAlter = null;
}

export function favorGive(g, targetId, cardId) {
  const a = g.pendingAction;
  if (!a || a.type !== 'favor_pick') throw new Error('No favor pending');
  if (a.target !== targetId) throw new Error('Not the favor target');
  const hand = g.hands[targetId];
  const idx = hand.findIndex((c) => c.id === cardId);
  if (idx < 0) throw new Error('Card not in hand');
  const [card] = hand.splice(idx, 1);
  g.hands[a.by].push(card);
  const tgt = g.players.find((p) => p.id === targetId);
  const by = g.players.find((p) => p.id === a.by);
  logCard(g, `${tgt.name} gave a card to ${by.name}`);
  g.pendingAction = null;
}

export function drawCard(g, playerId) {
  if (g.over) throw new Error('Game over');
  const cur = currentPlayer(g);
  if (!cur || cur.id !== playerId) throw new Error('Not your turn');
  if (g.pendingExplosion) throw new Error('Resolve explosion');
  if (g.pendingImplosionPlace) throw new Error('Place the Imploding Kitten first');
  if (g.pendingAction) throw new Error('Resolve pending action');
  if (g.pendingAlter) throw new Error('Finish Alter the Future first');
  if (g.deck.length === 0) {
    g.deck = shuffle(g.discard);
    g.discard = [];
  }
  const card = g.deck.pop();
  const p = g.players.find((x) => x.id === playerId);
  if (card.type === CARD_TYPES.BOMB) {
    g.pendingExplosion = { playerId, bombId: card.id };
    logCard(g, `${p.name} drew a BOMB!`);
    return;
  }
  if (card.type === CARD_TYPES.IMPLODING_KITTEN) {
    if (!card.seenOnce) {
      card.seenOnce = true;
      g.pendingImplosionPlace = { playerId, cardId: card.id };
      logCard(g, `${p.name} revealed the IMPLODING KITTEN! Must place it back face-up.`);
      return;
    }
    p.alive = false;
    g.discard.push(...g.hands[playerId], card);
    g.hands[playerId] = [];
    logCard(g, `${p.name} drew the Imploding Kitten a second time — INSTANT EXPLOSION! No defuse possible.`);
    checkWin(g);
    if (!g.over) {
      g.turnsLeft = 1;
      if (!g.players[g.turnIdx].alive) advanceTurn(g);
    }
    return;
  }
  g.hands[playerId].push(card);
  logCard(g, `${p.name} drew a card`);
  g.turnsLeft -= 1;
  if (g.turnsLeft <= 0) advanceTurn(g);
}

export function placeImploding(g, playerId, insertPos) {
  if (!g.pendingImplosionPlace || g.pendingImplosionPlace.playerId !== playerId)
    throw new Error('No imploding kitten to place');
  const cardId = g.pendingImplosionPlace.cardId;
  const card = { id: cardId, type: CARD_TYPES.IMPLODING_KITTEN, seenOnce: true };
  const pos = Math.max(0, Math.min(g.deck.length, insertPos ?? 0));
  g.deck.splice(g.deck.length - pos, 0, card);
  const p = g.players.find((x) => x.id === playerId);
  logCard(g, `${p.name} placed the Imploding Kitten back (depth ${pos}).`);
  g.pendingImplosionPlace = null;
  g.turnsLeft -= 1;
  if (g.turnsLeft <= 0) advanceTurn(g);
}

export function defuse(g, playerId, insertPos) {
  if (!g.pendingExplosion || g.pendingExplosion.playerId !== playerId)
    throw new Error('No bomb pending for you');
  const hand = g.hands[playerId];
  const idx = hand.findIndex((c) => c.type === CARD_TYPES.DEFUSE);
  if (idx < 0) throw new Error('No defuse');
  const [defuseCard] = hand.splice(idx, 1);
  g.discard.push(defuseCard);
  const bomb = { id: g.pendingExplosion.bombId, type: CARD_TYPES.BOMB };
  const pos = Math.max(0, Math.min(g.deck.length, insertPos ?? g.deck.length));
  g.deck.splice(g.deck.length - pos, 0, bomb);
  const p = g.players.find((x) => x.id === playerId);
  logCard(g, `${p.name} defused the bomb!`);
  g.pendingExplosion = null;
  g.turnsLeft -= 1;
  if (g.turnsLeft <= 0) advanceTurn(g);
}

export function explode(g, playerId) {
  if (!g.pendingExplosion || g.pendingExplosion.playerId !== playerId) return;
  const p = g.players.find((x) => x.id === playerId);
  p.alive = false;
  g.discard.push(...g.hands[playerId]);
  g.hands[playerId] = [];
  g.discard.push({ id: g.pendingExplosion.bombId, type: CARD_TYPES.BOMB });
  logCard(g, `${p.name} EXPLODED!`);
  g.pendingExplosion = null;
  checkWin(g);
  if (!g.over) {
    g.turnsLeft = 1;
    if (!g.players[g.turnIdx].alive) advanceTurn(g);
  }
}
