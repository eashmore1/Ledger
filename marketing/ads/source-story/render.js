const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const dir = __dirname, frames = path.join(dir, 'frames');
const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
(async () => {
  fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames);
  const T = JSON.parse(fs.readFileSync(path.join(dir, 'timing.json')));
  
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.addInitScript(([t, l]) => { window.TIMING = t; window.LINES = l; }, [T, null]);
  await p.goto('file://' + path.join(dir, 'ad.html'));
  await p.evaluate(() => document.fonts.ready);
  const n = Math.ceil(T.total * 30);
  const list = only || [...Array(n).keys()];
  for (const i of list) {
    await p.evaluate(t => render(t), i / 30);
    await p.screenshot({ path: path.join(frames, String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 93 });
  }
  await b.close(); console.log('frames', list.length);
})();
