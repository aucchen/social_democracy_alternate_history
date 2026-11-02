# Red Germany: 1919–1923

An alternate-history game about the Communist Party of Germany (KPD) from its founding in January 1919 to the crisis of 1923. You hold the party's Zentrale, but the districts, the factions and Moscow all have their own ideas.

This is a modification of [Social Democracy: An Alternate History](https://github.com/aucchen/social_democracy_alternate_history) by Autumn Chen (MIT licence). The original game's 1928–1934 content is kept for reference in `archive/base_game/` and is not part of the build.

## Status

Early build: January to April 1919 is playable (the January Uprising, the National Assembly election, four card decks and three advisors).

## How the game works

- **Factions set the party line.** The faction leading the Zentrale decides which actions are open, against the line (allowed, but costs Unity), or forbidden. A Left Radical Zentrale cannot propose a united front at all.
- **Districts can defy the Zentrale.** Each district has its own faction, members and loyalty. Loyal districts carry out your cards; defiant ones may act alone.
- **Factions can split.** A faction whose satisfaction falls too low walks out with its districts' members.
- **Meters:** Unity, Militancy, Worker support, Repression, SPD and USPD relations, Independence from Moscow, World revolution, plus Republic stability.

The party logic (party line, district totals, faction strength, monthly drift) lives in `source/scenes/post_event.scene.dry`; the starting state is in `source/scenes/root.scene.dry`.

Starting numbers and monthly drift are placeholders, to be tuned in playtesting. Historical details should be checked before more content is written.

## Building the game

1. Run `npm install` (installs [dendrynexus](https://github.com/aucchen/dendrynexus)).
2. Run `npx dendrynexus make-html` in this folder, then copy `out/game.json` into `out/html/`.
3. Serve `out/html/` with any static web server.

Pushing to `main` builds and publishes the game to GitHub Pages through `.github/workflows/build.yaml`, once Pages is enabled with "GitHub Actions" as the source.

## Included Libraries

[jquery v1.11.1](https://releases.jquery.com/)

[d3.js v7](https://d3js.org)

[d3-parliament](https://github.com/geoffreybr/d3-parliament)
