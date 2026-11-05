// Scripted checks of the W2 systems in the built game (see docs/writing-guide.md).
//
// Usage: build and serve as for tools/playtest.js, then
//   node tools/systems_test.js [port]
//
// It starts a game, then checks in turn: the RG helpers survive a save, a page
// reload and a load; a congress runs from start to close by playing congress
// cards, and the month turns once; a directive is issued, answered through its
// telegram, and resolved; the comrades roster and the legacy flags stay in
// sync; the elections engine returns a result; the news and the ledger fill.
const { chromium } = require('playwright');
const port = process.argv[2] || '8765';

let failures = 0;
const check = (ok, what) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures++;
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => { if (!/d3 is not defined|toFixed|font_size/.test(e.message)) errors.push(e.message); });
  page.on('dialog', d => d.accept().catch(() => {}));
  const Q = () => page.evaluate(() => dendryUI.dendryEngine.state.qualities);
  // pages that show undefined, NaN or unrendered markup
  const badText = new Set();
  const textCheck = async () => {
    const info = await page.evaluate(() => ({ scene: dendryUI.dendryEngine.state.sceneId,
      text: document.querySelector('#content') ? document.querySelector('#content').innerText : '' }));
    const m = info.text.match(/.{0,40}(undefined|NaN|\[\+|\[\?|\+\]|\[object).{0,40}/);
    if (m) badText.add(`${info.scene}: ...${m[0].replace(/\s+/g, ' ')}...`);
  };
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const scene = () => ev(() => dendryUI.dendryEngine.state.sceneId);
  // click options until the main hand shows (events in between are answered at random)
  const toMain = async (limit = 60) => {
    for (let i = 0; i < limit; i++) {
      const s = await scene();
      if (s === 'main') return true;
      const choices = await page.$$('#content ul.choices li a');
      if (!choices.length) return false;
      await choices[Math.floor(Math.random() * choices.length)].click({ force: true }).catch(() => {});
      await page.waitForTimeout(40);
    }
    return false;
  };
  // play one card from the hand, drawing from the decks first if needed
  const playCard = async () => {
    let hand = await page.$$('#content ul.hand a.card');
    if (!hand.length) {
      const decks = await page.$$('#content ul.decks a.card');
      for (const d of decks) { await d.click({ force: true }).catch(() => {}); await page.waitForTimeout(40); }
      hand = await page.$$('#content ul.hand a.card');
    }
    if (!hand.length) return false;
    await hand[0].click({ force: true }).catch(() => {});
    await page.waitForTimeout(60);
    // answer the card with its first available option that is not "return to hand"
    for (let i = 0; i < 20; i++) {
      if (await scene() === 'main') return true;
      const opts = await page.$$('#content ul.choices li a');
      if (!opts.length) return false;
      const usable = [];
      for (const o of opts) {
        const t = await o.innerText();
        if (!/Return card to hand/.test(t)) { usable.push(o); }
      }
      const pick = usable.length ? usable[Math.floor(Math.random() * usable.length)] : opts[0];
      await pick.click({ force: true }).catch(() => {});
      await page.waitForTimeout(40);
      await textCheck();
    }
    return true;
  };

  await page.goto(`http://localhost:${port}/index.html`);
  await page.waitForTimeout(800);
  await ev(() => { try { localStorage.clear(); } catch (e) {} });
  check(await ev(() => typeof RG !== 'undefined' && !!RG.news), 'RG is defined when the page loads');
  // start the game, then jump to May 1921 with the historical state (as playtest.js does)
  await page.click('#content a:has-text("Start game")');
  await page.waitForTimeout(200);
  await ev((preset) => {
    const Q = dendryUI.dendryEngine.state.qualities;
    Object.assign(Q, preset);
    Q.year = 1921; Q.month = 5; Q.time = 29; Q.started = 1;
    dendryUI.dendryEngine.goToScene('post_event');
  }, JSON.parse(JSON.stringify(require('./presets.js').upTo('1921-5'))));
  await page.waitForTimeout(200);
  check(await toMain(), 'the game reaches the main hand');
  await ev(() => { const Q = RG.q(); Q.crisis = 0; Q.week = 0; });
  let q = await Q();
  check(Array.isArray(q.comrades) && q.comrades.length >= 20, 'the comrades roster is built');
  check(typeof q.district_ruhr_militancy === 'number' && typeof q.district_ruhr_guards === 'number', 'district meters exist');
  check(typeof q.ecci_lenin === 'number' && typeof q.moscow_favour === 'number', 'the Executive and moscow_favour exist');
  check(typeof q.news_headline === 'string' && q.news_headline.length > 0 && Array.isArray(q.news_items), 'the news has a headline');

  // ------------------------------------------------ save, reload, load
  await ev(() => { dendryUI.saveSlot(0); });
  await page.reload();
  await page.waitForTimeout(800);
  check(await ev(() => typeof RG !== 'undefined'), 'RG is defined again after a reload');
  await ev(() => { dendryUI.loadSlot(0); });
  await page.waitForTimeout(300);
  check(await ev(() => RG.engine === dendryUI.dendryEngine && RG.q() === dendryUI.dendryEngine.state.qualities), 'RG reads the loaded game');
  check(await ev(() => { RG.news('Test item after load'); return dendryUI.dendryEngine.state.qualities.news_pending.length > 0; }), 'a helper works right after loading');

  // ------------------------------------------------ comrades and legacy flags
  await ev(() => { RG.arrest('levi', 3); });
  q = await Q();
  check(q.comrade_levi === 2 && q.levi_in_party === 1, 'arresting Levi keeps him in the party');
  await ev(() => { RG.expel('levi'); });
  q = await Q();
  check(q.comrade_levi === 5 && q.levi_in_party === 0 && q.levi_split === 1, 'expelling Levi sets levi_in_party and levi_split');
  await ev(() => { RG.free('levi'); });
  await ev(() => { const Q = RG.q(); Q.jogiches_alive = 0; dendryUI.dendryEngine.goToScene('post_event'); });
  await page.waitForTimeout(100);
  q = await Q();
  check(q.comrade_jogiches === 4, 'jogiches_alive = 0 set by an event marks him dead in the roster');
  check(q.levi_in_party === 1, 'freeing Levi readmits him');
  await toMain();

  // ------------------------------------------------ elections
  const res = await ev(() => RG.election('saxony', { news: false }));
  check(res && res.kpd_share > 0 && res.seats && res.size === 96, `the elections engine returns a result (Saxony: ${res && res.kpd_share.toFixed(1)}%, ${res && res.kpd_seats} seats)`);
  const rt = await ev(() => RG.election('reichstag', { base: { spd: 102, uspd: 84, ddp: 39, zentrum: 64, bvp: 21, dvp: 65, dnvp: 71, kpd: 4 }, apply: false, news: false }));
  const seatSum = Object.values(rt.seats).reduce((a, b) => a + b, 0);
  check(seatSum === 459, `Reichstag seats add up (${seatSum}); KPD ${rt.kpd_share.toFixed(1)}%, ${rt.kpd_seats} seats`);

  // ------------------------------------------------ a congress
  q = await Q();
  const t0 = q.time;
  const started = await ev(() => RG.congressStart({ id: 'test', name: 'The Test Congress', stake: 'A test motion', sessions: 3,
    positions: RG.present().slice(0, 2), kind: 'motion' }));
  await ev(() => dendryUI.dendryEngine.goToScene('post_event'));
  await page.waitForTimeout(100);
  await toMain();
  q = await Q();
  check(started && q.congress === 1 && q.congress_test === 1, 'a congress starts');
  check(q.congress_delegates_total > 100, `delegates are allocated (${q.congress_delegates_total})`);
  const handOk = await ev(() => {
    const s = dendryUI.dendryEngine.state;
    const hand = s.currentHands.main || [];
    return hand.every(c => (dendryUI.game.scenes[c.id].tags || []).indexOf('congress') >= 0);
  });
  check(handOk, 'the hand holds only congress cards');
  let sessions = 0;
  for (let i = 0; i < 10; i++) {
    q = await Q();
    if (!q.congress) break;
    if (await scene() !== 'main') { await toMain(); continue; }
    const ok = await playCard();
    if (!ok) break;
    sessions++;
    await toMain();
  }
  q = await Q();
  check(q.congress === 0 && q.congress_test === 3, `the congress closes (after ${sessions} cards)`);
  check(typeof q.congress_result === 'string' && q.congress_result_code > 0, `it has a result: ${q.congress_result}, ${q.congress_votes_for}% for our side`);
  check(q.time === t0 + 1, `the congress took one month (time ${t0} -> ${q.time})`);

  // more congresses, with every kind of motion and random answers, for the text check
  let closed = 0;
  for (let n = 0; n < 6; n++) {
    await ev((n) => {
      const pres = RG.present();
      RG.congressStart({ id: 'soak' + n, name: 'Congress ' + n, stake: 'Soak test', sessions: 2 + (n % 3),
        positions: n % 2 ? pres : pres.slice(0, 2), backing: pres[n % pres.length], kind: n % 2 ? 'leadership' : 'motion',
        mandates: ['members', 'districts', 'zentrale'][n % 3] });
      dendryUI.dendryEngine.goToScene('post_event');
    }, n);
    await page.waitForTimeout(80);
    for (let i = 0; i < 30; i++) {
      q = await Q();
      if (!q.congress) break;
      if (await scene() !== 'main') {
        const opts = await page.$$('#content ul.choices li a');
        if (!opts.length) break;
        await opts[Math.floor(Math.random() * opts.length)].click({ force: true }).catch(() => {});
        await page.waitForTimeout(40);
        await textCheck();
        continue;
      }
      if (!await playCard()) break;
    }
    q = await Q();
    if (!q.congress && q['congress_soak' + n] === 3) closed++;
    await toMain();
  }
  check(closed === 6, `six more congresses close (${closed})`);

  // ------------------------------------------------ a directive
  await ev(() => { const Q = RG.q(); Q.comintern_member = 1; });
  await ev(() => RG.directive({ id: 'test', title: 'A test directive', text: 'The Executive tests the German section.',
    from: 'radek', months: 2, goals: [{ q: 'unity', op: '>=', v: 101 }] }));
  // log every scene the engine enters from here on
  await ev(() => {
    const e = dendryUI.dendryEngine;
    window.__visited = [];
    if (!e.__logged) {
      const o = e.__changeScene;
      e.__changeScene = function (id) { window.__visited.push(id); return o.call(this, id); };
      e.__logged = 1;
    }
  });
  await ev(() => dendryUI.dendryEngine.goToScene('post_event'));
  await page.waitForTimeout(100);
  let sc = await scene();
  if (/events_choice/.test(sc)) {
    const tg = await page.$('#content ul.choices li a:has-text("A Telegram from Moscow")');
    if (tg) { await tg.click({ force: true }); await page.waitForTimeout(60); }
    sc = await scene();
  }
  check(/sys_dir_telegram/.test(sc), `the telegram event fires (${sc})`);
  const clar = await page.$('#content ul.choices li a:has-text("Ask the Executive")');
  if (clar) { await clar.click({ force: true }); await page.waitForTimeout(60); }
  q = await Q();
  check(q.directive_active === 1 && q.directive_stance === 2 && q.directive_due === q.time + 4, 'stalling buys time');
  for (let i = 0; i < 40; i++) {
    q = await Q();
    if (q.directive_test >= 2 && !q.directive_reckoning) break;
    const s = await scene();
    if (s === 'main') { await playCard(); continue; }
    const opts = await page.$$('#content ul.choices li a');
    if (!opts.length) break;
    await opts[0].click({ force: true }).catch(() => {});
    await page.waitForTimeout(40);
  }
  q = await Q();
  check(q.directive_test >= 2, `the directive is resolved (directive_test = ${q.directive_test}, now active: ${q.directive_active ? q.directive_id : "none"}, time ${q.time}, last ${q.directive_last_time})`);
  const visited = await ev(() => window.__visited);
  check(visited.some(v => /^sys_dir_reckoning/.test(v)), 'the verdict event fires');
  await toMain();

  // ------------------------------------------------ the news and the ledger
  await ev(() => { RG.ledger('A test entry.', 'test'); RG.ledger('A test entry.', 'test'); });
  q = await Q();
  check(q.ledger.filter(x => /A test entry/.test(x)).length === 1, 'a keyed ledger entry is added once');
  check(q.news_items.length <= 4, 'news_items holds at most four items');

  check(badText.size === 0, 'no bad text' + (badText.size ? ': ' + [...badText].slice(0, 5).join(' | ') : ''));
  check(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await browser.close();
  console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
})();
