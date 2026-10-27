/**
 * SmartCampus Notifications Controller (Full Center View)
 * Handles full-page notifications list, filters (All / Unread), and real-time read synchronization.
 */

function getNotificationsSafe() {
  if (typeof window.getStoredNotifications === 'function') {
    return window.getStoredNotifications();
  }
  try {
    const raw = localStorage.getItem('smartcampus-notifications');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

let activeFilter = 'all';

window.renderFullNotifications = function() {
  const container = document.getElementById('notificationList');
  if (!container) return;

  const notifs = getNotificationsSafe();
  const list = notifs.filter(n => {
    if (activeFilter === 'unread') return n.unread;
    return true;
  });

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔔</div>
        <h3>No ${activeFilter === 'unread' ? 'unread ' : ''}notifications</h3>
        <p>You are completely caught up with campus updates.</p>
      </div>`;
    return;
  }

  const safe = typeof window.safeText === 'function' ? window.safeText : (v => String(v ?? ''));

  container.innerHTML = list.map(item => `
    <article class="notification ${item.unread ? 'unread' : ''}" data-notif-id="${item.id}" tabindex="0">
      <div class="notification-icon ${item.type || 'system'}">
        ${item.type === 'claim' ? '📝' : item.type === 'match' ? '⚡' : item.type === 'verified' ? '✓' : '📢'}
      </div>
      <div class="notification-body">
        <div class="notification-top">
          <strong>${safe(item.title)}</strong>
          <time>${safe(item.time)}</time>
        </div>
        <p>${safe(item.message)}</p>
        <div class="notification-actions">
          ${item.reportId ? `<a class="btn-subtle" href="browse.html" onclick="event.stopPropagation(); window.markNotifRead(${item.id});">View report →</a>` : ''}
          ${item.unread ? `<button class="mark-read-btn" type="button" data-mark-btn="${item.id}">Mark as read</button>` : '<span class="status-read">✓ Read</span>'}
        </div>
      </div>
    </article>
  `).join('');

  // Attach click listener to each article to mark read on click
  container.querySelectorAll('.notification').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't double trigger if clicking link
      if (e.target.closest('a')) return;
      const id = Number(card.dataset.notifId);
      if (typeof window.markNotifRead === 'function') {
        window.markNotifRead(id);
      }
    });
  });

  // Attach button-specific listener
  container.querySelectorAll('[data-mark-btn]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.markBtn);
      if (typeof window.markNotifRead === 'function') {
        window.markNotifRead(id);
      }
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  window.renderFullNotifications();
  if (typeof window.syncBackendNotifications === 'function') {
    window.syncBackendNotifications().then(() => window.renderFullNotifications());
  }

  // Filter tabs
  document.querySelectorAll('[data-notif-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-notif-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.notifFilter;
      window.renderFullNotifications();
    });
  });

  // Mark all read button
  const markAllBtn = document.getElementById('markAllRead');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      if (typeof window.markAllNotifsRead === 'function') {
        window.markAllNotifsRead();
      }
      window.renderFullNotifications();
      if (typeof showToast === 'function') {
        showToast('All Caught Up', 'All notifications marked as read.');
      }
    });
  }
});
