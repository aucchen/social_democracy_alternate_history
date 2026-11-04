# Writing guide: Red Germany 1919–1923

This guide is the contract every scene in the game follows. Read it all before writing.

## The game in one paragraph

The player holds the Zentrale of the KPD from January 1919 to December 1923. The game follows history closely at first, and the player's choices lead somewhere else. Each turn is one month: the player plays one card from the hand, then historical events for that month fire. During a big crisis (the Kapp Putsch, the March Action, the German October and so on), each turn becomes **one week** instead, and only crisis cards can be drawn. Four historical currents compete inside the party. The current that holds the Zentrale sets the party line, and the line forbids or discourages some actions. What the player picks shifts the party towards one current or another. That decides who splits, when and how: Heidelberg, Levi, and the Left.

## Tone and style

- Write like the original *Social Democracy* game: short paragraphs, plain and concrete, past or present tense consistently within a scene, no purple prose. Two to five short paragraphs per event, one or two sentences per option result.
- Be historically accurate where history is followed: real names, dates and places. When the player's choices diverge, write plausible alternate history, grounded in the people and forces of the time.
- British spelling ("organise", "labour").
- Option titles are short imperatives ("Call a general strike."). The subtitle says what it costs or what it does, in plain words, never with numbers except funds ("Costs 1 fund.").
- Do not mention game mechanics by name inside story text (no "Unity +5", no "crisis mode", no "rubicon"). The UI already says each action takes a week during a crisis.
- Do not use em dashes in text. Use commas, colons or full stops.

## Files and folders

Scenes are `.scene.dry` files in `source/scenes/`. Each file id is its file name and must be unique across the whole game. **Prefix every new file with your period** so writers never clash:

| Writer | Folder | Prefix |
| --- | --- | --- |
| 1919 | `source/scenes/events/1919/` | `e19_` |
| 1920 | `source/scenes/events/1920/` | `e20_` |
| 1921 | `source/scenes/events/1921/` | `e21_` |
| 1922–23 | `source/scenes/events/1922/`, `source/scenes/events/1923/` | `e22_`, `e23_` |
| Cards | `source/scenes/party/`, `movement/`, `germany/`, `international/`, `crisis/`, `advisors/` | `c_` for new cards, `adv_` for new advisors |

Crisis cards for a specific crisis belong to the writer of that crisis, in their own folder, with their prefix (for example `e20_kapp_card_strike`).

Do not edit files owned by another writer. If you need the framework changed (`root`, `post_event`, `main`, `status`, the qdisplays, `game.js`, `game.css`, `index.html`), stop and say so in your final report instead: the integrator makes those changes. Two exceptions: you may add your own starting variables in a new file (see "Your own variables"), and you may add new qdisplay files under `source/qdisplays/` with your prefix.

## Dendry syntax, and the traps

A scene file:

```
title: The Kapp Putsch
subtitle: Shown under the title on the event card.
new-page: true
tags: event
view-if: year = 1920 and month = 3 and kapp_started = 0
max-visits: 1
on-arrival: {!
// plain JavaScript; Q holds all qualities
Q.kapp_started = 1;
!}

= The Kapp Putsch

Story text. **Bold** and *italic* work. [+ chancellor +] prints a quality.
[? if luxemburg_alive = 1 : Text shown only if the condition holds. ?]

- @strike: Call a general strike.
- @wait: Wait and see.

@strike
subtitle: What this option does, in plain words.
on-arrival: militancy += 10; worker_support += 5; lean_offensive += 2

Result text.

@wait
subtitle: ...
on-arrival: ...

Result text.
```

Rules learned the hard way:

- **Leave a blank line between a section header block (`@id` plus its properties) and the first `- ` choice line.** Otherwise the build fails with "Invalid property definition".
- **A section id cannot equal the file id.** In `e20_kapp_putsch.scene.dry`, do not name a section `@e20_kapp_putsch`.
- **`go-to` skips the option's own text.** If an option should show its result text and then move on, give the result section a choice instead: `- @next: Continue...`, and put the next step in `@next`. Use `go-to` only on sections with no text of their own.
- **Use numbers, not strings, in `view-if`, `choose-if` and `[? if ?]`.** Strings work inside `{! !}` JavaScript, but not in Dendry conditions. Use flags such as `kapp_outcome = 2`, not `kapp_outcome = "won"`.
- Dendry conditions: `=`, `!=`, `<`, `<=`, `>`, `>=`, `and`, `or`, `not`. Expressions in `on-arrival` outside `{! !}` are semicolon-separated assignments: `a += 1; b -= 2; c = 3`.
- Inside `{! !}`, Q is the qualities object. Undefined qualities read as 0 in Dendry conditions, but as `undefined` in JavaScript, so set every variable you use (see "Your own variables").
- `view-if` decides whether a scene or option shows at all; `choose-if` shows it greyed out with `unavailable-subtitle` when it fails.
- An event fires when its `view-if` holds after a turn. Always give events `max-visits: 1` unless they are meant to repeat. During a crisis, every week is a turn, so a `year = 1920 and month = 3` event fires in the first week of March: guard follow-ups with flags.
- `priority: N` makes an event go first when several are eligible (higher first). Default 1.
- To chain one event straight into another, end with a choice to a section that does `go-to: other_scene_id`, or set a flag that the next event's `view-if` reads (it then fires after the next turn).
- Raw HTML inside `{! !}` in text is printed literally, and `[+ +]` inside it is **not** expanded. Close the HTML before inserting a quality: `{!<span class="tooltip-text" title="...">!}[+ name +]{!</span>!}`.
- A card ends the turn by adding to `month_actions` (`on-arrival: month_actions += 1` at the top level). Events and advisor actions do **not** add to `month_actions`.

## The state you can use

All of these exist from the first turn (set in `source/scenes/root.scene.dry`; numbers are 0–100 unless noted).

Time: `year`, `month` (1–12), `time` (months since start, January 1919 = 1), `week` (1–4 during a crisis, else 0), `crisis_time` (weeks since this crisis began).

Party: `resources` (funds, small integers), `members` (thousands, computed from districts), `unity`, `leading_faction`, `junior_faction` (0 or a faction id), `leading_faction_name` and `leading_faction_adj` (strings for text, such as 'Spartacists' / 'Spartacist'), `faction_names` (object, JavaScript only), `loyal_share` (0–1, share of members in loyal districts).

Factions: ids `luxemburgist` (shown as Spartacists: Luxemburg, Jogiches, then Levi, Zetkin), `offensive` (the Left: Ruth Fischer, Arkadi Maslow, later Thälmann; theory of the offensive), `unionist` (the Right: Brandler, Thalheimer, Walcher; union work and the united front), `ultraleft` (the Left Radicals: Bremen and Hamburg, Laufenberg, Wolffheim, Otto Rühle; later the KAPD). For each faction f: `f_satisfaction`, `f_strength` (computed, % of members), `lean_f`, `history_f`, `f_gone` (1 once the faction has left the party).

Party line, computed every turn from the leading faction: `lock_elections`, `lock_united_front`, `lock_union_work`, `lock_councils`, `lock_uprising`, `lock_moscow_orders`. 0 = open, 1 = against the line (allowed, costs Unity), 2 = forbidden.

Districts: ids `berlin`, `hamburg`, `bremen`, `ruhr`, `saxony`, `thuringia`, `bavaria`, `halle`. For each district d: `district_d_faction`, `district_d_members` (thousands), `district_d_loyalty`.

Meters: `militancy`, `worker_support`, `repression`, `stability` (of the Republic), `inflation` (rises by itself; above 80 is hyperinflation), `independence` (from Moscow), `world_revolution`.

Parties, ids `spd`, `uspd`, `kapd`, `ddp`, `zentrum`, `bvp`, `dvp`, `dnvp`, `nsdap`. For each party p: `p_relation` (with the KPD), `p_exists` (0/1), `p_seats`, `p_in_government` (0/1). Also `kpd_seats`, `parliament_name` (string or 0), `parliament_size`, `government_name`, `chancellor` (strings), `nsdap_name` (string: 'DAP' until February 1920). Set seats from real results for every national election that happens.

Forces, ids `army`, `freikorps`, `police`, `civil_guards`, `red_guards`, `sa`. For each: `f_strength` (thousands), `f_loyalty` (state forces: to the Republic; red guards: to the Zentrale). Also `red_guards_arms`, `army_name` ('Army', then 'Reichswehr' from March 1919).

Moscow: `comintern_member` (0/1), `comintern_rep` (envoy's name or 0), `moscow_subsidy` (funds added each month), `soviet_russia_status` (short string shown in the Moscow tab).

Flags already in use: `luxemburg_alive`, `liebknecht_alive`, `election_boycott`, `spartacist_uprising_done`, `leaders_hidden`.

### Your own variables

Every new flag you read must be set before anything reads it. Put your starting values in **one** file, `source/scenes/events/<your folder>/<prefix>init.scene.dry`, written like this:

```
title: 1920 setup
view-if: e20_init_done = 0
tags: event
priority: 100
max-visits: 1
on-arrival: {!
Q.e20_init_done = 1;
// only set what is not set yet, so test presets are not overwritten
var start = {kapp_started: 0, kapp_outcome: 0, crisis_kapp: 0};
for (var k in start) {
    if (Q[k] === undefined) {
        Q[k] = start[k];
    }
}
!}
go-to: post_event
```

It runs once, at the first turn of the game, before anything else (priority 100). Only set a value when it is still undefined, as above. Name your flags with clear words; if you set a flag in the shared contract below, use exactly that name.

## Factions: options, locks and lean

Factions are the heart of the game. Every important event offers options that match different currents, and the player's choices push the party towards them.

**Every major event has options for at least three of the four currents, where history allows.** The subtitle names whose line it is when that is not obvious, for example "The Left's answer: the offensive, now." When a faction has left the party (`ultraleft_gone = 1`), do not offer its line as a party option; it can still appear as a rival party (the KAPD).

**Lean.** An option that follows a faction's line adds to `lean_<faction>`: `+1` for a small step, `+2` for a clear choice, `+3` for a defining decision (a congress vote, a rising). Opposing a faction's core belief can subtract 1 or 2. Every month, the month's lean is added to `history_<faction>` for good, and a strong lean can win over a wavering district. Also change satisfaction directly (`offensive_satisfaction += 8`): lean is the long memory, satisfaction is the mood.

**Locks.** An option that needs an action the line can forbid gets:

```
@united_front
subtitle: [? if lock_united_front = 1 : Against the party line: costs Unity. ?] Offer the SPD and USPD joint action.
choose-if: lock_united_front < 2
unavailable-subtitle: The [+ leading_faction_adj +] line forbids any deal with the social democrats.
on-arrival: {!
if (Q.lock_united_front == 1) {
    Q.unity -= 10;
    Q[Q.leading_faction + '_satisfaction'] -= 10;
}
Q.spd_relation += 8;
Q.lean_unionist += 2;
!}
```

The six actions: `elections` (standing in elections), `united_front` (deals with the SPD/USPD), `union_work` (working inside the reformist unions), `councils` (factory councils and occupations), `uprising` (armed rising), `moscow_orders` (obeying Comintern instructions against our own judgement).

**Leadership.** The leading faction changes only through a congress, a Central Committee vote, Moscow's intervention or a split. To change it, set `Q.leading_faction = 'offensive'` (and `Q.junior_faction`) inside `{! !}`. The new line applies from the next turn.

**Dynamic splits.** The historical splits are events whose `view-if` reads `history_*`, `*_satisfaction` and story flags. The historical outcome happens when the player made roughly the historical choices; other choices lead to another split, a smaller one, or none. Example for Levi (1921): if `history_offensive` is high and Levi still leads, Levi resigns and later breaks with the party (history). If the player mostly followed the Spartacist line, the Left breaks away instead, or Levi stays and the March Action never happens. To make a faction leave, set `Q.<f>_gone = 1`, move its districts' members (most of them leave), give those districts to another faction, and set `<f>_satisfaction = 0`. The existing generic `faction_split` event covers splits from very low satisfaction; your historical splits are separate and richer.

## Crises: weekly turns

For the great confrontations, time slows to weeks. The pattern:

1. A start event sets the crisis on:

```
on-arrival: {!
Q.crisis = 1;
Q.crisis_kapp = 1;              // your crisis's own flag
Q.crisis_time = 0;
Q.week = 1;
Q.crisis_name = 'The Kapp Putsch';
Q.crisis_goal = 'Defeat the putsch, and decide what comes after it.';
Q.crisis_momentum = 50;          // 0-100: our side's position
!}
```

2. While `crisis = 1`, the normal decks are hidden and the hand only offers cards tagged `crisis`. Write **3 to 5 crisis cards** for your crisis (`tags: crisis`, `view-if: crisis_kapp = 1 and ...`, `on-arrival: month_actions += 1`, `frequency: 100`, `is-card: true`, `new-page: true`), each with 2–4 options that move `crisis_momentum`, forces, meters and lean. A generic card, `crisis/hold_together`, is always available too.
3. Weekly events read `crisis_time` (`view-if: crisis_kapp = 1 and crisis_time = 2`) to tell the story week by week. Keep a crisis to 2–6 weeks.
4. An end event decides the outcome from `crisis_momentum`, forces and earlier choices, sets an outcome flag from the contract, and switches the crisis off:

```
on-arrival: {!
Q.crisis = 0;
Q.crisis_kapp = 0;
Q.crisis_name = 0;
Q.crisis_goal = 0;
Q.kapp_outcome = Q.crisis_momentum >= 65 ? 3 : 1;
!}
```

The month turns after every fourth week, so a long crisis can run into the next month. The page darkens slightly and a Crisis tab appears in the sidebar while it runs.

## Endings

To end the game early (a decisive victory or defeat), set `Q.ending_id` to one of the ids below inside `{! !}` and add a choice `- @end: See how it ends.` with `@end` / `go-to: game_over`. The 1922–23 writer writes `game_over` with the text for every ending, and the end-of-1923 judgement.

| `ending_id` | Meaning |
| --- | --- |
| 1 | German Soviet Republic: the revolution wins nationally |
| 2 | Regional soviet republic survives (Bavaria, the Ruhr, Saxony or Central Germany), the Republic does not fall |
| 3 | Military dictatorship: a putsch succeeds and the party is driven underground |
| 4 | The party is crushed: banned and broken, members below 1,000 |
| 5 | The party dissolves into a united workers' party with the USPD and/or SPD |
| 6 | End of 1923: judged by members, influence, independence and the state of Germany |

## Shared flags between periods

Each period writer sets these, and later writers read them. 0 always means "not happened" or "not yet". The historical path is in **bold**.

**1919 sets:** `jogiches_alive` (**0** from March 1919), `bavaria_soviet` (0 none yet, **1 crushed**, 2 survives as a regional soviet republic), `heidelberg_outcome` (**1 Left Radicals expelled**, 2 compromise and they stay, 3 the Left Radicals win the congress), `kapd_split` (**1** once the Left Radicals have left; `kapd_exists` = 1 from April 1920 if they left), `levi_chair` (**1** Levi leads the Zentrale after March 1919), `election_boycott` (**0** after Heidelberg), `comintern_member` (**1** from March 1919), `versailles_signed` (**1**), `constitution_adopted` (**1**).

**1920 sets:** `kapp_outcome` (**1 putsch defeated by the general strike**, 2 putsch succeeds, 3 strike becomes a workers' government), `ruhr_red_army` (0 none, **1 crushed**, 2 holds the Ruhr), `warsaw_outcome` (**1 Red Army stopped at Warsaw**, 2 Red Army takes Warsaw), `twenty_one_conditions` (**1** accepted), `uspd_split` (**1** USPD left joins at Halle), `vkpd_formed` (**1**, December 1920; the party is the VKPD until 1921).

**1921 sets:** `levi_in_party` (1 until **Levi leaves, April 1921**), `levi_split` (**1** Levi and his followers leave or are expelled), `left_split` (1 if the Left leaves instead), `march_action` (0 avoided, **1 fought and lost**, 2 fought and won), `kag_exists` (**1**, Levi's Communist Working Group).

**1922–23 sets:** `rathenau_murdered` (**1**), `ruhr_occupied` (**1**, January 1923), `saxony_government` (0 none, **1 KPD ministers in the Saxon and Thuringian governments**, October 1923), `german_october` (0 called off, **1 called off at Chemnitz, Hamburg rises alone**, 2 national rising fails, 3 national rising wins), `kpd_banned` (**1**, November 1923), `beer_hall_putsch` (**1**).

The historical state at the start of each year is in `tools/presets/`, for testing.

## Building and testing

From your working copy:

```
ln -s /home/claude/social_democracy_alternate_history/node_modules node_modules   # once, if missing
npx dendrynexus make-html && cp out/game.json out/html/
python3 -m http.server <your port> -d out/html     # leave running (start it with setsid ... &)
node tools/playtest.js 4 3000 <your port> <start> <until>
```

Ports: 1919 writer 8771, 1920 8772, 1921 8773, 1922–23 8774, cards 8775.

`start`/`until` run only your period from its historical starting state, for example `1920-1 1920-12`. The playtest clicks random options and reports page errors, dead ends and text that shows `undefined`, `NaN` or unrendered markup. **Before you finish: the build must succeed with no errors, and the playtest must report OK on at least 6 runs of your period.** Also read through two or three of your events in the playtest's path to check they read well.

## Committing

Commit your work in your working copy as Maarten, with a plain message and no trailers:

```
git -c user.name=Maarten -c user.email=115289775+AthanasiosGalanakis@users.noreply.github.com commit -m "Add the 1920 events"
```

Commit only source files (`source/`, `tools/presets/`, `docs/` if asked). Never commit `out/game.json` or `out/html/game.json`.
