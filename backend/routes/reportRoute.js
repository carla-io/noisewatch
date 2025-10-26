const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const NoiseReport = require("../models/Report");

const router = express.Router();

// ✅ Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Cloudinary Storage Setup
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "noise_reports",
    resource_type: "auto", // handles audio and video
    public_id: `${Date.now()}-${file.originalname}`,
  }),
});

const upload = multer({ storage });

// ✅ POST: Save new noise report
router.post("/new-report", upload.single("media"), async (req, res) => {
  try {
    const { reason, comment, location, mediaType } = req.body;
    const mediaUrl = req.file?.path;

    if (!mediaUrl || !reason) {
      return res.status(400).json({ message: "Media and reason are required." });
    }

    const parsedLocation = location ? JSON.parse(location) : null;

    const newReport = new NoiseReport({
      mediaUrl,
      mediaType,
      reason,
      comment,
      location: parsedLocation,
    });

    await newReport.save();
    res.status(201).json({
      message: "Noise report saved successfully!",
      report: newReport,
    });
  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).json({ message: "Error saving report", error: error.message });
  }
});

// ✅ GET: Fetch all noise reports
router.get("/get-report", async (req, res) => {
  try {
    const reports = await NoiseReport.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Error fetching reports", error: error.message });
  }
});

module.exports = router;
