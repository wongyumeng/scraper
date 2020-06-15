const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const link = 'https://meeples.com.my/game-list.php';
  await page.goto(link);
  
  const urls = await page.evaluate(() => {
    const data = []
    Array.from(document.getElementById("gamelist").querySelectorAll("li")).slice(2).forEach(element => {
      data.push(element.querySelector("a").href);
    });
    
    return data;
  })
  urls.forEach(u => console.log(u));
  await browser.close();
})();