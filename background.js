// background.js — RifqyShield v3.1 (support banyak .txt)
const FILTER_FOLDER = "filters";

async function loadAndApplyFilters() {
  const ruleIdStart = 1;
  const rules = [];
  let currentId = ruleIdStart;

  // Daftar semua file .txt yang mau dipakai
  const filterFiles = [
    "google-ads.txt",
    "youtube-ads.txt",
    "popups.txt",
    "trackers.txt",
    "social-media-ads.txt",
    "indonesia-block.txt",
    "custom.txt"
  ];

  for (const file of filterFiles) {
    try {
      const url = chrome.runtime.getURL(`\( {FILTER_FOLDER}/ \){file}`);
      const response = await fetch(url);
      if (!response.ok) continue;

      const text = await response.text();
      const lines = text.split('\n');

      for (let line of lines) {
        line = line.trim();

        // Abaikan komentar dan baris kosong
        if (!line || line.startsWith('!') || line.startsWith('#') || line.startsWith('[')) continue;

        // Support format uBlock Origin
        let domain = '';
        if (line.startsWith('||')) {
          domain = line.slice(2).split('^')[0].split('$')[0];
        } else if (line.startsWith('@@')) {
          continue; // whitelist (skip dulu)
        } else if (!line.includes('/')) {
          domain = line.split('^')[0];
        } else {
          continue; // regex kompleks → skip biar aman
        }

        if (domain) {
          rules.push({
            id: currentId++,
            priority: 1,
            action: { type: "block" },
            condition: {
              urlFilter: `||${domain}^`,
              resourceTypes: [
                "script", "image", "media", "sub_frame",
                "xmlhttprequest", "stylesheet", "font"
              ]
            }
          });
        }
      }
    } catch (err) {
      console.warn(`Gagal baca ${file}:`, err);
    }
  }

  // Hapus rule lama, tambah rule baru
  const oldRuleIds = Array.from({length: 100000}, (_, i) => i + ruleIdStart);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: oldRuleIds,
    addRules: rules.slice(0, chrome.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES)
  });

  console.log(`RifqyShield aktif! ${rules.length} domain diblokir`);
}

// Jalankan saat install & saat Chrome start
chrome.runtime.onInstalled.addListener(() => {
  loadAndApplyFilters();
  console.log("RifqyShield v3.1 terinstall!");
});

chrome.runtime.onStartup.addListener(() => {
  loadAndApplyFilters();
});

// Optional: reload filter saat ada perubahan file (dev only)
chrome.runtime.onMessage?.addListener((msg) => {
  if (msg === "reload-filters") {
    loadAndApplyFilters();
  }
});
