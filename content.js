let videoData = null;

function extractVideoInfo() {
  try {
    const videoId = new URLSearchParams(window.location.search).get('v');
    
    if (!videoId) {
      return null;
    }
    
    const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer') || 
                         document.querySelector('h1.title yt-formatted-string') ||
                         document.querySelector('ytd-watch-metadata h1 yt-formatted-string');
    
    const authorElement = document.querySelector('ytd-channel-name a') ||
                          document.querySelector('#channel-name a') ||
                          document.querySelector('#owner-name a');
    
    const title = titleElement ? titleElement.textContent.trim() : 'YouTube Video';
    const author = authorElement ? authorElement.textContent.trim() : 'Unknown';
    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    
    return {
      videoId,
      title,
      author,
      thumbnail,
      url: window.location.href
    };
  } catch (error) {
    console.error('Error extracting video info:', error);
    return null;
  }
}

function addDownloadButton() {
  if (document.getElementById('yt-downloader-btn')) {
    return;
  }
  
  const targetContainer = document.querySelector('#top-level-buttons-computed') ||
                          document.querySelector('#menu-container') ||
                          document.querySelector('.ytd-menu-renderer');
  
  if (!targetContainer) {
    setTimeout(addDownloadButton, 1000);
    return;
  }
  
  const downloadBtn = document.createElement('button');
  downloadBtn.id = 'yt-downloader-btn';
  downloadBtn.className = 'yt-downloader-button';
  downloadBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
    <span>Download</span>
  `;
  
  downloadBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
  
  targetContainer.insertBefore(downloadBtn, targetContainer.firstChild);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getVideoInfo') {
    videoData = extractVideoInfo();
    
    if (videoData) {
      sendResponse({ success: true, data: videoData });
    } else {
      sendResponse({ success: false, error: 'Could not extract video information' });
    }
  }
  
  return true;
});

function init() {
  if (window.location.href.includes('youtube.com/watch')) {
    setTimeout(() => {
      videoData = extractVideoInfo();
      addDownloadButton();
    }, 2000);
  }
}

init();

let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    init();
  }
}).observe(document, { subtree: true, childList: true });
