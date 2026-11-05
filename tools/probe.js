// Evaluate an expression in a fresh game (for debugging the systems).
// Usage: node tools/probe.js <port> <date or ""> "<js expression using RG and Q>"
const { chromium } = require('playwright');
const [port, date, expr] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('pageerror: ' + e.message));
  page.on('console', m => console.log('console: ' + m.text()));
  await page.goto(`http://localhost:${port}/index.html`);
  await page.waitForTimeout(800);
  await page.click('#content a:has-text("Start game")');
  await page.waitForTimeout(200);
  const preset = date ? require('./presets.js').upTo(date) : {};
  const out = await page.evaluate(([preset, date, expr]) => {
    const Q = dendryUI.dendryEngine.state.qualities;
    if (date) {
      Object.assign(Q, preset);
      const [y, m] = date.split('-').map(Number);
      Q.year = y; Q.month = m; Q.time = (y - 1919) * 12 + m; Q.started = 1;
    }
    dendryUI.dendryEngine.goToScene('post_event');
    // eslint-disable-next-line no-eval
    return JSON.stringify(eval(expr), null, 1);
  }, [preset, date, expr]);
  console.log(out);
  await browser.close();
})();
