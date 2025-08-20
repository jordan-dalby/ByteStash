// Inject content script when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({url: ["http://localhost/*", "http://127.0.0.1/*"]}, (tabs) => {
    tabs.forEach(tab => {
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['content.js']
      }).catch(err => console.log('Could not inject into tab:', tab.id, err));
    });
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchAnthropicCredits') {
    // Fetch credits from Anthropic API
    fetch('https://console.anthropic.com/api/organizations/a7acf7de-b598-43fc-a539-86d1168a44e3/prepaid/credits', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Send back the credits data
      sendResponse({
        success: true,
        data: {
          amount: data.amount,
          dollars: data.amount / 100 // Convert cents to dollars
        }
      });
    })
    .catch(error => {
      console.error('Error fetching Anthropic credits:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    });
    
    // Return true to indicate we'll send response asynchronously
    return true;
  }
});