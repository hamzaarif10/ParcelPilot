const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const express = require("express");
const multer = require("multer");

const upload = multer();
const router = express.Router();

// Set up AWS S3 client
const s3 = new S3Client({
  region: "us-east-2", // Your bucket region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,   // From environment variables
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // From environment variables
  },
});

const bucketName = "label-storage100";  // Replace with your bucket name

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    // Generate a unique key for the file
    const key = `labels/${Date.now()}-${file.originalname}`;

    // Set up the parameters for the file upload
    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    // Upload file to S3
    await s3.send(new PutObjectCommand(uploadParams));

    // Generate a permanent URL for the uploaded file
    const fileUrl = `https://${bucketName}.s3.amazonaws.com/${key}`;

    // Respond with the file URL
    res.json({ url: fileUrl });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).send("Error uploading file");
  }
});

module.exports = router;
