# Design, second pass: Red Germany 1919–1923

The first pass made the whole timeline playable. The second pass makes the game deeper and gives it its own face. This document is the plan and the contract between the people building it.

## Pillars

1. **The party is a machine you run, not a meter you watch.** Districts, congresses, Moscow and the comrades themselves are systems the player works with every month.
2. **Every big choice is a fight inside the party first.** Congresses are played, not read: the player counts delegates, wins districts, trades posts and risks splits.
3. **Moscow is a patron with moods.** The Executive of the Comintern is not one voice: Lenin, Zinoviev, Radek, Trotsky and Bukharin want different things, and their favour has a price.
4. **The look of 1919.** The interface reads like the party's own paper and files: newsprint, a red masthead, stamped dossiers, telegrams in a crisis. Clean and readable first, period second.

## Workstreams and ownership

### W1: interface (owns `out/html/`, `source/scenes/status.scene.dry`, `source/qdisplays/` display-only files with prefix `ui_`)

- **Identity:** "Die Rote Fahne" newsprint. Warm paper background, near-black ink, one strong red, a restrained serif for text and a condensed grotesque for headings and labels (Google Fonts are fine). Light and dark mode.
- **Masthead:** the page header becomes a newspaper masthead with the game title, the date (month, year, week in a crisis) and the party's name.
- **Front page:** at the top of the main hand, a small front page renders `Q.news_headline` and `Q.news_items` (see W2), so each month opens with the news.
- **Cards and decks:** cards as printed leaflets/handbills: a deck-specific typographic cover (Party Affairs, The Movement, Germany, The International, The Crisis, Congress) that works without images, and still shows `card-image` when one is set. Advisors as dossier photos with a name plate.
- **Sidebar as the party's files:** clean tab navigation that fits all tabs (Party, Factions, Districts, Map, Germany, Parties, Forces, Moscow, Comrades, plus Crisis and Congress when active) without breaking at narrow widths.
- **Map:** a stylised schematic map of Germany (inline SVG, not a geographic tracing) with the eight districts as regions, coloured by faction, shaded by loyalty, with markers for red guards, strikes, repression and red republics (`bavaria_soviet = 2`, `ruhr_red_army = 2`, `central_germany_soviet = 2`, `e23_red_region`). Clicking a district shows its details.
- **Charts:** a parliament hemicycle (the repo has `d3-parliament.js`; vendor a d3 v7 build into the repo, since `d3.v7.min.js` is missing today) for the current parliament's seats in the Parties tab, and delegate bars during a congress.
- **Factions:** each current gets a colour used consistently: in the sidebar, on the map, in congress bars and as a thin accent on options whose subtitle names that current. Keep it tasteful.
- **Crisis mode:** telegram style: the page shifts to a darker paper, headings in a stencil or typewriter face, a "STATE OF EMERGENCY" ribbon. **Congress mode:** a hall look with the delegate bar always visible.
- Must stay accessible: contrast, font sizes, mobile width.

### W2: systems (owns `source/scenes/root.scene.dry`, `post_event.scene.dry`, `main.scene.dry`, `source/scenes/systems/`, new non-display qdisplays)

All new systems must be **usable by event writers with a few lines**, documented in `docs/writing-guide.md` (W2 adds a section for each).

- **Congresses (a playable mode):** like a crisis, a congress turns the hand into congress cards for 2–4 turns ("sessions"). State: `congress = 1`, `congress_name`, `congress_session`, delegates per faction `congress_delegates_<f>` computed from districts (members and faction) and mandate rules, `congress_stake` (what is being decided, a string), `congress_result` read by the event that closes it. Generic congress cards: lobby a district delegation, a speech from the platform, trade a post in the Zentrale, invoke Moscow's letter, change the mandate rules, threaten a walkout. Writers start a congress with a short snippet and read the result.
- **Moscow's Executive:** favour 0–100 for `ecci_lenin`, `ecci_zinoviev`, `ecci_radek`, `ecci_trotsky`, `ecci_bukharin` (Lenin's influence fades from 1922, his illness; Trotsky rises and falls). Overall `moscow_favour` derived from them. **Directives:** Moscow sends a directive with a deadline in months (`directive_active`, `directive_text`, `directive_deadline`); the player complies or defies through events and cards; consequences on subsidy, envoys, factions, independence.
- **Elections:** a function that computes the KPD's vote share and seats from worker support, unity, repression, the united front, relations and the party line (boycott), used for the Reichstag elections and state elections. Writers call it from an event (`Q.run_election = 'reichstag'` or a documented JS helper) and read the results.
- **District life:** each district gets `district_<d>_militancy`, `district_<d>_guards` (red guards), `district_<d>_repression` and `district_<d>_strike` (0/1), drifting monthly and touched by cards and events; the national meters stay as summaries. Strikes can spread to neighbours.
- **The comrades:** a roster `Q.comrades` (array of objects: id, name, faction, role, status: free / prison / exile / dead / expelled) for the leading figures (Luxemburg, Liebknecht, Jogiches, Levi, Zetkin, Pieck, Brandler, Thalheimer, Meyer, Fischer, Maslow, Thälmann, Eberlein, Münzenberg, Hoelz, Radek as envoy...). Helpers to arrest, free, kill or expel; existing flags (`luxemburg_alive`, `levi_in_party`...) stay in sync. The advisor roster should read it.
- **The news:** each month `news_headline` (string) and `news_items` (array of up to 4 short strings) are rebuilt; events and cards push items with a documented one-liner. A default headline is generated from the state when nothing happened.
- **Achievements / ledger:** a hidden ledger of notable outcomes for the ending screen (`ledger` array of short strings).

### W3: content (after W1 and W2 land)

Period writers wire the new systems into the story: the founding congress echoes, Heidelberg (1919), the unification congress (1920), Jena (1921) and Leipzig (1923) become playable congresses; Moscow directives at the right moments (the 21 Conditions, the March Action, the Schlageter line, the October); elections run through the engine; news items for every event; comrades' fates through the roster. Card writers add congress cards, district cards and directive responses.

## Contract between W1 and W2

W1 only reads these; W2 defines them in `root` and keeps them current in `post_event`:

`news_headline`, `news_items[]`, `party_name`, `congress`, `congress_name`, `congress_session`, `congress_stake`, `congress_delegates_<faction>`, `ecci_<person>`, `moscow_favour`, `directive_active`, `directive_text`, `directive_deadline`, `district_<d>_militancy`, `district_<d>_guards`, `district_<d>_repression`, `district_<d>_strike`, `comrades[]`, plus everything already listed in `docs/writing-guide.md`. Faction display colours are W1's.

Until W2 lands, W1 must render sensibly when any of these is undefined.
