#!/usr/bin/env node
// Renderiza todos os slides de todos os carrosseis em PNG 1080x1350
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const baseDir = __dirname;
  const folders = fs.readdirSync(baseDir).filter(f => /^carrossel-/.test(f) && fs.statSync(path.join(baseDir, f)).isDirectory());

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  for (const folder of folders) {
    const folderPath = path.join(baseDir, folder);
    const slides = fs.readdirSync(folderPath).filter(f => /^slide-\d+\.html$/.test(f)).sort();
    for (const slide of slides) {
      const html = path.join(folderPath, slide);
      const out = html.replace(/\.html$/, '.png');
      await page.goto('file://' + html.replace(/\\/g, '/'));
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(400);
      const el = await page.$('.post');
      if (el) await el.screenshot({ path: out });
      else await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
      console.log(`OK: ${folder}/${path.basename(out)}`);
    }
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
