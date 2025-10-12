// Function to update status elements
function updateStatus(data) {
  // Discord Status
  const discordStatus = document.getElementById('discord-status');
  const statusIndicator = document.querySelector('.status-indicator');
  const customStatus = document.getElementById('discord-custom-status');

  if (data.discord_status) {
    discordStatus.textContent = data.discord_status.charAt(0).toLowerCase() + data.discord_status.slice(1);
    statusIndicator.className = `status-indicator ${data.discord_status}`;
  } else {
    discordStatus.textContent = 'offline';
    statusIndicator.className = 'status-indicator offline';
  }

  const customActivity = data.activities.find(activity => activity.type === 4);
  customStatus.textContent = customActivity && customActivity.state ? customActivity.state : '';

 
}

// Initialize WebSocket for real-time updates
const ws = new WebSocket('wss://api.lanyard.rest/socket');

ws.onopen = () => {
  // Subscribe to the user's presence
  ws.send(JSON.stringify({
    op: 2,
    d: { subscribe_to_id: '1372459254136705064' }
  }));

  // Send heartbeat every 30 seconds
  setInterval(() => {
    ws.send(JSON.stringify({ op: 3 }));
  }, 30000);
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.op === 0 && message.t === 'PRESENCE_UPDATE') {
    updateStatus(message.d);
  } else if (message.op === 1) {
    // Initialize with the first heartbeat
    ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: '1372459254136705064' } }));
  }
};

// Fallback: Fetch initial data via HTTP if WebSocket is slow
fetch('https://api.lanyard.rest/v1/users/1372459254136705064')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      updateStatus(data.data);
    }
  })
  .catch(error => {
    console.error('Error fetching Lanyard data:', error);
    document.getElementById('discord-status').textContent = 'Error';

  });