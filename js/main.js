document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // DOM elements
    const downloadForm = document.getElementById('download-form');
    const videoUrlInput = document.getElementById('video-url');
    const submitBtn = document.getElementById('submit-btn');
    const statusSection = document.getElementById('status');
    const resultSection = document.getElementById('result');
    const errorSection = document.getElementById('error');
    const errorDetails = document.getElementById('error-details');
    const downloadBtn = document.getElementById('download-btn');
    
    // Video details elements
    const videoThumbnail = document.getElementById('thumbnail');
    const videoTitle = document.getElementById('video-title');
    const videoPlatform = document.getElementById('video-platform');
    const videoDuration = document.getElementById('video-duration');

    // Handle form submission
    downloadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const videoUrl = videoUrlInput.value.trim();
        if (!videoUrl) return;
        
        // Reset UI
        hideAllSections();
        showSection(statusSection);
        
        try {
            // Disable form while processing
            setFormEnabled(false);
            
            // Extract video info client-side (simplified for demo)
            const videoInfo = await clientSideExtractVideo(videoUrl);
            
            // Update UI with video info
            updateVideoInfo(videoInfo);
            
            // Show result section
            hideAllSections();
            showSection(resultSection);
        } catch (error) {
            console.error('Error:', error);
            errorDetails.textContent = error.message || 'Could not process this video. Please try another URL.';
            
            // Show error section
            hideAllSections();
            showSection(errorSection);
        } finally {
            setFormEnabled(true);
        }
    });

    // Client-side video extraction (basic version for GitHub Pages demo)
    async function clientSideExtractVideo(url) {
        // Basic URL validation
        try {
            new URL(url);
        } catch (error) {
            throw new Error('Invalid URL format');
        }

        // Determine which platform the URL belongs to
        let platform = 'unknown';
        let title = 'Video';
        let thumbnail = '';
        let duration = null;
        
        // YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            platform = 'youtube';
            
            // Extract video ID
            let videoId = '';
            if (url.includes('youtube.com/watch')) {
                const urlObj = new URL(url);
                videoId = urlObj.searchParams.get('v') || '';
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0] || '';
            }
            
            if (!videoId) {
                throw new Error('Could not extract YouTube video ID');
            }
            
            // Set thumbnail from video ID
            thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            title = 'YouTube Video: ' + videoId;
            
            // Set download link to original YouTube
            downloadBtn.href = url;
        } 
        // TikTok
        else if (url.includes('tiktok.com')) {
            platform = 'tiktok';
            title = 'TikTok Video';
            thumbnail = 'https://sf16-scmcdn-sg.ibytedtos.com/goofy/tiktok/falcon/falcon/webapp/main/webapp-static/image/tiktok-logo-dark.1e8e3a0c.png';
            downloadBtn.href = url;
        } 
        // Twitter/X
        else if (url.includes('twitter.com') || url.includes('x.com')) {
            platform = 'twitter';
            title = 'Twitter Video';
            thumbnail = 'https://abs.twimg.com/responsive-web/client-web/icon-default.ee392b40.png';
            downloadBtn.href = url;
        } 
        // Facebook
        else if (url.includes('facebook.com') || url.includes('fb.com')) {
            platform = 'facebook';
            title = 'Facebook Video';
            thumbnail = 'https://static.xx.fbcdn.net/rsrc.php/y8/r/dF5SId3UHWd.svg';
            downloadBtn.href = url;
        } 
        // Other platforms
        else {
            platform = new URL(url).hostname.replace('www.', '');
            title = `Video from ${platform}`;
            downloadBtn.href = url;
        }
        
        return {
            title: title,
            platform: platform,
            thumbnail: thumbnail,
            duration: duration,
            originalUrl: url
        };
    }

    // Update video info in the UI
    function updateVideoInfo(info) {
        videoThumbnail.src = info.thumbnail || '';
        videoTitle.textContent = info.title || 'Unknown Title';
        videoPlatform.textContent = `Platform: ${info.platform || 'Unknown'}`;
        
        if (info.duration) {
            videoDuration.textContent = `Duration: ${formatDuration(info.duration)}`;
            videoDuration.classList.remove('hidden');
        } else {
            videoDuration.classList.add('hidden');
        }
        
        // Update download button to point to original URL
        downloadBtn.href = info.originalUrl;
    }

    // Format duration from seconds to mm:ss
    function formatDuration(seconds) {
        if (!seconds) return 'Unknown';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // UI Helper functions
    function hideAllSections() {
        statusSection.classList.add('hidden');
        resultSection.classList.add('hidden');
        errorSection.classList.add('hidden');
    }

    function showSection(section) {
        section.classList.remove('hidden');
    }

    function setFormEnabled(enabled) {
        videoUrlInput.disabled = !enabled;
        submitBtn.disabled = !enabled;
        if (!enabled) {
            submitBtn.querySelector('.btn-text').textContent = 'Processing...';
        } else {
            submitBtn.querySelector('.btn-text').textContent = 'Extract Video';
        }
    }
});