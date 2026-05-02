require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
app.use(cors({
  origin: "https://construction-site-delta-six.vercel.app"
}));

const app = express();
app.use(express.json({ limit: "10mb" }));

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅MongoDB connected"))
.catch(err => console.log("❌ Mongo error:",err));

const Report = mongoose.model("Report", {
  client: String,
  consultant: String,
  contractor: String,
  project: String,
  title: String,
  rows: Array
});

app.post("/save-report", async (req, res) => {
  await Report.create(req.body);
  res.send("Saved");
});

app.get("/reports", async (req, res) => {
  const data = await Report.find().sort({ createdAt: -1 });
  res.json(data);
});

app.listen(5000, () => console.log("Server running"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running");
});

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

