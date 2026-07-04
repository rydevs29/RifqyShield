const REMOTE_ID_START = 1;
const CATEGORY_ID_START = 10001;
const FOCUS_ID_START = 15001;
const CUSTOM_ID_START = 20001;
const DEFAULT_URL = "https://example.com/blocked-extension.txt";

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(null, (data) => {
        const defaults = {
            shieldEnabled: data.shieldEnabled ?? true,
            customRules: data.customRules || [],
            totalBlocked: data.totalBlocked || 0,
            remoteUrl: data.remoteUrl || DEFAULT_URL,
            categoryAds: data.categoryAds ?? true,
            categoryYouTube: data.categoryYouTube ?? true, // NEW
            categoryTrackers: data.categoryTrackers ?? true,
            categoryMalware: data.categoryMalware ?? true,
            focusMode: data.focusMode ?? false,
            recentLogs: data.recentLogs || []
        };
        chrome.storage.local.set(defaults, reloadRules);
    });

    chrome.action.setBadgeBackgroundColor({ color: '#1a73e8' });
    chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: true });
    
    // Add Context Menu
    chrome.contextMenus.create({
        id: "block_this_domain",
        title: "🛡️ RifqyShield: Blokir Domain Ini",
        contexts: ["page"]
    });

    chrome.alarms.create("autoSync", { periodInMinutes: 720 }); // Every 12 hrs
});

// Context Menu Action
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "block_this_domain" && tab.url) {
        try {
            const domain = new URL(tab.url).hostname;
            chrome.storage.local.get(['customRules'], (data) => {
                let rules = data.customRules || [];
                if (!rules.some(r => r.domain === domain)) {
                    rules.unshift({ domain: domain, type: 'block' });
                    chrome.storage.local.set({ customRules: rules }, reloadRules);
                }
            });
        } catch(e) {}
    }
});

// Debug Log interceptor
if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
    chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
        chrome.storage.local.get(['recentLogs', 'totalBlocked'], (data) => {
            let logs = data.recentLogs || [];
            let total = (data.totalBlocked || 0) + 1;
            
            let url = info.request.url;
            if(url.length > 50) url = url.substring(0, 50) + "...";

            logs.unshift({ url: url, time: Date.now(), ruleId: info.rule.ruleId });
            if (logs.length > 30) logs.pop(); 
            
            chrome.storage.local.set({ recentLogs: logs, totalBlocked: total });
        });
    });
}

chrome.alarms.onAlarm.addListener((alarm) => { if (alarm.name === "autoSync") syncRemote(); });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleShield" || request.action === "updateFilters") {
        reloadRules().then(() => sendResponse({ success: true }));
        return true;
    } else if (request.action === "forceSync") {
        syncRemote().then(res => sendResponse({ success: res }));
        return true;
    } else if (request.action === "resetAll") {
        chrome.declarativeNetRequest.getDynamicRules().then(rules => {
            const ids = rules.map(r => r.id);
            chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ids }).then(() => {
                chrome.storage.local.set({ shieldEnabled: true, customRules: [], remoteUrl: DEFAULT_URL }, () => {
                    reloadRules(); sendResponse({ success: true });
                });
            });
        });
        return true;
    }
});

async function reloadRules() {
    try {
        const data = await chrome.storage.local.get(null);
        const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
        const removeRuleIds = currentRules.map(r => r.id).filter(id => id >= CATEGORY_ID_START); 
        
        if (data.shieldEnabled === false) {
            await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: currentRules.map(r => r.id) });
            return;
        }

        const addRules = [];
        
        if (data.categoryAds) {
            addRules.push({ id: CATEGORY_ID_START, priority: 2, action: { type: "block" }, condition: { urlFilter: "||doubleclick.net^" } });
            addRules.push({ id: CATEGORY_ID_START+1, priority: 2, action: { type: "block" }, condition: { urlFilter: "||googlesyndication.com^" } });
            addRules.push({ id: CATEGORY_ID_START+2, priority: 2, action: { type: "block" }, condition: { urlFilter: "||adservice.google.com^" } });
        }
        if (data.categoryTrackers) {
            addRules.push({ id: CATEGORY_ID_START+50, priority: 2, action: { type: "block" }, condition: { urlFilter: "||google-analytics.com^" } });
            addRules.push({ id: CATEGORY_ID_START+51, priority: 2, action: { type: "block" }, condition: { urlFilter: "||hotjar.com^" } });
        }

        if (data.focusMode) {
            const focusDomains = ["facebook.com", "instagram.com", "tiktok.com", "twitter.com", "x.com", "reddit.com", "netflix.com"];
            focusDomains.forEach((domain, idx) => {
                addRules.push({
                    id: FOCUS_ID_START + idx,
                    priority: 5,
                    action: { type: "block" },
                    condition: { urlFilter: "||" + domain + "^", resourceTypes: ["main_frame"] }
                });
            });
        }

        const custom = data.customRules || [];
        custom.forEach((rule, idx) => {
            if (idx > 9000) return;
            addRules.push({
                id: CUSTOM_ID_START + idx,
                priority: rule.type === 'allow' ? 10 : 8,
                action: { type: rule.type },
                condition: { urlFilter: "||" + rule.domain + "^" }
            });
        });

        await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
    } catch(e) { console.error("Rules update error", e); }
}

async function syncRemote() {
    try {
        const data = await chrome.storage.local.get(['remoteUrl', 'shieldEnabled']);
        if (!data.shieldEnabled) return false;
        
        const res = await fetch(data.remoteUrl || DEFAULT_URL);
        if (!res.ok) return false;
        const text = await res.text();
        const lines = text.split('\n');
        
        const remoteRules = [];
        let idCounter = REMOTE_ID_START;
        
        for (const line of lines) {
            let domain = line.trim();
            if (!domain || domain.startsWith('#')) continue;
            if (!domain.startsWith('||')) domain = "||" + domain + "^";
            
            remoteRules.push({
                id: idCounter++, priority: 3, action: { type: "block" },
                condition: { urlFilter: domain, resourceTypes: ["main_frame", "sub_frame", "script", "image", "xmlhttprequest"] }
            });
            if (idCounter >= CATEGORY_ID_START) break;
        }
        
        const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
        const removeRuleIds = currentRules.map(r => r.id).filter(id => id < CATEGORY_ID_START);
        
        await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules: remoteRules });
        await chrome.storage.local.set({ lastUpdate: Date.now() });
        return true;
    } catch(e) { return false; }
}
