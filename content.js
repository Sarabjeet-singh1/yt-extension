
const extensionApi = globalThis.browser || globalThis.chrome;

let videoData = null;

function getSiteType(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('x.com') || url.includes('twitter.com')) {
    return 'x';
  }
  if (url.includes('instagram.com')) {
    return 'instagram';
  }
  return 'unknown';
}

function getMetaContent(property) {
  const element = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
  return element ? element.content : '';
}

function extractYouTubeInfo() {
  const url = window.location.href;
  let videoId = new URLSearchParams(window.location.search).get('v');

  if (!videoId && url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || null;
  }

  if (!videoId) {
    return null;
  }

  const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer') ||
                       document.querySelector('h1.title yt-formatted-string') ||
                       document.querySelector('ytd-watch-metadata h1 yt-formatted-string');

  const authorElement = document.querySelector('ytd-channel-name a') ||
                        document.querySelector('#channel-name a') ||
                        document.querySelector('#owner-name a');

  const title = titleElement?.textContent?.trim() || getMetaContent('og:title') || document.title || 'YouTube Video';
  const author = authorElement?.textContent?.trim() || getMetaContent('og:site_name') || 'YouTube';
  
  // Try to get thumbnail from page first - YouTube stores it in multiple places
  let thumbnail = '';
  
  // Method 1: Parse YouTube JSON data (most reliable)
  // Methods 1-3 already applied above (JSON, meta, video poster)
  
  // Method 4: Page thumbnail img (legacy)
  if (!thumbnail) {
    const thumbnailImg = document.querySelector('.ytp-videostreaming-data img') || 
                         document.querySelector('#thumbnail img') ||
                         document.querySelector('.ytd-thumbnail img');
    if (thumbnailImg) {
      thumbnail = thumbnailImg.src;
    }
  }
  
  // Method 5: Reliable i.ytimg.com fallback (HQ first, then maxres)
  if (!thumbnail) {
    thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }
  if (!thumbnail || thumbnail === `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`) {
    thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  }
  
  console.log('Final extracted thumbnail:', thumbnail, 'Video ID:', videoId); // Debug log

  if (!thumbnail) {
    const thumbnailImg = document.querySelector('.ytp-videostreaming-data img') || 
                         document.querySelector('#thumbnail img') ||
                         document.querySelector('.ytd-thumbnail img');
    if (thumbnailImg) {
      thumbnail = thumbnailImg.src;
    }
  }
  
  // Method 3: Use YouTube thumbnail URL with fallback sizes
  if (!thumbnail) {
    thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }

  return {
    videoId,
    title,
    author,
    thumbnail,
    url,
    source: 'youtube'
  };
}

function extractXInfo() {
  const url = window.location.href;
  let title = '';
  let author = '';
  let thumbnail = getMetaContent('og:image') || '';

  // X/Twitter video thumbnail selectors (priority video poster)
  const videoPoster = document.querySelector('video')?.poster ||
                     document.querySelector('[data-testid="videoPlayer"] video')?.poster ||
                     document.querySelector('div[data-testid="videoThumbnail"] img')?.src ||
                     document.querySelector('[data-testid="tweet"] video')?.poster;
  if (videoPoster) {
    thumbnail = videoPoster;
  }

  // Title from tweet text or og:title
  const tweetText = document.querySelector('[data-testid="tweetText"]');
  if (tweetText) {
    title = tweetText.textContent.trim().substring(0, 100) + (tweetText.textContent.length > 100 ? '...' : '');
  } else {
    title = getMetaContent('og:title') || 'X Video';
  }

  // Author from user name
  const userName = document.querySelector('[data-testid="User-Name"]');
  if (userName) {
    author = userName.textContent.trim();
  } else {
    author = 'X';
  }

  return {
    videoId: null,
    title,
    author,
    thumbnail,
    url,
    source: 'x'
  };
}

function extractInstagramInfo() {
  const url = window.location.href;
  let title = getMetaContent('og:title') || 'Instagram Video';
  let author = 'Instagram';
  let thumbnail = getMetaContent('og:image') || '';

  // Instagram video thumbnail selectors (reels/posts)
  const videoPoster = document.querySelector('div[role="main"] video')?.poster ||
                     document.querySelector('article video')?.poster ||
                     document.querySelector('video')?.poster;
  if (videoPoster) {
    thumbnail = videoPoster;
  } else {
    // Fallback to post video thumbnail img (higher res than og:image)
    const postImages = [...document.querySelectorAll('article img')];
    if (postImages[1]) { // Usually second img is video thumb
      thumbnail = postImages[1].src;
    } else if (postImages[0]) {
      thumbnail = postImages[0].src;
    }
  }

  // Author from profile link
  const authorSel = document.querySelector('header section a[href^="/"]');
  if (authorSel) {
    const strong = authorSel.querySelector('strong');
    author = strong ? strong.textContent.trim() : authorSel.textContent.trim();
  }

  return {
    videoId: null,
    title,
    author,
    thumbnail,
    url,
    source: 'instagram'
  };
}

function extractGenericSocialInfo(sourceName) {
  const url = window.location.href;
  const title = getMetaContent('og:title') || document.title || `${sourceName} Video`;
  const description = getMetaContent('og:description') || '';
  const author = description.split(':')[0]?.trim() || sourceName;
  const thumbnail = getMetaContent('og:image') || '';

  return {
    videoId: null,
    title,
    author,
    thumbnail,
    url,
    source: sourceName.toLowerCase()
  };
}

function extractVideoInfo() {
  try {
    const siteType = getSiteType(window.location.href);

    if (siteType === 'youtube') {
      return extractYouTubeInfo();
    }
    if (siteType === 'x') {
      return extractXInfo();
    }
    if (siteType === 'instagram') {
      return extractInstagramInfo();
    }

    return null;
  } catch (error) {
    console.error('Error extracting video info:', error);
    return null;
  }
}

function addYouTubeDownloadButton() {
  if (document.getElementById('yt-downloader-btn')) {
    return;
  }

  const targetContainer = document.querySelector('#top-level-buttons-computed') ||
                          document.querySelector('#menu-container') ||
                          document.querySelector('.ytd-menu-renderer');

  if (!targetContainer) {
    setTimeout(addYouTubeDownloadButton, 1000);
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
    extensionApi.runtime.sendMessage({ action: 'openPopup' });
  });

  targetContainer.insertBefore(downloadBtn, targetContainer.firstChild);
}

extensionApi.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
  const siteType = getSiteType(window.location.href);

  if (siteType === 'youtube' && window.location.href.includes('/watch')) {
    setTimeout(() => {
      videoData = extractVideoInfo();
      addYouTubeDownloadButton();
    }, 2000);
    return;
  }

  if (siteType === 'x' || siteType === 'instagram') {
    videoData = extractVideoInfo();
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
