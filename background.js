// ==UserScript==
// @name         RifqyShield – Ultimate Protection
// @namespace    https://github.com/rydevs29/RifqyShield
// @version      15.2
// @description  Block Google/YouTube/Spotify Ads + NSFW + Gambling + Trackers
// @author       RifqyDev
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(async function () {
    'use strict';

    // Semua file blocklist
    const filterFiles = [
        "filters/blocklist/RifqyShield-BlockList.txt",
        "filters/blocklist/google-ads.txt",
        "filters/blocklist/blocklist.txt",
        "filters/youtube-ads/youtube-ads.txt",
        "filters/youtube-ads/youtube-ads2.txt",
        "filters/spotify-ads/spotify-ads.txt",
        "filters/spotify-ads/spotify-ads2.txt",
        "filters/nsfw/nsfw.txt",
        "filters/nsfw/nsfw-2.txt",
        "filters/nsfw/nsfw-3.txt",
        "filters/gambling/gambling.txt",
        "filters/gambling/gambling-2.txt",
        "filters/gambling/gambling-3.txt",
        "filters/trackers.txt"
    ];

    // Semua file whitelist
    const whitelistFiles = [
        "filters/whitelist.txt",
        "filters/whitelist-all/whitelist-all.txt",
        "filters/whitelist-spotify.txt"
    ];

    console.log("🛡️ RifqyShield 🛡️ - Active");

    // Fungsi ambil domain dari file
    async function loadDomains(files) {
        let domains = [];
        for (const file of files) {
            try {
                const res = await fetch(file);
                const text = await res.text();
                const lines = text.split("\n")
                    .map(l => l.trim())
                    .filter(l => l && !l.startsWith("#"))
                    .map(l => l.replace(/^0\.0\.0\.0\s+/, "")); // hapus prefix hosts
                domains.push(...lines);
            } catch (e) {
                console.warn("Gagal load filter:", file, e);
            }
        }
        return domains;
    }

    // Load blocklist & whitelist
    const blockedDomains = await loadDomains(filterFiles);
    const whitelistedDomains = await loadDomains(whitelistFiles);

    // Fungsi blokir
    const blocked = () => {
        document.documentElement.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;color:#0f0;font-family:monospace;text-align:center;padding-top:20vh;font-size:20px;z-index:999999;">
                <h1>🛡️ RIFQYSHIELD 🛡️</h1>
                <p>Site blocked for your safety</p>
            </div>`;
    };

    // Deteksi domain
    const host = location.hostname;
    if (blockedDomains.some(d => host.includes(d)) &&
        !whitelistedDomains.some(w => host.includes(w))) {
        blocked();
    }
})();
