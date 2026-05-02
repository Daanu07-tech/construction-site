const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());

app.use(express.json({ limit: "10mb" }));

console.log("MONGO_URI:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.log("❌ Mongo error:",err));

const Report = mongoose.model("Report", new mongoose.Schema({
  client: String,
  consultant: String,
  contractor: String,
  project: String,
  title: String,
  rows: Array
}, { timestamps: true }));

app.post("/reports", async (req, res) => {
  try {
    await Report.create(req.body);
    res.send("Saved");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving report");
  }
});

app.get("/reports", async (req, res) => {
  try {
    const data = (await Report.find()).sort({ createdAt: -1 });

    console.log("Reports fetched:", data);

    res.json(data);
  } catch (err) {
    console.error("❌ ERROR IN /reports:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

