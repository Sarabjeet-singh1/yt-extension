const SERVER_URL = 'http://localhost:3000';
const extensionApi = globalThis.browser || globalThis.chrome;

extensionApi.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadVideo') {
    handleDownload(request.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'openPopup') {
    extensionApi.action.openPopup();
  }
  
  if (request.action === 'checkServer') {
    checkServerHealth()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function checkServerHealth() {
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    const data = await response.json();
    return { success: true, data: data };
  } catch (error) {
    return { 
      success: false, 
      error: 'Server is not running. Please start the server first.' 
    };
  }
}

async function handleDownload(data) {
  try {
    const { videoId, url, source, title, quality, format } = data;
    
    // Check if server is running
    const healthCheck = await checkServerHealth();
    if (!healthCheck.success) {
      return { 
        success: false, 
        error: 'Local server is not running. Please start the server first (npm start).' 
      };
    }
    
    if (!healthCheck.data.ytdlpInstalled) {
      return { 
        success: false, 
        error: 'yt-dlp is not installed. Please install it first (brew install yt-dlp).' 
      };
    }
    
    // Send download request to local server
    // The server will download directly to the user's Downloads folder
    const response = await fetch(`${SERVER_URL}/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        videoId,
        url,
        source,
        title,
        quality,
        format: format || 'mp4'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return { 
        success: true, 
        message: `${format === 'mp3' ? 'Audio' : 'Video'} downloaded successfully to your Downloads folder!`,
        filename: result.filename
      };
    } else {
      return { 
        success: false, 
        error: result.error || 'Download failed' 
      };
    }
  } catch (error) {
    console.error('Download error:', error);
    return { 
      success: false, 
      error: 'Download failed: ' + error.message 
    };
  }
}

extensionApi.runtime.onInstalled.addListener(() => {
  console.log('Social Video Downloader extension installed');
});
