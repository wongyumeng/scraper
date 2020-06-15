const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const link = 'https://boardgamecafe.biz/products/c34-solo-play/';
  await page.goto(link);
  while (!(await page.$eval(".loadmore_wrapper", el => el.attributes.class.textContent.includes("hide")))) {
    await page.click("#prod_lisiings_loadmoreresult");
    await page.waitForSelector('.loadmore_loading', {hidden: true});
    console.log("wow")
  }
  const urls = await page.evaluate(() => {
    const data = []
    Array.from(document.getElementsByClassName("product-details")).forEach(element => {
      const product = {
        name: element.querySelector("h6").textContent.trim(),
        price: element.getElementsByClassName("widget-mainprice")[0].textContent
      }
      data.push(product);
    });
    
    return data;
  })
  urls.forEach(u => console.log(u));
  console.log(urls.length);
  await browser.close();
})();