/* -------------------------
   Config
   ------------------------- */
const DISCORD_ID = '1372459254136705064';
const LANYARD_API = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;
const QUOTES_TXT = 'https://moonlightrblx.github.io/api/quotes.txt';
const POLL_INTERVAL = 15000;
/* -------------------------
   Helpers
   ------------------------- */
const $ = sel => document.querySelector(sel);
const el = (tag, attrs = {}, children = []) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else if (c) e.appendChild(c);
  });
  return e;
};

/* ---- Time formatting ---- */
const formatElapsed = ms => {
  if (ms < 0) return 'just now';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}min`;
  if (m > 0) return `${m} min`;
  return `${s} sec`;
};
const formatTimestamp = ts => new Date(ts).toLocaleString(undefined, {
  month: 'short', day: 'numeric', year: 'numeric',
  hour: '2-digit', minute: '2-digit'
});
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };

/* -------------------------
   Quotes
   ------------------------- */
let quotes = [], quoteIndex = 0, quoteTimer = null;

async function loadQuotes() {
  try {
    const res = await fetch(QUOTES_TXT, { cache: 'no-cache' });
    if (!res.ok) throw new Error('quotes fetch failed');
    const txt = await res.text();
    quotes = txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (!quotes.length) throw new Error('no quotes');
    shuffle(quotes);
    $('#quoteCount').textContent = `Quotes: ${quotes.length}`;
    showRandomQuote(true);
  } catch (err) {
    console.error('Quotes error', err);
    $('#quoteText').textContent = 'Could not load quotes.';
  }
}

function showRandomQuote(first = false) {
  if (!quotes.length) return;
  if (first) quoteIndex = Math.floor(Math.random() * quotes.length);
  else quoteIndex = (quoteIndex + 1) % quotes.length;

  const box = $('#quoteBox');
  box.classList.remove('fade-enter-active');
  box.classList.add('fade-exit-active');
  setTimeout(() => {
    $('#quoteText').textContent = quotes[quoteIndex];
    box.classList.remove('fade-exit-active');
    box.classList.add('fade-enter-active');
  }, 180);

  if (quoteTimer) clearInterval(quoteTimer);
  quoteTimer = setInterval(showRandomQuote, 8000);
}

/* -------------------------
   Lanyard
   ------------------------- */
let lastLanyardData = null;

async function fetchLanyard() {
  try {
    const res = await fetch(LANYARD_API, { cache: 'no-store' });
    if (!res.ok) throw new Error('Lanyard failed: ' + res.status);
    const { data } = await res.json();
    if (!data) throw new Error('Malformed payload');
    lastLanyardData = data;
    updateProfileUI(data);
    $('#lastUpdated').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
  } catch (err) {
    console.error('Lanyard error', err);
    $('#statusText').textContent = 'Offline';
    $('#statusDot').style.background = 'gray';
  }
}

/* ---- Avatar ---- */
function avatarUrlFromLanyard(u) {
  if (!u) return '';
  const { id, avatar, discriminator = '0' } = u;
  if (avatar) {
    const ext = avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${id}/${avatar}.${ext}?size=512`;
  }
  const idx = parseInt(discriminator) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

/* ---- Status Color ---- */
const statusColor = status => ({
  online: '#43d675', idle: '#f6c244', dnd: '#ef4444',
  offline: '#7b8894', invisible: '#7b8894'
})[status] || '#7b8894';

/* ---- Asset URL ---- */
function assetUrl(appId, asset, size = 128) {
  return asset ? `https://cdn.discordapp.com/app-assets/${appId}/${asset}.png?size=${size}` : '';
}

/* ---- Update UI ---- */
function updateProfileUI(data) {
  const { discord_user: user, discord_status: status, activities = [], spotify, listening_to_spotify } = data;

  // Name & Tag
  const name = user?.username || 'Unknown';
  const discr = user?.discriminator ? `#${user.discriminator}` : '';
  $('#displayName').textContent = name;
  $('#tagline').textContent = discr ? `${discr} • ${user.id}` : `ID: ${user.id}`;

  // Avatar
  const pfpImg = document.createElement('img');
  pfpImg.src = avatarUrlFromLanyard(user);
  pfpImg.alt = 'avatar';
  const pfp = $('#pfp');
  pfp.innerHTML = '';
  pfp.appendChild(pfpImg);

  // Status
  const statusText = (status || 'offline').toUpperCase();
  $('#statusText').textContent = statusText;
  $('#statusDot').style.background = statusColor(status);

  // Status Since
  const since = data.active_on_discord ? new Date(data.active_on_discord) : null;
  $('#statusSince').textContent = since ? `(${formatElapsed(Date.now() - since)})` : '';

  // Activity Block
  const block = $('#activityBlock');
  block.innerHTML = '';

  if (listening_to_spotify && spotify) {
    const { song, artist, album, album_art_url, timestamps } = spotify;
    const start = timestamps?.start ? new Date(timestamps.start) : null;
    const elapsed = start ? formatElapsed(Date.now() - start) : '';

    const spNode = el('div', { class: 'spotify' }, [
      el('div', { class: 'sp-art' }, [el('img', { src: album_art_url, alt: 'album' })]),
      el('div', { class: 'sp-meta' }, [
        el('div', { class: 'sp-song' }, song || 'Unknown'),
        el('div', { class: 'sp-artist' }, `${artist || 'Unknown'} — ${album || ''}`),
        start && el('div', { class: 'act-timestamp' }, `Started ${elapsed} ago`)
      ])
    ]);
    block.appendChild(spNode);
  } else if (activities.length) {
    const act = activities.find(a => a.type !== 4) || activities[0];
    if (act) {
      const { name, details, state, timestamps, assets, application_id } = act;
      const start = timestamps?.start ? new Date(timestamps.start) : null;
      const elapsed = start ? formatElapsed(Date.now() - start) : '';

      const actNode = el('div', { class: 'activity' }, [
        el('div', { class: 'act-art' }, assets?.large_image
          ? [el('img', { src: assetUrl(application_id, assets.large_image, 128), alt: 'large' })]
          : []),
        el('div', { class: 'act-meta' }, [
          el('div', { class: 'act-name' }, name || 'Activity'),
          details && el('div', { class: 'act-details' }, details),
          state && el('div', { class: 'act-details' }, state),
          start && el('div', { class: 'act-timestamp' }, `Playing for ${elapsed}`)
        ])
      ]);

      // Small assets with hover
      if (assets?.small_image) {
        const small = el('div', { class: 'act-asset', 'data-text': assets.small_text || '' },
          [el('img', { src: assetUrl(application_id, assets.small_image, 64) })]);
        const assetsRow = el('div', { class: 'act-assets' }, [small]);
        actNode.appendChild(assetsRow);
      }

      block.appendChild(actNode);
    }
  } else {
    block.appendChild(el('div', { class: 'muted' }, 'No active activity'));
  }
}

/* -------------------------
   Init
   ------------------------- */
(async () => {
  await loadQuotes();
  await fetchLanyard();
  setInterval(fetchLanyard, POLL_INTERVAL);
})();

/* Space to shuffle quote */
document.body.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); showRandomQuote(); }
});