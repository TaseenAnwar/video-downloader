const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { validateUrl } = require('../middleware/validators');

// Import video extractors
const youtubeExtractor = require('../utils/youtube');
const tiktokExtractor = require('../utils/tiktok');
const twitterExtractor = require('../utils/twitter');
const facebookExtractor = require('../utils/facebook');
const generalExtractor = require('../utils/general');

// Temp directory for downloads
const TEMP_DIR = path.join(__dirname, '../../temp');

// Create temp directory if it doesn't exist
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Extract video information from URL
 * POST /api/extract
 */
router.post('/extract', validateUrl, async (req, res, next) => {
  try {
    const { url } = req.body;
    const videoInfo = await processUrl(url);
    
    res.json(videoInfo);
  } catch (error) {
    next(error);
  }
});

/**
 * Download video
 * GET /api/download
 */
router.get('/download', validateUrl, async (req, res, next) => {
  try {
    const { url } = req.query;
    const videoInfo = await processUrl(url);
    
    // Create a unique filename
    const filename = `${Date.now()}_${videoInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
    const outputPath = path.join(TEMP_DIR, filename);
    
    // Get video stream based on platform
    let videoStream;
    
    if (videoInfo.platform === 'youtube') {
      videoStream = await youtubeExtractor.getVideoStream(url);
    } else if (videoInfo.platform === 'tiktok') {
      videoStream = await tiktokExtractor.getVideoStream(url);
    } else if (videoInfo.platform === 'twitter') {
      videoStream = await twitterExtractor.getVideoStream(url);
    } else if (videoInfo.platform === 'facebook') {
      videoStream = await facebookExtractor.getVideoStream(url);
    } else {
      videoStream = await generalExtractor.getVideoStream(url);
    }
    

    // Set headers
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');
    
    // Handle the stream
    videoStream.pipe(res);
    
    // Clean up temp file after streaming (for platforms that create temp files)
    videoStream.on('end', () => {
      if (fs.existsSync(outputPath)) {
        fs.unlink(outputPath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      }
    });
    
    videoStream.on('error', (err) => {
      console.error('Stream error:', err);
      next(err);
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Process URL and route to appropriate extractor
 */
async function processUrl(url) {
  // Determine which platform the URL belongs to
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return await youtubeExtractor.extractInfo(url);
  } else if (url.includes('tiktok.com')) {
    return await tiktokExtractor.extractInfo(url);
  } else if (url.includes('twitter.com') || url.includes('x.com')) {
    return await twitterExtractor.extractInfo(url);
  } else if (url.includes('facebook.com') || url.includes('fb.com')) {
    return await facebookExtractor.extractInfo(url);
  } else {
    // For any other URLs, use the general extractor
    return await generalExtractor.extractInfo(url);
  }
}

module.exports = router;
