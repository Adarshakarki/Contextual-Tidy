import { applyRules } from './rules.js';

const headerCache = new Map();

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    for (const h of details.responseHeaders || []) {
      if (h.name.toLowerCase() === 'content-type') {
        headerCache.set(details.url, h.value.split(';')[0].trim());
      }
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  handleRename(item, suggest);
  return true;
});

async function handleRename(item, suggest) {
  const { enabled = true } = await chrome.storage.sync.get('enabled');
  if (!enabled) return suggest({ filename: item.filename });

  const mime = headerCache.get(item.url) || item.mime;
  const pageTitle = await getTitle(item.referrer);

  const newName = applyRules({
    originalName: item.filename.split(/[\\/]/).pop(),
    url: item.url,
    pageTitle: pageTitle,
    mimeType: mime
  });

  if (newName && newName !== item.filename) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Tidied!',
      message: `${newName}`
    });
    
    const { history = [] } = await chrome.storage.local.get('history');
    history.unshift({ original: item.filename, renamed: newName, ts: Date.now() });
    chrome.storage.local.set({ history: history.slice(0, 15) });

    suggest({ filename: newName, conflictAction: 'uniquify' });
  } else {
    suggest({ filename: item.filename });
  }
}

async function getTitle(url) {
  if (!url) return null;
  try {
    const tabs = await chrome.tabs.query({ url });
    return tabs[0]?.title || null;
  } catch { return null; }
}