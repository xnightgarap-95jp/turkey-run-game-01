# Gobble Run — Turkey's Great Escape

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/xnightgarap-95jp/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/xnightgarap-95jp/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

A complete, original 2D canvas turkey escape game for the [make.fun turkey-run-game-01 bounty](https://make.fun/bounty/turkey-run-game-01). Thanksgiving is coming and the farmer is coming faster: run 1200 metres from the farmyard, through the kitchen, and out the window — or become dinner.

## How it plays

- **Jump** (Space / ↑ / click) over fences, pots and oven flames; **hide** (↓ / S) in the hay bales while the farmer searches; **dash** (Shift / X) when he lunges.
- The **farmer chases** from behind: every stumble lets him catch up, every corn cob and clean dash opens the gap. If the gap closes, you are caught.
- Two stages that grow harder: **Stage 1 — The Farmyard** (fences, hay, mud puddles, corn) and **Stage 2 — The Kitchen** (flaming ovens, falling carving knives, steaming pots).
- HUD shows score, distance, corn, lives and a live farmer-proximity meter. Title screen, pause, and end screens for **caught** or **escaped**, with restart.
- Synthesised WebAudio sound (gobbles, jumps, pickups, the farmer closing in) — no audio files, no network. M to mute.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Static files only: `game/index.html` opens in desktop Chrome and plays offline, with no network request.

## Layout

- `game/index.html`, `game/style.css` — page shell
- `game/src/main.js` — state machine, turkey physics, frame loop
- `game/src/config.js` — tuning, palette, stages
- `game/src/world.js` — spawning, collisions, farmer chase AI
- `game/src/art.js` — all art, drawn fresh with canvas paths
- `game/src/render.js` — scenery, HUD, title and end screens
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — synthesised WebAudio effects
- `game/src/shots.js` — deterministic screenshot poses (`?shot=start|farm|kitchen|end`)
- `game/src/random.js` — seeded RNG
- `main.ts` — the make.fun entrypoint: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
- `vendor/makefun-game.ts` — the kit's library, unchanged

## License

MIT — see [LICENSE](LICENSE).
