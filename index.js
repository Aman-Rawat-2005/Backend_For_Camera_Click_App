import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "admin-key"],
  })
);

await mongoose.connect(process.env.MONGO_URL);

const storage = multer.memoryStorage();
const upload = multer({ storage });

const ADMIN_KEY = process.env.ADMIN_KEY;

const Verification = mongoose.model(
  "Verification",
  new mongoose.Schema({
    photo: Buffer,
    location: Object,
    createdAt: { type: Date, default: Date.now },
  })
);

app.post("/api/verify", upload.single("photo"), async (req, res) => {
  try {
    const location = JSON.parse(req.body.location);

    await Verification.create({
      photo: req.file.buffer,
      location,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Save Error" });
  }
});

app.get("/api/admin/records", async (req, res) => {
  if (req.headers["admin-key"] !== ADMIN_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const records = await Verification.find();

  res.json(
    records.map((r) => ({
      id: r._id,
      location: r.location,
      createdAt: r.createdAt,
      photo: r.photo
        ? `data:image/jpeg;base64,${r.photo.toString("base64")}`
        : null,
    }))
  );
});

app.listen(5000, () => console.log("Backend running on port 5000"));
