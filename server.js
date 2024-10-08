const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const methodOverride = require("method-override");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const mongoURL = process.env.MONGO_DB_URL;

mongoose
  .connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1); // Exit the process if the connection fails
  });

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const urlSchema = new mongoose.Schema({
  fullUrl: String,
  shortUrl: String,
  clicks: { type: Number, default: 0 },
});

const Url = mongoose.model("Url", urlSchema);

app.get("/", async (req, res) => {
  const urls = await Url.find();
  res.render("index", {
    urls,
    baseUrl: process.env.BASE_URL, // Pass the environment variable to the template
  });
});

app.post("/shortUrls", async (req, res) => {
  const fullUrl = req.body.fullUrl;

  // Use dynamic import for nanoid
  const { nanoid } = await import("nanoid");

  const shortUrl = nanoid(8);

  const url = new Url({ fullUrl, shortUrl });
  await url.save();

  res.redirect("/");
});

app.delete("/shortUrls/:shortUrl", async (req, res) => {
  const shortUrl = req.params.shortUrl;
  await Url.deleteOne({ shortUrl });
  res.redirect("/");
});

app.get("/:shortUrl", async (req, res) => {
  const shortUrl = req.params.shortUrl;
  const url = await Url.findOne({ shortUrl });

  if (url == null) return res.sendStatus(404);

  url.clicks++;
  await url.save();

  res.redirect(url.fullUrl);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
