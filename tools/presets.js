// Historical state at the start of each period, for tools/playtest.js.
// Each file in tools/presets/ exports { from: 'YYYY-M', state: {...} }: the
// qualities as they stand at that date if events went as in history. upTo()
// merges, in date order, every preset that starts on or before the date.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'presets');
const ym = (t) => { const [y, m] = t.split('-').map(Number); return y * 12 + m; };

function upTo(date) {
  const all = fs.readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => require(path.join(dir, f)))
    .filter((p) => ym(p.from) <= ym(date))
    .sort((a, b) => ym(a.from) - ym(b.from));
  const state = {};
  for (const p of all) {
    Object.assign(state, p.state);
  }
  return state;
}

module.exports = { upTo };
