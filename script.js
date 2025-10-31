// --- START: YOUR CUSTOM QUOTES ---
async function loadQuotes() {
  try {
    // Load the text file
    const response = await fetch('quotes.txt');
    const text = await response.text();

    // Split by newlines and clean up
    const lines = text.split('\n').filter(line => line.trim() !== '');

    // Convert each line into a { quote, author } object
    const myQuotes = lines.map(line => {
      const [quote, author] = line.split(' - ');
      return {
        quote: quote?.trim(),
        author: author?.trim() || 'Unknown'
      };
    });

    console.log(myQuotes); // See the result in the console
    return myQuotes;

  } catch (error) {
    console.error('Error loading quotes:', error);
  }
}

loadQuotes();

const myQuotes = [ // fallback
    {quote:"I will now go back to my cave and continue pulling stuff, I just had to do something else for a while. Some people relax with a nice drink by the pool, I relax by playing around with inline asm.", author:"linus torvavlds "}
];

// --- CONFIGURATION - REPLACE THESE VALUES ---
const DISCORD_USER_ID = '1372459254136705064';
const CITY_NAME = 'catland';
// --- END CONFIGURATION ---

let activityCarouselInterval = null;
let activityUpdateInterval = null;
let wsHeartbeatInterval = null; 
let quoteTimeout; 

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
        console.warn("Initial video play attempt failed (expected if muted in HTML):", err);
    });
}





document.addEventListener('DOMContentLoaded', () => {
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
        backgroundVideo.play().catch(err => console.error("Failed to play background video after user interaction:", err));
        profileBlock.classList.remove('hidden');
        gsap.fromTo(profileBlock, { opacity: 0, y: -50 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' });
   
        typeWriterName();
        startQuoteCycle(); 
        


    }

    startScreen.addEventListener('click', handleStartInteraction);
    startScreen.addEventListener('touchstart', handleStartInteraction);





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
        let text = profileBio.textContent;
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
        deleteWriterBioQuote(() => {
            const randomIndex = Math.floor(Math.random() * myQuotes.length);
            const randomQuote = myQuotes[randomIndex];
            const fullQuote = `"${randomQuote.quote}" — ${randomQuote.author}`;
            typeWriterBioQuote(fullQuote, () => {
                quoteTimeout = setTimeout(cycleQuotes, 4000);
            });
        });
    }

    function startQuoteCycle() {
        const profileBio = document.getElementById('profile-bio');
        if (!profileBio) return;
        const randomIndex = Math.floor(Math.random() * myQuotes.length);
        const randomQuote = myQuotes[randomIndex];
        const fullQuote = `"${randomQuote.quote}" — ${randomQuote.author}`;
        typeWriterBioQuote(fullQuote, () => {
            quoteTimeout = setTimeout(cycleQuotes, 4000);
        });
    }

    let currentAudio = backgroundVideo;
    let isMuted = false;
    volumeIcon.addEventListener('click', () => {
        isMuted = !isMuted;
        currentAudio.muted = isMuted;
        volumeIcon.innerHTML = isMuted ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>` : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>`;
    });
    volumeSlider.addEventListener('input', () => {
        currentAudio.volume = volumeSlider.value;
        isMuted = false;
        currentAudio.muted = false;
        volumeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>`;
    });
    

   
   

    function handleTilt(e, element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let clientX, clientY;
        if (e.type === 'touchmove') { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; } else { clientX = e.clientX; clientY = e.clientY; }
        const mouseX = clientX - centerX;
        const mouseY = clientY - centerY;
        const maxTilt = 15;
        const tiltX = (mouseY / rect.height) * maxTilt;
        const tiltY = -(mouseX / rect.width) * maxTilt;
        gsap.to(element, { rotationX: tiltX, rotationY: tiltY, duration: 0.3, ease: 'power2.out', transformPerspective: 1000 });
    }
    profileBlock.addEventListener('mousemove', (e) => handleTilt(e, profileBlock));
    profileBlock.addEventListener('touchmove', (e) => { e.preventDefault(); handleTilt(e, profileBlock); });
    profileBlock.addEventListener('mouseleave', () => { gsap.to(profileBlock, { rotationX: 0, rotationY: 0, duration: 0.5, ease: 'power2.out' }); });
    profileBlock.addEventListener('touchend', () => { gsap.to(profileBlock, { rotationX: 0, rotationY: 0, duration: 0.5, ease: 'power2.out' }); });
    profilePicture.addEventListener('mouseenter', () => { glitchOverlay.style.opacity = '1'; setTimeout(() => { glitchOverlay.style.opacity = '0'; }, 500); });

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
            const timeText = bar.closest('.activity-slide').querySelector('.time-info-text');
            if (timeText) { timeText.textContent = `${formatTime(elapsed)} / ${formatTime(duration)}`; }
        });
        document.querySelectorAll('.elapsed-time-text').forEach(timer => {
            const start = parseInt(timer.dataset.start, 10);
            if (isNaN(start)) return;
            const elapsed = Date.now() - start;
            timer.textContent = `${formatTime(elapsed)} elapsed`;
        });
    }

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
        const statusIndicator = `<div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${statusColor}; border: 2px solid rgba(255,255,255,0.2); flex-shrink: 0; box-shadow: 0 0 8px ${statusColor};"></div>`;

        if (data.listening_to_spotify && data.spotify) {
            const spotify = data.spotify;
            const progressHtml = spotify.timestamps ? `<div class="activity-progress-content"><div class="activity-progress-bar-container"><div class="activity-progress-bar-fill" data-start="${spotify.timestamps.start}" data-end="${spotify.timestamps.end}"></div></div><p class="time-info-text"></p></div>` : '';
            const titleHtml = `<p class="activity-title"><span style="font-weight: 400;">Listening to </span><span style="color: ${brandColors.spotify}; font-weight: 700; text-shadow: 0 0 8px ${brandColors.spotify};">Spotify</span></p>`;
            slides.push(`<div class="activity-slide"><img src="${spotify.album_art_url}" alt="Album Art" style="width: 50px; height: 50px; border-radius: 8px; flex-shrink: 0;"><div class="activity-details-container">${titleHtml}<p class="activity-details">${spotify.song}</p><p class="activity-state">by ${spotify.artist}</p>${progressHtml}</div></div>`);
        }
        
        if (data.activities && data.activities.length > 0) {
            data.activities.filter(act => act.name !== 'Spotify' && act.type !== 4).forEach(activity => {
                const imageUrl = activity.assets?.large_image ? (activity.assets.large_image.startsWith('mp:external/') ? `https://media.discordapp.net/external/${activity.assets.large_image.substring(12)}` : `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`) : '';
                const activityType = activity.type === 3 ? 'Watching' : (activity.type === 2 ? 'Listening to' : 'Playing');
                const color = brandColors[activity.name.toLowerCase()] || defaultColor;
                const titleHtml = `<p class="activity-title"><span style="font-weight: 400;">${activityType} </span><span style="color: ${color}; font-weight: 700; text-shadow: 0 0 8px ${color};">${activity.name}</span></p>`;
                let textContent = `${titleHtml}${activity.details ? `<p class="activity-details">${activity.details}</p>` : ''}${activity.state ? `<p class="activity-state">${activity.state}</p>` : ''}`;
                let progressContent = '';
                if (activity.timestamps) {
                    if (activity.timestamps.start && activity.timestamps.end) {
                        progressContent = `<div class="activity-progress-content"><div class="activity-progress-bar-container"><div class="activity-progress-bar-fill" data-start="${activity.timestamps.start}" data-end="${activity.timestamps.end}"></div></div><p class="time-info-text"></p></div>`;
                    } else if (activity.timestamps.start) {
                        textContent += `<p class="time-info-text elapsed-time-text" data-start="${activity.timestamps.start}"></p>`;
                    }
                }
                slides.push(`<div class="activity-slide">${statusIndicator}${imageUrl ? `<img src="${imageUrl}" alt="${activity.name}" style="width: 45px; height: 45px; border-radius: 8px; flex-shrink: 0;">` : ''}<div class="activity-details-container">${textContent}${progressContent}</div></div>`);
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
                    let currentSlideIndex = 0;
                    activityCarouselInterval = setInterval(() => {
                        currentSlideIndex = (currentSlideIndex + 1) % allSlides.length;
                        carouselWrapper.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
                    }, 5000);
                }
                gsap.to(activityContainer, { opacity: 1, duration: 0.4, ease: "power1.out" });
            }
        });
    }

    let ws;

    function connectWebSocket() {
        ws = new WebSocket('wss://api.lanyard.rest/websocket');
        ws.onopen = () => {
            console.log('Connected to Lanyard WebSocket');
            ws.send(JSON.stringify({ op: 2, d: { subscribe_to_ids: [DISCORD_USER_ID] } }));
            if (wsHeartbeatInterval) clearInterval(wsHeartbeatInterval);
            wsHeartbeatInterval = setInterval(() => { if (ws.readyState === 1) { ws.send(JSON.stringify({ op: 3 })); } }, 30000);
        };
        ws.onmessage = (event) => {
            const { op, t, d } = JSON.parse(event.data);
            if (op === 0 && (t === 'INIT_STATE' || t === 'PRESENCE_UPDATE')) {
                displayDiscordActivity(d);
            }
        };
        ws.onclose = () => {
            if (wsHeartbeatInterval) { clearInterval(wsHeartbeatInterval); wsHeartbeatInterval = null; }
            console.warn('Lanyard WebSocket disconnected. Reconnecting in 5s...');
            setTimeout(connectWebSocket, 5000);
        };
        ws.onerror = (error) => {
            console.error('Lanyard WebSocket error:', error);
            ws.close();
        };
    }

    fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`)
        .then(response => response.json())
        .then(res => {
            if (res.success) { displayDiscordActivity(res.data); } 
            else { document.getElementById('activity-carousel-wrapper').innerHTML = `<div class="activity-slide"><p style="font-size: 14px; margin: 0; color: rgba(255, 255, 255, 0.7);">Discord: Data not available.</p></div>`; }
        })
        .catch(error => {
            console.error('Error fetching initial Lanyard data:', error);
            document.getElementById('activity-carousel-wrapper').innerHTML = `<div class="activity-slide"><p style="font-size: 14px; margin: 0; color: #F04747;">Failed to load activity.</p></div>`;
        });

    connectWebSocket();
});