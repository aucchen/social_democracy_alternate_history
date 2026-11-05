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
| Systems (W2) | `source/scenes/systems/`, `source/qdisplays/` | `sys_` |

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

## The systems: helpers you can call

Seven systems run under the story: the news, the ledger, the comrades, the districts, Moscow's Executive with its directives, congresses and elections. They live in `source/scenes/systems/` (the code is in `sys_lib.scene.dry`) and are driven from `post_event`. You use them from any `{! !}` block through one global object, **`RG`**. It is always there: it loads when the page opens, again on every turn, and after a saved game is loaded. Never store `RG` or any function in `Q` (saves are JSON); keep only numbers, strings, arrays and plain objects in `Q`.

Every system also sets **numeric flags** you can read in `view-if`, `choose-if` and `[? if ?]`, so you rarely need JavaScript to react to them. Strings (names) are for `[+ +]` only.

### The news

Each month the paper is rebuilt: `news_headline` (a string) and `news_items` (up to four strings). The interface prints them as a front page.

- **Every event you write is already news.** When an event fires, its `title` and `subtitle` become an item ("The Kapp Putsch: The Ehrhardt Brigade marches on Berlin"), and the month's first event is the headline unless something more important happened. So write subtitles that read like a headline: short, concrete, no markup.
- To add an item, or to claim the headline:

```
on-arrival: {!
RG.news('Noske resigns');                       // an item
RG.news('General strike: Kapp flees Berlin', 3); // 3 or more: the headline
!}
```

Priority 1 is an ordinary item, 2 an important one, 3 the headline. Write news in the voice of a newspaper headline, in British spelling, without full stops or game terms. When nothing happened, a headline is made from the state of the country (the price of bread in `bread_price`, strikes, raids, cabinet crises).

### The ledger

`Q.ledger` is a list of the game's notable outcomes, each dated ("March 1920: ..."), for the ending screen. Add an entry when your event changes history:

```
RG.ledger('The workers\' government of Legien survived the Reichstag election.', 'e20_wg_survives');
```

The second argument is a key: an entry with a key is added only once per game. The systems add entries by themselves (a first congress won, a congress lost, a directive carried out or defied, a district broken by repression, Luxemburg alive in 1920) and so do these flags when they first take these values: `kapp_outcome` 2 and 3, `bavaria_soviet` 2, `ruhr_red_army` 2, `warsaw_outcome` 2, `march_action` 1 and 2, `levi_split` 1, `left_split` 1, `german_october` 1 to 3, `kpd_banned` 1. `ledger_count` is the number of entries.

### The comrades

`Q.comrades` is the roster of the party's leading figures: an array of `{id, name, faction, role, status, district}`. Status is one of `'free'`, `'prison'`, `'exile'`, `'dead'`, `'expelled'`, or `'outside'` before they join (Zetkin from March 1919, Fischer and Maslow from late 1919, Thälmann with the unification of December 1920). The ids:

`luxemburg`, `liebknecht`, `jogiches`, `levi`, `pieck`, `eberlein`, `meyer`, `zetkin`, `levine`, `thalheimer`, `brandler`, `walcher`, `frolich`, `fischer`, `maslow`, `thalmann`, `hoelz`, `munzenberg`, `laufenberg`, `wolffheim`, `ruhle`, `schroder`, `radek` (Radek is Moscow's man, faction `'ecci'`).

For conditions, each comrade has **`comrade_<id>`**: 0 not in the party, 1 free, 2 in prison, 3 in exile, 4 dead, 5 expelled (qdisplay `sys_comrade` turns it into words). `comrades_in_prison` counts the prisoners.

```
on-arrival: {!
RG.arrest('brandler', 6);   // six months; RG.arrest('hoelz') with no number is open-ended
RG.free('brandler');
RG.exile('brandler');       // to Moscow, say
RG.kill('levine');
RG.expel('levi');
RG.setFaction('frolich', 'unionist');
RG.setRole('fischer', 'Chair of the Zentrale');
!}
view-if: comrade_brandler = 1
```

Each change makes a news item; pass `{quiet: true}` as the last argument to skip it, or `{news: 'Brandler escapes to Moscow'}` to word it yourself. RG.isFree(id) and RG.status(id) answer questions in JavaScript, and RG.speaker(faction) gives the best free speaker of a current, as `{id, name}`.

**The old flags still work, both ways.** `luxemburg_alive`, `liebknecht_alive`, `jogiches_alive`, `levine_alive`, `levi_in_party`, `levi_split`, `radek_prison` and `hoelz_imprisoned` are kept in step with the roster: if your event sets `Q.luxemburg_alive = 0`, Luxemburg is dead in the roster from the next turn; if you call `RG.expel('levi')`, then `levi_in_party` is 0 and `levi_split` is 1 at once, and the Levi events react as before. When a current leaves the party (`<f>_gone = 1`), its comrades leave with it.

The advisors read the roster: a comrade in prison, in exile, dead or expelled is not at the table. Repression puts comrades in prison by itself now and then (more where their home district is policed hardest), for a few months; the card "A Comrade in Prison" offers ways to get them out.

### The districts

Each district now has a life of its own:

| Variable | Meaning |
| --- | --- |
| `district_<d>_militancy` | 0–100, the workers' mood in the district |
| `district_<d>_repression` | 0–100, police, courts and Freikorps in the district |
| `district_<d>_guards` | red guards in the district, in thousands |
| `district_<d>_strike` | 1 while the district is on strike (`_strike_months` counts) |

The national `militancy`, `repression` and `red_guards_strength` are now **summaries** of the districts (weighted by members, and a sum for the guards). You can keep changing the national values exactly as before: `militancy += 10` raises every district by ten. To act on one district:

```
RG.district('ruhr', {militancy: 8, repression: 5, guards: 2, loyalty: -4, members: 0.1});  // members: +10 per cent
RG.startStrike('halle');    RG.endStrike('halle', 'won');   // or 'crushed', or no second argument
RG.spreadStrike('halle');   // to its most militant neighbour
```

Every month each district drifts towards the national mood with its own character (the Ruhr and Halle hotter, Bavaria cooler), militancy draws local repression, repression above 60 costs members, angry districts grow red guards and policed ones lose them, and a district far from the Zentrale's temper loses loyalty. A militant district may strike; a strike raises members and support while it lasts and draws the police, may be broken by them, and can spread to the neighbouring districts (Berlin borders Halle, Saxony and Hamburg; Hamburg borders Bremen; Bremen the Ruhr; Saxony borders Halle, Thuringia, Berlin and Bavaria; Thuringia borders Halle and Bavaria). `strike_count` and `strike_districts` (names, for text) summarise.

**Cards that act on a district** pick their target in their own `on-arrival` with `RG.target(by)`, where `by` is `'strike'`, `'militancy'`, `'repression'`, `'guards'`, `'loss'` (furthest below its best membership) or `'loyalty'`. It sets `sys_target` (the id), `sys_target_name`, `sys_target_trade` (who works there), `sys_target_striking`, `sys_target_militancy`, `sys_target_repression`, `sys_target_guards`, `sys_target_members`, `sys_target_faction_name`, `sys_target_ours` (1 if it follows the leading current) and `sys_target_neighbour_name`. See `systems/sys_card_strike` for the pattern.

### Moscow's Executive

Moscow is five men, each with a favour for the party from 0 to 100: **`ecci_lenin`, `ecci_zinoviev`, `ecci_radek`, `ecci_trotsky`, `ecci_bukharin`**. Each month each one drifts towards what he wants to see:

- **Lenin** likes the Right and the Spartacists, hates the Left Radicals, and turns against the Left after the March Action. He fades from 1922 (his illness: `ecci_lenin_ill` = 1 from May 1922), and hardly counts after March 1923.
- **Zinoviev**, the President, likes the Left and obedience above all; he tolerates the Right in 1921–23. He cares most about independence.
- **Radek**, the German expert, likes the Right and the united front (the Spartacists until 1921); he weighs more while he is the envoy in Berlin.
- **Trotsky** likes the united front in 1921–22, and arms and a date for the rising in 1923; he rises with the plans for October 1923 and falls after.
- **Bukharin** likes the Left and militancy, the theory of the offensive.

Each also dislikes independence, and Lenin and Radek like good relations with the SPD and USPD from mid-1921. The weight of each man on the Executive is `ecci_<p>_weight` (per cent). **`moscow_favour`** is their weighted favour, pulled down by our independence. `moscow_backs` (id), `moscow_backs_code` (1–4) and `moscow_backs_name` name the current the Executive would back today; `ecci_friend_name` is our best friend there. Very low favour can cost the subsidy, very high favour can raise it.

To please or anger one of them, or all:

```
RG.ecci('zinoviev', 10);   // a lasting nudge: it fades over months
RG.ecci('all', -5);
```

Use small numbers (3 to 15). The qdisplay `sys_favour` turns a favour into words.

### Directives

Moscow sends the Zentrale directives with a deadline. While one runs: `directive_active` = 1, `directive_title`, `directive_text`, `directive_from_name` (who drafted it), `directive_deadline` (months left), `directive_compliance` (0–100). Each directive also sets `directive_<id>`: 1 while it runs, then 2 carried out, 3 half done, 4 failed or defied, 5 withdrawn. The Executive sends generic directives by itself when the party is in the International (bolshevise the party, the united front, prepare for decisive struggles, defend Soviet Russia, into the factories, the Executive's control). To issue a historical one:

```
on-arrival: {!
RG.directive({
    id: 'conditions21',              // directive_conditions21 = 1, then 2-5
    title: 'The Twenty-One Conditions',
    text: 'Break with the reformists and the centrists, and accept the conditions of the International.',
    from: 'zinoviev',                // lenin, zinoviev, radek, trotsky or bukharin
    months: 3,
    goals: [{q: 'independence', op: '<=', v: 40}],   // checked every turn; any number quality
    reward: {subsidy: 1},            // or {funds: 2, favour: 15, faction: 'offensive'}
    punish: 'rival',                 // 'rebuke', 'subsidy', 'envoy', 'rival', or 'auto' (default)
    announce: false                  // your event tells the story: no generic telegram
});
!}
```

Compliance is the effort the Zentrale puts in plus 60 points shared between the goals that are met. At 100 the directive succeeds at once; at the deadline it succeeds from 70, is half done from 35, and fails below. Success pleases its author and the Executive, brings money or the subsidy, and pleases the current Moscow backs. Failure brings the punishment: a public rebuke (Unity and the leading current suffer), a cut in the subsidy, an envoy sent to Berlin (`comintern_rep` changes), or Moscow backing a rival current (it gains satisfaction and lean, and may win a wavering district). Defiance also raises independence and goes into the ledger.

The player answers through the telegram event, the card "The Executive's Directive", the emissary's visit and the card "A Friend on the Executive". In your own events, record the answer with:

```
RG.comply(30);   // effort towards the directive (default 30)
RG.stall(2);     // two more months; the author is irritated, more so each time
RG.defy();       // refuse: it fails now, with defiance
```

The verdict event (`sys_dir_reckoning`) tells the player what Moscow decided. Follow-ups can read `directive_<id>`, or `directive_result` (1 success, 2 half, 3 failure) and `directive_punishment_code` (1 rebuke, 2 subsidy, 3 envoy, 4 rival).

### Congresses

A congress is a mode, like a crisis: for its sessions the hand holds only congress cards (`tags: congress`), the normal decks disappear, and each card played is one session. **The whole congress takes one month**: the month turns when it ends. Delegates are elected by the districts: each district sends delegates by its members (or by the mandate rule in force); most follow the district's current, the rest split by the currents' strength, and a loyal district sends more delegates for the Zentrale's current. Delegates whose own current has no motion on the table vote for the nearest one (Spartacists lean to the Right, the Right to the Spartacists, the Left and the Left Radicals to each other). If no motion has a majority, the weakest is dropped and its delegates vote again.

**Start it** from your event (with an option, or in `on-arrival`):

```
on-arrival: {!
RG.congressStart({
    id: 'jena',                       // sets congress_jena: 1 in session, 2 votes counted, 3 over
    name: 'The Jena Congress',
    stake: 'Who leads the party after the March Action',
    sessions: 3,                      // 2 to 4 cards
    positions: ['unionist', 'offensive'],   // the currents whose motions are on the table
    backing: 'unionist',              // the motion the Zentrale fights for (default: the leading current if on the table)
    kind: 'leadership',               // 'leadership': the winner takes the Zentrale when it ends; 'motion': you apply the result
    mandates: 'members',              // 'members', 'districts' (small districts weigh more) or 'zentrale' (the Zentrale votes)
    ownClose: true                    // you write the closing event; without it a generic "The Vote" closes the congress
});
!}
```

A congress cannot start during a crisis; if you call it then, it opens when the crisis ends. While it runs: `congress` = 1, `congress_name`, `congress_stake`, `congress_session` and `congress_sessions`, `congress_backing_name`, `congress_delegates_<faction>` and `congress_delegates_total`, `congress_votes_<faction>` (per cent of the vote for that current's motion now), `congress_votes_for` (our motion), `congress_ahead` (1 if we lead), `congress_leader_name`, `congress_close_call` (1 if it is within six points). The main hand shows the count after every session.

**Close it** with an event that fires when the votes are counted, reads the result and calls `RG.congressEnd()` once:

```
title: Jena Votes
tags: event
view-if: congress_jena = 2
priority: 9
on-arrival: {!
RG.congressEnd();    // consequences, the leadership change for kind 'leadership', the month turns
!}

= Jena Votes

The motion of the [+ congress_result_name +] is carried, with [+ congress_votes_for +]% for ours.

[? if congress_won = 1 : ... ?][? if congress_result_code = 2 : The Left take the Zentrale. ?]
```

After the count: `congress_result` (the winning current's id), `congress_result_code` (1 Spartacists, 2 Left, 3 Right, 4 Left Radicals), `congress_result_name`, `congress_won` (1 if our motion won), `congress_share_<faction>` (final per cent for each motion), `congress_margin`, `congress_leadership_changed`. They stay readable after `RG.congressEnd()`, so options can use them. `congressEnd` gives the winners satisfaction and lean, costs the losers satisfaction and the party Unity in proportion to the congress's bitterness, makes a current that took a seat in the Zentrale the junior partner, and applies a failed walkout threat. If your closing event cannot fire, the generic one closes the congress.

The congress cards (in `systems/`, `sys_cg_*`) are: Work a Delegation (lobby the delegation most against us), From the Platform (our best free speaker, from the roster), A Seat in the Zentrale (a deal with another current), Moscow's Letter (Moscow backs `moscow_backs`), The Mandate Commission (change the rules, or annul a delegation), Threats (walkout, resignation, expulsion), The Chair and the Agenda (closure, an extra session), The Corridors. To write a congress card for one congress, copy one of them, add `and congress_jena = 1` to its `view-if`, and move delegates with:

```
RG.congress.sway(0.05);                  // 5% of every delegation against us comes over
RG.congress.convert('berlin', 0.3);      // 30% of the Berlin delegates against us
RG.congress.swayTo('offensive', 0.05);   // 5% of everyone else goes over to the Left
RG.congress.lose(0.04);                  // we lose 4% of ours to the strongest rival
RG.congress.deal('unionist');            // the Right vote with us (and share the Zentrale if we win)
RG.congress.setMandates('districts');
RG.congress.bitter(3);                   // the losers will be angrier, and Unity pays
RG.congress.closeEarly();  RG.congress.extend(1);
```

`congress_last_moved` holds the number of delegates the last move changed, for the result text. A player can also call an extraordinary congress on the leadership through the Party Affairs card "The Districts Want a Congress" (at most one every ten months; `congress_ready` = 1 when allowed).

### Elections

`RG.election(scope, opts)` computes the KPD's vote and seats, takes the votes we win from the other parties (mostly the USPD and SPD), lets the right gain in a hyperinflation, and returns the result. scope is `'reichstag'` or a state: `'prussia'`, `'saxony'`, `'thuringia'`, `'hamburg'`, `'bremen'`, `'bavaria'`.

Our share grows with worker support and members, and with Unity and good relations with the SPD; it falls with repression, with militancy so high it frightens voters, and with a ban; hyperinflation and the end of the USPD help; a campaign adds `election_bonus` (and `opts.bonus`, in points). In a state, it is scaled by how strong the party's districts there are. With the boycott line (`election_boycott` = 1, or `lock_elections` = 2) the party stands no candidates and gets nothing.

```
on-arrival: {!
var r = RG.election('reichstag', {
    base: {spd: 102, uspd: 84, ddp: 39, zentrum: 64, bvp: 21, dvp: 65, dnvp: 71, kpd: 4},  // the historical seats
    size: 459,
    kpdShare: 2.1,   // the KPD's real share of the vote, if known (seats under-count a small party)
    bonus: 1         // points for a good campaign (optional)
});
// r.kpd_share, r.kpd_seats, r.seats.spd ...
!}

Our party wins [+ election_kpd_share_display +] per cent and [+ election_kpd_seats +] seats.
```

Give `base` the historical result, including the KPD's real seats: the result stays close to it when our position is the historical one, and moves away from it as the player does better or worse. For the Reichstag it sets every party's `_seats`, `kpd_seats`, `parliament_name` and `parliament_size` (pass `apply: false` to only compute). For a state it sets `landtag_<state>_kpd_seats`, `_kpd_share`, `_size` and `_left_majority`. Every call also sets `election_name`, `election_kpd_share` (and `_display`, one decimal), `election_kpd_seats`, `election_kpd_gain`, `election_left_seats` (SPD, USPD and KPD), `election_left_majority` (0/1), and adds a news item (`news: false` to skip it). The 1920 Reichstag election event already uses it.

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

`start`/`until` run only your period from its historical starting state, for example `1920-1 1920-12`. With `TRACE=1` in the environment, each run also prints the systems' state every three months (members, meters, strikes, Moscow, the directive, the headline) and the ledger at the end.

`node tools/systems_test.js <your port>` runs scripted checks of the systems: the helpers survive a save, a reload and a load; congresses start, run on congress cards and close in one month; a directive is issued, answered and judged; the roster and the old flags stay in step; the elections engine adds up. The playtest clicks random options and reports page errors, dead ends and text that shows `undefined`, `NaN` or unrendered markup. **Before you finish: the build must succeed with no errors, and the playtest must report OK on at least 6 runs of your period.** Also read through two or three of your events in the playtest's path to check they read well.

## Committing

Commit your work in your working copy as Maarten, with a plain message and no trailers:

```
git -c user.name=Maarten -c user.email=115289775+AthanasiosGalanakis@users.noreply.github.com commit -m "Add the 1920 events"
```

Commit only source files (`source/`, `tools/presets/`, `docs/` if asked). Never commit `out/game.json` or `out/html/game.json`.
