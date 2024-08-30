import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // If you have static files
const PORT = process.env.PORT || 5000;

import methodOverride from "method-override";
import { nanoid } from "nanoid";
const mongoURL = process.env.MONGO_DB_URL;
const app = express();

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
app.set("views", "./views"); // Ensure this points to your views directory

const urlSchema = new mongoose.Schema({
  fullUrl: String,
  shortUrl: String,
  clicks: { type: Number, default: 0 },
});

const Url = mongoose.model("Url", urlSchema);

app.get("/", async (req, res) => {
  const urls = await Url.find();
  res.render("index", { urls });
});

app.post("/shortUrls", async (req, res) => {
  const fullUrl = req.body.fullUrl;
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

app.listen(PORT, () => console.log(`Server running ${PORT}`));
