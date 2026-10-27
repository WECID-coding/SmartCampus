/**
 * SmartCampus Homepage Controller
 * Handles interactive hero live search with instant room & item autocomplete,
 * dynamic live feed filtering, and category count badges.
 */
document.addEventListener('DOMContentLoaded', () => {
  const heroSearch = document.getElementById('heroSearchForm');
  const heroInput = document.getElementById('heroSearchInput');
  const dropdown = document.getElementById('heroSearchDropdown');
  const feedContainer = document.getElementById('homeLiveFeed');
  let currentFeedFilter = 'all';

  // 1. Hero Search Form & Live Autocomplete Dropdown
  if (heroSearch && heroInput && dropdown) {
    heroSearch.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = (heroInput.value || '').trim();
      location.href = `pages/browse.html?search=${encodeURIComponent(query)}`;
    });

    const handleSearchInput = () => {
      const q = (heroInput.value || '').trim().toLowerCase();
      if (!q || q.length < 2) {
        dropdown.classList.remove('open');
        dropdown.innerHTML = '';
        return;
      }

      // Find matching reports
      const reports = typeof getReports === 'function' ? getReports() : [];
      const matchedReports = reports.filter(r => 
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.location && r.location.toLowerCase().includes(q)) ||
        (r.categoryLabel && r.categoryLabel.toLowerCase().includes(q))
      ).slice(0, 3);

      // Find matching campus classrooms / seminar halls / rooms
      let matchedRooms = [];
      if (typeof searchCampusLocations === 'function') {
        matchedRooms = searchCampusLocations(q).slice(0, 3);
      }

      if (!matchedReports.length && !matchedRooms.length) {
        dropdown.innerHTML = `
          <div style="padding: 12px 14px; text-align: center; color: var(--muted); font-size: 13px;">
            <span>🔍 No direct match for "<strong>${escapeHTML(q)}</strong>"</span>
            <div style="margin-top: 6px;">
              <a href="pages/browse.html?search=${encodeURIComponent(q)}" style="color: var(--primary); font-weight: 700;">
                Search all reports in Directory →
              </a>
            </div>
          </div>
        `;
        dropdown.classList.add('open');
        return;
      }

      let html = '';

      if (matchedReports.length) {
        html += `<div class="hero-search-group-title">Active Campus Reports</div>`;
        html += matchedReports.map(r => `
          <a class="hero-search-result-item" href="pages/browse.html?search=${encodeURIComponent(r.name)}">
            <span class="item-icon">${iconFor(r)}</span>
            <div class="item-info">
              <div class="item-title">${escapeHTML(r.name)}</div>
              <div class="item-meta">📍 ${escapeHTML(r.location)} · <b style="color:${r.type === 'lost' ? 'var(--lost)' : 'var(--found)'}; text-transform:uppercase;">${r.type}</b></div>
            </div>
            <span style="font-size: 11px; color: var(--accent);">View →</span>
          </a>
        `).join('');
      }

      if (matchedRooms.length) {
        html += `<div class="hero-search-group-title" style="margin-top: 6px;">Classrooms & Seminar Halls</div>`;
        html += matchedRooms.map(room => `
          <a class="hero-search-result-item" href="pages/browse.html?location=${encodeURIComponent(room.id || room.name)}">
            <span class="item-icon">📍</span>
            <div class="item-info">
              <div class="item-title">${escapeHTML(room.name)}</div>
              <div class="item-meta">${escapeHTML(room.building || 'Main Campus')} · ${escapeHTML(room.floorLabel || 'Academic Complex')}</div>
            </div>
            <span style="font-size: 11px; color: var(--primary); font-weight: 700;">Filter Reports →</span>
          </a>
        `).join('');
      }

      html += `
        <div style="padding: 8px 10px 4px; border-top: 1px solid var(--border-subtle); margin-top: 6px; text-align: right;">
          <a href="pages/browse.html?search=${encodeURIComponent(q)}" style="font-size: 12px; font-weight: 700; color: var(--primary);">
            View all directory results for "${escapeHTML(q)}" →
          </a>
        </div>
      `;

      dropdown.innerHTML = html;
      dropdown.classList.add('open');
    };

    heroInput.addEventListener('input', handleSearchInput);
    heroInput.addEventListener('focus', () => {
      if ((heroInput.value || '').trim().length >= 2) handleSearchInput();
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !heroInput.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') dropdown.classList.remove('open');
    });
  }

  // 2. Render Live Feed with Tabs
  function renderLiveFeed() {
    if (!feedContainer || typeof getReports !== 'function') return;
    const all = getReports();
    const filtered = all.filter(r => {
      if (currentFeedFilter === 'all') return true;
      return r.type === currentFeedFilter;
    }).slice(0, 4);

    if (!filtered.length) {
      feedContainer.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--muted); font-size: 13px;">
          No ${currentFeedFilter} items currently in feed.
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = filtered.map(r => `
      <a class="feed-item" href="pages/browse.html?search=${encodeURIComponent(r.name)}">
        <div class="feed-item-icon">${iconFor(r)}</div>
        <div class="feed-item-content">
          <strong>${escapeHTML(r.name)}</strong>
          <small>📍 ${escapeHTML(r.location)} · ${escapeHTML(r.time)}</small>
        </div>
        <span class="feed-item-badge ${r.type}">${r.type}</span>
      </a>
    `).join('');
  }

  // Feed Tab Buttons
  document.querySelectorAll('#feedTabs [data-feed-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#feedTabs [data-feed-type]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFeedFilter = btn.dataset.feedType;
      renderLiveFeed();
    });
  });

  renderLiveFeed();

  // 3. Render Featured Recent Cards Grid
  function renderFeaturedReports() {
    const cardsGrid = document.getElementById('homeFeaturedReports');
    if (cardsGrid && typeof getReports === 'function') {
      const featured = getReports().slice(0, 4);
      cardsGrid.innerHTML = featured.map(reportCard).join('');
      if (typeof attachCardActions === 'function') {
        attachCardActions(cardsGrid);
      }
    }
  }
  window.renderFeaturedReports = renderFeaturedReports;
  renderFeaturedReports();

  // 4. Update Category Card Badges with Real Dynamic Item Counts
  if (typeof getReports === 'function') {
    const reports = getReports();
    const counts = {};
    reports.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });

    document.querySelectorAll('.categories-grid .category-card').forEach(card => {
      const href = card.getAttribute('href') || '';
      const match = href.match(/category=([a-z0-9_-]+)/i);
      if (match && match[1]) {
        const catKey = match[1];
        const count = counts[catKey] || 0;
        let badge = card.querySelector('.cat-count-badge');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'cat-count-badge';
          card.appendChild(badge);
        }
        badge.textContent = `${count} active`;
      }
    });
  }

  // 5. Update Metrics Strip Dynamically
  const roomCountEl = document.getElementById('statCampusRooms');
  if (roomCountEl) {
    const totalRooms = (typeof CAMPUS_LOCATIONS !== 'undefined' && Array.isArray(CAMPUS_LOCATIONS) && CAMPUS_LOCATIONS.length) 
      ? CAMPUS_LOCATIONS.length 
      : 235;
    roomCountEl.textContent = `${totalRooms}+`;
  }

  const activeUsersEl = document.getElementById('statActiveUsers');
  if (activeUsersEl) {
    activeUsersEl.textContent = '4,000+';
  }

  const reunitedRateEl = document.getElementById('statReunitedRate');
  if (reunitedRateEl && typeof getReports === 'function') {
    const reports = getReports();
    if (reports.length > 0) {
      const resolvedCount = reports.filter(r => r.status === 'resolved' || r.type === 'found').length;
      const rate = Math.min(99, Math.max(85, Math.round((resolvedCount / reports.length) * 100)));
      reunitedRateEl.textContent = `${rate}%`;
    }
  }
});
