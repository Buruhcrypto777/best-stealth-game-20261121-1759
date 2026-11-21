# NIGHTSHIFT: The Meridian Archive

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Buruhcrypto777/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Buruhcrypto777/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A complete, original top-down 2D stealth game that plays offline in a desktop browser from static files. You are a night-shift archivist sneaking through the Meridian Archive across 3 levels (Lobby, Gallery, Vault): slip past patrolling guards whose vision cones are clipped by walls and crates, hide in dark floor patches, toss coins to lure guards away, grab the keycard, and reach the green exit door unseen.

Guards patrol, grow suspicious, chase, and search. A detection meter (0–100) fills with distance, light, and movement speed; at 100 they chase, and being touched means caught. Running makes noise, sneaking is slow but quiet, and finishing without a single alarm earns a GHOST rating.

Controls: WASD / arrow keys to move, Shift to sneak, click or Q to toss a coin (3 per level), P to pause, M to mute, R to restart. All art is drawn in code and all sound is synthesized WebAudio — no external assets, no network.

Run `node serve.ts` and open http://localhost:8080 to play, or run `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` to hand the game in.

Built for the make.fun bounty — join with my referral: https://make.fun/r/1dmvtzwc
