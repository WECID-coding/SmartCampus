/**
 * SmartCampus Auth & Header Navigation UI
 * Handles login state, user avatar dropdown, interactive notification center, and reactive notification badges.
 */
window.safeText = v => String(v ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

if (typeof window.escapeHTML !== 'function') {
  window.escapeHTML = window.safeText;
}

const getPagePath = page => location.pathname.includes('/pages/') ? page : `pages/${page}`;

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Global Unified Notification Store
const NOTIFS_KEY = 'smartcampus-notifications';
const DEFAULT_SEED_NOTIFICATIONS = [
  {
    id: 1,
    title: 'New Ownership Claim Submitted',
    message: 'A student has submitted an ownership check for "Wireless headphones" found near Canteen.',
    time: '10m ago',
    unread: false,
    type: 'claim',
    reportId: 4
  },
  {
    id: 2,
    title: 'Possible Match Detected',
    message: 'A found report matching your lost "Black leather wallet" was reported at Central Library.',
    time: '2h ago',
    unread: false,
    type: 'match',
    reportId: 1
  },
  {
    id: 3,
    title: 'Verification Approved',
    message: 'Campus Security verified the handover for "Student ID card". Report status updated to Reunited.',
    time: 'Yesterday',
    unread: false,
    type: 'verified',
    reportId: 3
  },
  {
    id: 4,
    title: 'Welcome to SmartCampus',
    message: 'Your MITS institute account is active. Report lost items or submit found articles easily.',
    time: '3d ago',
    unread: false,
    type: 'system'
  }
];

window.getStoredNotifications = function() {
  try {
    const raw = localStorage.getItem(NOTIFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {}
  // Initialize in localStorage if absent
  try {
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(DEFAULT_SEED_NOTIFICATIONS));
  } catch {}
  return [...DEFAULT_SEED_NOTIFICATIONS];
};

window.saveStoredNotifications = function(notifs) {
  try {
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifs));
  } catch {}
};

window.syncBackendNotifications = async function() {
  if (typeof apiFetch !== 'function') return;
  try {
    const remote = await apiFetch('/notifications');
    if (Array.isArray(remote) && remote.length) {
      window.saveStoredNotifications(remote);
      window.updateGlobalNotifUI();
    }
  } catch {}
};

window.getUnreadNotifCount = function() {
  const list = window.getStoredNotifications();
  return list.filter(n => n.unread).length;
};

window.markNotifRead = function(id) {
  const list = window.getStoredNotifications();
  const target = list.find(n => n.id === id);
  if (target && target.unread) {
    target.unread = false;
    window.saveStoredNotifications(list);
    window.updateGlobalNotifUI();
  }
  if (typeof apiFetch === 'function') {
    apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {});
  }
};

window.markAllNotifsRead = function() {
  const list = window.getStoredNotifications().map(n => ({ ...n, unread: false }));
  window.saveStoredNotifications(list);
  window.updateGlobalNotifUI();
  if (typeof apiFetch === 'function') {
    apiFetch('/notifications/mark-all-read', { method: 'POST' }).catch(() => {});
  }
};

window.addNotification = function(notifData) {
  const list = window.getStoredNotifications();
  const item = {
    id: Date.now(),
    title: notifData.title || 'Notification',
    message: notifData.message || '',
    time: notifData.time || 'Just now',
    unread: true,
    type: notifData.type || 'system',
    reportId: notifData.reportId || null
  };
  list.unshift(item);
  window.saveStoredNotifications(list);
  window.updateGlobalNotifUI();
  if (typeof apiFetch === 'function') {
    apiFetch('/notifications', {
      method: 'POST',
      body: JSON.stringify({
        title: item.title,
        message: item.message,
        time: item.time,
        unread: true,
        type: item.type,
        report_id: item.reportId
      })
    }).catch(() => {});
  }
};

function renderNotifDropdownItems(notifs) {
  if (!notifs.length) {
    return `<div class="notif-dropdown-empty">🔔 No notifications yet</div>`;
  }
  const slice = notifs.slice(0, 5);
  return slice.map(n => {
    const icon = n.type === 'claim' ? '📝' : n.type === 'match' ? '⚡' : n.type === 'verified' ? '✓' : '📢';
    return `
      <div class="notif-dropdown-item ${n.unread ? 'unread' : ''}" data-dropdown-notif-id="${n.id}">
        <span class="notif-item-icon">${icon}</span>
        <div class="notif-item-text">
          <strong class="notif-item-title">${safeText(n.title)}</strong>
          <span class="notif-item-desc">${safeText(n.message)}</span>
          <span class="notif-item-time">${safeText(n.time)}</span>
        </div>
        ${n.unread ? `<span class="unread-dot" title="Unread"></span>` : ''}
      </div>
    `;
  }).join('');
}

function attachDropdownNotifListeners(container) {
  if (!container) return;
  container.querySelectorAll('[data-dropdown-notif-id]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(el.dataset.dropdownNotifId);
      const list = window.getStoredNotifications();
      const n = list.find(x => x.id === id);
      window.markNotifRead(id);
      if (n && n.reportId) {
        location.href = getPagePath('browse.html');
      }
    });
  });
}

window.updateGlobalNotifUI = function() {
  const notifs = window.getStoredNotifications();
  const unreadCount = notifs.filter(n => n.unread).length;

  // 1. Navbar notification badge
  const badge = document.getElementById('navNotifBadge');
  if (badge) {
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'flex' : 'none';
  }

  // 2. Button title attribute
  const trigger = document.getElementById('navNotifTrigger');
  if (trigger) {
    trigger.setAttribute('title', unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications (All caught up)');
  }

  // 3. Dropdown header count pill
  const pill = document.getElementById('notifDropdownCount');
  if (pill) {
    pill.textContent = unreadCount > 0 ? `${unreadCount} Unread` : 'All Caught Up';
  }

  // 4. Dropdown list items
  const listEl = document.getElementById('notifDropdownList');
  if (listEl) {
    listEl.innerHTML = renderNotifDropdownItems(notifs);
    attachDropdownNotifListeners(listEl);
  }

  // 5. User dropdown notif badge if present
  const userMenuCount = document.getElementById('userMenuNotifCount');
  if (userMenuCount) {
    userMenuCount.textContent = unreadCount > 0 ? `(${unreadCount})` : '';
    userMenuCount.style.display = unreadCount > 0 ? 'inline' : 'none';
  }

  // 6. Notify full notifications page if active
  if (typeof window.renderFullNotifications === 'function') {
    window.renderFullNotifications();
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const box = document.querySelector('[data-auth-area]');
  if (!box) return;

  let user = typeof getStoredUser === 'function' ? getStoredUser() : null;
  if (typeof getToken === 'function' && getToken() && typeof refreshUser === 'function') {
    user = await refreshUser();
  }

  const notifs = window.getStoredNotifications();
  const unreadCount = notifs.filter(n => n.unread).length;
  const notifUrl = getPagePath('notifications.html');

  const bellComponentHtml = `
    <div class="nav-notif-wrap" id="navNotifWrap">
      <button class="nav-notif-btn" id="navNotifTrigger" type="button" aria-expanded="false" aria-haspopup="true" title="${unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}">
        <span class="notif-icon">🔔</span>
        <span class="notif-badge" id="navNotifBadge" style="${unreadCount > 0 ? 'display:flex;' : 'display:none;'}">${unreadCount}</span>
      </button>

      <div class="notif-dropdown" id="navNotifDropdown">
        <div class="notif-dropdown-head">
          <strong>🔔 Notifications <span class="notif-count-pill" id="notifDropdownCount">${unreadCount > 0 ? `${unreadCount} Unread` : 'All Caught Up'}</span></strong>
          <button type="button" id="dropdownMarkAllReadBtn">✓ Mark all read</button>
        </div>
        <div class="notif-dropdown-list" id="notifDropdownList">
          ${renderNotifDropdownItems(notifs)}
        </div>
        <div class="notif-dropdown-footer">
          <a href="${notifUrl}">View All Notifications Center →</a>
        </div>
      </div>
    </div>
  `;

  if (!user) {
    box.innerHTML = `
      ${bellComponentHtml}
      <a class="auth-link auth-btn-login" href="${getPagePath('login.html')}">Sign In</a>
      <a class="auth-link" href="${getPagePath('register.html')}" style="color:var(--accent);">Register</a>
    `;
  } else {
    const initials = getInitials(user.name);
    const myReportsUrl = getPagePath('my-reports.html');
    const roleLabel = user.role === 'admin' ? 'Campus Admin' : (user.email?.includes('mitsgwalior.in') ? 'Faculty' : 'Student');

    box.innerHTML = `
      ${bellComponentHtml}
      <div class="auth-user-wrap">
        <button class="auth-user-chip" id="authUserTrigger" type="button" aria-expanded="false" aria-haspopup="true">
          <span class="auth-avatar">${initials}</span>
          <span style="max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${safeText(user.name)}</span>
          <span style="font-size: 10px; opacity: 0.6;">▼</span>
        </button>

        <div class="auth-dropdown" id="authUserDropdown">
          <div style="padding: 6px 12px 10px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 4px;">
            <strong style="display:block; font-size: 13.5px; color: var(--heading);">${safeText(user.name)}</strong>
            <small style="display:block; font-size: 11px; color: var(--muted);">${safeText(user.email || '')}</small>
            <span style="display:inline-block; margin-top: 4px; font-size: 10.5px; font-weight: 700; color: var(--primary); background: var(--soft); padding: 2px 8px; border-radius: 999px;">${roleLabel}</span>
          </div>
          ${user.role === 'admin' ? `
            <a class="auth-dropdown-item" href="${getPagePath('admin.html')}" style="color: var(--primary); font-weight: 700;">
              <span>🛡️</span> Admin Dashboard
            </a>
          ` : ''}
          <a class="auth-dropdown-item" href="${myReportsUrl}">
            <span>📁</span> My Campus Reports
          </a>
          <a class="auth-dropdown-item" href="${notifUrl}">
            <span>🔔</span> Notifications <b id="userMenuNotifCount" style="color:var(--lost); margin-left:auto; ${unreadCount > 0 ? '' : 'display:none;'}">(${unreadCount})</b>
          </a>
          <button class="auth-dropdown-item logout" id="authLogoutBtn" type="button">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </div>
    `;
  }

  // Attach Notification Trigger and Dropdown Listeners
  const notifTrigger = document.getElementById('navNotifTrigger');
  const notifDropdown = document.getElementById('navNotifDropdown');
  const userTrigger = document.getElementById('authUserTrigger');
  const userDropdown = document.getElementById('authUserDropdown');
  const markAllBtn = document.getElementById('dropdownMarkAllReadBtn');
  const notifListEl = document.getElementById('notifDropdownList');

  if (notifListEl) {
    attachDropdownNotifListeners(notifListEl);
  }

  if (notifTrigger && notifDropdown) {
    notifTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown?.classList.remove('open');
      userTrigger?.setAttribute('aria-expanded', 'false');

      const isOpen = notifDropdown.classList.contains('open');
      notifDropdown.classList.toggle('open', !isOpen);
      notifTrigger.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  if (markAllBtn) {
    markAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.markAllNotifsRead();
      if (typeof showToast === 'function') {
        showToast('All Caught Up', 'All notifications marked as read.');
      }
    });
  }

  if (userTrigger && userDropdown) {
    userTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown?.classList.remove('open');
      notifTrigger?.setAttribute('aria-expanded', 'false');

      const isOpen = userDropdown.classList.contains('open');
      userDropdown.classList.toggle('open', !isOpen);
      userTrigger.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  document.addEventListener('click', (e) => {
    if (notifDropdown && !notifDropdown.contains(e.target) && !notifTrigger?.contains(e.target)) {
      notifDropdown.classList.remove('open');
      notifTrigger?.setAttribute('aria-expanded', 'false');
    }
    if (userDropdown && !userDropdown.contains(e.target) && !userTrigger?.contains(e.target)) {
      userDropdown.classList.remove('open');
      userTrigger?.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      notifDropdown?.classList.remove('open');
      userDropdown?.classList.remove('open');
      notifTrigger?.setAttribute('aria-expanded', 'false');
      userTrigger?.setAttribute('aria-expanded', 'false');
    }
  });

  const logoutBtn = document.getElementById('authLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (typeof clearSession === 'function') clearSession();
      if (typeof showToast === 'function') {
        showToast('Signed Out', 'You have been signed out of SmartCampus.');
      }
      setTimeout(() => location.reload(), 400);
    });
  }

  // Synchronize notifications with backend API
  window.syncBackendNotifications();
});
