/**
 * SmartCampus Report Submission & Dynamic Live Preview
 * Includes real-time image preview, draft auto-save, and form validation.
 */
let mode = new URLSearchParams(location.search).get('mode') === 'found' ? 'found' : 'lost';
let uploadedImageDataUrl = null;

const LOCATION_LABELS = {
  main_gate: 'Main Entrance Gate (South)',
  jubilee_gate: 'Diamond Jubilee Gate',
  central_library: 'Central Library',
  canteen: 'Campus Canteen & Cafeteria',
  sac: 'Student Activity Center (SAC J114)',
  tp_cell: 'Training & Placement Centre (T&P J120)',
  workshops: 'Workshops & Mechanical Labs',
  drone_school: 'Drone School & Tech Innovation',
  main_gf_conclave: 'Main Building: Conclave Centre (J001)',
  main_gf_lt: 'Main Building: Lecture Theatres (LT-1 / LT-2)',
  main_gf_sh: 'Main Building: Seminar Halls (SH-1 to SH-6)',
  main_ff_cloud_lab: 'Main Building FF: Cloud Computing Lab (J140)',
  main_ff_ml_lab: 'Main Building FF: Machine Learning Lab (J139/J142)',
  ai_gf_ciot: 'AI Building GF: CIoT Lab (M007)'
};

const CATEGORY_ICONS_MAP = {
  accessories: '⌚',
  documents: '🪪',
  electronics: '💻',
  bags: '🎒',
  keys: '🔑',
  education: '📚'
};

const DRAFT_KEY = 'smartcampus-report-draft';

function saveDraft() {
  const draft = {
    mode,
    name: document.getElementById('itemName')?.value || '',
    category: document.getElementById('itemCategory')?.value || '',
    date: document.getElementById('itemDate')?.value || '',
    description: document.getElementById('itemDescription')?.value || ''
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (draft.name && document.getElementById('itemName')) document.getElementById('itemName').value = draft.name;
    if (draft.category && document.getElementById('itemCategory')) document.getElementById('itemCategory').value = draft.category;
    if (draft.date && document.getElementById('itemDate')) document.getElementById('itemDate').value = draft.date;
    if (draft.description && document.getElementById('itemDescription')) {
      document.getElementById('itemDescription').value = draft.description;
      const count = document.getElementById('charCount');
      if (count) count.textContent = draft.description.length;
    }
  } catch {}
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

function updateLivePreview() {
  const preview = document.getElementById('reportLivePreview');
  if (!preview) return;

  const name = document.getElementById('itemName')?.value.trim() || 'Item Name Preview';
  const cat = document.getElementById('itemCategory')?.value || 'accessories';
  const locVal = document.getElementById('itemLocation')?.value;
  const locNameAttr = document.getElementById('itemLocation')?.dataset?.locationName;
  const locObj = typeof findCampusLocation === 'function' ? findCampusLocation(locVal) : null;
  const loc = (locVal && (locNameAttr || LOCATION_LABELS[locVal] || locObj?.name || locVal)) || 'MITS Campus Location';
  const desc = document.getElementById('itemDescription')?.value.trim() || 'Identifying details and description will appear here as you type...';
  const icon = CATEGORY_ICONS_MAP[cat] || '📦';
  const isLost = mode === 'lost';
  const catLabel = REPORT_CATEGORY_LABELS?.[cat] || cat;

  const visualContent = uploadedImageDataUrl
    ? `<img src="${uploadedImageDataUrl}" alt="Item preview" style="width: 100%; height: 100%; object-fit: cover;">`
    : `<div class="item-category-icon">${icon}</div>`;

  preview.innerHTML = `
    <article class="item-card ${mode}" style="margin: 0; box-shadow: none;">
      <div class="item-visual-wrap">
        ${visualContent}
        <span class="status-badge ${mode}">
          <span class="pulse-dot"></span>
          ${isLost ? 'LOST ITEM' : 'FOUND ITEM'}
        </span>
      </div>
      <div class="item-body">
        <div class="item-topline">
          <span class="category-chip">${catLabel}</span>
          <span class="time-chip">⏱ Just now</span>
        </div>
        <h3 class="item-title">${escapeHTML(name)}</h3>
        <p class="item-description">${escapeHTML(desc)}</p>
        <div class="item-footer">
          <div class="location-chip" title="${escapeHTML(loc)}">
            <svg class="chip-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            <span>${escapeHTML(loc)}</span>
          </div>
          <button type="button" class="item-action-btn ${mode}" style="pointer-events: none;">
            <span>${isLost ? '⚡ Check Matches' : '🛡️ Verify Ownership'}</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

function setMode(next) {
  mode = next;
  document.querySelectorAll('[data-mode]').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  
  const title = document.getElementById('reportTitle');
  const subtitle = document.getElementById('reportSubtitle');
  if (title) {
    title.textContent = mode === 'found' ? 'Report a Found Item' : 'Report a Lost Item';
  }
  if (subtitle) {
    subtitle.textContent = mode === 'found'
      ? 'Help a fellow student by reporting an item you discovered on the MITS campus.'
      : 'Provide clear, identifiable details to maximize chances of finding your item.';
  }
  
  history.replaceState({}, '', `report.html?mode=${mode}`);
  saveDraft();
  updateLivePreview();
}

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof requireAuth === 'function') await requireAuth();

  restoreDraft();
  setMode(mode);

  // Initialize searchable campus location picker
  if (typeof initCampusLocationPicker === 'function' && document.getElementById('reportLocationPickerContainer')) {
    initCampusLocationPicker({
      containerId: 'reportLocationPickerContainer',
      hiddenInputId: 'itemLocation',
      placeholder: 'Search classroom, seminar hall, or room (e.g. J115, SH-12, M005)...',
      onSelect: (selectedLoc) => {
        updateLivePreview();
      }
    });
  }

  const dateInput = document.getElementById('itemDate');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  // Bind live preview listeners
  ['itemName', 'itemCategory', 'itemLocation'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      saveDraft();
      updateLivePreview();
    });
    document.getElementById(id)?.addEventListener('change', () => {
      saveDraft();
      updateLivePreview();
    });
  });

  const desc = document.getElementById('itemDescription');
  const count = document.getElementById('charCount');
  if (desc && count) {
    desc.addEventListener('input', () => {
      count.textContent = desc.value.length;
      saveDraft();
      updateLivePreview();
    });
  }

  // AI Auto-Fill & Description Enhancer Button
  const aiEnhanceBtn = document.getElementById('aiEnhanceReportBtn');
  if (aiEnhanceBtn) {
    aiEnhanceBtn.addEventListener('click', async () => {
      const nameInput = document.getElementById('itemName');
      const catInput = document.getElementById('itemCategory');
      const descInput = document.getElementById('itemDescription');
      const locInput = document.getElementById('itemLocation');

      const title = nameInput?.value?.trim() || '';
      const rawDesc = descInput?.value?.trim() || '';
      const cat = catInput?.value || '';
      const loc = locInput?.value || '';

      if (!title && !rawDesc) {
        if (typeof showToast === 'function') {
          showToast('Provide an Item Hint', 'Please enter at least an item title or keyword first.');
        }
        nameInput?.focus();
        return;
      }

      const origText = aiEnhanceBtn.innerHTML;
      aiEnhanceBtn.disabled = true;
      aiEnhanceBtn.innerHTML = `<span>⏳ Enhancing with AI...</span>`;

      try {
        let result = null;
        if (typeof window.requestAIEnhance === 'function') {
          result = await window.requestAIEnhance({
            title,
            description: rawDesc,
            category: cat,
            location: loc
          });
        }

        if (result) {
          if (result.suggested_title && nameInput && (!nameInput.value || nameInput.value.length < 5)) {
            nameInput.value = result.suggested_title;
          }
          if (result.suggested_category && catInput && (!catInput.value || catInput.value === 'accessories')) {
            catInput.value = result.suggested_category;
          }
          if (result.enhanced_description && descInput) {
            descInput.value = result.enhanced_description;
            const charCountEl = document.getElementById('charCount');
            if (charCountEl) charCountEl.textContent = descInput.value.length;
          }
          saveDraft();
          updateLivePreview();
          if (typeof showToast === 'function') {
            showToast('AI Enhanced Successfully', 'Specifications and security guidance updated.');
          }
        }
      } catch (err) {
        console.warn('AI Enhance error', err);
      } finally {
        aiEnhanceBtn.disabled = false;
        aiEnhanceBtn.innerHTML = origText;
      }
    });
  }

  // Mode buttons
  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  // Photo uploader with preview and removal
  const photoInput = document.getElementById('itemPhoto');
  const photoBox = document.getElementById('photoName');
  const previewBox = document.getElementById('photoPreviewContainer');
  const previewImg = document.getElementById('photoPreviewImg');
  const previewName = document.getElementById('photoPreviewName');
  const previewSize = document.getElementById('photoPreviewSize');
  const removeBtn = document.getElementById('photoRemoveBtn');

  if (photoInput) {
    photoInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        photoInput.value = '';
        if (photoBox) photoBox.innerHTML = '<span style="color:var(--lost)">Photo exceeds 5 MB. Please pick a smaller image.</span>';
        if (typeof showToast === 'function') showToast('Photo Too Large', 'Maximum allowed image size is 5 MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        uploadedImageDataUrl = event.target.result;
        if (previewBox && previewImg) {
          previewImg.src = uploadedImageDataUrl;
          if (previewName) previewName.textContent = file.name;
          if (previewSize) previewSize.textContent = `${(file.size / 1024).toFixed(0)} KB`;
          previewBox.style.display = 'flex';
        }
        if (photoBox) photoBox.innerHTML = `<span>✓ Attached: <strong>${escapeHTML(file.name)}</strong></span>`;
        updateLivePreview();
      };
      reader.readAsDataURL(file);
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        photoInput.value = '';
        uploadedImageDataUrl = null;
        if (previewBox) previewBox.style.display = 'none';
        if (photoBox) photoBox.innerHTML = 'Click or drag an image here to attach a photograph';
        updateLivePreview();
      });
    }
  }

  // Form submission
  const form = document.getElementById('reportForm');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const cat = document.getElementById('itemCategory');
      const loc = document.getElementById('itemLocation');
      const file = photoInput?.files[0];
      const name = document.getElementById('itemName').value.trim();
      const dateVal = document.getElementById('itemDate').value;
      const descVal = desc.value.trim();

      const locationLabel = loc.dataset?.locationName || LOCATION_LABELS[loc.value] || (typeof findCampusLocation === 'function' ? findCampusLocation(loc.value)?.name : null) || loc.selectedOptions?.[0]?.textContent || loc.value || 'Campus';

      if (!loc.value) {
        if (typeof showToast === 'function') {
          showToast('Location Required', 'Please select or search for a campus classroom or room.');
        }
        document.getElementById('reportLocationPickerContainer_input')?.focus();
        return;
      }

      try {
        let data;
        if (file) {
          const formData = new FormData();
          formData.append('type', mode);
          formData.append('name', name);
          formData.append('category', cat.value);
          formData.append('location', locationLabel);
          formData.append('location_key', loc.value);
          formData.append('item_date', dateVal);
          formData.append('description', descVal);
          formData.append('image', file);
          data = await apiFetch('/reports/with-image', { method: 'POST', body: formData });
        } else {
          data = await apiFetch('/reports', {
            method: 'POST',
            body: JSON.stringify({
              type: mode,
              name,
              category: cat.value,
              location: locationLabel,
              location_key: loc.value,
              item_date: dateVal,
              description: descVal
            })
          });
        }

        // Cache immediately in local my-reports so it instantly appears
        const savedItem = {
          id: data?.id || Date.now(),
          type: mode,
          name,
          category: cat.value,
          categoryLabel: REPORT_CATEGORY_LABELS?.[cat.value] || cat.value,
          location: locationLabel,
          locationKey: loc.value,
          itemDate: dateVal,
          date: dateVal,
          time: 'Just now',
          description: descVal,
          imageUrl: data?.image_url || uploadedImageDataUrl,
          status: 'active'
        };
        const myReports = JSON.parse(localStorage.getItem('smartcampus-my-reports-v2') || '[]');
        myReports.unshift(savedItem);
        localStorage.setItem('smartcampus-my-reports-v2', JSON.stringify(myReports));

        if (typeof getReports === 'function' && typeof saveReports === 'function') {
          const all = getReports();
          all.unshift(savedItem);
          saveReports(all);
        }

        clearDraft();

        if (typeof window.addNotification === 'function') {
          window.addNotification({
            title: mode === 'found' ? 'Found Report Published' : 'Lost Report Logged',
            message: `"${name}" has been published to the campus directory at ${locationLabel}.`,
            type: 'system',
            reportId: data?.id
          });
        }

        if (typeof showToast === 'function') {
          showToast('Report Published Successfully', `"${name}" has been logged in SmartCampus.`);
        }
        setTimeout(() => {
          location.href = 'my-reports.html';
        }, 700);
      } catch (err) {
        if (typeof showToast === 'function') {
          showToast('Could Not Submit', err.message);
        }
      }
    });
  }

  updateLivePreview();
});
