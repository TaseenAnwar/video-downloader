/**
 * Facebook video extractor
 */
const axios = require('axios');
const cheerio = require('cheerio');
const stream = require('stream');

/**
 * Extract information about a Facebook video
 * @param {string} url - Facebook video URL
 * @returns {Object} Video information including title, thumbnail, etc.
 */
async function extractInfo(url) {
  try {
    // Normalize URL
    const cleanUrl = cleanFacebookUrl(url);
    
    // Fetch the Facebook page
    const response = await axios.get(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml',
        'sec-fetch-site': 'none',
        'sec-fetch-mode': 'navigate'
      }
    });
    
    // Parse the HTML
    const $ = cheerio.load(response.data);
    
    // Extract video information from meta tags
    const title = $('meta[property="og:title"]').attr('content') || 'Facebook Video';
    const description = $('meta[property="og:description"]').attr('content') || '';
    const thumbnail = $('meta[property="og:image"]').attr('content') || '';
    
    // Try to find the video URL in the page source
    // Facebook regularly changes their structure, so this is a simplified approach
    let videoUrl = '';
    
    // Look for the HD src first, then SD
    const hdSrcMatch = response.data.match(/"hd_src":"([^"]+)"/);
    const sdSrcMatch = response.data.match(/"sd_src":"([^"]+)"/);
    
    if (hdSrcMatch && hdSrcMatch[1]) {
      videoUrl = hdSrcMatch[1].replace(/\\\//g, '/');
    } else if (sdSrcMatch && sdSrcMatch[1]) {
      videoUrl = sdSrcMatch[1].replace(/\\\//g, '/');
    }
    
    // Sometimes the video URL is in the og:video tag
    if (!videoUrl) {
      videoUrl = $('meta[property="og:video"]').attr('content') || 
                 $('meta[property="og:video:url"]').attr('content') || '';
    }
    
    // Try to get the author from meta tags
    let author = $('meta[property="og:title"]').attr('content')?.split(' - ')[0] || 'Unknown User';
    
    return {
      title: title,
      platform: 'facebook',
      thumbnail: thumbnail,
      description: description,
      author: author,
      duration: null, // Facebook doesn't easily expose duration
      videoUrl: videoUrl
    };
  } catch (error) {
    console.error('Facebook extraction error:', error);
    throw new Error('Failed to extract Facebook video. ' + (error.message || ''));
  }
}

/**
 * Get a video stream for downloading
 * @param {string} url - Facebook video URL
 * @returns {ReadableStream} Video stream
 */
async function getVideoStream(url) {
  try {
    // First get video info to extract the direct video URL
    const info = await extractInfo(url);
    
    if (!info.videoUrl) {
      throw new Error('Could not find video URL in Facebook page');
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
        'Referer': 'https://www.facebook.com/'
      }
    });
    
    // Pipe the response to our PassThrough stream
    response.data.pipe(passThrough);
    
    return passThrough;
  } catch (error) {
    console.error('Facebook stream error:', error);
    throw new Error('Failed to stream Facebook video. ' + (error.message || ''));
  }
}

/**
 * Clean Facebook URL by removing tracking parameters
 * @param {string} url - Facebook URL
 * @returns {string} Cleaned URL
 */
function cleanFacebookUrl(url) {
  try {
    // Replace shortened fb.com with facebook.com for consistency
    let cleanUrl = url.replace('fb.com', 'facebook.com');
    
    const urlObj = new URL(cleanUrl);
    
    // Keep only these parameters if they exist
    const allowedParams = ['v'];
    const params = new URLSearchParams();
    
    for (const param of allowedParams) {
      if (urlObj.searchParams.has(param)) {
        params.set(param, urlObj.searchParams.get(param));
      }
    }
    
    // Update the search part of the URL with only allowed parameters
    urlObj.search = params.toString();
    
    return urlObj.toString();
  } catch (error) {
    console.error('Error cleaning Facebook URL:', error);
    return url; // Return original URL if cleaning fails
  }
}

module.exports = {
  extractInfo,
  getVideoStream
};
