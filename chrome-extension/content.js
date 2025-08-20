console.log('ByteStash Credits Bridge: Content script loaded!');

// Listen for messages from the ByteStash website
window.addEventListener('message', (event) => {
  console.log('Content script received message:', event.data);
  
  // Only accept messages from ByteStash
  if (event.origin !== 'http://localhost:5000' && 
      !event.origin.startsWith('http://localhost:') && 
      !event.origin.startsWith('http://127.0.0.1:')) {
    return;
  }

  if (event.data.type === 'FETCH_ANTHROPIC_CREDITS') {
    console.log('Forwarding credits request to background script...');
    // Forward request to background script
    chrome.runtime.sendMessage(
      { action: 'fetchAnthropicCredits' },
      (response) => {
        console.log('Got response from background:', response);
        // Send response back to ByteStash
        window.postMessage({
          type: 'ANTHROPIC_CREDITS_RESPONSE',
          ...response
        }, event.origin);
      }
    );
  }
});

// Notify ByteStash that the extension is installed
console.log('Sending BYTESTASH_EXTENSION_READY message...');
setTimeout(() => {
  window.postMessage({
    type: 'BYTESTASH_EXTENSION_READY'
  }, '*');
  console.log('Extension ready message sent!');
}, 100);