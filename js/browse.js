/**
 * SmartCampus Browse Page Controller
 * Supports URL param pre-filtering, dynamic search, category, location, and status filters
 * with interactive active filter chips and instant reset.
 */
let newestFirst = true;
let selectedStatus = 'all';

function renderActiveFilterChips(q, cat, loc, status) {
  const container = document.getElementById('activeFilterTags');
  if (!container) return;

  const chips = [];

  if (q) {
    chips.push({
      label: `Search: "${escapeHTML(q)}"`,
      onRemove: () => {
        const inp = document.getElementById('searchInput');
        if (inp) inp.value = '';
        applyBrowse();
      }
    });
  }

  if (status !== 'all') {
    chips.push({
      label: `Type: ${status.toUpperCase()}`,
      onRemove: () => {
        selectedStatus = 'all';
        document.querySelectorAll('.status-option').forEach(b => b.classList.toggle('active', b.dataset.status === 'all'));
        applyBrowse();
      }
    });
  }

  if (cat !== 'all') {
    const catLabel = REPORT_CATEGORY_LABELS?.[cat] || cat;
    chips.push({
      label: `Category: ${catLabel}`,
      onRemove: () => {
        const cSel = document.getElementById('categoryFilter');
        if (cSel) cSel.value = 'all';
        applyBrowse();
      }
    });
  }

  if (loc !== 'all') {
    const locInput = document.getElementById('locationFilter');
    const locName = locInput?.dataset?.locationName || loc;
    chips.push({
      label: `Room: ${locName}`,
      onRemove: () => {
        if (locInput) {
          locInput.value = 'all';
          locInput.dataset.locationName = '';
        }
        const pickerClear = document.getElementById('browseLocationPickerContainer_clear');
        if (pickerClear) pickerClear.click();
        applyBrowse();
      }
    });
  }

  if (!chips.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); align-self: center;">Active:</span>
    ${chips.map((c, i) => `
      <span class="active-filter-chip">
        ${c.label}
        <span class="chip-remove" data-remove-chip="${i}" title="Remove filter">✕</span>
      </span>
    `).join('')}
    <button type="button" class="clear-all-chips-btn" id="clearAllChipsBtn">Clear all ✕</button>
  `;

  chips.forEach((c, i) => {
    container.querySelector(`[data-remove-chip="${i}"]`)?.addEventListener('click', c.onRemove);
  });

  container.querySelector('#clearAllChipsBtn')?.addEventListener('click', () => {
    document.getElementById('clearFilters')?.click();
  });
}

async function applyBrowse() {
  const searchInput = document.getElementById('searchInput');
  const catSelect = document.getElementById('categoryFilter');
  const locSelect = document.getElementById('locationFilter');

  const q = (searchInput?.value || '').toLowerCase().trim();
  const cat = catSelect?.value || 'all';
  const loc = locSelect?.value || 'all';

  renderActiveFilterChips(q, cat, loc, selectedStatus);

  let reports = [];
  try {
    reports = await apiFetch(`/reports?search=${encodeURIComponent(q)}&status=${encodeURIComponent(selectedStatus)}&category=${encodeURIComponent(cat)}&location_key=${encodeURIComponent(loc)}`);
  } catch {
    reports = getReports().filter(r => {
      const matchStatus = selectedStatus === 'all' || r.type === selectedStatus;
      const matchCat = cat === 'all' || r.category === cat;
      const rKey = (r.locationKey || '').toLowerCase();
      const rLoc = (r.location || '').toLowerCase();
      const selectedName = (locSelect?.dataset?.locationName || '').toLowerCase();
      const matchLoc = loc === 'all' || 
        rKey === loc || 
        rLoc.includes(loc) ||
        (selectedName && rLoc.includes(selectedName));
      const matchSearch = !q || `${r.name} ${r.description} ${r.location} ${r.categoryLabel}`.toLowerCase().includes(q);
      return matchStatus && matchCat && matchLoc && matchSearch;
    });
  }

  if (!newestFirst) reports.reverse();

  const grid = document.getElementById('itemsGrid');
  const empty = document.getElementById('emptyState');
  const countEl = document.getElementById('resultCount');

  if (grid) {
    grid.innerHTML = reports.map(reportCard).join('');
    if (typeof attachCardActions === 'function') attachCardActions(grid);
  }

  if (empty) empty.hidden = reports.length > 0;
  if (countEl) countEl.textContent = `${reports.length} report${reports.length === 1 ? '' : 's'}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const qParam = params.get('search');
  const catParam = params.get('category');
  const statusParam = params.get('status');
  const locParam = params.get('location') || params.get('location_key');

  if (qParam && document.getElementById('searchInput')) {
    document.getElementById('searchInput').value = qParam;
  }
  if (catParam && document.getElementById('categoryFilter')) {
    document.getElementById('categoryFilter').value = catParam;
  }
  if (locParam && document.getElementById('locationFilter')) {
    document.getElementById('locationFilter').value = locParam;
  }
  if (statusParam) {
    selectedStatus = statusParam;
    document.querySelectorAll('.status-option').forEach(b => {
      b.classList.toggle('active', b.dataset.status === statusParam);
    });
  }

  // Initialize searchable campus location filter
  if (typeof initCampusLocationPicker === 'function' && document.getElementById('browseLocationPickerContainer')) {
    initCampusLocationPicker({
      containerId: 'browseLocationPickerContainer',
      hiddenInputId: 'locationFilter',
      initialKey: locParam || '',
      placeholder: 'Filter classroom or room (e.g. J115, SH-12, M005)...',
      onSelect: (selectedLoc) => {
        const locInput = document.getElementById('locationFilter');
        if (locInput) {
          locInput.value = selectedLoc ? (selectedLoc.id || selectedLoc.name) : 'all';
          locInput.dataset.locationName = selectedLoc ? selectedLoc.name : '';
        }
        applyBrowse();
      }
    });
  }

  // Debounced input search
  let debounceTimeout = null;
  document.getElementById('searchInput')?.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(applyBrowse, 150);
  });

  document.getElementById('categoryFilter')?.addEventListener('change', applyBrowse);
  document.getElementById('locationFilter')?.addEventListener('change', applyBrowse);

  document.querySelectorAll('.status-option').forEach(button => {
    button.addEventListener('click', () => {
      selectedStatus = button.dataset.status || 'all';
      document.querySelectorAll('.status-option').forEach(b => b.classList.toggle('active', b === button));
      applyBrowse();
    });
  });

  document.getElementById('clearFilters')?.addEventListener('click', () => {
    if (document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
    if (document.getElementById('categoryFilter')) document.getElementById('categoryFilter').value = 'all';
    if (document.getElementById('locationFilter')) {
      document.getElementById('locationFilter').value = 'all';
      document.getElementById('locationFilter').dataset.locationName = '';
    }
    const pickerClear = document.getElementById('browseLocationPickerContainer_clear');
    if (pickerClear) pickerClear.click();
    selectedStatus = 'all';
    document.querySelectorAll('.status-option').forEach(b => b.classList.toggle('active', b.dataset.status === 'all'));
    applyBrowse();
  });

  document.getElementById('sortButton')?.addEventListener('click', () => {
    newestFirst = !newestFirst;
    const btn = document.getElementById('sortButton');
    if (btn) btn.textContent = newestFirst ? 'Newest first ↕' : 'Oldest first ↕';
    applyBrowse();
  });

  applyBrowse();
});
