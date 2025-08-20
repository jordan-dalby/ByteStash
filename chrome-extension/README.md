# ByteStash Credits Bridge Extension

This Chrome extension fetches your Anthropic credits and displays them in ByteStash.

## Installation Instructions

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/` in Chrome
   - Or go to Menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to `/home/sean/gits/ByteStash/chrome-extension`
   - Select the folder and click "Open"

4. **Verify Installation**
   - You should see "ByteStash Credits Bridge" in your extensions list
   - Click the extension icon in the toolbar
   - Click "Test Fetch Credits" to verify it works

## Usage

1. **Make sure you're logged into Anthropic Console**
   - Go to https://console.anthropic.com
   - Login with your Google account (devopsone808@gmail.com)

2. **Open ByteStash**
   - Navigate to http://localhost:5000
   - The credits will automatically fetch and display
   - Look for "✅ Live balance via extension" in the credits display

3. **Refresh Credits**
   - Click the refresh button in the credits display
   - Credits will update automatically

## Troubleshooting

- **"Extension not detected"**: Make sure the extension is enabled and you've refreshed ByteStash
- **"Unable to fetch credits"**: Ensure you're logged into Anthropic Console
- **CORS errors**: The extension should bypass these - if you see them, the extension may not be loaded

## How It Works

1. ByteStash detects the extension and sends a request for credits
2. Extension fetches from Anthropic using your existing session cookies
3. Credits are returned to ByteStash and displayed
4. The backend is updated with the latest balance for caching