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
- Ancient Guardian Dragonite: now uses the exact user-approved blue-crystal Elite Redux Mega Dragonite front from the PJR asset lock, only on the special Legendary guide card.
- Mew: Insurgence Space Mew front from the PRU species source (not vanilla pink Mew).
- Mewtwo: Insurgence Shadow Mewtwo front from the PRU species source (not regular vanilla Mewtwo).
- Kyogre and Groudon: existing PRU dark/black legendary front assets, rather than older page previews.
- Mewduo: exact existing site front with the accidentally opaque white patch inside the red tail hoop cleared to transparency.

## Anti-regression procedure

js/app.js now includes APPROVED_FRONT_LOCKS that override stale values from older Pokédex exports. When approving NEW art, update both data/pokemon.json and APPROVED_FRONT_LOCKS. Do not blindly overwrite locked fronts from an older Alpha 4 archive or source branch.

## Validation

- All 450 Pokédex front paths exist and have transparent corners.
- 27 legendary/special encounter records; 27 appropriate front images including the exclusive Ancient Guardian Dragonite.
- No front/back/shiny/icon tabs or extra artwork galleries in Pokédex detail.
- All guide cards use their assigned approved images.
- Service worker cache bumped; old orange Charaxis removed from precache.
- No ROM build or additional GitHub Actions workflow needed.
