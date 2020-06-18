
const mongoURL = "mongodb://localhost:27017/"
const dbName = "test";
const collectionProduct = "product";
const collectionProductPrice = "product_price"
const puppeteer = require('puppeteer-extra')
const mongoClient = require("mongodb").MongoClient;
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const bent = require("bent");

const getBuffer = bent("buffer");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const link = 'https://www.davidjones.com/men/clothing';
  await page.goto(link);
  const links = [];
  const products = [];
  const productCategories = (await (await (await page.$("[data-catid=\"881495\"]")).$("ul")).$$("a"));
  for (const el of productCategories) {
    const link = await el.evaluate(a => a.getAttribute("href"));
    links.push(link);
    break;
  }
  console.log(links);
  for (let l of links) {
    await page.goto(l);
    const numberOfItems = await page.$eval(".total", el => el.textContent);
    l = avoidLoadMore(l, numberOfItems);
    console.log(l);
    page.goto(l);
    // while (!(await page.$(".disabled"))) {
    //   try {
    //     console.log("before");
    //     await page.tap(".loading-button");
    //     console.log("after");
    //   } catch (e) {
    //     console.log("element not found");
    //   }
    // }
    // while (!(await page.$(".disabled"))) {
    //   console.log("wow")
    //   await page.tap(".loading-button").catch((e) => console.log("lol"));
    //   await page.waitForSelector(".progress-completed").catch((e) => console.log("lol"));
    //   console.log("bye")
    // }
    // console.log("finn")
    const result = await page.evaluate(() => {
      const items = []
      for (el of document.querySelector(".products").childNodes) {
        const item = {
          id: el.querySelector(".style-number").textContent.replace(/\D/g,''),
          shop: "David Jones",
          brand: el.querySelector(".item-brand")
                    .textContent,
          name: el.querySelector("h4").textContent,
          link: el.querySelector("h4").querySelector("a").href,
          price: el.querySelector(".price").textContent,
          img: el.querySelector("img").src
        }
        const itemPrice = {
          id: el.querySelector(".style-number").textContent.replace(/\D/g,''),
          price: el.querySelector(".price").textContent,
          date: (new Date()).toISOString()
        }
        items.push([item, itemPrice]);
        
      }
      return items;
    });
    products.push(result);
  }
  
  // mongoClient.connect(mongoURL, function(err, client) {
  //   if (!err) {
  //     console.log("Connected");
  //   }
  //   const db = client.db("test");
  //   const collection = db.collection("product");
  //   const bulk = collection.initializeUnorderedBulkOp();

  //   products[0].forEach((p, i) => {
  //     bulk.find(p).upsert().replaceOne(p);
  //     console.log(p.price);
  //     console.log(i);
  //   });
  //   bulk.execute();
  //   console.log("done");
  //   client.close();
  // })

  insertToProduct(products).then(_ => 
    insertToProductPrice(products)).then(_=> 
    browser.close())
})();


function avoidLoadMore(url, text) {
  const length = text.length;
  const extraLength = 9;
  const numberOfItems = Number(text.substring(length - extraLength + 1, 0));
  const maxItemsPerPage = 90;
  const pageArgument = "#catpage=" + Math.ceil(numberOfItems/maxItemsPerPage);
  return url + pageArgument;
}

async function insertToProduct(items) {
  let client;
  try {
    client = await mongoClient.connect(mongoURL);
    const db = client.db(dbName);
    const collection = db.collection(collectionProduct);
    const bulk = collection.initializeUnorderedBulkOp();
    items[0].forEach((item_, index) => {
      const item = item_[0]
      bulk.find(item).upsert().replaceOne(item);
      console.log(item.price);
      console.log(index);
    });
    bulk.execute();
  } catch(e) {
    console.error(e);
  } finally {
    console.log("done");
    client.close();
  }

}

async function insertToProductPrice(items) {
  let client;
  try {
    client = await mongoClient.connect(mongoURL);
    const db = client.db(dbName);
    const collection = db.collection(collectionProductPrice);
    const bulk = collection.initializeUnorderedBulkOp();
    items[0].forEach((item_, index) => {
      const item = item_[1]
      bulk.insert(item);
      console.log(item.price);
      console.log(index);
    });
    bulk.execute();
  } catch(e) {
    console.error(e);
  } finally {
    console.log("done");
    client.close();
  }

}