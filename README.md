# Purrocalypse

Online multiplayer party card game. Draw cards. Avoid the boom. Last cat standing wins.

Inspired by the Exploding Kittens party edition (2–10 players). Original art and naming — not affiliated with Exploding Kittens Inc.

## Stack

- Server: Node 20 + Express + Socket.IO
- Client: React 18 + Vite
- Realtime rooms over WebSockets

## Quick start

```bash
npm install
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001

Open the client URL in multiple browser tabs / on multiple devices on the same LAN to test.

## How to play

1. Open the client, pick a nickname.
2. Create a room (get a 4-letter code) or join with a friend's code.
3. Host clicks **Start** once 2–10 players are in.
4. On your turn: play any number of cards, then draw one to end turn.
5. Draw a Bomb Cat = you explode. Play a Defuse to survive (reinsert the bomb anywhere).
6. Last player alive wins.

## Cards

| Card | Effect |
|---|---|
| Bomb Cat | Draw it = you die unless you have a Defuse |
| Defuse | Cancel a bomb, reinsert it in the deck at your chosen depth |
| Skip | End turn without drawing |
| Attack | End turn, next player takes 2 turns |
| Favor | Pick a player; they hand you a card of their choice |
| Shuffle | Shuffle the draw pile |
| See Future | Peek at top 3 cards of the deck |
| Nope | Cancel any other action (except Bomb/Defuse). Stackable. |
| Cat pair (2) | Steal a random card from a target player |
| Cat triple (3) | Name a card; take it from target if they have it |
| Half-Bomb (party) | Combine 2 halves = instant KO on a target |
| Streaker (party) | One player plays with no hand — exposed |

## License

MIT
