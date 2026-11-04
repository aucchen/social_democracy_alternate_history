// Random playthroughs of the built game, to catch errors and dead ends.
//
// Usage: build first (npx dendrynexus make-html && cp out/game.json out/html/),
// serve out/html on a port (python3 -m http.server 8765 -d out/html), then
//   node tools/playtest.js [runs] [maxSteps] [port] [start] [until]
//
// start (optional, e.g. 1921-1) jumps straight to that month with the
// historical outcome of everything before it (see tools/presets.js).
// until (optional, e.g. 1921-12) counts a run as finished once the date
// passes that month, so a writer can test one period alone.
//
// Reports, per run: the date reached, the ending, page errors, and any page
// that shows "undefined", "NaN" or unrendered [+ +] markup. At the end it lists
// every event scene visited across all runs.
const { chromium } = require('playwright');

const runs = parseInt(process.argv[2] || '3', 10);
const maxSteps = parseInt(process.argv[3] || '1500', 10);
const port = process.argv[4] || '8765';
const start = process.argv[5] || '';
const until = process.argv[6] || '';
const presets = require('./presets.js');
const ym = (t) => { const [y, m] = t.split('-').map(Number); return y * 12 + m; };
const IGNORE = /d3 is not defined|toFixed|font_size/;

(async () => {
  const browser = await chromium.launch();
  const visitedAll = {};
  let failures = 0;
  for (let run = 0; run < runs; run++) {
    const page = await browser.newPage();
    const errors = [];
    const badText = new Set();
    page.on('pageerror', e => { if (!IGNORE.test(e.message)) errors.push(e.message.slice(0, 300)); });
    await page.goto(`http://localhost:${port}/index.html`);
    await page.waitForTimeout(1000);
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    let ended = false, stuck = false, steps = 0, lastScene = '';
    if (start) {
      // start the game, then overwrite the date and the historical flags
      await page.click('#content a:has-text("Start game")');
      await page.waitForTimeout(200);
      const preset = presets.upTo(start);
      await page.evaluate(([preset, start]) => {
        const Q = dendryUI.dendryEngine.state.qualities;
        Object.assign(Q, JSON.parse(JSON.stringify(preset)));
        const [y, m] = start.split('-').map(Number);
        Q.year = y; Q.month = m; Q.time = (y - 1919) * 12 + m;
        Q.started = 1;
        dendryUI.dendryEngine.goToScene('post_event');
      }, [preset, start]);
      await page.waitForTimeout(200);
    }
    for (; steps < maxSteps; steps++) {
      const info = await page.evaluate(() => {
        const s = dendryUI.dendryEngine.state;
        const text = document.querySelector('#content') ? document.querySelector('#content').innerText : '';
        const side = document.querySelector('#qualities') ? document.querySelector('#qualities').innerText : '';
        return { scene: s.sceneId, q: { year: s.qualities.year, month: s.qualities.month, week: s.qualities.week,
          crisis: s.qualities.crisis, ending: s.qualities.ending_id, game_over: s.qualities.game_over,
          lead: s.qualities.leading_faction }, text, side };
      });
      if (info.scene !== lastScene) {
        const sc = info.scene.split('.')[0];
        visitedAll[sc] = (visitedAll[sc] || 0) + 1;
        lastScene = info.scene;
      }
      for (const [label, t] of [['page', info.text], ['sidebar', info.side]]) {
        const m = t.match(/.{0,40}(undefined|NaN|\[\+|\[\?|\+\]).{0,40}/);
        if (m) badText.add(`${label} @ ${info.scene}: ...${m[0].replace(/\s+/g, ' ')}...`);
      }
      if (info.q.game_over) { ended = true; break; }
      if (until && !info.q.crisis && info.q.year * 12 + info.q.month > ym(until)) { ended = true; break; }
      // visit a random sidebar tab now and then, so its text is checked too
      if (steps % 7 === 0) {
        const tabs = await page.$$('#stats_sidebar .tab_button:visible');
        if (tabs.length) { await tabs[Math.floor(Math.random() * tabs.length)].click(); }
      }
      const choices = await page.$$('#content ul.choices li a');
      if (choices.length) { await choices[Math.floor(Math.random() * choices.length)].click({ force: true, timeout: 5000 }).catch(() => {}); await page.waitForTimeout(40); continue; }
      // pick among the hand and the decks, so a hand of unplayable cards cannot loop forever
      const hand = await page.$$('#content ul.hand a.card');
      const decks = await page.$$('#content ul.decks a.card');
      const handFull = hand.length >= 3;
      const pool = handFull || !decks.length ? hand : (hand.length && Math.random() < 0.6 ? hand : decks);
      if (pool.length) {
        await pool[Math.floor(Math.random() * pool.length)].click({ force: true, timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(60);
        continue;
      }
      const pinned = await page.$$('#content ul.pinned-cards a.card');
      if (pinned.length) { await pinned[0].click(); await page.waitForTimeout(40); continue; }
      stuck = true;
      break;
    }
    const q = await page.evaluate(() => dendryUI.dendryEngine.state.qualities);
    const ok = errors.length === 0 && badText.size === 0 && !stuck && ended;
    if (!ok) failures++;
    console.log(`run ${run}: ${ok ? 'OK' : 'PROBLEM'} | reached ${q.month}/${q.year}${q.crisis ? ' (crisis week ' + q.week + ')' : ''} after ${steps} steps | ended=${ended} ending=${q.ending_id} stuck=${stuck} at ${lastScene} | Zentrale=${q.leading_faction}`);
    errors.slice(0, 10).forEach(e => console.log('   error: ' + e));
    [...badText].slice(0, 10).forEach(e => console.log('   text: ' + e));
    await page.close();
  }
  console.log('\nscenes visited (all runs): ' + Object.keys(visitedAll).sort().join(', '));
  await browser.close();
  process.exit(failures ? 1 : 0);
})();
