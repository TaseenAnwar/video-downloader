/**
 * YouTube video extractor
 */
const ytdl = require('ytdl-core');

/**
 * Extract information about a YouTube video
 * @param {string} url - YouTube video URL
 * @returns {Object} Video information including title, thumbnail, etc.
 */
async function extractInfo(url) {
  try {
    // Get video info
    const info = await ytdl.getInfo(url);
    
    // Get basic details
    const videoDetails = info.videoDetails;
    
    return {
      title: videoDetails.title,
      platform: 'youtube',
      thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
      duration: parseInt(videoDetails.lengthSeconds),
      author: videoDetails.author.name,
      formats: info.formats
        .filter(format => format.hasVideo && format.hasAudio)
        .map(format => ({
          quality: format.qualityLabel,
          mimeType: format.mimeType,
          itag: format.itag
        }))
    };
  } catch (error) {
    console.error('YouTube extraction error:', error);
    throw new Error('Failed to extract YouTube video. ' + (error.message || ''));
  }
}

/**
 * Get a video stream for downloading
 * @param {string} url - YouTube video URL
 * @returns {ReadableStream} Video stream
 */
async function getVideoStream(url) {
  try {
    // Get best format with both video and audio
    const options = {
      quality: 'highest',
      filter: format => format.container === 'mp4' && format.hasVideo && format.hasAudio
    };
    
    return ytdl(url, options);
  } catch (error) {
    console.error('YouTube stream error:', error);
    throw new Error('Failed to stream YouTube video. ' + (error.message || ''));
  }
}

module.exports = {
  extractInfo,
  getVideoStream
};
