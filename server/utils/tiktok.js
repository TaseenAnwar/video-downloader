/**
 * TikTok video extractor
 */
const axios = require('axios');
const cheerio = require('cheerio');
const stream = require('stream');
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);

/**
 * Extract information about a TikTok video
 * @param {string} url - TikTok video URL
 * @returns {Object} Video information including title, thumbnail, etc.
 */
async function extractInfo(url) {
  try {
    // Normalize URL (remove tracking parameters if any)
    const cleanUrl = cleanTikTokUrl(url);
    
    // Fetch the TikTok page
    const response = await axios.get(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.tiktok.com/'
      }
    });
    
    // Parse the HTML
    const $ = cheerio.load(response.data);
    
    // Extract video information from meta tags
    const title = $('meta[property="og:title"]').attr('content') || 'TikTok Video';
    const thumbnail = $('meta[property="og:image"]').attr('content') || '';
    const description = $('meta[property="og:description"]').attr('content') || '';
    const author = $('meta[property="og:title"]').attr('content')?.split(' on TikTok')[0] || 'Unknown Creator';
    
    // Look for JSON-LD data
    let videoUrl = '';
    let duration = null;
    
    // Try to find the video URL in the page source
    // This is a simplified approach - TikTok regularly changes their structure
    const videoMatches = response.data.match(/"playAddr":"([^"]+)"/);
    if (videoMatches && videoMatches[1]) {
      videoUrl = videoMatches[1].replace(/\\u002F/g, '/');
    }
    
    // Try to find duration in the page source
    const durationMatches = response.data.match(/"duration":(\d+)/);
    if (durationMatches && durationMatches[1]) {
      duration = parseInt(durationMatches[1]);
    }
    
    return {
      title: title,
      platform: 'tiktok',
      thumbnail: thumbnail,
      description: description,
      author: author,
      duration: duration,
      videoUrl: videoUrl
    };
  } catch (error) {
    console.error('TikTok extraction error:', error);
    throw new Error('Failed to extract TikTok video. ' + (error.message || ''));
  }
}

/**
 * Get a video stream for downloading
 * @param {string} url - TikTok video URL
 * @returns {ReadableStream} Video stream
 */
async function getVideoStream(url) {
  try {
    // First get video info to extract the direct video URL
    const info = await extractInfo(url);
    
    if (!info.videoUrl) {
      throw new Error('Could not find video URL in TikTok page');
    }
    
    // Create a PassThrough stream
    const passThrough = new stream.PassThrough();
    
    // Get the video content as a stream
    const response = await axios({
      method: 'GET',
      url: info.videoUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.tiktok.com/'
      }
    });
    
    // Pipe the response to our PassThrough stream
    response.data.pipe(passThrough);
    
    return passThrough;
  } catch (error) {
    console.error('TikTok stream error:', error);
    throw new Error('Failed to stream TikTok video. ' + (error.message || ''));
  }
}

/**
 * Clean TikTok URL by removing tracking parameters
 * @param {string} url - TikTok URL
 * @returns {string} Cleaned URL
 */
function cleanTikTokUrl(url) {
  try {
    const urlObj = new URL(url);
    
    // Keep only essential path and remove query parameters
    // Format should be like https://www.tiktok.com/@username/video/1234567890
    const pathParts = urlObj.pathname.split('/');
    let cleanPath = '';
    
    // Check if the URL contains a username and video ID
    if (pathParts.includes('video')) {
      const usernameIndex = pathParts.findIndex(part => part.startsWith('@'));
      const videoIndex = pathParts.indexOf('video');
      
      if (usernameIndex !== -1 && videoIndex !== -1 && videoIndex + 1 < pathParts.length) {
        cleanPath = `/${pathParts[usernameIndex]}/video/${pathParts[videoIndex + 1]}`;
      } else {
        cleanPath = urlObj.pathname; // Keep original path if pattern not found
      }
    } else {
      cleanPath = urlObj.pathname; // Keep original path
    }
    
    // Construct clean URL with only essential parts
    return `${urlObj.protocol}//${urlObj.host}${cleanPath}`;
  } catch (error) {
    console.error('Error cleaning TikTok URL:', error);
    return url; // Return original URL if cleaning fails
  }
}

module.exports = {
  extractInfo,
  getVideoStream
};
