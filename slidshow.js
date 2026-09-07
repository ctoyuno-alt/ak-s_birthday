// 3D Coverflow Memory Vault Engine with Dynamic API Image Discovery & Parallel Audio Sync
document.addEventListener('DOMContentLoaded', async () => {
    const ring = document.getElementById('ring3d');
    const currentNumEl = document.getElementById('currentNum');
    const totalNumEl = document.getElementById('totalNum');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const autoBtn = document.getElementById('autoBtn');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    const startOverlay = document.getElementById('startOverlay');
    const startSurpriseBtn = document.getElementById('startSurpriseBtn');
    const quoteAudio = document.getElementById('quoteAudio');
    const bgAudio = document.getElementById('bgAudio');

    let imageList = [];

    // 1. Automatically fetch ALL images from the images directory via /api/images
    try {
        const res = await fetch('/api/images');
        if (res.ok) {
            imageList = await res.json();
            // Filter out cake image if present
            imageList = imageList.filter(img => !img.includes('birthday_cake'));
        }
    } catch (e) {
        console.log("Fallback to default image search", e);
    }

    // Fallback if API not available
    if (!imageList || imageList.length === 0) {
        imageList = [];
        for (let i = 1; i <= 20; i++) {
            imageList.push(`images/polu/photo_${i}.jpg`);
        }
    }


    const totalPhotos = imageList.length;
    const cards = [];
    let activeIndex = 0;
    let isAutoPlaying = true;
    let autoPlayTimer = null;
    let isRedirecting = false;

    // 2. Build Cards Dynamically from Server Image List
    imageList.forEach((imgSrc, index) => {
        const card = document.createElement('div');
        card.className = 'card3d';
        card.dataset.index = index;

        const numBadge = document.createElement('div');
        numBadge.className = 'card-num';
        numBadge.innerText = String(index + 1).padStart(2, '0');

        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = `Polu Memory ${index + 1}`;
        
        img.onerror = function() {
            console.log(`Failed to load ${imgSrc}`);
            card.style.display = 'none';
        };

        card.appendChild(numBadge);
        card.appendChild(img);
        ring.appendChild(card);
        cards.push(card);

        card.addEventListener('click', () => {
            if (activeIndex === index) {
                openLightbox(imgSrc, index + 1);
            } else {
                setActiveIndex(index);
                pauseAutoPlay();
            }
        });
    });

    // 3. Coverflow Position Calculator
    function updateCoverflow() {
        const isMobile = window.innerWidth < 600;
        const spacing = isMobile ? 135 : 185;

        cards.forEach((card, index) => {
            const offset = index - activeIndex;
            const absOffset = Math.abs(offset);

            if (offset === 0) {
                card.style.transform = `translateX(0px) translateY(15px) translateZ(160px) rotateY(0deg) scale(1.18)`;
                card.style.opacity = '1';
                card.style.zIndex = '50';
                card.style.pointerEvents = 'all';
                card.classList.add('active');
            } else if (absOffset <= 3) {
                const dir = offset < 0 ? -1 : 1;
                const xPos = dir * (spacing * absOffset + (isMobile ? 15 : 35));
                const zPos = -130 * absOffset;
                const rotY = dir * -35;
                const opacity = 1 - absOffset * 0.28;
                const scale = 0.8 - absOffset * 0.08;

                card.style.transform = `translateX(${xPos}px) translateY(0px) translateZ(${zPos}px) rotateY(${rotY}deg) scale(${scale})`;
                card.style.opacity = String(opacity);
                card.style.zIndex = String(30 - absOffset);
                card.style.pointerEvents = 'all';
                card.classList.remove('active');
            } else {
                const dir = offset < 0 ? -1 : 1;
                card.style.transform = `translateX(${dir * 800}px) translateY(0px) translateZ(-500px) rotateY(${dir * -45}deg) scale(0.4)`;
                card.style.opacity = '0';
                card.style.zIndex = '0';
                card.style.pointerEvents = 'none';
                card.classList.remove('active');
            }
        });

        if (currentNumEl) currentNumEl.innerText = String(activeIndex + 1).padStart(2, '0');
        if (totalNumEl) totalNumEl.innerText = String(totalPhotos).padStart(2, '0');
    }

    function setActiveIndex(index) {
        activeIndex = (index + totalPhotos) % totalPhotos;
        updateCoverflow();
    }

    function nextSlide() {
        setActiveIndex(activeIndex + 1);
    }

    function prevSlide() {
        setActiveIndex(activeIndex - 1);
    }

    updateCoverflow();

    // 4. Navigation Controls
    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); pauseAutoPlay(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); pauseAutoPlay(); });

    function startAutoPlay() {
        isAutoPlaying = true;
        if (autoBtn) autoBtn.innerText = "⏸ Auto Play";
        if (autoPlayTimer) clearInterval(autoPlayTimer);

        autoPlayTimer = setInterval(() => {
            nextSlide();
        }, 1800);
    }

    function pauseAutoPlay() {
        isAutoPlaying = false;
        if (autoBtn) autoBtn.innerText = "▶ Auto Play";
        if (autoPlayTimer) clearInterval(autoPlayTimer);
    }

    if (autoBtn) {
        autoBtn.addEventListener('click', () => {
            if (isAutoPlaying) pauseAutoPlay();
            else startAutoPlay();
        });
    }

    // 5. Dual Audio & 21-Sec Auto-Landing Controller
    function finishSurpriseAndLand() {
        if (isRedirecting) return;
        isRedirecting = true;

        console.log("21-second Quote finished. Stopping audio and landing on birthday.html");
        
        if (quoteAudio) { quoteAudio.pause(); quoteAudio.currentTime = 0; }
        if (bgAudio) { bgAudio.pause(); bgAudio.currentTime = 0; }

        const statusSubtitle = document.getElementById('statusSubtitle');
        if (statusSubtitle) statusSubtitle.innerText = "Quote complete! Landing on Birthday Wish Page... 💖";

        window.location.href = 'birthday.html';
    }

    function startSurpriseSequence() {
        if (startOverlay) startOverlay.style.display = 'none';

        if (bgAudio) bgAudio.volume = 0.25;
        if (quoteAudio) quoteAudio.volume = 1.0;

        if (quoteAudio && bgAudio) {
            quoteAudio.currentTime = 0;
            bgAudio.currentTime = 0;

            const p1 = quoteAudio.play();
            const p2 = bgAudio.play();

            Promise.all([p1, p2]).then(() => {
                updateAudioButtonUI(true);
            }).catch(err => {
                console.log("Autoplay policy requires user click", err);
                if (startOverlay) startOverlay.style.display = 'flex';
            });
        }

        startAutoPlay();

        setTimeout(() => {
            finishSurpriseAndLand();
        }, 21500);
    }

    if (quoteAudio) {
        quoteAudio.addEventListener('ended', finishSurpriseAndLand);
    }

    if (startSurpriseBtn) {
        startSurpriseBtn.addEventListener('click', () => {
            startSurpriseSequence();
        });
    }

    startSurpriseSequence();

    // 6. Mouse / Touch Dragging & Wheel
    let startX = 0;
    let isDragging = false;

    function onStart(e) {
        isDragging = true;
        startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    }

    function onMove(e) {
        if (!isDragging) return;
        const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        const diff = x - startX;

        if (Math.abs(diff) > 40) {
            if (diff > 0) prevSlide();
            else nextSlide();
            isDragging = false;
            pauseAutoPlay();
        }
    }

    function onEnd() {
        isDragging = false;
    }

    const stage = document.querySelector('.stage3d');
    if (stage) {
        stage.addEventListener('mousedown', onStart);
        stage.addEventListener('mousemove', onMove);
        stage.addEventListener('mouseup', onEnd);
        stage.addEventListener('touchstart', onStart, { passive: true });
        stage.addEventListener('touchmove', onMove, { passive: true });
        stage.addEventListener('touchend', onEnd);
    }

    window.addEventListener('wheel', (e) => {
        if (e.deltaY > 0) nextSlide();
        else prevSlide();
        pauseAutoPlay();
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { nextSlide(); pauseAutoPlay(); }
        else if (e.key === 'ArrowLeft') { prevSlide(); pauseAutoPlay(); }
        else if (e.key === 'Escape') { closeLightbox(); }
    });

    window.addEventListener('resize', updateCoverflow);

    // 7. Lightbox Modal
    function openLightbox(src, num) {
        lightboxImg.src = src;
        lightboxCaption.innerText = `Polu's Memory ${String(num).padStart(2, '0')} 💖`;
        lightbox.classList.add('active');
        pauseAutoPlay();
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
    }

    // 8. Ambient Particle Canvas Background
    const canvas = document.getElementById('canvasBg');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speedY: Math.random() * 0.3 + 0.1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ff75c3';

            particles.forEach(p => {
                ctx.globalAlpha = p.opacity;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                p.y -= p.speedY;
                if (p.y < 0) {
                    p.y = canvas.height;
                    p.x = Math.random() * canvas.width;
                }
            });

            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }
});

function updateAudioButtonUI(isPlaying) {
    const musicIcon = document.getElementById('musicIcon');
    const musicText = document.getElementById('musicText');
    if (musicIcon && musicText) {
        musicIcon.innerText = isPlaying ? "🔊" : "🎵";
        musicText.innerText = isPlaying ? "Pause Audio" : "Play Audio";
    }
}

function toggleAudio() {
    const quoteAudio = document.getElementById('quoteAudio');
    const bgAudio = document.getElementById('bgAudio');

    if (quoteAudio && bgAudio) {
        if (quoteAudio.paused && bgAudio.paused) {
            bgAudio.volume = 0.25;
            quoteAudio.volume = 1.0;
            quoteAudio.play();
            bgAudio.play();
            updateAudioButtonUI(true);
        } else {
            quoteAudio.pause();
            bgAudio.pause();
            updateAudioButtonUI(false);
        }
    }
}