let selectedQuality = '720p';
let selectedFormat = 'mp4';
let currentVideoData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url || (!tab.url.includes('youtube.com/watch') && !tab.url.includes('youtu.be/'))) {
    showNotYouTube();
    return;
  }
  
  showLoading();
  
  // Check if server is running
  try {
    const serverCheck = await chrome.runtime.sendMessage({ action: 'checkServer' });
    if (!serverCheck.success) {
      document.getElementById('server-warning').classList.remove('hidden');
    }
  } catch (error) {
    console.error('Server check failed:', error);
  }
  
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' });
    
    if (response && response.success) {
      currentVideoData = response.data;
      displayVideoInfo(response.data);
    } else {
      showError('Could not retrieve video information. Please refresh the page and try again.');
    }
  } catch (error) {
    showError('Error connecting to YouTube page. Please refresh and try again.');
  }
});

function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('video-info').classList.add('hidden');
  document.getElementById('error').classList.add('hidden');
  document.getElementById('not-youtube').classList.add('hidden');
}

function showError(message) {
  document.getElementById('error-message').textContent = message;
  document.getElementById('error').classList.remove('hidden');
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('video-info').classList.add('hidden');
  document.getElementById('not-youtube').classList.add('hidden');
}

function showNotYouTube() {
  document.getElementById('not-youtube').classList.remove('hidden');
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('video-info').classList.add('hidden');
  document.getElementById('error').classList.add('hidden');
}

function displayVideoInfo(data) {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('video-info').classList.remove('hidden');
  
  document.getElementById('thumbnail').src = data.thumbnail;
  document.getElementById('video-title').textContent = data.title;
  document.getElementById('video-author').textContent = data.author;
  
  // Setup format buttons
  const formatBtns = document.querySelectorAll('.format-btn');
  formatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      formatBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedFormat = btn.dataset.format;
      
      // Show/hide quality section based on format
      const qualitySection = document.getElementById('quality-section');
      const downloadBtn = document.getElementById('download-btn');
      
      if (selectedFormat === 'mp3') {
        qualitySection.style.display = 'none';
        downloadBtn.querySelector('span').textContent = 'Download Audio';
      } else if (selectedFormat === 'mov') {
        qualitySection.style.display = 'block';
        downloadBtn.querySelector('span').textContent = 'Download MOV Video';
      } else {
        qualitySection.style.display = 'block';
        downloadBtn.querySelector('span').textContent = 'Download Video';
      }
    });
  });
  
  // Setup quality buttons
  const qualityOptions = document.getElementById('quality-options');
  qualityOptions.innerHTML = '';
  
  const qualities = ['360p', '480p', '720p', '1080p'];
  
  qualities.forEach(quality => {
    const btn = document.createElement('button');
    btn.className = 'quality-btn';
    btn.textContent = quality;
    
    if (quality === selectedQuality) {
      btn.classList.add('selected');
    }
    
    btn.addEventListener('click', () => {
      document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedQuality = quality;
    });
    
    qualityOptions.appendChild(btn);
  });
  
  document.getElementById('download-btn').addEventListener('click', handleDownload);
}

async function handleDownload() {
  const downloadBtn = document.getElementById('download-btn');
  const statusDiv = document.getElementById('download-status');
  const statusMessage = document.getElementById('status-message');
  
  downloadBtn.disabled = true;
  const originalText = downloadBtn.querySelector('span').textContent;
  downloadBtn.querySelector('span').textContent = 'Downloading...';
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'downloadVideo',
      data: {
        videoId: currentVideoData.videoId,
        title: currentVideoData.title,
        quality: selectedQuality,
        format: selectedFormat
      }
    });
    
    if (response.success) {
      statusDiv.classList.remove('hidden');
      statusMessage.textContent = response.message || 'Download completed! Check your downloads folder.';
      downloadBtn.querySelector('span').textContent = 'Download Complete!';
      
      setTimeout(() => {
        statusDiv.classList.add('hidden');
        downloadBtn.disabled = false;
        downloadBtn.querySelector('span').textContent = originalText;
      }, 3000);
    } else {
      showError(response.error || 'Download failed. Please try again.');
      downloadBtn.disabled = false;
      downloadBtn.querySelector('span').textContent = originalText;
    }
  } catch (error) {
    showError('Download failed. Please try again.');
    downloadBtn.disabled = false;
    downloadBtn.querySelector('span').textContent = originalText;
  }
}
