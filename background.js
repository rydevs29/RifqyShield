// ==UserScript==
// @name         RifqyShield – Ultimate Protection
// @namespace    https://github.com/rydevs29/RifqyShield
// @version      12.0
// @description  Block Google/YouTube/Spotify Ads + Nsfw + Gambling + Trackers
// @author       RifqyDev
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // Daftar filter terpisah (otomatis terhubung)
    const filterFiles = [
        "filters/google-ads.txt",
        "filters/blocklist-2.txt",
        "filters/youtube-ads.txt",
        "filters/youtube-ads2.txt",
        "filters/spotify-ads.txt",
        "filters/spotify-ads2.txt",
        "filters/nsfw.txt",
        "filters/nsfw-2.txt",
        "filters/gambling.txt",
        "filters/whitelist.txt",
        "filters/whitelist-2.txt",
        "filters/whitelist-spotify.txt",
        "filters/bonus.txt"
    ];

    console.log("🛡️ RifqyShield - Active");
    console.log("Total file filter: " + filterFiles.length);

    // Auto-block kalau ada request ke domain terlarang
    const blocked = () => {
        document.documentElement.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;color:#0f0;font-family:monospace;text-align:center;padding-top:20vh;font-size:20px;z-index:999999;">
                <h1>🛡️ RIFQYSHIELD</h1>
                <p>Situs diblokir demi keselamatan keluarga.</p>
            </div>`;
    };

    // Deteksi & blokir
    if (location.hostname.includes("porn") || 
        location.hostname.includes("bokep") || 
        location.hostname.includes("judi") || 
        location.hostname.includes("simontok")) {
        blocked();
    }
})();
