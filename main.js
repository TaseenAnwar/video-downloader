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

    // API URL - Update with your Render.com URL in production
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000/api' 
        : '/api';

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
            
            // Call API to extract video info
            const videoInfo = await extractVideo(videoUrl);
            
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

    // Handle download button click
    downloadBtn.addEventListener('click', async () => {
        const videoUrl = videoUrlInput.value.trim();
        if (!videoUrl) return;
        
        try {
            // Start download
            window.location.href = `${API_BASE_URL}/download?url=${encodeURIComponent(videoUrl)}`;
        } catch (error) {
            console.error('Download error:', error);
            errorDetails.textContent = 'Download failed. Please try again.';
            
            hideAllSections();
            showSection(errorSection);
        }
    });

    // Extract video information
    async function extractVideo(url) {
        const response = await fetch(`${API_BASE_URL}/extract`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to extract video');
        }

        return await response.json();
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
