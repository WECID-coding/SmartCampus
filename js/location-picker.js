/**
 * SmartCampus Campus Location Autocomplete & Room Picker
 * Provides searchable combobox selection for Classrooms, Seminar Halls, and Academic Rooms.
 */

/**
 * Initialize a Searchable Campus Location Picker Component
 */
function initCampusLocationPicker({
  containerId,
  hiddenInputId = 'itemLocation',
  initialValue = '',
  initialKey = '',
  placeholder = 'Type classroom, lab, or room (e.g. J115, SH-12, M005)...',
  onSelect = null
}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const hiddenInput = document.getElementById(hiddenInputId);
  let activeIndex = -1;
  let currentMatches = [];

  container.innerHTML = `
    <div class="location-picker-wrap">
      <div class="location-search-input-group">
        <span class="search-icon">🔍</span>
        <input type="text" class="location-search-input" id="${containerId}_input" placeholder="${escapeHTML(placeholder)}" autocomplete="off">
        <button type="button" class="clear-loc-btn" id="${containerId}_clear" style="display: none;" title="Clear search">✕</button>
      </div>

      <!-- Autocomplete Dropdown Panel -->
      <div class="location-autocomplete-list" id="${containerId}_dropdown" style="display: none;"></div>

      <!-- Selected Location Pill -->
      <div class="selected-location-pill" id="${containerId}_pill" style="display: none;">
        <div class="selected-location-info">
          <span>📍</span>
          <span id="${containerId}_selectedText">No location chosen</span>
        </div>
        <div class="selected-location-actions">
          <button type="button" class="chip-btn" id="${containerId}_changeBtn" style="padding: 3px 10px;">
            Change Room
          </button>
        </div>
      </div>

      <!-- Quick Pick Popular Chips (Classrooms, Seminar Halls & Academic Rooms) -->
      <div class="quick-location-chips" id="${containerId}_chips">
        <span class="quick-chips-label">Rooms:</span>
        <button type="button" class="chip-btn" data-key="room_J115" data-name="Classroom 113A J115">🏫 Classroom J115</button>
        <button type="button" class="chip-btn" data-key="room_J118" data-name="Classroom 115 J118">🏫 Classroom J118</button>
        <button type="button" class="chip-btn" data-key="room_AI_GF_M005" data-name="M005 (AI Building GF)">🏫 Classroom M005</button>
        <button type="button" class="chip-btn" data-key="room_LT1" data-name="LT-1 (Lecture Theatre 1)">🏫 LT-1</button>
        <button type="button" class="chip-btn" data-key="room_J001" data-name="J001 – Conclave Centre">🏛️ Conclave J001</button>
        <button type="button" class="chip-btn" data-key="room_SH12" data-name="SH-12 (Main Building GF)">🏛️ SH-12</button>
        <button type="button" class="chip-btn" data-key="room_J140" data-name="Cloud Computing Lab J140">💻 Cloud Lab J140</button>
        <button type="button" class="chip-btn" data-key="room_AI_GF_M007" data-name="M007 – CIoT Lab">🤖 CIoT Lab M007</button>
        <button type="button" class="chip-btn" data-key="room_J114" data-name="Student Activity Center J114">🎯 SAC J114</button>
      </div>
    </div>
  `;

  const input = document.getElementById(`${containerId}_input`);
  const clearBtn = document.getElementById(`${containerId}_clear`);
  const dropdown = document.getElementById(`${containerId}_dropdown`);
  const pill = document.getElementById(`${containerId}_pill`);
  const selectedText = document.getElementById(`${containerId}_selectedText`);
  const changeBtn = document.getElementById(`${containerId}_changeBtn`);
  const chips = document.getElementById(`${containerId}_chips`);

  let currentSelected = null;

  function renderDropdown(matches) {
    currentMatches = matches;
    activeIndex = -1;

    if (!matches || !matches.length) {
      dropdown.innerHTML = `
        <div class="location-no-results">
          <span>No exact classroom, seminar hall, or room found for "<strong>${escapeHTML(input.value)}</strong>".</span>
          <button type="button" class="btn primary small" id="${containerId}_useCustomBtn" style="margin-top: 8px; width: 100%;">
            Use "${escapeHTML(input.value)}" as custom room
          </button>
        </div>
      `;
      dropdown.style.display = 'block';

      const customBtn = document.getElementById(`${containerId}_useCustomBtn`);
      if (customBtn) {
        customBtn.onclick = () => {
          selectLocation({
            id: 'custom_room',
            name: input.value.trim(),
            building: 'MITS Campus',
            floorLabel: 'Custom Room',
            type: 'other_room'
          });
        };
      }
      return;
    }

    dropdown.innerHTML = matches.map((m, idx) => {
      const isClass = m.type === 'classroom';
      const isSeminar = m.type === 'seminar_hall';
      const isLab = m.name && /lab|computing|microprocessor/i.test(m.name);
      const icon = isClass ? '🏫' : (isSeminar ? '🏛️' : (isLab ? '💻' : '🚪'));
      const typeTag = isClass ? 'Classroom' : (isSeminar ? 'Seminar Hall' : (isLab ? 'Lab' : 'Room / Cabin'));
      return `
        <div class="location-item-opt" data-idx="${idx}">
          <div class="location-item-opt-content">
            <span class="location-item-opt-icon">${icon}</span>
            <div class="location-item-opt-text">
              <strong>${escapeHTML(m.name)}</strong>
              <small>${escapeHTML(m.building)} · ${escapeHTML(m.floorLabel)}</small>
            </div>
          </div>
          <span class="location-item-tag">${escapeHTML(typeTag)}</span>
        </div>
      `;
    }).join('');

    dropdown.style.display = 'block';

    dropdown.querySelectorAll('.location-item-opt').forEach(el => {
      el.onmousedown = (e) => {
        e.preventDefault();
        const idx = Number(el.dataset.idx);
        if (currentMatches[idx]) {
          selectLocation(currentMatches[idx]);
        }
      };
    });
  }

  function selectLocation(loc) {
    currentSelected = loc;
    input.value = loc.name;
    clearBtn.style.display = 'grid';
    dropdown.style.display = 'none';

    if (hiddenInput) {
      hiddenInput.value = loc.id || loc.name;
      hiddenInput.dataset.locationName = loc.name;
      hiddenInput.dataset.locationKey = loc.id;
      hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    selectedText.textContent = `${loc.name} (${loc.floorLabel || 'Academic Complex'})`;
    pill.style.display = 'flex';

    if (typeof onSelect === 'function') {
      onSelect(loc);
    }
  }

  // Input event
  input.addEventListener('input', () => {
    const val = input.value.trim();
    clearBtn.style.display = val ? 'grid' : 'none';

    if (val.length === 0) {
      dropdown.style.display = 'none';
      return;
    }

    const searchFn = typeof searchCampusLocations === 'function' ? searchCampusLocations : null;
    const results = typeof searchFn === 'function' ? searchFn(val, 12) : [];
    renderDropdown(results);
  });

  input.addEventListener('focus', () => {
    const val = input.value.trim();
    const searchFn = typeof searchCampusLocations === 'function' ? searchCampusLocations : null;
    const results = typeof searchFn === 'function' ? searchFn(val || 'Main', 10) : [];
    renderDropdown(results);
  });

  input.addEventListener('blur', () => {
    setTimeout(() => {
      dropdown.style.display = 'none';
    }, 200);
  });

  // Keyboard navigation
  input.addEventListener('keydown', e => {
    if (dropdown.style.display === 'none') return;

    const items = dropdown.querySelectorAll('.location-item-opt');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      items.forEach((it, i) => it.classList.toggle('focused', i === activeIndex));
      if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      items.forEach((it, i) => it.classList.toggle('focused', i === activeIndex));
      if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && currentMatches[activeIndex]) {
        selectLocation(currentMatches[activeIndex]);
      } else if (currentMatches.length) {
        selectLocation(currentMatches[0]);
      }
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    dropdown.style.display = 'none';
    pill.style.display = 'none';
    currentSelected = null;

    if (hiddenInput) {
      hiddenInput.value = '';
      hiddenInput.dataset.locationName = '';
      hiddenInput.dataset.locationKey = '';
      hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (typeof onSelect === 'function') {
      onSelect(null);
    }
    input.focus();
  });

  changeBtn?.addEventListener('click', () => {
    input.focus();
    input.select();
  });

  // Quick Chips
  chips?.querySelectorAll('[data-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const name = btn.dataset.name;
      const findFn = typeof findCampusLocation === 'function' ? findCampusLocation : null;
      const loc = typeof findFn === 'function' ? findFn(key) : null;
      selectLocation(loc || { id: key, name, building: 'Main Building', floorLabel: 'Main Complex' });
    });
  });

  // Handle Initial Value
  if (initialKey || initialValue) {
    const findFn = typeof findCampusLocation === 'function' ? findCampusLocation : null;
    const searchFn = typeof searchCampusLocations === 'function' ? searchCampusLocations : null;
    const loc = typeof findFn === 'function'
      ? (findFn(initialKey) || (typeof searchFn === 'function' ? searchFn(initialValue)[0] : null))
      : null;
    if (loc) {
      selectLocation(loc);
    } else if (initialValue) {
      selectLocation({ id: initialKey || 'custom', name: initialValue, building: 'Campus', floorLabel: 'Main Complex' });
    }
  }

  return {
    selectLocation,
    getSelected: () => currentSelected
  };
}

if (typeof module !== 'undefined') {
  module.exports = {
    initCampusLocationPicker
  };
}
