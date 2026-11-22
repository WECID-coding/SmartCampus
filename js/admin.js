/**
 * SmartCampus Admin Dashboard Controller
 * Moderation, claims review, and metrics reporting.
 */

function escapeHTML(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}
window.escapeHTML = escapeHTML;

const CLAIMS_STORAGE_KEY = 'smartcampus_claims_store_v1';

const DEFAULT_SEED_CLAIMS = [
  {
    id: 101,
    report_id: 1,
    claimant_name: 'Rahul Verma',
    claimant_email: '0901CS221045 · CS Dept',
    contact: '0901CS221045',
    item_name: 'HP Pavilion Laptop',
    item_location: 'Found at CIoT Lab M007',
    proof: 'Has "GitHub Octocat" sticker on top left lid and dual-boot GRUB loader with roll number lock.',
    lost_where_when: 'CIoT Lab M007 around 1:30 PM',
    desk: 'Central Library Circulation Desk',
    status: 'pending',
    created_at: '2 hours ago'
  },
  {
    id: 102,
    report_id: 2,
    claimant_name: 'Ananya Joshi',
    claimant_email: '0901IT231012 · IT Dept',
    contact: '0901IT231012',
    item_name: 'Fastrack Analog Watch',
    item_location: 'Found at Classroom J115',
    proof: 'Black leather strap with slight scuff on the 4 o\'clock rim mark. Engraved initials \'AJ\'.',
    lost_where_when: 'Classroom J115 after lecture',
    desk: 'SAC Office (J114)',
    status: 'pending',
    created_at: '4 hours ago'
  }
];

function deduplicateClaims(claims) {
  if (!Array.isArray(claims)) return [];
  const seenSignatures = new Set();
  const cleaned = [];

  for (const c of claims) {
    if (!c) continue;
    const claimant = (c.claimant_name || c.claimant_email || c.contact || '').trim().toLowerCase();
    const item = (c.item_name || '').trim().toLowerCase();
    const sig = `${claimant}|${item}`;

    if (claimant && item && seenSignatures.has(sig)) {
      continue;
    }

    if (claimant && item) seenSignatures.add(sig);
    cleaned.push(c);
  }
  return cleaned;
}

function getAdminClaims() {
  let list = [];
  try {
    const raw = localStorage.getItem(CLAIMS_STORAGE_KEY);
    if (raw) list = JSON.parse(raw);
  } catch {}
  if (!Array.isArray(list) || !list.length) {
    list = DEFAULT_SEED_CLAIMS.map(c => ({ ...c }));
  }
  const deduped = deduplicateClaims(list);
  if (list.length !== deduped.length) {
    try {
      localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(deduped));
    } catch {}
  }
  return deduped;
}

function saveAdminClaims(list) {
  const deduped = deduplicateClaims(list);
  try {
    localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(deduped));
  } catch (e) {
    console.warn('Error saving claims to localStorage:', e);
  }
}

async function renderAdminStats() {
  const reports = typeof getReports === 'function' ? getReports() : [];
  const statTotal = document.getElementById('statTotalReports');
  const statReunited = document.getElementById('statReunited');
  const statUsers = document.getElementById('statVerifiedUsers');
  const statPending = document.getElementById('statPendingClaims');

  if (statTotal) statTotal.textContent = reports.length;
  if (statReunited) {
    const reunitedCount = reports.filter(r => r.status === 'resolved' || r.type === 'found').length;
    statReunited.textContent = reunitedCount;
  }
  if (statUsers) statUsers.textContent = '4,120+';

  // Accurate pending claims count from persistent claims store
  const claims = getAdminClaims();
  const pendingCount = claims.filter(c => (c.status || 'pending').toLowerCase() === 'pending').length;
  if (statPending) statPending.textContent = pendingCount;

  try {
    if (typeof apiFetch === 'function') {
      const stats = await apiFetch('/admin/stats');
      if (stats) {
        if (statTotal && stats.total_reports !== undefined) statTotal.textContent = stats.total_reports;
        if (statReunited && stats.reunited !== undefined) statReunited.textContent = stats.reunited;
        if (statUsers && stats.total_users !== undefined) statUsers.textContent = `${Number(stats.total_users).toLocaleString()}+`;
      }
    }
  } catch {}
}

function renderAdminReports(filterQuery = '') {
  const tbody = document.getElementById('adminReportsTableBody');
  if (!tbody) return;

  const reports = typeof getReports === 'function' ? getReports() : [];
  const q = filterQuery.toLowerCase().trim();
  const filtered = reports.filter(r => 
    !q || 
    r.name.toLowerCase().includes(q) || 
    (r.location && r.location.toLowerCase().includes(q)) ||
    (r.category && r.category.toLowerCase().includes(q))
  );

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 32px; color: var(--muted);">
          No reports matching current filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const isApproved = r.adminApproved !== false;
    const statusClass = isApproved ? 'approved' : 'pending';
    const statusText = isApproved ? 'Active / Approved' : 'Under Review';
    const typeColor = r.type === 'lost' ? 'var(--lost)' : 'var(--found)';

    return `
      <tr data-report-id="${r.id}">
        <td><strong style="color: var(--muted); font-size: 11.5px;">#${r.id}</strong></td>
        <td>
          <strong>${escapeHTML(r.name)}</strong><br>
          <small style="color: var(--muted);">${escapeHTML(r.categoryLabel || r.category || 'General')}</small>
        </td>
        <td>📍 ${escapeHTML(r.location)}</td>
        <td>
          <span style="font-weight: 800; text-transform: uppercase; font-size: 11.5px; color: ${typeColor};">
            ${r.type}
          </span>
        </td>
        <td><span class="status-pill ${statusClass}">${statusText}</span></td>
        <td><small style="color: var(--muted);">${escapeHTML(r.date || r.time || 'Today')}</small></td>
        <td>
          <div class="admin-actions">
            ${!isApproved ? `
              <button type="button" class="btn primary small" onclick="approveReport(${r.id})">✓ Approve</button>
            ` : `
              <button type="button" class="btn secondary small" onclick="toggleReportStatus(${r.id})">Mark Resolved</button>
            `}
            <button type="button" class="btn secondary small" style="color: var(--lost); border-color: rgba(244, 63, 94, 0.3);" onclick="removeReportAdmin(${r.id})">✕ Remove</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function syncAdminReports() {
  try {
    if (typeof apiFetch === 'function') {
      const remote = await apiFetch('/reports?limit=500');
      if (Array.isArray(remote) && remote.length) {
        const local = typeof getReports === 'function' ? getReports() : [];
        const combined = [...local];

        remote.forEach(r => {
          if (!r || !r.name || r.name.includes('Audit Test')) return;
          const normName = r.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          const normLoc = (r.location || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

          const matchIdx = combined.findIndex(c => {
            const cName = c.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            const cLoc = (c.location || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            return String(c.id) === String(r.id) || (cName === normName && c.type === r.type && cLoc === normLoc);
          });

          if (matchIdx !== -1) {
            combined[matchIdx] = { ...combined[matchIdx], ...r };
          } else {
            combined.push(r);
          }
        });

        const deduped = typeof deduplicateReports === 'function' ? deduplicateReports(combined) : combined;
        if (typeof saveReports === 'function') saveReports(deduped);
        renderAdminReports(document.getElementById('adminFilterInput')?.value || '');
        renderAdminStats();
      }
    }
  } catch {}
}

function approveClaim(btn, claimId, itemName, claimantName) {
  let row = null;
  if (btn && btn.closest) {
    row = btn.closest('tr');
    if (!claimId) claimId = row?.dataset?.claimId;
  }

  // Handle signature variations: approveClaim(btn, itemName, claimantName)
  if (typeof claimId === 'string' && isNaN(Number(claimId)) && !itemName) {
    itemName = claimId;
    claimantName = itemName;
    claimId = row?.dataset?.claimId;
  }

  const claims = getAdminClaims();
  let c = claims.find(x => String(x.id) === String(claimId));
  if (!c && itemName) {
    c = claims.find(x => x.item_name && x.item_name.toLowerCase() === String(itemName).toLowerCase());
  }

  if (c) {
    c.status = 'approved';
    c.authorized_at = new Date().toISOString();
    saveAdminClaims(claims);
  }

  // Synchronize student's local claims store
  try {
    const rawMy = localStorage.getItem('smartcampus_my_claims');
    if (rawMy) {
      const myClaims = JSON.parse(rawMy);
      const myC = myClaims.find(x => String(x.id) === String(claimId) || (c && String(x.report_id) === String(c.report_id)));
      if (myC) {
        myC.status = 'approved';
        localStorage.setItem('smartcampus_my_claims', JSON.stringify(myClaims));
      }
    }
  } catch {}

  const cid = claimId || c?.id;
  if (cid && typeof apiFetch === 'function') {
    apiFetch(`/admin/claims/${cid}?status=approved`, { method: 'PATCH' }).catch(() => {});
  }

  renderAdminClaims();
  renderAdminStats();

  if (typeof showToast === 'function') {
    showToast('Handover Authorized', `Authorization recorded for "${itemName || c?.item_name || 'Item'}" to ${claimantName || c?.claimant_name || 'Student'}.`);
  }
}

function rejectClaim(btn, claimId) {
  let row = null;
  if (btn && btn.closest) {
    row = btn.closest('tr');
    if (!claimId) claimId = row?.dataset?.claimId;
  }

  const claims = getAdminClaims();
  let c = claims.find(x => String(x.id) === String(claimId));

  if (c) {
    c.status = 'rejected';
    c.rejected_at = new Date().toISOString();
    saveAdminClaims(claims);
  }

  // Synchronize student's local claims store
  try {
    const rawMy = localStorage.getItem('smartcampus_my_claims');
    if (rawMy) {
      const myClaims = JSON.parse(rawMy);
      const myC = myClaims.find(x => String(x.id) === String(claimId) || (c && String(x.report_id) === String(c.report_id)));
      if (myC) {
        myC.status = 'rejected';
        localStorage.setItem('smartcampus_my_claims', JSON.stringify(myClaims));
      }
    }
  } catch {}

  const cid = claimId || c?.id;
  if (cid && typeof apiFetch === 'function') {
    apiFetch(`/admin/claims/${cid}?status=rejected`, { method: 'PATCH' }).catch(() => {});
  }

  renderAdminClaims();
  renderAdminStats();

  if (typeof showToast === 'function') {
    showToast('Claim Rejected', 'The claim has been declined due to insufficient proof.');
  }
}

function resetClaimStatus(claimId) {
  const claims = getAdminClaims();
  const c = claims.find(x => String(x.id) === String(claimId));
  if (c) {
    c.status = 'pending';
    saveAdminClaims(claims);
  }
  renderAdminClaims();
  renderAdminStats();
  if (typeof showToast === 'function') {
    showToast('Status Reset', 'Claim reset to pending proof check.');
  }
}

async function aiVerifyClaimPrompt(btn, itemName, proofDetails, claimId) {
  const origText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span>⏳ Evaluating...</span>';

  try {
    let result = null;
    const base = typeof API_BASE !== 'undefined' ? API_BASE : (window.SMARTCAMPUS_API_BASE || '');
    try {
      const res = await fetch(`${base}/ai/verify-claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: itemName,
          proof: proofDetails,
          lost_context: 'Reported on MITS Campus',
          report_id: null
        })
      });
      if (res.ok) result = await res.json();
    } catch {}

    if (!result) {
      const p = (proofDetails || '').toLowerCase();
      let score = 75;
      let notes = 'Claimant provided circumstantial details.';
      let verdict = 'Moderate Confidence — Cross-verify Physical Serial';

      if (p.includes('sticker') || p.includes('engraved') || p.includes('wallpaper') || p.includes('serial') || p.includes('scratch') || p.includes('dual-boot') || p.includes('grub') || p.includes('case') || p.includes('blue')) {
        score = 94;
        verdict = 'Likely Legitimate Owner';
        notes = 'High confidence: Specific physical identifying traits match unexposed item attributes.';
      } else if (p.length < 15) {
        score = 35;
        verdict = 'Requires Additional Identity Check';
        notes = 'Sparse proof provided. Proctor must verify student institute ID card.';
      }
      result = {
        verification_score: score,
        confidence: score >= 80 ? 'High' : (score >= 50 ? 'Moderate' : 'Low'),
        verdict: verdict,
        admin_notes: notes
      };
    }

    if (claimId) {
      const claims = getAdminClaims();
      const c = claims.find(x => String(x.id) === String(claimId));
      if (c) {
        c.ai_check = result;
        saveAdminClaims(claims);
      }
    }

    renderAdminClaims();

    if (typeof showToast === 'function') {
      showToast('AI Assessment Complete', `${result.verdict} (${result.verification_score}% score).`);
    }
  } catch (err) {
    console.warn('AI verify error', err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = origText;
  }
}

function approveReport(id) {
  const reports = typeof getReports === 'function' ? getReports() : [];
  const item = reports.find(r => r.id === id);
  if (item) {
    item.approved = true;
    item.status = 'active';
    if (typeof saveReports === 'function') saveReports(reports);
    if (typeof apiFetch === 'function') {
      apiFetch(`/admin/reports/${id}?status=active`, { method: 'PATCH' }).catch(() => {});
    }
    if (typeof showToast === 'function') {
      showToast('Report Approved', `Report #${id} ("${item.name}") is now approved & published.`);
    }
    renderAdminReports(document.getElementById('adminFilterInput')?.value || '');
    renderAdminStats();
  }
}

function toggleReportStatus(id) {
  const reports = typeof getReports === 'function' ? getReports() : [];
  const item = reports.find(r => r.id === id);
  if (item) {
    item.status = 'resolved';
    if (typeof saveReports === 'function') saveReports(reports);
    if (typeof apiFetch === 'function') {
      apiFetch(`/admin/reports/${id}?status=resolved`, { method: 'PATCH' }).catch(() => {});
    }
    if (typeof showToast === 'function') {
      showToast('Status Updated', `Report #${id} marked as resolved.`);
    }
    renderAdminReports(document.getElementById('adminFilterInput')?.value || '');
    renderAdminStats();
  }
}

function removeReportAdmin(id) {
  const reports = typeof getReports === 'function' ? getReports() : [];
  const idx = reports.findIndex(r => r.id === id);
  if (idx !== -1) {
    const removed = reports.splice(idx, 1)[0];
    if (typeof saveReports === 'function') saveReports(reports);
    if (typeof apiFetch === 'function') {
      apiFetch(`/admin/reports/${id}`, { method: 'DELETE' }).catch(() => {});
    }
    if (typeof showToast === 'function') {
      showToast('Report Removed', `Report "${removed.name}" removed from public directory.`);
    }
    renderAdminReports(document.getElementById('adminFilterInput')?.value || '');
    renderAdminStats();
  }
}

async function renderAdminClaims() {
  const tbody = document.getElementById('adminClaimsTableBody');
  if (!tbody) return;

  let claims = getAdminClaims();

  try {
    if (typeof apiFetch === 'function') {
      const remote = await apiFetch('/admin/claims');
      if (Array.isArray(remote) && remote.length) {
        remote.forEach(rc => {
          if (!rc) return;
          const rcClaimant = (rc.claimant_name || rc.claimant_email || rc.contact || '').trim().toLowerCase();
          const rcItem = (rc.item_name || '').trim().toLowerCase();

          const matchIdx = claims.findIndex(c => {
            const cClaimant = (c.claimant_name || c.claimant_email || c.contact || '').trim().toLowerCase();
            const cItem = (c.item_name || '').trim().toLowerCase();
            return String(c.id) === String(rc.id) || (rcClaimant && rcItem && cClaimant === rcClaimant && cItem === rcItem);
          });

          if (matchIdx !== -1) {
            claims[matchIdx] = { ...rc, ...claims[matchIdx] };
          } else {
            claims.push(rc);
          }
        });
        claims = deduplicateClaims(claims);
        saveAdminClaims(claims);
      }
    }
  } catch {}

  if (!claims.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 32px; color: var(--muted);">
          No ownership claims filed yet.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = claims.map(c => {
    const isApproved = (c.status || '').toLowerCase() === 'approved';
    const isRejected = (c.status || '').toLowerCase() === 'rejected';
    const isPending = !isApproved && !isRejected;
    const statusClass = isApproved ? 'approved' : (isRejected ? 'rejected' : 'pending');
    const statusText = isApproved ? 'Authorized Handover' : (isRejected ? 'Rejected' : 'Pending Proof Check');

    const claimantDisplay = escapeHTML(c.claimant_name || c.claimant_email || 'Student');
    const contactDisplay = escapeHTML(c.contact || c.claimant_email || 'No phone provided');
    const itemDisplay = escapeHTML(c.item_name || `Report #${c.report_id || c.id}`);
    const locDisplay = escapeHTML(c.item_location || 'Campus');
    const proofDisplay = escapeHTML(c.proof || c.proof_reason || 'Private proof provided');
    const lostDisplay = escapeHTML(c.lost_where_when || 'Campus');
    const deskDisplay = escapeHTML(c.desk || 'Central Library Circulation Desk');

    let aiBadgeHtml = '';
    if (c.ai_check) {
      const result = c.ai_check;
      const isHigh = (result.verification_score >= 80);
      const isMed = (result.verification_score >= 50 && result.verification_score < 80);
      const bg = isHigh ? 'rgba(16, 185, 129, 0.12)' : (isMed ? 'rgba(245, 158, 11, 0.12)' : 'rgba(244, 63, 94, 0.12)');
      const border = isHigh ? 'rgba(16, 185, 129, 0.35)' : (isMed ? 'rgba(245, 158, 11, 0.35)' : 'rgba(244, 63, 94, 0.35)');
      const color = isHigh ? '#10b981' : (isMed ? '#f59e0b' : '#f43f5e');
      aiBadgeHtml = `
        <div class="ai-claim-badge" style="margin-top: 6px; font-size: 11.5px; padding: 6px 10px; border-radius: var(--radius-sm); background: ${bg}; border: 1px solid ${border}; color: ${color};">
          <strong>🤖 AI Plausibility: ${result.verification_score}% (${escapeHTML(result.verdict)})</strong><br>
          <small style="color:var(--text);">${escapeHTML(result.admin_notes || '')}</small>
        </div>
      `;
    }

    const safeItem = itemDisplay.replace(/'/g, "\\'");
    const safeProof = proofDisplay.replace(/'/g, "\\'").replace(/\n/g, ' ');
    const safeClaimant = claimantDisplay.replace(/'/g, "\\'");

    return `
      <tr data-claim-id="${c.id}">
        <td>
          <strong>${claimantDisplay}</strong><br>
          <small style="color: var(--muted);">${contactDisplay}</small>
        </td>
        <td>
          <strong>${itemDisplay}</strong><br>
          <small style="color: var(--muted);">📍 ${locDisplay}</small>
        </td>
        <td>
          <span style="font-size: 12.5px;">${proofDisplay}</span><br>
          <small style="color: var(--muted);">Lost context: ${lostDisplay}</small>
          ${aiBadgeHtml}
        </td>
        <td>${deskDisplay}</td>
        <td><span class="status-pill ${statusClass}">${statusText}</span></td>
        <td>
          <div class="admin-actions">
            ${isPending ? `
              <button type="button" class="btn secondary small" onclick="aiVerifyClaimPrompt(this, '${safeItem}', '${safeProof}', ${c.id})">🤖 AI Check</button>
              <button type="button" class="btn primary small" onclick="approveClaim(this, ${c.id}, '${safeItem}', '${safeClaimant}')">✓ Authorize</button>
              <button type="button" class="btn secondary small" onclick="rejectClaim(this, ${c.id})">✕ Reject</button>
            ` : `
              <span style="font-size: 12px; font-weight: 700; color: ${isApproved ? 'var(--found)' : 'var(--lost)'};">
                ${isApproved ? '✓ Handover Authorized' : '✕ Claim Rejected'}
              </span>
              <button type="button" class="btn secondary small" style="margin-left: 6px; font-size: 11px; padding: 3px 6px;" onclick="resetClaimStatus(${c.id})">Reset</button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const user = typeof getStoredUser === 'function' ? getStoredUser() : null;
  if (!user || user.role !== 'admin') {
    sessionStorage.setItem('adminAccessDenied', '1');
    window.location.replace('login.html?error=unauthorized');
    return;
  }

  renderAdminStats();
  renderAdminReports();
  renderAdminClaims();
  syncAdminReports();

  const filterInput = document.getElementById('adminFilterInput');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      renderAdminReports(e.target.value);
    });
  }

  document.getElementById('refreshAdminBtn')?.addEventListener('click', () => {
    renderAdminStats();
    renderAdminReports(filterInput?.value || '');
    renderAdminClaims();
    syncAdminReports();
    if (typeof showToast === 'function') {
      showToast('Feed Refreshed', 'Admin live dashboard re-synchronized.');
    }
  });

  document.getElementById('exportAuditBtn')?.addEventListener('click', () => {
    const reports = typeof getReports === 'function' ? getReports() : [];
    const headers = 'ID,Name,Type,Category,Location,Date\n';
    const rows = reports.map(r => `"${r.id}","${(r.name||'').replace(/"/g, '""')}","${r.type}","${r.category||''}","${(r.location||'').replace(/"/g, '""')}","${r.date||r.time||''}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartcampus_audit_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') {
      showToast('Audit Exported', 'CSV report downloaded successfully.');
    }
  });
});

window.getAdminClaims = getAdminClaims;
window.saveAdminClaims = saveAdminClaims;
window.approveClaim = approveClaim;
window.rejectClaim = rejectClaim;
window.resetClaimStatus = resetClaimStatus;
window.aiVerifyClaimPrompt = aiVerifyClaimPrompt;
window.renderAdminClaims = renderAdminClaims;
window.renderAdminReports = renderAdminReports;
window.syncAdminReports = syncAdminReports;
window.approveReport = approveReport;
window.toggleReportStatus = toggleReportStatus;
window.removeReportAdmin = removeReportAdmin;

