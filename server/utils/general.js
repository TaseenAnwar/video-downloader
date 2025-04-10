/**
 * General video extractor for websites not specifically supported
 */
const axios = require('axios');
const cheerio = require('cheerio');
const stream = require('stream');
const url = require('url');

/**
 * Extract information about a video from any website
 * @param {string} url - Video URL
 * @returns {Object} Video information including title, thumbnail, etc.
 */
async function extractInfo(videoUrl) {
  try {
    // Fetch the page
    const response = await axios.get(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    
    // Parse the HTML
    const $ = cheerio.load(response.data);
    
    // Extract video information from meta tags
    const title = $('meta[property="og:title"]').attr('content') || 
                 $('title').text() || 
                 'Video';
    
    const description = $('meta[property="og:description"]').attr('content') || 
                       $('meta[name="description"]').attr('content') || 
                       '';
    
    const thumbnail = $('meta[property="og:image"]').attr('content') || 
                     $('meta[name="thumbnail"]').attr('content') || 
                     '';
    
    // Get domain for platform info
    const domain = new URL(videoUrl).hostname.replace('www.', '');
    
    // Try to find video sources
    let videoSources = [];
    
    // Method 1: Look for video tags
    $('video').each((i, el) => {
      const src = $(el).attr('src');
      if (src) {
        // Make sure URL is absolute
        const absoluteSrc = makeAbsoluteUrl(src, videoUrl);
        videoSources.push({
          url: absoluteSrc,
          type: 'video/mp4', // Assume mp4 as default
          quality: 'unknown'
        });
      }
      
      // Check source tags within video tag
      $(el).find('source').each((j, source) => {
        const sourceSrc = $(source).attr('src');
        if (sourceSrc) {
          const absoluteSrc = makeAbsoluteUrl(sourceSrc, videoUrl);
          videoSources.push({
            url: absoluteSrc,
            type: $(source).attr('type') || 'video/mp4',
            quality: $(source).attr('size') || $(source).attr('label') || 'unknown'
          });
        }
      });
    });
    
    // Method 2: Look for og:video meta tag
    const ogVideo = $('meta[property="og:video"]').attr('content') || 
                   $('meta[property="og:video:url"]').attr('content');
    
    if (ogVideo) {
      const absoluteSrc = makeAbsoluteUrl(ogVideo, videoUrl);
      videoSources.push({
        url: absoluteSrc,
        type: $('meta[property="og:video:type"]').attr('content') || 'video/mp4',
        quality: 'unknown'
      });
    }
    
    // Method 3: Search for video URLs in the HTML
    const videoRegex = /https?:\/\/[^"'\s)]+\.(mp4|mov|webm|ogg)/g;
    const matches = response.data.match(videoRegex);
    
    if (matches && matches.length > 0) {
      matches.forEach(match => {
        // Avoid duplicates
        if (!videoSources.some(s => s.url === match)) {
          const fileType = match.split('.').pop();
          let mimeType;
          
          switch (fileType) {
            case 'mp4': mimeType = 'video/mp4'; break;
            case 'webm': mimeType = 'video/webm'; break;
            case 'ogg': mimeType = 'video/ogg'; break;
            case 'mov': mimeType = 'video/quicktime'; break;
            default: mimeType = 'video/mp4';
          }
          
          videoSources.push({
            url: match,
            type: mimeType,
            quality: 'unknown'
          });
        }
      });
    }
    
    // Get best video source (assuming first is best for now)
    const bestSource = videoSources.length > 0 ? videoSources[0] : null;
    
    return {
      title: title,
      platform: domain,
      thumbnail: thumbnail,
      description: description,
      author: '',
      duration: null,
      videoUrl: bestSource ? bestSource.url : null,
      videoSources: videoSources
    };
  } catch (error) {
    console.error('General extraction error:', error);
    throw new Error('Failed to extract video. ' + (error.message || ''));
  }
}

/**
 * Get a video stream for downloading
 * @param {string} url - Video URL
 * @returns {ReadableStream} Video stream
 */
async function getVideoStream(url) {
  try {
    // First get video info to extract the direct video URL
    const info = await extractInfo(url);
    
    if (!info.videoUrl) {
      throw new Error('Could not find video URL in the page');
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
        'Referer': url
      }
    });
    
    // Pipe the response to our PassThrough stream
    response.data.pipe(passThrough);
    
    return passThrough;
  } catch (error) {
    console.error('General stream error:', error);
    throw new Error('Failed to stream video. ' + (error.message || ''));
  }
}

/**
 * Convert relative URL to absolute URL
 * @param {string} relativeUrl - Relative URL
 * @param {string} baseUrl - Base URL
 * @returns {string} Absolute URL
 */
function makeAbsoluteUrl(relativeUrl, baseUrl) {
  if (relativeUrl.startsWith('http')) {
    return relativeUrl;
  }
  
  return new URL(relativeUrl, baseUrl).toString();
}

module.exports = {
  extractInfo,
  getVideoStream
};
