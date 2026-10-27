/**
 * SmartCampus My Reports Dashboard Controller
 * Handles report management, status transitions (Reunited / Resolved),
 * deletion, and real-time metric counters.
 */
let currentMyFilter = 'all';

function getMyReportsList() {
  let mine = [];
  try {
    const raw = localStorage.getItem('smartcampus-my-reports-v2');
    if (raw) mine = JSON.parse(raw);
  } catch {}

  // If empty on initial demo, initialize with 2 sample user reports
  if (!Array.isArray(mine) || !mine.length) {
    if (typeof getReports === 'function') {
      const all = getReports();
      mine = all.slice(0, 3).map((r, i) => ({
        ...r,
        status: i === 2 ? 'resolved' : 'active'
      }));
      localStorage.setItem('smartcampus-my-reports-v2', JSON.stringify(mine));
    }
  }
  return mine;
}

function saveMyReportsList(list) {
  localStorage.setItem('smartcampus-my-reports-v2', JSON.stringify(list));
}

function renderMyReportCard(item) {
  const isResolved = item.status === 'resolved';
  const isLost = item.type === 'lost';
  const badgeClass = isResolved ? 'verified' : item.type;
  const badgeLabel = isResolved ? 'REUNITED / RESOLVED' : (isLost ? 'LOST ITEM' : 'FOUND ITEM');

  return `
    <article class="item-card ${isResolved ? 'resolved' : item.type}" data-id="${item.id}">
      <div class="item-visual-wrap">
        ${typeof renderItemVisual === 'function' ? renderItemVisual(item) : `<div class="item-category-icon">${iconFor(item)}</div>`}
        <span class="status-badge ${badgeClass}">
          <span class="pulse-dot"></span>
          ${badgeLabel}
        </span>
      </div>
      <div class="item-body">
        <div class="item-topline">
          <span class="category-chip">${escapeHTML(item.categoryLabel || item.category)}</span>
          <span class="time-chip">⏱ ${escapeHTML(item.time || 'Recently')}</span>
        </div>
        <h3 class="item-title">${escapeHTML(item.name)}</h3>
        <p class="item-description">${escapeHTML(item.description)}</p>
        
        <div class="item-footer" style="flex-direction: column; align-items: stretch; gap: 12px;">
          <div class="location-chip" title="${escapeHTML(item.location)}">
            <svg class="chip-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            <span>${escapeHTML(item.location)}</span>
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: flex-end; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
            <div style="display: flex; gap: 8px; margin-left: auto;">
              ${!isResolved ? `
                <button type="button" class="btn primary small" data-mark-resolved="${item.id}" title="Mark as successfully reunited with owner">
                  ✓ Mark Reunited
                </button>
              ` : `
                <span style="font-size: 11.5px; font-weight: 800; color: #8b5cf6; padding: 4px 8px; background: rgba(139, 92, 246, 0.1); border-radius: 999px;">
                  ✓ Completed
                </span>
              `}
              <button type="button" class="btn secondary small" data-delete-report="${item.id}" style="color: var(--lost); border-color: rgba(244, 63, 94, 0.3);" title="Delete report">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}


let myFiledClaims = [];

function renderMyClaimCard(claim) {
  const status = (claim.status || 'pending').toLowerCase();
  let badgeClass = 'lost';
  let badgeLabel = 'UNDER REVIEW';
  let bannerBorder = 'var(--accent)';
  let bannerText = 'Verification is currently under review by campus administration & proctors.';

  if (status === 'approved') {
    badgeClass = 'verified';
    badgeLabel = 'VERIFIED & APPROVED ✓';
    bannerBorder = 'var(--found)';
    bannerText = '✓ Handover authorized! Please present your institute ID card at the designated security desk to collect this item.';
  } else if (status === 'rejected') {
    badgeClass = 'lost';
    badgeLabel = 'CLAIM REJECTED ✗';
    bannerBorder = 'var(--lost)';
    bannerText = 'The ownership details provided could not be verified by proctors.';
  }

  const rawImg = claim.item_image_url;
  const fullImg = (typeof formatImageUrl === 'function') ? formatImageUrl(rawImg) : rawImg;
  const visual = fullImg
    ? `<img src="${escapeHTML(fullImg)}" alt="${escapeHTML(claim.item_name || 'Item')}" class="item-cover-img" onerror="this.onerror=null;this.parentElement.firstElementChild.outerHTML='<div class=\'item-category-icon\'>🛡️</div>';">`
    : `<div class="item-category-icon">🛡️</div>`;

  return `
    <article class="item-card ${badgeClass}" data-claim-id="${claim.id}">
      <div class="item-visual-wrap">
        ${visual}
        <span class="status-badge ${badgeClass}">
          <span class="pulse-dot"></span>
          ${badgeLabel}
        </span>
      </div>
      <div class="item-body">
        <div class="item-topline">
          <span class="category-chip">Verification Claim #${claim.id} · Item #${claim.report_id}</span>
          <span class="time-chip">⏱ ${escapeHTML(claim.created_at || 'Recently')}</span>
        </div>
        <h3 class="item-title">${escapeHTML(claim.item_name || 'Campus Item')}</h3>
        <p class="item-description"><strong>Loss Context:</strong> ${escapeHTML(claim.lost_where_when || 'Not specified')}</p>
        <p class="item-description"><strong>Ownership Proof:</strong> ${escapeHTML(claim.proof || 'Identity & distinctive markers provided.')}</p>
        
        <div style="margin-top: 10px; padding: 10px 14px; background: var(--surface-hover); border-radius: var(--radius); border-left: 3px solid ${bannerBorder}; font-size: 13px;">
          <strong>Proctor Status:</strong> ${bannerText}
        </div>

        <div class="item-footer" style="margin-top: 12px;">
          <div class="location-chip" title="${escapeHTML(claim.item_location || 'Campus')}">
            <svg class="chip-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            <span>${escapeHTML(claim.item_location || 'Designated Collection Desk')}</span>
          </div>
          <div style="font-size: 12px; color: var(--muted); margin-left: auto;">
            Claimant: ${escapeHTML(claim.contact || 'Registered Account')}
          </div>
        </div>
      </div>
    </article>
  `;
}

async function loadMyReports() {
  const grid = document.getElementById('myReportsGrid');
  const empty = document.getElementById('myReportsEmpty');
  const totalCountEl = document.getElementById('myTotalReports');
  const lostCountEl = document.getElementById('myLostCount');
  const foundCountEl = document.getElementById('myFoundCount');
  const resolvedCountEl = document.getElementById('myResolvedCount');
  const claimsCountEl = document.getElementById('myClaimsCount');

  let mine = getMyReportsList();

  try {
    if (typeof apiFetch === 'function') {
      const claimsRes = await apiFetch('/claims/mine');
      if (Array.isArray(claimsRes)) {
        myFiledClaims = claimsRes;
      }
    }
  } catch {}

  try {
    if (typeof apiFetch === 'function') {
      const remote = await apiFetch('/reports/mine');
      if (Array.isArray(remote) && remote.length) {
        const localMap = new Map(mine.map(r => [r.id, r]));
        remote.forEach(r => {
          localMap.set(r.id, { ...r, categoryLabel: r.categoryLabel || r.category_label || r.category });
        });
        mine = Array.from(localMap.values());
        saveMyReportsList(mine);
      }
    }
  } catch {}

  // Calculate stats
  const lostCount = mine.filter(r => r.type === 'lost' && r.status !== 'resolved').length;
  const foundCount = mine.filter(r => r.type === 'found' && r.status !== 'resolved').length;
  const resolvedCount = mine.filter(r => r.status === 'resolved').length;

  if (totalCountEl) totalCountEl.textContent = mine.length;
  if (lostCountEl) lostCountEl.textContent = lostCount;
  if (foundCountEl) foundCountEl.textContent = foundCount;
  if (resolvedCountEl) resolvedCountEl.textContent = resolvedCount;
  if (claimsCountEl) claimsCountEl.textContent = myFiledClaims.length;

  // Filter items
  if (currentMyFilter === 'claims') {
    if (!myFiledClaims.length) {
      if (grid) grid.innerHTML = '';
      if (empty) {
        empty.hidden = false;
        empty.innerHTML = `
          <div class="empty-icon">🛡️</div>
          <h3>No Ownership Claims Filed</h3>
          <p>When you submit a verification claim for a found item on campus, its status and proctor approvals will appear here.</p>
          <a class="btn primary" href="browse.html">Browse Found Articles →</a>
        `;
      }
      return;
    }
    if (empty) empty.hidden = true;
    if (grid) {
      grid.innerHTML = myFiledClaims.map(renderMyClaimCard).join('');
    }
    return;
  }

  const filtered = mine.filter(r => {
    if (currentMyFilter === 'all') return true;
    if (currentMyFilter === 'resolved') return r.status === 'resolved';
    if (currentMyFilter === 'lost') return r.type === 'lost' && r.status !== 'resolved';
    if (currentMyFilter === 'found') return r.type === 'found' && r.status !== 'resolved';
    return true;
  });

  if (!filtered.length) {
    if (grid) grid.innerHTML = '';
    if (empty) {
      empty.hidden = false;
      empty.innerHTML = `
        <div class="empty-icon">📁</div>
        <h3>No reports submitted yet</h3>
        <p>When you report a lost item or log an article you found on campus, it will appear here.</p>
        <a class="btn primary" href="report.html?mode=lost">Report a Lost Item Now →</a>
      `;
    }
    return;
  }

  if (empty) empty.hidden = true;
  if (grid) {
    grid.innerHTML = filtered.map(renderMyReportCard).join('');
    
    // Wire Mark Reunited
    grid.querySelectorAll('[data-mark-resolved]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.markResolved);
        const item = mine.find(r => r.id === id);
        if (item) {
          item.status = 'resolved';
          saveMyReportsList(mine);
          if (typeof apiFetch === 'function') {
            apiFetch(`/reports/${id}/status?status=resolved`, { method: 'PATCH' }).catch(() => {});
          }
          if (typeof window.addNotification === 'function') {
            window.addNotification({
              title: 'Item Reunited & Recovered! 🎉',
              message: `Report for "${item.name}" marked as resolved and safely reunited.`,
              type: 'verified',
              reportId: id
            });
          }
          if (typeof showToast === 'function') {
            showToast('Item Marked Reunited! 🎉', `"${item.name}" has been marked as returned to owner.`);
          }
          loadMyReports();
        }
      });
    });

    // Wire Delete
    grid.querySelectorAll('[data-delete-report]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.deleteReport);
        const idx = mine.findIndex(r => r.id === id);
        if (idx !== -1) {
          const removed = mine.splice(idx, 1)[0];
          saveMyReportsList(mine);
          if (typeof apiFetch === 'function') {
            apiFetch(`/reports/${id}`, { method: 'DELETE' }).catch(() => {});
          }
          if (typeof showToast === 'function') {
            showToast('Report Deleted', `"${removed.name}" has been removed from your list.`);
          }
          loadMyReports();
        }
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-my-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-my-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMyFilter = btn.dataset.myFilter;
      loadMyReports();
    });
  });

  loadMyReports();
});
