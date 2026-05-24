#!/usr/bin/env node
// Renderiza HTMLs em PNG 1080x1350 (formato feed Instagram vertical)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const files = process.argv.slice(2);
  const targets = files.length ? files : fs.readdirSync(__dirname).filter(f => /^post-\d+.*\.html$/.test(f));

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  for (const f of targets) {
    const html = path.join(__dirname, f);
    if (!fs.existsSync(html)) { console.log('SKIP: ' + f); continue; }
    const out = html.replace(/\.html$/, '.png');
    await page.goto('file://' + html.replace(/\\/g, '/'));
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);
    const el = await page.$('.post');
    if (el) {
      await el.screenshot({ path: out });
    } else {
      await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
    }
    console.log('OK: ' + path.basename(out));
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
