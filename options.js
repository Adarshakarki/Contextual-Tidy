const list = document.getElementById('history');
const toggle = document.getElementById('enabled');

async function load() {
  const { enabled = true } = await chrome.storage.sync.get('enabled');
  const { history = [] } = await chrome.storage.local.get('history');
  
  toggle.checked = enabled;
  if (history.length > 0) {
    list.innerHTML = history.map(h => `
      <div class="item">
        <span style="text-decoration:line-through; opacity:0.6">${h.original.split('/').pop()}</span>
        <b>→ ${h.renamed}</b>
      </div>
    `).join('');
  }
}

toggle.addEventListener('change', (e) => chrome.storage.sync.set({ enabled: e.target.checked }));
load();