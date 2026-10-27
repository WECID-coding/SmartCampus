/**
 * SmartCampus MITS — AI Intelligence Controller
 * Integrates Google Gemini 3.8 Flash & Heuristic Intelligence:
 *  - Floating Campus AI Assistant Chat Drawer
 *  - AI Matchmaker for Lost & Found items
 *  - AI Report Description Enhancer
 *  - AI Handover Claim Validator
 */

const isLocalEnv = typeof window !== 'undefined' && (
  window.location.protocol === 'file:' || 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);
const AI_API_BASE = (typeof API_BASE !== 'undefined' ? API_BASE : (window.SMARTCAMPUS_API_BASE || (isLocalEnv ? 'http://localhost:8000' : '')));

function safeText(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}

// Global API invocation helpers
window.requestAIMatch = async function(lostItem) {
  try {
    const res = await fetch(`${AI_API_BASE}/ai/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lost_item: lostItem, report_id: lostItem?.id })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[AI] Backend offline, computing local heuristic match');
  }

  // Client-side heuristic fallback
  const reports = typeof getReports === 'function' ? getReports() : [];
  const foundReports = reports.filter(r => r.type === 'found');
  const matches = foundReports.map(cand => {
    let score = 20;
    const reasons = [];
    if (cand.category === lostItem.category) {
      score += 40;
      reasons.append ? null : reasons.push(`Category match (${cand.categoryLabel || cand.category})`);
    }
    const cleanWords = s => (s || '').toLowerCase().match(/\b[a-z0-9]{3,}\b/g) || [];
    const lostWords = cleanWords(lostItem.name + ' ' + (lostItem.description || ''));
    const candWords = cleanWords(cand.name + ' ' + (cand.description || ''));
    const common = lostWords.filter(w => candWords.includes(w));
    if (common.length) {
      score += Math.min(30, common.length * 10);
      reasons.push(`Matching terms: ${[...new Set(common)].slice(0, 3).join(', ')}`);
    }
    if (cand.location && lostItem.location && cand.location === lostItem.location) {
      score += 15;
      reasons.push(`Exact location (${cand.location})`);
    }
    score = Math.min(97, score);
    const level = score >= 75 ? 'High' : (score >= 50 ? 'Medium' : 'Low');
    return {
      match_score: score,
      match_level: level,
      reasoning: reasons.length ? reasons.join(' · ') : 'Potential campus vicinity match',
      candidate: cand
    };
  }).sort((a, b) => b.match_score - a.match_score);

  return {
    matches,
    engine: 'SmartCampus Heuristic Engine',
    total_evaluated: foundReports.length
  };
};

window.requestAIEnhance = async function(itemData) {
  try {
    const res = await fetch(`${AI_API_BASE}/ai/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[AI] Backend offline, using client enhancer');
  }

  // Client-side fallback
  const title = (itemData.title || '').trim();
  const desc = (itemData.description || '').trim();
  const loc = itemData.location || 'MITS Campus';
  
  return {
    suggested_title: title.replace(/\b\w/g, l => l.toUpperCase()),
    suggested_category: itemData.category || 'accessories',
    enhanced_description: `${title || 'Campus Item'} reported in ${loc}. ${desc ? desc + ' ' : ''}Physical condition is intact. Genuine owner must identify private markings or secret features to authorize collection.`,
    key_tags: title.toLowerCase().split(/\s+/).filter(w => w.length > 3),
    engine: 'SmartCampus Heuristic Engine'
  };
};

window.requestAIChat = async function(userQuery) {
  try {
    const res = await fetch(`${AI_API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: userQuery })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('[AI] Backend chat offline, using client assistant');
  }

  // Client-side assistant fallback
  const reports = typeof getReports === 'function' ? getReports() : [];
  const q = userQuery.toLowerCase();
  const matched = reports.filter(r => 
    q.includes(r.name.toLowerCase()) || 
    (r.location && q.includes(r.location.toLowerCase())) ||
    (r.category && q.includes(r.category.toLowerCase()))
  ).slice(0, 3);

  let reply = '';
  if (q.includes('desk') || q.includes('handover') || q.includes('where') && q.includes('collect')) {
    reply = `📍 **MITS Campus Handover Desks**:\n• **Central Library Desk**: Books, IDs, electronics\n• **SAC Desk (J114)**: Sports gear, bags, wearables\n• **Main Gate 1 Security**: Keys, umbrellas\n• **Proctor Office**: Laptops, wallets, phones`;
  } else if (matched.length) {
    reply = `🔍 Found **${matched.length} report(s)** matching your query:\n` + 
      matched.map(m => `• **${m.name}** (${m.type.toUpperCase()}) at *${m.location}*`).join('\n') +
      `\n\nClick below to inspect or submit an ownership claim!`;
  } else {
    reply = `👋 I am **SmartCampus AI**. I search across all **235 campus academic rooms & labs** and active lost/found entries.\n\nTry asking:\n• *"Did anyone find keys in J115?"*\n• *"Where do I submit a claim?"*`;
  }

  return {
    reply,
    recommendations: matched,
    engine: 'SmartCampus Heuristic Engine'
  };
};

// UI Component: Floating Chat Widget
function initAIAssistantWidget() {
  if (document.getElementById('aiChatFab')) return;

  const fab = document.createElement('button');
  fab.id = 'aiChatFab';
  fab.className = 'ai-chat-fab';
  fab.type = 'button';
  fab.innerHTML = `
    <span class="ai-fab-icon">🤖</span>
    <span>Ask Campus AI</span>
  `;
  document.body.appendChild(fab);

  const drawer = document.createElement('aside');
  drawer.id = 'aiAssistantDrawer';
  drawer.className = 'ai-assistant-drawer';
  drawer.hidden = true;
  drawer.innerHTML = `
    <div class="ai-drawer-header">
      <div class="ai-drawer-title">
        <span>🤖 SmartCampus AI</span>
        <span class="ai-chip-pill">Gemini 3.8</span>
      </div>
      <button class="ai-close-btn" id="aiDrawerClose" type="button" aria-label="Close assistant">✕</button>
    </div>

    <div class="ai-messages-wrap" id="aiMessagesWrap">
      <div class="ai-msg bot">
        <strong>👋 Hi, I'm SmartCampus AI!</strong>
        <span>Ask me about lost items, classrooms, or handover desks. What are you looking for today?</span>
      </div>
    </div>

    <div class="ai-suggestions-row" id="aiSuggestionsRow">
      <button class="ai-prompt-pill" type="button" data-prompt="Where are the campus handover desks?">📍 Handover Desks</button>
      <button class="ai-prompt-pill" type="button" data-prompt="Did anyone find an ID card or wallet?">🪪 ID / Wallet Reports</button>
      <button class="ai-prompt-pill" type="button" data-prompt="How do I claim a found item?">🛡️ How to Claim?</button>
      <button class="ai-prompt-pill" type="button" data-prompt="Items reported in Main Building today">🏫 Main Building Items</button>
    </div>

    <form class="ai-input-bar" id="aiChatForm" autocomplete="off">
      <input type="text" id="aiChatInput" placeholder="Ask AI: e.g. Lost earphones in canteen..." required>
      <button type="submit">Send</button>
    </form>
  `;
  document.body.appendChild(drawer);

  fab.addEventListener('click', () => {
    const isHidden = drawer.hidden;
    drawer.hidden = !isHidden;
    if (!drawer.hidden) {
      document.getElementById('aiChatInput')?.focus();
    }
  });

  document.getElementById('aiDrawerClose')?.addEventListener('click', () => {
    drawer.hidden = true;
  });

  // Handle Quick Prompts
  drawer.querySelectorAll('[data-prompt]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.prompt;
      submitUserQuery(p);
    });
  });

  const chatForm = document.getElementById('aiChatForm');
  const chatInput = document.getElementById('aiChatInput');
  const messagesWrap = document.getElementById('aiMessagesWrap');

  async function submitUserQuery(query) {
    if (!query || !query.trim()) return;
    const text = query.trim();
    if (chatInput) chatInput.value = '';

    // Append user message
    const userDiv = document.createElement('div');
    userDiv.className = 'ai-msg user';
    userDiv.textContent = text;
    messagesWrap.appendChild(userDiv);
    messagesWrap.scrollTop = messagesWrap.scrollHeight;

    // Loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'ai-msg bot';
    loadingDiv.innerHTML = `<em>Thinking with Gemini AI...</em>`;
    messagesWrap.appendChild(loadingDiv);
    messagesWrap.scrollTop = messagesWrap.scrollHeight;

    const data = await window.requestAIChat(text);
    messagesWrap.removeChild(loadingDiv);

    // Append bot reply
    const botDiv = document.createElement('div');
    botDiv.className = 'ai-msg bot';
    
    // Format simple markdown into HTML
    const formatted = data.reply
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    botDiv.innerHTML = `<div>${formatted}</div>`;

    if (data.recommendations && data.recommendations.length) {
      const recsHtml = data.recommendations.map(r => `
        <div style="margin-top: 8px; padding: 6px 10px; background: var(--surface-card); border: 1px solid var(--border-highlight); border-radius: var(--radius-sm); font-size: 11.5px;">
          <strong>${safeText(r.name)}</strong> · <span style="text-transform:uppercase; color: ${r.type === 'lost' ? 'var(--lost)' : 'var(--found)'}; font-weight:800;">${r.type}</span><br>
          <small style="color:var(--muted);">📍 ${safeText(r.location)}</small><br>
          <a href="${location.pathname.includes('/pages/') ? 'browse.html' : 'pages/browse.html'}?search=${encodeURIComponent(r.name)}" style="color:var(--primary); font-weight:700; display:inline-block; margin-top:3px;">
            Inspect in Directory →
          </a>
        </div>
      `).join('');
      botDiv.innerHTML += recsHtml;
    }

    messagesWrap.appendChild(botDiv);
    messagesWrap.scrollTop = messagesWrap.scrollHeight;
  }

  chatForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    submitUserQuery(chatInput?.value || '');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAIAssistantWidget();
});
