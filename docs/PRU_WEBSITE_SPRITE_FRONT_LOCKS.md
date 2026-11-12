# Website battle-front approval locks — 12 November 2026

These are website-only sprite references, not ROM changes.

The Pokédex displays one front sprite only. Back, shiny and party-icon source files are retained for ROM use but not rendered as website tabs.

## Source provenance

- Black Charaxis: exact approved assets/pru-art/dex/charaxis_black_orange.png, not the old orange front.
- Edensaur/Feralodon: keep the most recently user-approved GBA art from the prior website update.
- Eighteen opaque front PNGs: preserve existing art/color pixels and remove only flat background regions connected to canvas edges; clean PNGs in assets/sprites/web-fronts/.
- Raikou, Entei and Suicune: extract one approved front frame from each PRU Relic animation strip. Never downsample entire animation strips as single images.
- Lugia, Celebi and Golden Ho-Oh: use the approved relic_*/front.png art.
- I-Unown: assets/sprites/i_unown/front.png, sharing Unown's Pokédex species number.
- Rayquaza: existing approved black shiny art matching the black-locked PRU form.
- Ancient Guardian Dragonite: do not show an incorrect generic Dragonite sprite. Its exclusive approved front must be sourced first.

## Anti-regression procedure

js/app.js now includes APPROVED_FRONT_LOCKS that override stale values from older Pokédex exports. When approving NEW art, update both data/pokemon.json and APPROVED_FRONT_LOCKS. Do not blindly overwrite locked fronts from an older Alpha 4 archive or source branch.

## Validation

- All 450 Pokédex front paths exist and have transparent corners.
- 27 legendary/special encounter records; 26 front images and an explicit Guardian artwork-pending placeholder.
- No front/back/shiny/icon tabs or extra artwork galleries in Pokédex detail.
- All guide cards use their assigned approved images.
- Service worker cache bumped; old orange Charaxis removed from precache.
- No ROM build or additional GitHub Actions workflow needed.
