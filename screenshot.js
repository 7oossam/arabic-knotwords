const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + __dirname + '/generator.html');
  await page.waitForTimeout(1000); // wait for JS to generate the puzzle
  await page.screenshot({ path: 'new_knotwords_layout.png', fullPage: true });
  await browser.close();
})();
