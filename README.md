# YouTube Video Downloader Extension

A browser extension that allows you to download YouTube videos and audio using yt-dlp.

## Features

- 🎬 Download YouTube videos as MP4 files
- 🎵 Download YouTube audio as MP3 files
- 📊 Multiple quality options (360p, 480p, 720p, 1080p)
- 🎨 Clean, modern user interface
- 🔘 Download button integrated into YouTube's interface
- 📱 Responsive popup design
- ⚡ Uses yt-dlp for reliable downloads
- 🖥️ Local server for processing downloads

## Prerequisites

Before using this extension, you need to install:

1. **Node.js** - Download from [nodejs.org](https://nodejs.org/)
2. **yt-dlp** - Install using:
   - macOS: `brew install yt-dlp`
   - Linux: `sudo apt install yt-dlp` or `pip install yt-dlp`
   - Windows: `pip install yt-dlp` or download from [github.com/yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp)

## Installation

### Step 1: Install Dependencies

```bash
cd "yt extension"
npm install
```

### Step 2: Start the Local Server

```bash
npm start
```

The server will start on `http://localhost:3000`. Keep this terminal window open while using the extension.

### Step 3: Install Browser Extension

#### Chrome/Edge/Brave

1. Open your browser and navigate to the extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`

2. Enable "Developer mode" (toggle in the top right corner)

3. Click "Load unpacked"

4. Select the `yt extension` folder

5. The extension should now appear in your extensions list

#### Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`

2. Click "Load Temporary Add-on"

3. Navigate to the `yt extension` folder and select the `manifest.json` file

4. The extension will be loaded temporarily (until you restart Firefox)

## Usage

### Important: Start the Server First!

Before using the extension, make sure the local server is running:

```bash
npm start
```

### Download Videos/Audio

1. Navigate to any YouTube video page

2. You'll see a purple "Download" button added to the video controls

3. Click the extension icon in your browser toolbar to open the popup

4. **Select format:**
   - **MP4 Video** - Download video file
   - **MP3 Audio** - Download audio only

5. **Select quality** (for MP4 only):
   - 360p, 480p, 720p, or 1080p

6. Click "Download Video" or "Download Audio"

7. The file will be downloaded to the `downloads` folder in the extension directory

8. A new tab will open with the download link (or check the `downloads` folder directly)

## Important Notes

⚠️ **Legal Disclaimer**: This extension is for educational purposes only. Please respect YouTube's Terms of Service and copyright laws. Only download videos you have permission to download.

⚠️ **Download Method**: This extension uses yt-dlp to download actual video/audio files. A local Node.js server must be running for the extension to work. Downloads are saved to the `downloads` folder in the extension directory.

⚠️ **Server Requirement**: The local server (running on port 3000) must be active for downloads to work. If the server is not running, you'll see a warning in the popup.

## File Structure

```
yt extension/
├── manifest.json          # Extension configuration
├── package.json           # Node.js dependencies
├── server.js              # Local download server
├── popup.html            # Popup interface HTML
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── content.js            # YouTube page integration
├── content.css           # Download button styling
├── background.js         # Background service worker
├── downloads/            # Downloaded files (created automatically)
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

## Troubleshooting

### "Local server is not running" error
- Make sure you've started the server with `npm start`
- Check that port 3000 is not being used by another application
- Verify the server is running by visiting `http://localhost:3000/health` in your browser

### "yt-dlp is not installed" error
- Install yt-dlp using the appropriate command for your OS (see Prerequisites)
- Verify installation by running `yt-dlp --version` in terminal
- Restart the server after installing yt-dlp

### Extension doesn't appear on YouTube
- Refresh the YouTube page after installing the extension
- Make sure you're on a video page (not the homepage)
- Check that the extension is enabled in your browser's extension settings

### Download fails or takes too long
- Check your internet connection
- Try a lower quality setting
- Check the server terminal for error messages
- Some videos may be restricted or unavailable for download

### Popup shows "Not a YouTube page"
- Make sure you're on a YouTube video page (URL should contain `/watch?v=`)
- The extension only works on actual video pages, not playlists or channel pages

### Downloads folder is empty
- Check the server terminal for error messages
- Verify yt-dlp is working by running: `yt-dlp --version`
- Try downloading a different video
- Check file permissions on the downloads folder

## Development

To modify the extension:

1. Make your changes to the source files
2. Go to your browser's extensions page
3. Click the refresh icon on the extension card
4. Test your changes

## Privacy

This extension:
- Does not collect any personal data
- Does not track your browsing history
- Only activates on YouTube pages
- Does not send data to external servers (except when opening the download service)

## License

This project is for educational purposes only.

## Support

If you encounter any issues, please check the troubleshooting section above or review the browser console for error messages.
