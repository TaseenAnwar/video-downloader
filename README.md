# Video Downloader

A web application for downloading videos from various platforms including YouTube, TikTok, Twitter/X, Facebook, and more.

## Features

- Extract video information from multiple platforms
- Download videos as MP4 files
- Simple and user-friendly interface
- Support for multiple video sources

## Supported Platforms

- YouTube
- TikTok
- Twitter/X
- Facebook
- Generic video extraction for other websites

## Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/video-downloader.git
   cd video-downloader
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Deployment

### Deploying to GitHub Pages (Frontend only)

For a static frontend-only version, you can use GitHub Pages. Note that this approach won't include the backend functionality.

### Deploying to Render.com (Full Stack)

1. Push your code to GitHub
2. Create a new Web Service in Render.com
3. Connect your GitHub repository
4. Configure the service:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node.js
   - Branch: main (or your preferred branch)

5. Add any environment variables if needed
6. Click "Create Web Service"

## Important Notes

### Legal Considerations

- Always ensure you have the right to download and use any content
- Some platforms may prohibit downloading content in their Terms of Service
- This tool is meant for personal use and for downloading content you have the rights to use

### Technical Limitations

- Video extraction methods may break if platforms change their structure
- Not all websites are supported for video extraction
- Some videos may be protected and impossible to download

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [ytdl-core](https://github.com/fent/node-ytdl-core) for YouTube extraction
- [cheerio](https://github.com/cheeriojs/cheerio) for HTML parsing
- [axios](https://github.com/axios/axios) for HTTP requests

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
