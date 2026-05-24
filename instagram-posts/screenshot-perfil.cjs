#!/usr/bin/env node
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const html = path.join(__dirname, 'perfil-instagram.html');
  await page.goto('file://' + html.replace(/\\/g, '/'));
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
  const el = await page.$('.post');
  await el.screenshot({ path: path.join(__dirname, 'perfil-instagram.png') });
  await browser.close();
  console.log('OK: perfil-instagram.png');
})().catch(e => { console.error(e); process.exit(1); });
