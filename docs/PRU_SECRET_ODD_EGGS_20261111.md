# PRU Secret Odd Eggs — 11 November 2026

**Status:** Development branch only. **NOT yet in public Alpha 3.** Static source checks passed; gameplay QA and new ROM build pending.

## How to get the eggs
At the Route 34 Day-Care, south of Goldenrod City, the clerk accepts four Easy Chat words. A separate NPC outdoors has Pichu, Cleffa, Igglybuff and Togepi overworld sprites wandering around them. They provide the cryptic nursery rhyme clue labels, not an explanation.

## PRU custom eggs
| NPC clue | Egg Pokémon | Four words |
|---|---|---|
| Baby Bug | Scarabub | GUTS / BUG / BABY / PLAY |
| Baby Bird | Skarmet | STURDY / FLYING / SILVER / SHINE |
| Baby Calf | Mootiny | THICK FAT / NORMAL / CUTE / SLEEP |
| Baby Gem | Gemlin | KEEN EYE / GHOST / MYSTERY / SHINE |

Each custom egg has its own one-time saved claim flag, so all four are obtainable in one playthrough. Scarabub, Skarmet and Mootiny are removed from six day/night fixed wild slots; Gemlin was not listed as wild. Evolution lines unchanged.

## Original Odd Eggs
| Pokémon | Four words |
|---|---|
| Pichu | STATIC / ELECTRIC / WAAAH / PLAY |
| Cleffa | CUTE CHARM / NORMAL / EEK / LOOKS |
| Igglybuff | CUTE CHARM / NORMAL / LALALA / SLEEP |
| Tyrogue | GUTS / FIGHTING / HIYAH / TRAINS |
| Smoochum | OBLIVIOUS / ICE / EHEHE / SHOW |
| Elekid | STATIC / ELECTRIC / OI OI OI / STORES |
| Magby | FLAME BODY / FIRE / TCH / ANGERS |

Only one of the seven original choices is claimable per save; the four custom eggs have independent flags.

## Other source fix
The Pokémon summary-screen Move Relearner shortcut is disabled; NPC move relearning remains available.

## Artwork
The approved 11 November Gemlin GBA sprite should be used unaltered on RelicDex; the older small purple sprite must not be mistaken for the new artwork.

## Sources
PRU branch: fix/pru-four-secret-eggs-and-nursery-clues-20261111. Implementation: src/easy_chat.c; src/scrcmd.c; data/maps/Route34_DayCare_hns/scripts.inc; data/maps/Route34_hns/map.json and scripts.inc; src/data/wild_encounters.json; include/constants/flags_hns.h; include/config/summary_screen.h.


## Purchased mystery eggs
The separate ¥5,000 mystery egg seller now uses only nine classic Kanto/Johto/Hoenn starters: Bulbasaur, Charmander, Squirtle, Chikorita, Cyndaquil, Totodile, Treecko, Torchic and Mudkip. Each has an equal chance. Scarabub, Skarmet, Mootiny and Gemlin are removed from this paid pool. Source change only, not public Alpha 3.
