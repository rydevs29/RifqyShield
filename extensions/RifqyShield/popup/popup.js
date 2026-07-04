document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    const globalToggle = document.getElementById('globalToggle');
    const statusHeadline = document.getElementById('statusHeadline');
    const currentDomainText = document.getElementById('currentDomainText');
    const whitelistSiteBtn = document.getElementById('whitelistSiteBtn');
    const blockSiteBtn = document.getElementById('blockSiteBtn');
    
    const totalBlockedCount = document.getElementById('totalBlockedCount');
    const customRulesCount = document.getElementById('customRulesCount');

    const toggleAds = document.getElementById('toggleAds');
    const toggleYouTube = document.getElementById('toggleYouTube'); // NEW
    const toggleTrackers = document.getElementById('toggleTrackers');
    const toggleMalware = document.getElementById('toggleMalware');
    const toggleFocusMode = document.getElementById('toggleFocusMode');
    const toggleDarkMode = document.getElementById('toggleDarkMode');

    const customInput = document.getElementById('customInput');
    const addBlockBtn = document.getElementById('addBlockBtn');
    const addAllowBtn = document.getElementById('addAllowBtn');
    const customRulesList = document.getElementById('customRulesList');
    
    const logsList = document.getElementById('logsList');
    const clearLogsBtn = document.getElementById('clearLogsBtn');

    const updateUrlInput = document.getElementById('updateUrlInput');
    const syncNowBtn = document.getElementById('syncNowBtn');
    const syncTimestamp = document.getElementById('syncTimestamp');
    const exportRulesBtn = document.getElementById('exportRulesBtn');
    const importRulesBtn = document.getElementById('importRulesBtn');
    const importFileInput = document.getElementById('importFileInput');
    const resetAllBtn = document.getElementById('resetAllBtn');

    let currentTabDomain = "";

    function init() {
        chrome.storage.local.get([
            'shieldEnabled', 'lastUpdate', 'totalBlocked', 'customRules', 
            'categoryAds', 'categoryYouTube', 'categoryTrackers', 'categoryMalware', 'remoteUrl',
            'focusMode', 'darkMode', 'recentLogs'
        ], (data) => {
            const isEnabled = data.shieldEnabled !== false;
            globalToggle.checked = isEnabled;
            updateStatusUI(isEnabled);

            if(data.darkMode) {
                document.body.classList.add('dark-mode');
                toggleDarkMode.checked = true;
            }

            totalBlockedCount.textContent = data.totalBlocked || 0;
            if(data.remoteUrl) updateUrlInput.value = data.remoteUrl;
            if(data.lastUpdate) syncTimestamp.textContent = 'Terakhir Update: ' + new Date(data.lastUpdate).toLocaleString('id-ID');

            toggleAds.checked = data.categoryAds !== false;
            toggleYouTube.checked = data.categoryYouTube !== false; // NEW
            toggleTrackers.checked = data.categoryTrackers !== false;
            toggleMalware.checked = data.categoryMalware !== false;
            toggleFocusMode.checked = data.focusMode === true;

            const rules = data.customRules || [];
            customRulesCount.textContent = rules.length;
            renderCustomRulesList(rules);
            
            renderLogsList(data.recentLogs || []);
        });

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0] && tabs[0].url) {
                try {
                    const url = new URL(tabs[0].url);
                    if (url.protocol.startsWith('http')) {
                        currentTabDomain = url.hostname;
                        currentDomainText.textContent = currentTabDomain;
                    } else {
                        currentDomainText.textContent = "Halaman Internal";
                        whitelistSiteBtn.style.display = "none";
                        blockSiteBtn.style.display = "none";
                    }
                } catch(e) {
                    currentDomainText.textContent = "URL Invalid";
                }
            }
        });
        
        chrome.declarativeNetRequest.getDynamicRules((rules) => {});
    }

    init();

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
        });
    });

    toggleDarkMode.addEventListener('change', (e) => {
        const isDark = e.target.checked;
        if(isDark) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
        chrome.storage.local.set({ darkMode: isDark });
    });

    globalToggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        chrome.storage.local.set({ shieldEnabled: isEnabled });
        updateStatusUI(isEnabled);
        chrome.runtime.sendMessage({ action: "toggleShield", enabled: isEnabled });
    });

    function updateStatusUI(enabled) {
        statusHeadline.textContent = enabled ? 'Aktif & Terlindungi' : 'Perlindungan Mati';
        statusHeadline.className = enabled ? 'status-good' : 'status-off';
    }

    const handleFiltersChange = () => {
        const config = {
            categoryAds: toggleAds.checked,
            categoryYouTube: toggleYouTube.checked, // NEW
            categoryTrackers: toggleTrackers.checked,
            categoryMalware: toggleMalware.checked,
            focusMode: toggleFocusMode.checked
        };
        chrome.storage.local.set(config);
        chrome.runtime.sendMessage({ action: "updateFilters" });
    };

    toggleAds.addEventListener('change', handleFiltersChange);
    toggleYouTube.addEventListener('change', handleFiltersChange); // NEW
    toggleTrackers.addEventListener('change', handleFiltersChange);
    toggleMalware.addEventListener('change', handleFiltersChange);
    toggleFocusMode.addEventListener('change', handleFiltersChange);

    function renderCustomRulesList(rules) {
        if (rules.length === 0) {
            customRulesList.innerHTML = '<p class="empty-text">Belum ada aturan kustom.</p>';
            return;
        }
        customRulesList.innerHTML = '';
        rules.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'rule-item-row';
            row.innerHTML = `
                <div>
                    <span>${item.domain}</span>
                    <span class="badge-type ${item.type}">${item.type === 'block' ? 'BLOK' : 'AMAN'}</span>
                </div>
                <button class="remove-btn" data-index="${index}">✖</button>
            `;
            customRulesList.appendChild(row);
        });
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => removeCustomRule(parseInt(e.target.getAttribute('data-index'))));
        });
    }

    function addCustomRule(domain, type) {
        if (!domain) return;
        chrome.storage.local.get(['customRules'], (data) => {
            const rules = data.customRules || [];
            if (rules.some(r => r.domain === domain)) {
                alert("Domain sudah terdaftar!"); return;
            }
            rules.unshift({ domain: domain, type: type });
            chrome.storage.local.set({ customRules: rules }, () => {
                customRulesCount.textContent = rules.length;
                renderCustomRulesList(rules);
                chrome.runtime.sendMessage({ action: "updateFilters" });
                customInput.value = "";
            });
        });
    }

    function removeCustomRule(index) {
        chrome.storage.local.get(['customRules'], (data) => {
            const rules = data.customRules || [];
            rules.splice(index, 1);
            chrome.storage.local.set({ customRules: rules }, () => {
                customRulesCount.textContent = rules.length;
                renderCustomRulesList(rules);
                chrome.runtime.sendMessage({ action: "updateFilters" });
            });
        });
    }

    addBlockBtn.addEventListener('click', () => addCustomRule(customInput.value.trim(), 'block'));
    addAllowBtn.addEventListener('click', () => addCustomRule(customInput.value.trim(), 'allow'));
    whitelistSiteBtn.addEventListener('click', () => { if(currentTabDomain) addCustomRule(currentTabDomain, 'allow'); });
    blockSiteBtn.addEventListener('click', () => { if(currentTabDomain) addCustomRule(currentTabDomain, 'block'); });

    function renderLogsList(logs) {
        if (logs.length === 0) {
            logsList.innerHTML = '<p class="empty-text">Bersih! Tidak ada pelacak yang ditangkap.</p>';
            return;
        }
        logsList.innerHTML = '';
        logs.forEach(log => {
            const row = document.createElement('div');
            row.className = 'log-item';
            row.innerHTML = `
                <span class="log-url">${log.url}</span>
                <span class="log-time">${new Date(log.time).toLocaleTimeString('id-ID')} - Rule ID: ${log.ruleId}</span>
            `;
            logsList.appendChild(row);
        });
    }
    clearLogsBtn.addEventListener('click', () => {
        chrome.storage.local.set({ recentLogs: [] });
        renderLogsList([]);
    });

    syncNowBtn.addEventListener('click', () => {
        const remoteUrl = updateUrlInput.value.trim();
        if (!remoteUrl) return;
        syncNowBtn.textContent = "Syncing..."; syncNowBtn.disabled = true;
        chrome.storage.local.set({ remoteUrl: remoteUrl }, () => {
            chrome.runtime.sendMessage({ action: "forceSync" }, (response) => {
                syncNowBtn.textContent = "Sinkronisasi Database"; syncNowBtn.disabled = false;
                if (response && response.success) {
                    syncTimestamp.textContent = 'Terakhir Update: ' + new Date().toLocaleString('id-ID');
                    alert("Sukses update list!");
                } else alert("Gagal update list. Cek URL / Koneksi.");
            });
        });
    });

    exportRulesBtn.addEventListener('click', () => {
        chrome.storage.local.get(['customRules'], (data) => {
            const blob = new Blob([JSON.stringify(data.customRules || [], null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'rifqyshield_v3_rules.json'; a.click();
        });
    });

    importRulesBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (Array.isArray(parsed)) {
                    chrome.storage.local.set({ customRules: parsed }, () => {
                        init(); chrome.runtime.sendMessage({ action: "updateFilters" });
                        alert(`Berhasil import ${parsed.length} aturan!`);
                    });
                }
            } catch(err) { alert("File JSON invalid!"); }
        };
        reader.readAsText(file);
    });

    resetAllBtn.addEventListener('click', () => {
        if(confirm("Yakin ingin reset semua pengaturan dan filter?")) {
            chrome.storage.local.clear(() => {
                chrome.runtime.sendMessage({ action: "resetAll" }, () => location.reload());
            });
        }
    });
});
