// ==========================================
// RIFQYSHIELD YOUTUBE AD-KILLER ENGINE
// ==========================================
let isYouTubeKillerEnabled = true;

// Cek apakah switch YouTube di popup menyala
chrome.storage.local.get(['categoryYouTube'], (data) => {
    isYouTubeKillerEnabled = data.categoryYouTube !== false;
    if(isYouTubeKillerEnabled) initKiller();
});

// Dengarkan jika Bos Rifqy mematikan/menyalakan switch secara realtime
chrome.storage.onChanged.addListener((changes) => {
    if (changes.categoryYouTube) {
        isYouTubeKillerEnabled = changes.categoryYouTube.newValue;
    }
});

function initKiller() {
    console.log("🛡️ RifqyShield: YouTube Ad-Killer Engine Activated!");
    
    // Gunakan interval brutal untuk mencegat eksekusi JS YouTube yang dinamis
    setInterval(() => {
        if (!isYouTubeKillerEnabled) return;
        
        // FITUR 1: SKIP VIDEO IKLAN & FAST-FORWARD 16x
        const video = document.querySelector('video');
        const adShowing = document.querySelector('.ad-showing');
        
        if (video && adShowing) {
            // Mute seketika agar tidak berisik
            video.muted = true; 
            // Putar 16x lipat lebih cepat (Bypass iklan 15 detik unskippable)
            video.playbackRate = 16.0; 
            
            // Lompat paksa ke akhir durasi iklan
            if (!isNaN(video.duration)) {
                video.currentTime = video.duration; 
            }
            
            // Klik tombol skip gaib jika sudah muncul
            const skipBtns = document.querySelectorAll('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
            skipBtns.forEach(btn => btn.click());
        }

        // FITUR 2: SAPU BERSIH BANNER, OVERLAY, DAN SIDEBAR SPONSOR
        const adSelectors = [
            'ytd-promoted-sparkles-web-renderer',
            'ytd-display-ad-renderer',
            'ytd-carousel-ad-renderer',
            'ytd-ad-slot-renderer',
            '#masthead-ad',
            '#player-ads',
            '.ytd-banner-promo-renderer',
            '.ytp-ad-overlay-container',
            'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]'
        ];
        
        adSelectors.forEach(selector => {
            const ads = document.querySelectorAll(selector);
            ads.forEach(ad => {
                ad.style.display = 'none';
                ad.remove();
            });
        });

        // FITUR 3: BYPASS "ANTI-ADBLOCK" YOUTUBE
        const antiAdblockPopups = document.querySelectorAll('ytd-enforcement-message-view-model, tp-yt-paper-dialog');
        antiAdblockPopups.forEach(popup => {
            const inner = popup.innerHTML.toLowerCase();
            // Deteksi teks peringatan Adblock dari YouTube (Inggris & Indo)
            if (inner.includes('ad blockers are not allowed') || inner.includes('pemblokir iklan') || inner.includes('ad blocker')) {
                popup.remove(); // Hancurkan popup
                
                // YouTube biasanya mem-pause video saat popup muncul, kita Play paksa lagi
                if (video && video.paused) {
                    video.play();
                }
                
                // Hapus background hitam/gelap yang mengunci layar
                const backdrop = document.querySelector('tp-yt-iron-overlay-backdrop');
                if(backdrop) backdrop.remove();
            }
        });

        // FITUR 4: YOUTUBE SHORTS AD-SKIPPER
        // Cek jika sedang memutar Shorts dan slot iklan aktif
        const shortsAd = document.querySelector('ytd-reel-video-renderer[is-active] ytd-ad-slot-renderer');
        if (shortsAd) {
            // Langsung tekan tombol panah bawah ke video Shorts berikutnya
            const nextBtn = document.querySelector('#navigation-button-down ytd-button-renderer button');
            if(nextBtn) nextBtn.click();
        }
        
    }, 300); // Eksekusi dengan kecepatan 300ms (Sangat brutal & cepat)
}
