const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const fs = require('fs');

// Fixed image dimensions for Word export
const IMG_WIDTH = 324;
const IMG_HEIGHT = 240;

const uploadsDir = path.resolve(__dirname, '../../uploads');

// Use multer memory storage so sharp can process before saving
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, WebP images are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * POST /api/v1/upload
 * Upload a single image — auto-resized to 324×240px
 */
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      code: 'UPLOAD_ERROR',
      message: 'No image file provided',
    });
  }

  try {
    const filename = `${uuidv4()}.jpg`;
    const outputPath = path.join(uploadsDir, filename);

    // Resize to exact 324×240, cropping to fit
    const info = await sharp(req.file.buffer)
      .resize(IMG_WIDTH, IMG_HEIGHT, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toFile(outputPath);

    const imageUrl = `/uploads/${filename}`;

    return res.status(200).json({
      code: 'SUCCESS',
      message: 'Image uploaded successfully',
      data: { url: imageUrl, width: info.width, height: info.height },
    });
  } catch (err) {
    return res.status(500).json({
      code: 'UPLOAD_ERROR',
      message: 'Failed to process image',
    });
  }
});

module.exports = router;
