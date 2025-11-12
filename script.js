
// --- START: YOUR CUSTOM QUOTES ---
  async function loadQuotes() {
    try {
      const response = await fetch('quotes.txt');
      const text = await response.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const quotes = lines.map(line => {
        const [quote, author] = line.split(' - ');
        return {
          quote: quote?.trim(),
          author: author?.trim() || 'Unknown'
        };
      });
      console.log('Quotes loaded:', quotes);
      return quotes;
    } catch (error) {
      console.error('Error loading quotes:', error);
      return [
        { quote: "The best is yet to come.", author: "ellii" },
        { quote: "Stay curious.", author: "Unknown" }
      ]; // fallback
    }
  }

  // --- CONFIGURATION - REPLACE THESE VALUES ---
  const DISCORD_USER_ID = '1372459254136705064';
  const CITY_NAME = 'catland';
  // --- END CONFIGURATION ---

  let activityCarouselInterval = null;
  let activityUpdateInterval = null;
  let wsHeartbeatInterval = null;
  let quoteTimeout = null;
  let myQuotes = []; // Will be populated after load

  // --- Global variables for the audio player ---
  let audioPlayer = null;
  let currentPlayingTrackDiv = null;

  function initMedia() {
    console.log("initMedia called");
    const backgroundVideo = document.getElementById('background');
    if (!backgroundVideo) {
      console.error("Media elements not found");
      return;
    }
    backgroundVideo.volume = 0.3;
    backgroundVideo.play().catch(err => {
      console.warn("Initial video play attempt failed:", err);
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    // --- Load quotes first ---
    myQuotes = await loadQuotes();

    const startScreen = document.getElementById('start-screen');
    const startText = document.getElementById('start-text');
    const profileName = document.getElementById('profile-name');
    const backgroundVideo = document.getElementById('background');
    const volumeIcon = document.getElementById('volume-icon');
    const volumeSlider = document.getElementById('volume-slider');
    const transparencySlider = document.getElementById('transparency-slider');
    const glitchOverlay = document.querySelector('.glitch-overlay');
    const profileBlock = document.getElementById('profile-block');
    const profilePicture = document.querySelector('.profile-picture');

    function handleStartInteraction(event) {
      event.preventDefault();
      startScreen.classList.add('hidden');
      backgroundVideo.muted = false;
      backgroundVideo.play().catch(err => console.error("Failed to play video:", err));
      profileBlock.classList.remove('hidden');
      gsap.fromTo(profileBlock, { opacity: 0, y: -50 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' });

      typeWriterName();
      startQuoteCycle(); // Now safe to call
    }

    startScreen.addEventListener('click', handleStartInteraction);
    startScreen.addEventListener('touchstart', handleStartInteraction);

    // --- Start screen typewriter ---
    const startMessage = "Click here to wake up the pixels!";
    let startTextContent = '';
    let startIndex = 0;
    let startCursorVisible = true;

    function typeWriterStart() {
      if (startIndex < startMessage.length) {
        startTextContent = startMessage.slice(0, startIndex + 1);
        startIndex++;
      }
      startText.textContent = startTextContent + (startCursorVisible ? '|' : ' ');
      setTimeout(typeWriterStart, 100);
    }

    setInterval(() => {
      startCursorVisible = !startCursorVisible;
      startText.textContent = startTextContent + (startCursorVisible ? '|' : ' ');
    }, 500);

    typeWriterStart();

    // --- Name typewriter with glitch ---
    const name = "ellii";
    let nameText = '';
    let nameIndex = 0;
    let isNameDeleting = false;
    let nameCursorVisible = true;

    function typeWriterName() {
      if (!isNameDeleting && nameIndex < name.length) {
        nameText = name.slice(0, nameIndex + 1);
        nameIndex++;
      } else if (isNameDeleting && nameIndex > 0) {
        nameText = name.slice(0, nameIndex - 1);
        nameIndex--;
      } else if (nameIndex === name.length) {
        isNameDeleting = true;
        setTimeout(typeWriterName, 10000);
        return;
      } else if (nameIndex === 0) {
        isNameDeleting = false;
      }

      profileName.textContent = nameText + (nameCursorVisible ? '|' : ' ');
      if (Math.random() < 0.1) {
        profileName.classList.add('glitch');
        setTimeout(() => profileName.classList.remove('glitch'), 200);
      }

      setTimeout(typeWriterName, isNameDeleting ? 150 : 300);
    }

    setInterval(() => {
      nameCursorVisible = !nameCursorVisible;
      profileName.textContent = nameText + (nameCursorVisible ? '|' : ' ');
    }, 500);

    // --- Bio quote typewriter ---
    function typeWriterBioQuote(text, onComplete) {
      const profileBio = document.getElementById('profile-bio');
      if (!profileBio) return;
      let i = 0;
      profileBio.textContent = '|';
      function type() {
        if (i < text.length) {
          profileBio.textContent = text.slice(0, i + 1) + '|';
          i++;
          setTimeout(type, 35);
        } else {
          profileBio.textContent = text;
          if (onComplete) onComplete();
        }
      }
      type();
    }

    function deleteWriterBioQuote(onComplete) {
      const profileBio = document.getElementById('profile-bio');
      if (!profileBio) return;
      let text = profileBio.textContent.replace(/\|$/, '');
      let i = text.length;
      function del() {
        if (i > 0) {
          profileBio.textContent = text.slice(0, i - 1) + '|';
          i--;
          setTimeout(del, 25);
        } else {
          profileBio.textContent = '|';
          if (onComplete) onComplete();
        }
      }
      del();
    }

    function cycleQuotes() {
      if (myQuotes.length === 0) return;
      deleteWriterBioQuote(() => {
        const randomQuote = myQuotes[Math.floor(Math.random() * myQuotes.length)];
        const fullQuote = `"${randomQuote.quote}" — ${randomQuote.author}`;
        typeWriterBioQuote(fullQuote, () => {
          quoteTimeout = setTimeout(cycleQuotes, 4000);
        });
      });
    }

    function startQuoteCycle() {
      if (myQuotes.length === 0) return;
      const randomQuote = myQuotes[Math.floor(Math.random() * myQuotes.length)];
      const fullQuote = `"${randomQuote.quote}" — ${randomQuote.author}`;
      typeWriterBioQuote(fullQuote, () => {
        quoteTimeout = setTimeout(cycleQuotes, 4000);
      });
    }

    // --- Volume controls ---
    let currentAudio = backgroundVideo;
    let isMuted = false;

    volumeIcon.addEventListener('click', () => {
      isMuted = !isMuted;
      currentAudio.muted = isMuted;
      volumeIcon.innerHTML = isMuted
        ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>`
        : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>`;
    });

    volumeSlider.addEventListener('input', () => {
      currentAudio.volume = volumeSlider.value;
      isMuted = false;
      currentAudio.muted = false;
      volumeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>`;
    });

    // --- Tilt effect ---
    function handleTilt(e, element) {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      let clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
      const mouseX = clientX - centerX;
      const mouseY = clientY - centerY;
      const maxTilt = 15;
      const tiltX = (mouseY / rect.height) * maxTilt;
      const tiltY = -(mouseX / rect.width) * maxTilt;
      gsap.to(element, { rotationX: tiltX, rotationY: tiltY, duration: 0.3, ease: 'power2.out', transformPerspective: 1000 });
    }

    profileBlock.addEventListener('mousemove', e => handleTilt(e, profileBlock));
    profileBlock.addEventListener('touchmove', e => { e.preventDefault(); handleTilt(e, profileBlock); });
    profileBlock.addEventListener('mouseleave', () => gsap.to(profileBlock, { rotationX: 0, rotationY: 0, duration: 0.5, ease: 'power2.out' }));
    profileBlock.addEventListener('touchend', () => gsap.to(profileBlock, { rotationX: 0, rotationY: 0, duration: 0.5, ease: 'power2.out' }));

    profilePicture.addEventListener('mouseenter', () => {
      glitchOverlay.style.opacity = '1';
      setTimeout(() => { glitchOverlay.style.opacity = '0'; }, 500);
    });

    // --- Time formatting ---
    function formatTime(ms) {
      if (isNaN(ms) || ms < 0) return '00:00';
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
      const seconds = (totalSeconds % 60).toString().padStart(2, '0');
      return `${minutes}:${seconds}`;
    }

    function updateActivityTimers() {
      document.querySelectorAll('.activity-progress-bar-fill').forEach(bar => {
        const start = parseInt(bar.dataset.start, 10);
        const end = parseInt(bar.dataset.end, 10);
        const now = Date.now();
        if (isNaN(start) || isNaN(end)) return;
        const duration = end - start;
        const elapsed = now - start;
        let progress = (elapsed / duration) * 100;
        progress = Math.max(0, Math.min(progress, 100));
        bar.style.width = `${progress}%`;
        const timeText = bar.closest('.activity-slide')?.querySelector('.time-info-text');
        if (timeText) timeText.textContent = `${formatTime(elapsed)} / ${formatTime(duration)}`;
      });

      document.querySelectorAll('.elapsed-time-text').forEach(timer => {
        const start = parseInt(timer.dataset.start, 10);
        if (isNaN(start)) return;
        const elapsed = Date.now() - start;
        timer.textContent = `${formatTime(elapsed)} elapsed`;
      });
    }

    // --- Discord Activity Display ---
    function displayDiscordActivity(data) {
      const carouselWrapper = document.getElementById('activity-carousel-wrapper');
      const activityContainer = document.getElementById('discord-activity');
      if (!carouselWrapper || !activityContainer) return;

      gsap.killTweensOf(activityContainer);
      clearInterval(activityCarouselInterval);
      clearInterval(activityUpdateInterval);

      const slides = [];
      const brandColors = { 'spotify': '#1DB954', 'netflix': '#E50914', 'youtube': '#FF0000', 'visual studio code': '#007ACC' };
      const defaultColor = '#8ea1e1';
      const discordStatus = data.discord_status || 'offline';
      let statusColor = '#747F8D';
      switch (discordStatus) {
        case 'online': statusColor = '#43B581'; break;
        case 'idle': statusColor = '#FAA61A'; break;
        case 'dnd': statusColor = '#F04747'; break;
      }
      const statusIndicator = `<div style="width:10px;height:10px;border-radius:50%;background:${statusColor};border:2px solid rgba(255,255,255,0.2);flex-shrink:0;box-shadow:0 0 8px ${statusColor};"></div>`;

      // Spotify
      if (data.listening_to_spotify && data.spotify) {
        const s = data.spotify;
        const progress = s.timestamps ? `<div class="activity-progress-content"><div class="activity-progress-bar-container"><div class="activity-progress-bar-fill" data-start="${s.timestamps.start}" data-end="${s.timestamps.end}"></div></div><p class="time-info-text"></p></div>` : '';
        const title = `<p class="activity-title"><span style="font-weight:400;">Listening to </span><span style="color:${brandColors.spotify};font-weight:700;text-shadow:0 0 8px ${brandColors.spotify};">Spotify</span></p>`;
        slides.push(`<div class="activity-slide"><img src="${s.album_art_url}" alt="Album" style="width:50px;height:50px;border-radius:8px;flex-shrink:0;"><div class="activity-details-container">${title}<p class="activity-details">${s.song}</p><p class="activity-state">by ${s.artist}</p>${progress}</div></div>`);
      }

      // Other activities
      if (data.activities?.length > 0) {
        data.activities
          .filter(a => a.name !== 'Spotify' && a.type !== 4)
          .forEach(a => {
            const img = a.assets?.large_image
              ? (a.assets.large_image.startsWith('mp:external/')
                ? `https://media.discordapp.net/external/${a.assets.large_image.substring(12)}`
                : `https://cdn.discordapp.com/app-assets/${a.application_id}/${a.assets.large_image}.png`)
              : '';
            const type = a.type === 3 ? 'Watching' : (a.type === 2 ? 'Listening to' : 'Playing');
            const color = brandColors[a.name.toLowerCase()] || defaultColor;
            const title = `<p class="activity-title"><span style="font-weight:400;">${type} </span><span style="color:${color};font-weight:700;text-shadow:0 0 8px ${color};">${a.name}</span></p>`;
            let content = title;
            if (a.details) content += `<p class="activity-details">${a.details}</p>`;
            if (a.state) content += `<p class="activity-state">${a.state}</p>`;
            let progress = '';
            if (a.timestamps?.start && a.timestamps?.end) {
              progress = `<div class="activity-progress-content"><div class="activity-progress-bar-container"><div class="activity-progress-bar-fill" data-start="${a.timestamps.start}" data-end="${a.timestamps.end}"></div></div><p class="time-info-text"></p></div>`;
            } else if (a.timestamps?.start) {
              content += `<p class="time-info-text elapsed-time-text" data-start="${a.timestamps.start}"></p>`;
            }
            slides.push(`<div class="activity-slide">${statusIndicator}${img ? `<img src="${img}" alt="${a.name}" style="width:45px;height:45px;border-radius:8px;flex-shrink:0;">` : ''}<div class="activity-details-container">${content}${progress}</div></div>`);
          });
      }

      if (slides.length === 0) {
        const statusText = discordStatus.charAt(0).toUpperCase() + discordStatus.slice(1);
        slides.push(`<div class="activity-slide">${statusIndicator}<div class="activity-details-container"><p class="activity-details">${statusText}</p><p class="activity-state">Not doing anything right now.</p></div></div>`);
      }

      gsap.to(activityContainer, {
        opacity: 0,
        duration: 0.3,
        ease: "power1.in",
        onComplete: () => {
          carouselWrapper.innerHTML = slides.join('');
          updateActivityTimers();
          activityUpdateInterval = setInterval(updateActivityTimers, 1000);

          const allSlides = carouselWrapper.querySelectorAll('.activity-slide');
          if (allSlides.length > 1) {
            let idx = 0;
            activityCarouselInterval = setInterval(() => {
              idx = (idx + 1) % allSlides.length;
              carouselWrapper.style.transform = `translateX(-${idx * 100}%)`;
            }, 5000);
          }

          gsap.to(activityContainer, { opacity: 1, duration: 0.4, ease: "power1.out" });
        }
      });
    }

    // --- WebSocket & Initial Fetch ---
    let ws;
    function connectWebSocket() {
      ws = new WebSocket('wss://api.lanyard.rest/websocket');
      ws.onopen = () => {
        console.log('Lanyard WS connected');
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_ids: [DISCORD_USER_ID] } }));
        clearInterval(wsHeartbeatInterval);
        wsHeartbeatInterval = setInterval(() => {
          if (ws.readyState === 1) ws.send(JSON.stringify({ op: 3 }));
        }, 30000);
      };
      ws.onmessage = e => {
        const { op, t, d } = JSON.parse(e.data);
        if (op === 0 && (t === 'INIT_STATE' || t === 'PRESENCE_UPDATE')) {
          displayDiscordActivity(d);
        }
      };
      ws.onclose = () => {
        clearInterval(wsHeartbeatInterval);
        console.warn('Lanyard WS disconnected. Reconnecting...');
        setTimeout(connectWebSocket, 5000);
      };
      ws.onerror = err => {
        console.error('Lanyard WS error:', err);
        ws.close();
      };
    }

    // Initial fetch
    fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) displayDiscordActivity(res.data);
        else throw new Error('API error');
      })
      .catch(() => {
        document.getElementById('activity-carousel-wrapper').innerHTML = `<div class="activity-slide"><p style="font-size:14px;margin:0;color:rgba(255,255,255,0.7);">Discord: Offline</p></div>`;
      });

    connectWebSocket();

    // --- Cleanup on unload ---
    window.addEventListener('beforeunload', () => {
      clearTimeout(quoteTimeout);
      clearInterval(activityCarouselInterval);
      clearInterval(activityUpdateInterval);
      clearInterval(wsHeartbeatInterval);
      if (ws) ws.close();
    });
  });
