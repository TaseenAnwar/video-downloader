/**
 * Middleware for validating request data
 */

/**
 * Validate URL
 * Ensures URL is present and properly formatted
 */
function validateUrl(req, res, next) {
  // Get URL from request body or query parameters
  const url = req.body.url || req.query.url;
  
  // Check if URL exists
  if (!url) {
    return res.status(400).json({
      message: 'URL is required',
    });
  }
  
  // Basic URL validation
  try {
    new URL(url);
  } catch (err) {
    return res.status(400).json({
      message: 'Invalid URL format',
    });
  }
  
  // Additional validation for supported domains (optional)
  const supportedDomains = [
    'youtube.com', 'youtu.be',
    'tiktok.com',
    'twitter.com', 'x.com',
    'facebook.com', 'fb.com',
    // Add more as needed
  ];
  
  // Check if URL is from a supported domain (commented out by default)
  /*
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.replace('www.', '');
  
  const isDomainSupported = supportedDomains.some(domain => hostname.includes(domain));
  
  if (!isDomainSupported) {
    return res.status(400).json({
      message: 'URL domain not supported',
    });
  }
  */
  
  next();
}

module.exports = {
  validateUrl,
};
