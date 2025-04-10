/**
 * Twitter/X video extractor
 */
const axios = require('axios');
const cheerio = require('cheerio');
const stream = require('stream');

/**
 * Extract information about a Twitter/X video
 * @param {string} url - Twitter/X video URL
 * @returns {Object} Video information including title, thumbnail, etc.
 */
async function extractInfo(url) {
  try {
    // Normalize URL
    const cleanUrl = cleanTwitterUrl(url);
    
    // Add mobile prefix to get a simpler version of the page
    const mobileUrl = cleanUrl.replace('twitter.com', 'mobile.twitter.com');
    
    // Fetch the Twitter page
    const response = await axios.get(mobileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    
    // Parse the HTML
    const $ = cheerio.load(response.data);
    
    // Extract video information from meta tags
    const title = $('meta[property="og:title"]').attr('content') || 'Twitter Video';
    const description = $('meta[property="og:description"]').attr('content') || '';
    const thumbnail = $('meta[property="og:image"]').attr('content') || '';
    const author = $('meta[property="og:title"]').attr('content')?.split(' on Twitter')[0] || 'Unknown User';
    
    // Try to find the video URL in the page source
    // Twitter regularly changes their structure, so this is a simplified approach
    let videoUrl = '';
    let videoSources = [];
    
    // Look for video elements or source elements
    $('video').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.includes('.mp4')) {
        videoSources.push({
          url: src,
          type: 'video/mp4'
        });
      }
    });
    
    $('source').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.includes('.mp4')) {
        videoSources.push({
          url: src,
          type: $(el).attr('type') || 'video/mp4'
        });
      }
    });
    
    // Try to find video URLs in the page source using regex
    const videoRegex = /https:\/\/video\.twimg\.com\/[^"'\s]+\.mp4/g;
    const matches = response.data.match(videoRegex);
    
    if (matches && matches.length > 0) {
      matches.forEach(match => {
        videoSources.push({
          url: match,
          type: 'video/mp4'
        });
      });
    }
    
    // Get highest quality video
    if (videoSources.length > 0) {
      videoUrl = videoSources[0].url;
    }
    
    return {
      title: title,
      platform: 'twitter',
      thumbnail: thumbnail,
      description: description,
      author: author,
      duration: null, // Twitter doesn't easily expose duration
      videoUrl: videoUrl,
      videoSources: videoSources
    };
  } catch (error) {
    console.error('Twitter extraction error:', error);
    throw new Error('Failed to extract Twitter video. ' + (error.message || ''));
  }
}

/**
 * Get a video stream for downloading
 * @param {string} url - Twitter/X video URL
 * @returns {ReadableStream} Video stream
 */
async function getVideoStream(url) {
  try {
    // First get video info to extract the direct video URL
    const info = await extractInfo(url);
    
    if (!info.videoUrl) {
      throw new Error('Could not find video URL in Twitter page');
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
        'Referer': 'https://twitter.com/'
      }
    });
    
    // Pipe the response to our PassThrough stream
    response.data.pipe(passThrough);
    
    return passThrough;
  } catch (error) {
    console.error('Twitter stream error:', error);
    throw new Error('Failed to stream Twitter video. ' + (error.message || ''));
  }
}

/**
 * Clean Twitter URL by removing tracking parameters
 * @param {string} url - Twitter URL
 * @returns {string} Cleaned URL
 */
function cleanTwitterUrl(url) {
  try {
    // Replace x.com with twitter.com for consistency
    let cleanUrl = url.replace('x.com', 'twitter.com');
    
    const urlObj = new URL(cleanUrl);
    
    // Remove query parameters
    urlObj.search = '';
    
    return urlObj.toString();
  } catch (error) {
    console.error('Error cleaning Twitter URL:', error);
    return url; // Return original URL if cleaning fails
  }
}

module.exports = {
  extractInfo,
  getVideoStream
};
