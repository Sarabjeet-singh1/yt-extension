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

// Get user's Downloads folder
function getUserDownloadsFolder() {
  const homeDir = os.homedir();
  return path.join(homeDir, 'Downloads');
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
  const { videoId, title, quality, format } = req.body;
  
  if (!videoId) {
    return res.status(400).json({ success: false, error: 'Video ID is required' });
  }

  checkYtDlp((isInstalled) => {
    if (!isInstalled) {
      return res.status(500).json({ 
        success: false, 
        error: 'yt-dlp is not installed. Please install it first.' 
      });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const sanitizedTitle = title.replace(/[^a-z0-9\s]/gi, '_').replace(/\s+/g, '_').toLowerCase();
    
    // Download directly to user's Downloads folder
    const userDownloadsFolder = getUserDownloadsFolder();
    let outputTemplate;
    let ytDlpCommand;
    let expectedExtension;

    if (format === 'mp3') {
      // Download audio only as MP3
      expectedExtension = 'mp3';
      outputTemplate = path.join(userDownloadsFolder, `${sanitizedTitle}.${expectedExtension}`);
      ytDlpCommand = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputTemplate}" "${videoUrl}"`;
    } else if (format === 'mov') {
      // Download video as MOV - use recode-video to ensure compatibility
      expectedExtension = 'mov';
      outputTemplate = path.join(userDownloadsFolder, `${sanitizedTitle}.${expectedExtension}`);
      const qualityMap = {
        '360p': 'bestvideo[height<=360]+bestaudio/best[height<=360]',
        '480p': 'bestvideo[height<=480]+bestaudio/best[height<=480]',
        '720p': 'bestvideo[height<=720]+bestaudio/best[height<=720]',
        '1080p': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]'
      };
      
      const formatString = qualityMap[quality] || 'best';
      // Use recode-video to convert to MOV with H.264 codec (compatible with MOV container)
      ytDlpCommand = `yt-dlp -f "${formatString}" --recode-video mov -o "${outputTemplate}" "${videoUrl}"`;
    } else {
      // Download video as MP4
      expectedExtension = 'mp4';
      outputTemplate = path.join(userDownloadsFolder, `${sanitizedTitle}.${expectedExtension}`);
      const qualityMap = {
        '360p': 'bestvideo[height<=360]+bestaudio/best[height<=360]',
        '480p': 'bestvideo[height<=480]+bestaudio/best[height<=480]',
        '720p': 'bestvideo[height<=720]+bestaudio/best[height<=720]',
        '1080p': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]'
      };
      
      const formatString = qualityMap[quality] || 'best';
      ytDlpCommand = `yt-dlp -f "${formatString}" --merge-output-format mp4 -o "${outputTemplate}" "${videoUrl}"`;
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
  console.log(`YouTube Downloader Server running on http://localhost:${PORT}`);
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
