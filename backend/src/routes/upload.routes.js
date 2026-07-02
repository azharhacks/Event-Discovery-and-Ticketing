const express = require('express');
const { uploadBanner } = require('../middleware/upload.middleware');
const { protect, organizerOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/banner', protect, organizerOnly, (req, res) => {
  uploadBanner.single('banner')(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be under 5MB.'
        : err.message || 'Upload failed.';
      return res.status(400).json({ success: false, message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    const url = `/uploads/banners/${req.file.filename}`;
    return res.status(201).json({
      success: true,
      message: 'Banner uploaded.',
      data: { url, filename: req.file.filename },
    });
  });
});

module.exports = router;
