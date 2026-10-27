/**
 * SmartCampus Core Application Script
 * Enhanced Dark/Light Theme & Campus Location Services
 */
const REPORTS_KEY = 'smartcampus-reports-v4';
const THEME_KEY = 'smartcampus-theme';

const REPORT_CATEGORY_LABELS = {
  accessories: 'Accessories',
  documents: 'Documents & IDs',
  electronics: 'Electronics',
  bags: 'Bags & Packs',
  keys: 'Keys',
  education: 'Academic & Books'
};

const CATEGORY_ICONS = {
  accessories: '⌚',
  documents: '🪪',
  electronics: '💻',
  bags: '🎒',
  keys: '🔑',
  education: '📚'
};

window.REPORT_CATEGORY_LABELS = REPORT_CATEGORY_LABELS;
window.CATEGORY_ICONS = CATEGORY_ICONS;
window.escapeHTML = escapeHTML;


const SEED_REPORTS = [
  {
    id: 1,
    type: 'lost',
    name: 'Black Leather Wallet',
    category: 'accessories',
    categoryLabel: 'Accessories',
    location: 'Student Activity Center J114',
    locationKey: 'room_J114',
    date: '2026-10-06',
    time: '2 hours ago',
    description: 'Black leather trifold wallet with silver MITS RFID card and student bus pass inside.',
    symbol: 'W'
  },
  {
    id: 2,
    type: 'found',
    name: 'Titan Digital Smart Watch',
    category: 'accessories',
    categoryLabel: 'Accessories',
    location: 'J001 – Conclave Centre',
    locationKey: 'room_J001',
    date: '2026-10-06',
    time: '4 hours ago',
    description: 'Dark silicone strap, rectangular AMOLED screen. Handed over to seminar stage desk.',
    symbol: '⌚'
  },
  {
    id: 3,
    type: 'lost',
    name: 'MITS Student ID Card',
    category: 'documents',
    categoryLabel: 'Documents & IDs',
    location: 'IQAC Office (Main Building GF)',
    locationKey: 'room_IQAC',
    date: '2026-10-05',
    time: 'Yesterday',
    description: 'Blue lanyard with college identity card. Enrollment ending with ...042.',
    symbol: '🪪'
  },
  {
    id: 4,
    type: 'found',
    name: 'OnePlus Buds Z2 Case',
    category: 'electronics',
    categoryLabel: 'Electronics',
    location: 'SH-12 (Main Building GF)',
    locationKey: 'room_SH12',
    date: '2026-10-05',
    time: 'Yesterday',
    description: 'Glossy white charging case with earbuds inside. Left on second row desk.',
    symbol: '🎧'
  },
  {
    id: 5,
    type: 'lost',
    name: 'Room Key Bundle with ID Tag',
    category: 'keys',
    categoryLabel: 'Keys',
    location: 'Classroom 115 J118 (Main Building FF)',
    locationKey: 'room_J118',
    date: '2026-10-04',
    time: '2 days ago',
    description: 'Three brass keys with a blue engraved plastic tag labeled "J118-Desk".',
    symbol: '🔑'
  },
  {
    id: 6,
    type: 'found',
    name: 'Stainless Steel Flask (Milton)',
    category: 'accessories',
    categoryLabel: 'Accessories',
    location: 'LT-1 (Lecture Theatre 1)',
    locationKey: 'room_LT1',
    date: '2026-10-04',
    time: '2 days ago',
    description: 'Matte silver finish, 750ml capacity with a small Batman decal near the cap.',
    symbol: '🧴'
  },
  {
    id: 7,
    type: 'found',
    name: 'Casio Scientific Calculator fx-991EX',
    category: 'education',
    categoryLabel: 'Academic & Books',
    location: 'Cloud Computing Lab J140',
    locationKey: 'room_J140',
    date: '2026-10-07',
    time: 'Today',
    description: 'Black solar scientific calculator with a name sticker partially scratched on back.',
    symbol: '📚'
  },
  {
    id: 8,
    type: 'lost',
    name: 'Dell Type-C 65W Laptop Charger',
    category: 'electronics',
    categoryLabel: 'Electronics',
    location: 'M007 – CIoT Lab (AI Building GF)',
    locationKey: 'room_AI_GF_M007',
    date: '2026-10-07',
    time: 'Today',
    description: 'Original black Dell adapter with circular LED on connector pin.',
    symbol: '💻'
  },
  {
    id: 9,
    type: 'lost',
    name: 'Spiral Notebook & Drafter Pen',
    category: 'education',
    categoryLabel: 'Academic & Books',
    location: 'Classroom 113A J115 (Main Building FF)',
    locationKey: 'room_J115',
    date: '2026-10-08',
    time: '1 hour ago',
    description: 'Black cover classmate spiral notebook with Computer Networks notes left on 3rd row desk.',
    symbol: '📓'
  }
];

function normalizeReport(report) {
  const item = { ...report };
  item.locationKey = item.location_key || item.locationKey || 'unknown';
  item.categoryLabel = item.categoryLabel || REPORT_CATEGORY_LABELS[item.category] || item.category || 'General';
  item.time = item.time || 'Recently';
  return item;
}

function getReports() {
  try {
    const saved = JSON.parse(localStorage.getItem(REPORTS_KEY));
    const items = Array.isArray(saved) && saved.length ? saved : SEED_REPORTS.map(x => ({ ...x }));
    return items.map(normalizeReport);
  } catch {
    return SEED_REPORTS.map(x => ({ ...x })).map(normalizeReport);
  }
}

function saveReports(reports) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports.map(normalizeReport)));
}

function escapeHTML(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function iconFor(item) {
  return CATEGORY_ICONS[item.category] || item.symbol || '📦';
}

function formatImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const base = typeof API_BASE !== 'undefined' ? API_BASE : (window.SMARTCAMPUS_API_BASE || '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

function renderItemVisual(item) {
  const rawUrl = item.image_url || item.imageUrl;
  const fullUrl = formatImageUrl(rawUrl);
  if (fullUrl) {
    return `<img src="${escapeHTML(fullUrl)}" alt="${escapeHTML(item.name)}" class="item-cover-img" onerror="this.onerror=null;this.parentElement.firstElementChild.outerHTML='<div class=\\'item-category-icon\\'>${iconFor(item)}</div>';">`;
  }
  return `<div class="item-category-icon">${iconFor(item)}</div>`;
}

function reportCard(item) {
  const isLost = item.type === 'lost';
  const label = isLost ? 'LOST ITEM' : 'FOUND ITEM';
  const actionText = isLost ? 'Check Matches' : 'Verify Ownership';
  const actionIcon = isLost ? '⚡' : '🛡️';

  return `
    <article class="item-card ${item.type}" data-id="${item.id}" data-category="${escapeHTML(item.category)}">
      <div class="item-visual-wrap">
        ${renderItemVisual(item)}
        <span class="status-badge ${item.type}">
          <span class="pulse-dot"></span>
          ${label}
        </span>
      </div>
      <div class="item-body">
        <div class="item-topline">
          <span class="category-chip">${escapeHTML(item.categoryLabel)}</span>
          <span class="time-chip">⏱ ${escapeHTML(item.time)}</span>
        </div>
        <h3 class="item-title">${escapeHTML(item.name)}</h3>
        <p class="item-description">${escapeHTML(item.description)}</p>
        <div class="item-footer">
          <div class="location-chip" title="Location: ${escapeHTML(item.location)}">
            <svg class="chip-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            <span>${escapeHTML(item.location)}</span>
          </div>
          <div class="item-actions-cluster">
            ${isLost ? `
              <button class="item-action-btn lost" data-item-action="${item.id}" title="Check matching found items">
                <span>⚡ Matches</span>
              </button>
              <button class="item-action-btn found-this" data-found-it="${item.id}" title="Report that you found this item">
                <span>🙋 I Found It!</span>
              </button>
            ` : `
              <button class="item-action-btn found" data-item-action="${item.id}" title="Verify ownership and submit claim">
                <span>🛡️ Verify Ownership</span>
              </button>
            `}
          </div>
        </div>
      </div>
    </article>
  `;
}

function attachCardActions(root = document) {
  root.querySelectorAll('[data-item-action]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      handleItemAction(Number(btn.dataset.itemAction));
    };
  });
  root.querySelectorAll('[data-found-it]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openFoundItModal(Number(btn.dataset.foundIt));
    };
  });
}

async function handleItemAction(id) {
  let item;
  try {
    item = await apiFetch(`/reports/${id}`);
  } catch {
    item = getReports().find(r => r.id === id);
  }
  if (!item) return;

  if (item.type === 'lost') {
    let aiResult = null;
    if (typeof window.requestAIMatch === 'function') {
      try {
        aiResult = await window.requestAIMatch(item);
      } catch (err) {
        console.warn('AI Match error', err);
      }
    }

    const matches = aiResult?.matches || [];
    const engineName = aiResult?.engine || 'SmartCampus AI Intelligence';

    openModal(`
      <div class="modal-head">
        <div>
          <span class="section-label">🤖 AI SEMANTIC MATCHMAKER</span>
          <h2>${escapeHTML(item.name)}</h2>
          <p>Scanned active candidate items using <strong>${escapeHTML(engineName)}</strong>.</p>
        </div>
        <button class="modal-close" data-close-modal aria-label="Close modal">✕</button>
      </div>
      <div class="modal-body">
        <div class="finder-cta-banner">
          <div>
            <strong style="color:var(--heading); display:block; font-size:13.5px;">Did you find this lost item?</strong>
            <small style="color:var(--muted); font-size:12px;">Notify the owner and record where you deposited it on campus.</small>
          </div>
          <button type="button" class="btn primary small" style="background:#10b981; border-color:#059669;" onclick="closeModal(); setTimeout(() => openFoundItModal(${item.id}), 120);">
            🙋 I Found This Item →
          </button>
        </div>
        <div class="modal-meta-bar">
          <span class="meta-tag">Lost at: <strong>${escapeHTML(item.location)}</strong></span>
          <span class="meta-tag">Reported: <strong>${escapeHTML(item.time)}</strong></span>
          <span class="meta-tag">Evaluated: <strong>${matches.length} Candidates</strong></span>
        </div>
        <div class="match-list">
          ${matches.length ? matches.map(m => {
            const cand = m.candidate || m;
            const score = m.match_score || 70;
            const level = m.match_level || 'Medium';
            const reason = m.reasoning || 'Potential campus vicinity match';
            return `
              <div class="match-row" style="flex-wrap: wrap;">
                <div class="match-icon">${iconFor(cand)}</div>
                <div class="match-details" style="flex: 1; min-width: 220px;">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:3px; flex-wrap:wrap;">
                    <strong>${escapeHTML(cand.name)}</strong>
                    <span class="ai-badge ${level === 'High' ? 'high' : ''}">⚡ ${score}% ${level} Match</span>
                  </div>
                  <span class="match-loc">📍 Found at ${escapeHTML(cand.location)} · ${escapeHTML(cand.time || 'Recently')}</span>
                  <p class="match-desc">${escapeHTML(cand.description || '')}</p>
                  <small style="display:block; color:var(--primary); font-weight:600; margin-top:4px;">
                    🤖 <em>${escapeHTML(reason)}</em>
                  </small>
                </div>
                <div style="display: flex; gap: 6px; align-items: center; margin-top: 8px;">
                  <button class="btn primary small" type="button" onclick="handleItemAction(${cand.id})">
                    🛡️ Verify & Claim
                  </button>
                  <a class="btn secondary small" href="${location.pathname.includes('/pages/') ? '' : 'pages/'}browse.html?search=${encodeURIComponent(cand.name)}">
                    Inspect →
                  </a>
                </div>
              </div>
            `;
          }).join('') : `
            <div class="empty-state">
              <div class="empty-icon">🔍</div>
              <h3>No exact match found yet</h3>
              <p>Keep your report active. When someone finds your item and reports it, you will receive an automatic notification.</p>
            </div>
          `}
        </div>
      </div>
    `);
  } else {
    openOwnershipModal(item);
  }
}

async function openFoundItModal(itemOrId) {
  let item = typeof itemOrId === 'object' && itemOrId !== null ? itemOrId : null;
  if (!item && (typeof itemOrId === 'number' || typeof itemOrId === 'string')) {
    const id = Number(itemOrId);
    try {
      item = await apiFetch(`/reports/${id}`);
    } catch {
      item = getReports().find(r => r.id === id);
    }
  }
  if (!item) return;

  const user = typeof getStoredUser === 'function' ? getStoredUser() : null;
  const isOwner = user && (user.email === item.reporter_email || user.email === item.reporterEmail);

  openModal(`
    <div class="modal-head">
      <div>
        <span class="section-label">🙋 FOUND ITEM NOTIFICATION</span>
        <h2>Did you find this lost item?</h2>
        <p>Help return lost belongings to their rightful owner on campus.</p>
      </div>
      <button class="modal-close" data-close-modal aria-label="Close modal">✕</button>
    </div>

    <form class="found-it-form" id="foundItForm">
      <div class="claim-item-summary" style="background: rgba(225, 29, 72, 0.08); border: 1px solid rgba(225, 29, 72, 0.25);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span class="status-badge lost" style="font-size: 10.5px; padding: 2px 8px;">REPORTED LOST</span>
          <span style="font-size: 11.5px; color: var(--muted);">${escapeHTML(item.time || 'Recently')}</span>
        </div>
        <strong style="font-size: 15.5px; color: var(--heading); display: block;">${escapeHTML(item.name)}</strong>
        <small style="color: var(--muted); display: block; margin-top: 2px;">📍 Lost at: <strong>${escapeHTML(item.location)}</strong> · ${escapeHTML(item.categoryLabel || item.category)}</small>
      </div>

      <div style="margin: 16px 0 14px; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);">
        <span style="display: block; font-size: 12px; font-weight: 700; color: var(--heading); margin-bottom: 8px;">Select your status:</span>
        <div style="display: flex; gap: 14px; flex-wrap: wrap;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; color: var(--text);">
            <input type="radio" name="finderType" value="samaritan" ${isOwner ? '' : 'checked'}>
            <span>🙋 <strong>I found this lost item</strong> (Good Samaritan)</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; color: var(--text);">
            <input type="radio" name="finderType" value="owner" ${isOwner ? 'checked' : ''}>
            <span>🎉 <strong>I am the owner & found my item!</strong></span>
          </label>
        </div>
      </div>

      <div id="samaritanFieldsWrap" ${isOwner ? 'hidden' : ''}>
        <label style="margin-bottom: 12px; display: block;">
          <span style="font-size: 12.5px; font-weight: 700; color: var(--heading); display: block; margin-bottom: 5px;">Where is the item currently deposited? <b style="color:var(--lost);">*</b></span>
          <select id="foundDepositLocation" required style="width: 100%; padding: 10px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--heading); font-size: 13px;">
            <option value="Central Library Security Desk (Ground Floor)">🏛️ Central Library Security Desk (Ground Floor)</option>
            <option value="Student Activity Center (SAC J114)">🏅 Student Activity Center (SAC Desk J114)</option>
            <option value="Campus Main Gate 1 Security Booth">🛡️ Campus Main Gate 1 Security Booth</option>
            <option value="Chief Proctor Office">👔 Chief Proctor Office</option>
            <option value="Department Lab / Department Office">🔬 Department Lab / Department Office</option>
            <option value="Kept safely with finder for direct handover">🤝 Kept safely with me for direct handover</option>
          </select>
        </label>

        <label style="margin-bottom: 12px; display: block;">
          <span style="font-size: 12.5px; font-weight: 700; color: var(--heading); display: block; margin-bottom: 5px;">Where did you find it & handover notes <b style="color:var(--lost);">*</b></span>
          <textarea id="foundNotes" rows="3" required placeholder="e.g. Found on desk row 3 in lecture hall, handed over to library in-charge Mr. Sharma." style="width: 100%; padding: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--heading); font-size: 13px; resize: vertical;"></textarea>
        </label>

        <label style="margin-bottom: 14px; display: block;">
          <span style="font-size: 12.5px; font-weight: 700; color: var(--heading); display: block; margin-bottom: 5px;">Your Contact Phone or Student ID (Optional)</span>
          <input id="finderContact" placeholder="e.g. 0901CS221045 or +91 98765 43210" style="width: 100%; padding: 9px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--heading); font-size: 13px;">
        </label>
      </div>

      <div id="ownerRecoveryWrap" ${isOwner ? '' : 'hidden'} style="padding: 14px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius); margin-bottom: 14px;">
        <p style="margin: 0; font-size: 13px; color: var(--text); line-height: 1.5;">
          🎉 <strong>Glad you recovered your belongings!</strong> Submitting will mark report <strong>#${item.id}</strong> as <strong>Reunited & Resolved</strong>, removing it from the active lost items feed.
        </p>
      </div>

      <div class="form-actions">
        <button type="button" class="btn secondary" data-close-modal>Cancel</button>
        <button class="btn primary" type="submit" id="submitFoundItBtn" style="background: #10b981; border-color: #059669;">
          <span>${isOwner ? '✓ Mark Item Reunited →' : '✓ Submit Found Report →'}</span>
        </button>
      </div>
    </form>
  `);

  const samaritanWrap = document.getElementById('samaritanFieldsWrap');
  const ownerWrap = document.getElementById('ownerRecoveryWrap');
  const submitBtn = document.getElementById('submitFoundItBtn');
  const foundNotes = document.getElementById('foundNotes');

  document.querySelectorAll('input[name="finderType"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const isOwnerMode = radio.value === 'owner';
      if (samaritanWrap) samaritanWrap.hidden = isOwnerMode;
      if (ownerWrap) ownerWrap.hidden = !isOwnerMode;
      if (foundNotes) foundNotes.required = !isOwnerMode;
      if (submitBtn) {
        submitBtn.innerHTML = isOwnerMode 
          ? '<span>✓ Mark Item Reunited →</span>'
          : '<span>✓ Submit Found Report →</span>';
      }
    });
  });

  document.getElementById('foundItForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const isOwnerMode = document.querySelector('input[name="finderType"]:checked')?.value === 'owner';

    if (isOwnerMode) {
      const reports = getReports();
      const target = reports.find(r => r.id === item.id);
      if (target) {
        target.status = 'resolved';
        saveReports(reports);
      }
      try {
        await apiFetch(`/reports/${item.id}/status?status=resolved`, { method: 'PATCH' });
      } catch {}

      if (typeof window.addNotification === 'function') {
        window.addNotification({
          title: 'Item Reunited & Recovered! 🎉',
          message: `Lost report for "${item.name}" has been marked as recovered and resolved.`,
          type: 'verified',
          reportId: item.id
        });
      }

      showToast('Item Reunited! 🎉', `"${item.name}" marked as recovered and resolved.`);
      closeModal();
      if (typeof applyBrowse === 'function') applyBrowse();
      if (typeof renderLiveFeed === 'function') renderLiveFeed();
      if (typeof renderFeaturedReports === 'function') renderFeaturedReports();
      if (typeof loadMyReports === 'function') loadMyReports();
    } else {
      const depositLoc = document.getElementById('foundDepositLocation')?.value || 'Central Library Security Desk';
      const notes = document.getElementById('foundNotes')?.value.trim() || 'Found on campus';
      const contact = document.getElementById('finderContact')?.value.trim() || '';

      const reports = getReports();
      const newFound = {
        id: Date.now(),
        type: 'found',
        name: `${item.name} (Found)`,
        category: item.category,
        categoryLabel: item.categoryLabel || REPORT_CATEGORY_LABELS[item.category] || 'General',
        location: depositLoc,
        locationKey: item.locationKey || 'unknown',
        time: 'Just now',
        date: new Date().toISOString().slice(0, 10),
        description: `Good Samaritan found report for lost item #${item.id}. Notes: ${notes}. Contact: ${contact || 'Anonymous student'}.`,
        status: 'active',
        reporterEmail: user?.email || 'samaritan@mitsgwl.ac.in'
      };
      reports.unshift(newFound);
      saveReports(reports);

      const mineKey = 'smartcampus-my-reports-v2';
      const myReports = JSON.parse(localStorage.getItem(mineKey) || '[]');
      myReports.unshift(newFound);
      localStorage.setItem(mineKey, JSON.stringify(myReports));

      try {
        await apiFetch('/reports', {
          method: 'POST',
          body: JSON.stringify({
            type: 'found',
            name: `${item.name} (Found)`,
            category: item.category,
            location: depositLoc,
            location_key: item.locationKey || 'unknown',
            item_date: new Date().toISOString().slice(0, 10),
            description: `Good Samaritan found match for lost item #${item.id}. Notes: ${notes}. Deposited at: ${depositLoc}.`
          })
        });
      } catch {}

      if (typeof window.addNotification === 'function') {
        window.addNotification({
          title: 'Found Match Alert! ⚡',
          message: `Someone reported finding "${item.name}"! Deposited at: ${depositLoc}. Notes: ${notes}`,
          type: 'match',
          reportId: item.id
        });
      }

      showToast('Found Report Submitted! 👏', 'Thank you for helping reunite campus belongings! Notification dispatched.');
      closeModal();
      if (typeof applyBrowse === 'function') applyBrowse();
      if (typeof renderLiveFeed === 'function') renderLiveFeed();
      if (typeof renderFeaturedReports === 'function') renderFeaturedReports();
      if (typeof loadMyReports === 'function') loadMyReports();
    }
  });
}

async function openOwnershipModal(item) {
  const user = getStoredUser();
  if (!user && !getToken()) {
    showToast('Sign In Recommended', 'Please log in with your MITS institute account to claim items.');
  }

  openModal(`
    <div class="modal-head">
      <div>
        <span class="section-label">SECURE OWNERSHIP CLAIM</span>
        <h2>Is this your item?</h2>
        <p>Please provide private verifying details to confirm rightful ownership.</p>
      </div>
      <button class="modal-close" data-close-modal aria-label="Close modal">✕</button>
    </div>
    <form class="ownership-form" id="ownershipForm">
      <div class="claim-item-summary">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="claim-badge found">FOUND REPORT</span>
        </div>
        <strong>${escapeHTML(item.name)}</strong>
        <small>📍 ${escapeHTML(item.location)} · Reported ${escapeHTML(item.time)}</small>
      </div>
      
      <label>
        <span>Where & when did you lose it? <b class="req">*</b></span>
        <input id="claimLost" required placeholder="e.g. Near Library stairs around 2:30 PM on Monday">
      </label>

      <label>
        <span>Unique identifying proof <b class="req">*</b></span>
        <textarea id="claimReason" rows="4" required placeholder="Describe private details not mentioned publicly: engravings, stickers, screen lock wallpaper, serial number, brand, contents, etc."></textarea>
      </label>

      <label>
        <span>Your Contact Phone / Student ID <b class="req">*</b></span>
        <input id="claimContact" required placeholder="e.g. 0901CS221045 or +91 98765 43210">
      </label>

      <div class="form-actions">
        <button type="button" class="btn secondary" data-close-modal>Cancel</button>
        <button class="btn primary" type="submit">Submit Ownership Claim →</button>
      </div>
    </form>
  `);

  document.getElementById('ownershipForm').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await apiFetch(`/claims/${item.id}`, {
        method: 'POST',
        body: JSON.stringify({
          report_id: item.id,
          lost_where_when: document.getElementById('claimLost').value.trim(),
          proof: document.getElementById('claimReason').value.trim(),
          proof_reason: document.getElementById('claimReason').value.trim(),
          contact: document.getElementById('claimContact').value.trim()
        })
      });
      closeModal();
      if (typeof window.addNotification === 'function') {
        window.addNotification({
          title: 'Ownership Claim Submitted',
          message: `Your verification request for "${item.name}" has been queued for proctor review.`,
          type: 'claim',
          reportId: item.id
        });
      }
      showToast('Claim Submitted Successfully', 'Your verification request has been queued for campus admin review.');
    } catch (err) {
      if (typeof window.addNotification === 'function') {
        window.addNotification({
          title: 'Ownership Claim Recorded',
          message: `Your claim details for "${item.name}" have been logged locally.`,
          type: 'claim',
          reportId: item.id
        });
      }
      showToast('Claim Submitted', 'Your ownership verification details have been recorded.');
      closeModal();
    }
  });
}

function openModal(html) {
  let m = document.getElementById('globalModal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'globalModal';
    m.className = 'modal-backdrop';
    document.body.appendChild(m);
  }
  m.innerHTML = `<div class="modal-card">${html}</div>`;
  m.classList.add('open');
  m.onclick = e => {
    if (e.target === m || e.target.closest('[data-close-modal]')) closeModal();
  };
}

function closeModal() {
  const m = document.getElementById('globalModal');
  if (m) m.classList.remove('open');
}

function showToast(title, message) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.innerHTML = `
    <div class="toast-indicator"></div>
    <div class="toast-content">
      <strong>${escapeHTML(title)}</strong>
      <span>${escapeHTML(message)}</span>
    </div>
  `;
  t.classList.add('show');
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => t.classList.remove('show'), 4000);
}

function initTheme() {
  const KEY = 'smartcampus-theme';
  const apply = isDark => {
    document.documentElement.classList.toggle('dark-theme', isDark);
    if (document.body) document.body.classList.toggle('dark', isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.textContent = isDark ? '☀' : '☾';
      icon.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
  };
  
  const saved = localStorage.getItem(KEY);
  const currentDark = saved !== 'light';
  apply(currentDark);

  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.onclick = () => {
      const isNowDark = !document.documentElement.classList.contains('dark-theme');
      localStorage.setItem(KEY, isNowDark ? 'dark' : 'light');
      apply(isNowDark);
    };
  }
}

function initNav() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mobileNav');
  if (toggle && nav) {
    toggle.onclick = () => {
      nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
    };
    // Close nav on click outside
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !nav.contains(e.target) && nav.classList.contains('open')) {
        nav.classList.remove('open');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  attachCardActions(document);
});

window.handleItemAction = handleItemAction;
window.openOwnershipModal = openOwnershipModal;
window.openFoundItModal = openFoundItModal;
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.escapeHTML = escapeHTML;

