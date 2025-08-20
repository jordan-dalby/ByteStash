document.getElementById('testFetch').addEventListener('click', () => {
  const statusDiv = document.getElementById('status');
  statusDiv.innerHTML = 'Fetching...';
  
  chrome.runtime.sendMessage(
    { action: 'fetchAnthropicCredits' },
    (response) => {
      if (response && response.success) {
        statusDiv.className = 'status success';
        statusDiv.innerHTML = `
          <div>✅ Successfully fetched!</div>
          <div class="credits">$${response.data.dollars.toFixed(2)}</div>
          <div>Raw: ${response.data.amount} cents</div>
        `;
        
        // Store the credits for ByteStash to read
        chrome.storage.local.set({ 
          anthropicCredits: response.data.dollars,
          lastFetched: new Date().toISOString()
        });
      } else {
        statusDiv.className = 'status error';
        statusDiv.innerHTML = `❌ Error: ${response?.error || 'Unknown error'}<br><br>
          Make sure you're logged into Anthropic Console.`;
      }
    }
  );
});