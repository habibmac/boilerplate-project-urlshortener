require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
const validUrl = require("valid-url");
const bodyParser = require("body-parser");

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
    return res.status(404).json("No item found");
  }

  // find item in db
  const item = await Item.findOne({ short_url: shortUrl });
  if (!item) {
    return res.status(404).json("No item found");
  }

  // redirect to original url
  return res.redirect(item.original_url);
});

// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.post("/api/shorturl", urlencodedParser, async (req, res) => {
  // get url from request body
  const url = req.body.url;

  // check if url is valid
  const isValidUrl = validUrl.isUri(url);
  if (!isValidUrl) {
    return res.json({ error: "invalid url" });
  }

  // check if url already exists in db
  const existingItem = await Item.findOne({ original_url: url });
  if (existingItem) {
    return res.status(404).json(existingItem);
  }

  // generate url code
  const urlCode = nanoid(5);
  const shortUrl = urlCode;

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
