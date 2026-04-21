const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Root endpoint for quick browser checks
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Social Video Downloader Server is running',
    endpoints: {
      health: 'GET /health',
      download: 'POST /download'
    }
  });
});

// Get user's Downloads folder
function getUserDownloadsFolder() {
  const homeDir = os.homedir();
  return path.join(homeDir, 'Downloads');
}

function sanitizeFilename(input) {
  const fallback = 'video_download';
  const safeInput = (input || fallback).toString();
  const cleaned = safeInput
    .replace(/[^a-z0-9\s]/gi, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

  return cleaned || fallback;
}

function buildSingleVideoUrl(url, videoId, source) {
  const isYouTubeSource = source === 'youtube' || videoId || (url && (url.includes('youtube.com') || url.includes('youtu.be')));

  if (!isYouTubeSource) {
    return url || '';
  }

  // Always prefer a canonical single-video YouTube URL so playlist params (list/index/start_radio)
  // never trigger huge "Mix" downloads.
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  try {
    const parsed = new URL(url);
    let extractedVideoId = parsed.searchParams.get('v');

    if (!extractedVideoId && parsed.hostname.includes('youtu.be')) {
      extractedVideoId = parsed.pathname.split('/').filter(Boolean)[0] || '';
    }

    if (extractedVideoId) {
      return `https://www.youtube.com/watch?v=${extractedVideoId}`;
    }
  } catch (error) {
    // Keep the original URL if parsing fails.
  }

  return url || '';
}

// Check if yt-dlp is installed
function checkYtDlp(callback) {
  exec('yt-dlp --version', (error, stdout, stderr) => {
    if (error) {
      callback(false);
    } else {
      callback(true);
    }
  });
}

// Download video endpoint
app.post('/download', (req, res) => {
  const { videoId, url, source, title, quality, format } = req.body;
  
  if (!videoId && !url) {
    return res.status(400).json({ success: false, error: 'Video URL is required' });
  }

  checkYtDlp((isInstalled) => {
    if (!isInstalled) {
      return res.status(500).json({ 
        success: false, 
        error: 'yt-dlp is not installed. Please install it first.' 
      });
    }

    const videoUrl = buildSingleVideoUrl(url, videoId, source);
    const sanitizedTitle = sanitizeFilename(title);
    
    // Download directly to user's Downloads folder
    const userDownloadsFolder = getUserDownloadsFolder();
    let outputTemplate;
    let ytDlpCommand;
    let expectedExtension;

    if (format === 'mp3') {
      // Download audio only as MP3
      expectedExtension = 'mp3';
      outputTemplate = path.join(userDownloadsFolder, `${sanitizedTitle}.${expectedExtension}`);
      ytDlpCommand = `yt-dlp --no-playlist -x --audio-format mp3 --audio-quality 0 -o "${outputTemplate}" "${videoUrl}"`;
    } else if (format === 'mov') {
      // Download video as MOV - use recode-video to ensure compatibility
      expectedExtension = 'mov';
      outputTemplate = path.join(userDownloadsFolder, `${sanitizedTitle}.${expectedExtension}`);
      const qualityMap = {
        '360p': 'bestvideo[height<=360]+bestaudio/best[height<=360]',
        '480p': 'bestvideo[height<=480]+bestaudio/best[height<=480]',
        '720p': 'bestvideo[height<=720]+bestaudio/best[height<=720]',
        '1080p': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
        'max': 'bestvideo+bestaudio/best'
      };
      
      const formatString = qualityMap[quality] || 'best';
      // Force QuickTime-friendly codecs (H.264 + AAC) so .mov opens reliably on macOS.
      ytDlpCommand = `yt-dlp --no-playlist -f "${formatString}" --recode-video mov --postprocessor-args "VideoConvertor:-c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart" -o "${outputTemplate}" "${videoUrl}"`;
    } else {
      // Download video as MP4
      expectedExtension = 'mp4';
      outputTemplate = path.join(userDownloadsFolder, `${sanitizedTitle}.${expectedExtension}`);
      const qualityMap = {
        '360p': 'bestvideo[height<=360]+bestaudio/best[height<=360]',
        '480p': 'bestvideo[height<=480]+bestaudio/best[height<=480]',
        '720p': 'bestvideo[height<=720]+bestaudio/best[height<=720]',
        '1080p': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
        'max': 'bestvideo+bestaudio/best'
      };
      
      const formatString = qualityMap[quality] || 'best';
      ytDlpCommand = `yt-dlp --no-playlist -f "${formatString}" --merge-output-format mp4 -o "${outputTemplate}" "${videoUrl}"`;
    }

    console.log('Executing:', ytDlpCommand);
    console.log('Downloading to:', outputTemplate);

    const downloadProcess = exec(ytDlpCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('Download error:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Download failed: ' + error.message 
        });
      }

      const filename = `${sanitizedTitle}.${expectedExtension}`;
      const filePath = path.join(userDownloadsFolder, filename);

      // Check if file exists
      if (fs.existsSync(filePath)) {
        console.log('✓ File downloaded successfully:', filePath);
        res.json({ 
          success: true, 
          message: 'Download completed!',
          filename: filename,
          filePath: filePath
        });
      } else {
        // Sometimes yt-dlp might use a different extension, check for common alternatives
        const possibleExtensions = format === 'mp3' ? ['mp3'] : format === 'mov' ? ['mov', 'mp4', 'webm', 'mkv'] : ['mp4', 'webm', 'mkv', 'mov'];
        let foundFile = null;
        
        for (const ext of possibleExtensions) {
          const altFilename = `${sanitizedTitle}.${ext}`;
          const altFilePath = path.join(userDownloadsFolder, altFilename);
          if (fs.existsSync(altFilePath)) {
            foundFile = altFilename;
            console.log('✓ File downloaded with alternative extension:', altFilePath);
            break;
          }
        }
        
        if (foundFile) {
          res.json({ 
            success: true, 
            message: 'Download completed!',
            filename: foundFile,
            filePath: path.join(userDownloadsFolder, foundFile)
          });
        } else {
          console.error('✗ File was not created at expected location');
          res.status(500).json({ 
            success: false, 
            error: 'File was not created' 
          });
        }
      }
    });

    // Send progress updates
    downloadProcess.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    downloadProcess.stderr.on('data', (data) => {
      console.log(data.toString());
    });
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  checkYtDlp((isInstalled) => {
    res.json({ 
      status: 'ok', 
      ytdlpInstalled: isInstalled,
      message: isInstalled ? 'Server is ready' : 'yt-dlp is not installed',
      downloadsFolder: getUserDownloadsFolder()
    });
  });
});

app.listen(PORT, () => {
  console.log(`Social Video Downloader Server running on http://localhost:${PORT}`);
  console.log('Downloads will be saved to:', getUserDownloadsFolder());
  console.log('Checking yt-dlp installation...');
  
  checkYtDlp((isInstalled) => {
    if (isInstalled) {
      console.log('✓ yt-dlp is installed and ready');
    } else {
      console.log('✗ yt-dlp is NOT installed');
      console.log('Please install yt-dlp:');
      console.log('  macOS: brew install yt-dlp');
      console.log('  Linux: sudo apt install yt-dlp');
      console.log('  Windows: pip install yt-dlp');
    }
  });
});
