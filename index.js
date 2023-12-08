require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { customAlphabet } = require("nanoid");
const bodyParser = require("body-parser");
const dns = require("dns");

const Item = require("./models/item");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.static("public"));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

mongoose.connect(process.env.MONGO_URI);

app.get("/api/shorturl/:shortUrl", async (req, res) => {
  // get shortUrl from request params
  const shortUrl = req.params.shortUrl;
  if (!shortUrl) {
    return res.status(404).json({error: "No item found"});
  }

  // find item in db
  const item = await Item.findOne({ short_url: shortUrl });
  if (!item) {
    return res.status(404).json({error: "No item found"});
  }

  // redirect to original url
  return res.redirect(item.original_url);
});

// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.post("/api/shorturl", urlencodedParser, async (req, res) => {
  // get url from request body
  const url = req.body.url;

  // validate url format
  let urlObject;
  try {
    urlObject = new URL(url);
  } catch (err) {
    return res.status(400).json({ error: "invalid url" });
  }

  // Check if the protocol is http or https
  if (urlObject.protocol !== 'http:' && urlObject.protocol !== 'https:') {
    return res.status(400).json({ error: "invalid url" });
  }

  try {
    await new Promise((resolve, reject) => {
      dns.lookup(urlObject.hostname, (err) => {
        if (err) {
          reject("invalid url");
        } else {
          resolve();
        }
      });
    });
  } catch (err) {
    return res.status(400).json({ error: err });
  }


  // check if url already exists in db
  const existingItem = await Item.findOne({ original_url: url });
  if (existingItem) {
    return res.status(404).json(existingItem);
  }

  // generate url code
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const nanoid = customAlphabet(alphabet, 5);
  const shortUrl = nanoid();

  // create item
  const item = new Item({
    original_url: url,
    short_url: shortUrl,
    created_at: new Date(),
  });

  // store in db
  item.save();
  res.json(item);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
