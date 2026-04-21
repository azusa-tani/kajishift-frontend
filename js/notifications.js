/**
 * 依頼者向け通知一覧（customer/notifications.html）
 */
let currentPage = 1;
let totalPages = 1;
let currentFilters = {};

function getUnreadCountFromResponse(response) {
  if (!response) return 0;
  if (response.data && typeof response.data.count === 'number') return response.data.count;
  if (typeof response.count === 'number') return response.count;
  return 0;
}

document.addEventListener('DOMContentLoaded', async function () {
  if (!checkAuth('customer')) {
    return;
  }

  const token = localStorage.getItem('token');
  if (token && typeof socketManager !== 'undefined') {
    socketManager.ensureConnected(token);

    socketManager.onUnreadCount((count) => {
      updateNotificationBadge(count);
    });

    socketManager.onNotification((notification) => {
      addNotificationToList(notification);
      updateUnreadCount();
    });
  }

  document.getElementById('markAllRead')?.addEventListener('click', markAllAsRead);
  document.getElementById('filterStatus')?.addEventListener('change', () => loadNotifications(1));
  document.getElementById('filterType')?.addEventListener('change', () => loadNotifications(1));
  document.getElementById('prevBtn')?.addEventListener('click', () => changePage(-1));
  document.getElementById('nextBtn')?.addEventListener('click', () => changePage(1));

  const listEl = document.getElementById('notifications-list');
  listEl?.addEventListener('click', onNotificationListClick);

  await updateUnreadCount();
  await loadNotifications(1);
});

async function updateUnreadCount() {
  try {
    const response = await api.getUnreadNotificationCount();
    const count = getUnreadCountFromResponse(response);
    const notificationBadge = document.querySelector('.notification-badge');
    if (notificationBadge) {
      if (count > 0) {
        notificationBadge.textContent = String(count);
        notificationBadge.classList.remove('is-hidden');
      } else {
        notificationBadge.classList.add('is-hidden');
      }
    }
  } catch (error) {
    console.error('未読通知数取得エラー:', error);
  }
}

async function loadNotifications(page = 1) {
  const listElement = document.getElementById('notifications-list');
  if (!listElement) return;

  try {
    currentPage = page;

    const isRead = document.getElementById('filterStatus').value;
    const type = document.getElementById('filterType').value;

    currentFilters = {};
    if (isRead !== '') {
      currentFilters.isRead = isRead === 'true';
    }
    if (type !== '') {
      currentFilters.type = type;
    }
    currentFilters.page = page;
    currentFilters.limit = 20;

    listElement.innerHTML = getLoadingHTML();

    const response = await api.getNotifications(currentFilters);
    const payload = response && response.data != null ? response.data : response;
    const notifications = payload.notifications || [];
    const pagination = payload.pagination || { page: 1, totalPages: 1 };

    displayNotifications(notifications);
    updatePagination(pagination);
    await updateUnreadCount();
  } catch (error) {
    console.error('通知一覧取得エラー:', error);
    showError('通知一覧の取得に失敗しました: ' + (error.message || 'エラーが発生しました'));
    listElement.innerHTML =
      '<div class="notifications-error" role="alert">通知一覧の取得に失敗しました。しばらくしてから再度お試しください。</div>';
  }
}

function getLoadingHTML() {
  return `
    <div class="notifications-loading" role="status" aria-live="polite">
      <span class="notifications-loading__spinner" aria-hidden="true"></span>
      <span class="notifications-loading__text">読み込み中...</span>
    </div>`;
}

function formatNotificationDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const datePart = d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  const timePart = d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${datePart} ${timePart}`;
}

function getNotificationTypeIcon(type) {
  const icons = {
    MESSAGE: '💬',
    BOOKING: '📋',
    BOOKING_UPDATE: '✅',
    BOOKING_CREATED: '📅',
    BOOKING_CANCELLED: '🚫',
    REVIEW: '⭐',
    PAYMENT: '💳',
    PAYMENT_FAILED: '⚠️',
    SYSTEM: 'ℹ️',
    WORKER_APPROVED: '✅',
    WORKER_REJECTED: '❌',
  };
  return icons[type] || '🔔';
}

function getNotificationTypeLabel(type) {
  const typeLabels = {
    MESSAGE: 'メッセージ',
    BOOKING: '予約',
    BOOKING_UPDATE: '予約更新',
    BOOKING_CREATED: '予約作成',
    BOOKING_CANCELLED: '予約キャンセル',
    REVIEW: 'レビュー',
    PAYMENT: '決済',
    PAYMENT_FAILED: '決済失敗',
    SYSTEM: 'システム',
    WORKER_APPROVED: 'ワーカー承認',
    WORKER_REJECTED: 'ワーカー却下',
  };
  return typeLabels[type] || type;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

function resolveNotificationNavigateUrl(notification) {
  const relatedType = notification.relatedType;
  const relatedId = notification.relatedId;
  const type = notification.type;

  if (type === 'MESSAGE' && relatedId) {
    return `chat.html?bookingId=${encodeURIComponent(relatedId)}`;
  }
  if (relatedId && (relatedType === 'BOOKING' || relatedType === 'BOOKING_ID')) {
    return `booking-detail.html?id=${encodeURIComponent(relatedId)}`;
  }
  if (
    relatedId &&
    (type === 'BOOKING_UPDATE' ||
      type === 'BOOKING_CREATED' ||
      type === 'BOOKING_CANCELLED' ||
      type === 'REVIEW' ||
      type === 'PAYMENT' ||
      type === 'PAYMENT_FAILED')
  ) {
    return `booking-detail.html?id=${encodeURIComponent(relatedId)}`;
  }
  return null;
}

function buildNotificationCardHTML(notification) {
  const dateStr = formatNotificationDateTime(notification.createdAt || notification.created_at);
  const icon = getNotificationTypeIcon(notification.type);
  const typeLabel = getNotificationTypeLabel(notification.type);
  const unreadClass = notification.isRead ? '' : ' unread';
  const navigateUrl = resolveNotificationNavigateUrl(notification);
  const navAttr = navigateUrl ? `data-navigate-url="${escapeHtml(navigateUrl)}"` : '';

  const unreadBadge = !notification.isRead
    ? '<span class="notification-card__unread-badge" aria-label="未読">未読</span>'
    : '';

  return `
    <article class="notification-card${unreadClass}" data-id="${escapeHtml(notification.id)}" data-read="${notification.isRead ? 'true' : 'false'}" ${navAttr} tabindex="0" role="button">
      <div class="notification-card__icon-wrap" aria-hidden="true">
        <span class="notification-card__icon notification-icon">${icon}</span>
      </div>
      <div class="notification-card__main">
        <div class="notification-card__row-top">
          <span class="notification-card__badge">${escapeHtml(typeLabel)}</span>
          <div class="notification-card__row-top-meta">
            ${unreadBadge}
            <time class="notification-card__time" datetime="${escapeHtml(notification.createdAt || '')}">${escapeHtml(dateStr)}</time>
          </div>
        </div>
        <h3 class="notification-card__title">${escapeHtml(notification.title)}</h3>
        <p class="notification-card__preview">${escapeHtml(notification.content || '')}</p>
      </div>
    </article>
  `;
}

function displayNotifications(notifications) {
  const listElement = document.getElementById('notifications-list');

  if (notifications.length === 0) {
    listElement.innerHTML = `
      <div class="notifications-empty" role="status">
        <span class="notifications-empty__icon" aria-hidden="true">📭</span>
        <p class="notifications-empty__title">通知はありません</p>
        <p class="notifications-empty__hint">新しいお知らせが届くと、ここに表示されます。</p>
      </div>`;
    return;
  }

  listElement.innerHTML = notifications.map((n) => buildNotificationCardHTML(n)).join('');
}

function updatePagination(pagination) {
  currentPage = pagination.page;
  totalPages = pagination.totalPages;

  const paginationElement = document.getElementById('pagination');
  const pageInfo = document.getElementById('pageInfo');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (totalPages <= 1) {
    paginationElement.classList.add('is-hidden');
    return;
  }

  paginationElement.classList.remove('is-hidden');
  pageInfo.textContent = `${currentPage} / ${totalPages}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

function changePage(delta) {
  const newPage = currentPage + delta;
  if (newPage >= 1 && newPage <= totalPages) {
    loadNotifications(newPage);
  }
}

function applyReadStateToCard(card) {
  card.classList.remove('unread');
  card.dataset.read = 'true';
  const badge = card.querySelector('.notification-card__unread-badge');
  if (badge) badge.remove();
}

async function markAsRead(notificationId) {
  await api.markNotificationAsRead(notificationId);
  const safeSel =
    typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
      ? CSS.escape(notificationId)
      : String(notificationId).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const card = document.querySelector(`.notification-card[data-id="${safeSel}"]`);
  if (card) {
    applyReadStateToCard(card);
  }
  await updateUnreadCount();
}

function onNotificationListClick(e) {
  const card = e.target.closest('.notification-card');
  const list = document.getElementById('notifications-list');
  if (!card || !list || !list.contains(card)) return;

  void handleNotificationCardActivate(card);
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const t = e.target;
  if (!t || !t.classList || !t.classList.contains('notification-card')) return;
  e.preventDefault();
  void handleNotificationCardActivate(t);
});

async function handleNotificationCardActivate(card) {
  const id = card.dataset.id;
  if (!id) return;

  const wasUnread = card.dataset.read !== 'true';

  try {
    if (wasUnread) {
      await markAsRead(id);
    }

    const url = card.getAttribute('data-navigate-url');
    if (url) {
      window.location.href = url;
    }
  } catch (error) {
    console.error('通知の処理エラー:', error);
    showError('通知の更新に失敗しました: ' + (error.message || 'エラーが発生しました'));
  }
}

async function markAllAsRead() {
  if (!confirm('すべての通知を既読にしますか？')) {
    return;
  }

  try {
    await api.markAllNotificationsAsRead();
    showSuccess('すべての通知を既読にしました');

    await loadNotifications(currentPage);
    await updateUnreadCount();
  } catch (error) {
    console.error('すべて既読処理エラー:', error);
    showError('すべて既読処理に失敗しました: ' + (error.message || 'エラーが発生しました'));
  }
}

function addNotificationToList(notification) {
  const listElement = document.getElementById('notifications-list');

  const emptyState = listElement.querySelector('.notifications-empty');
  if (emptyState) {
    emptyState.remove();
  }

  const loading = listElement.querySelector('.notifications-loading');
  if (loading) {
    loading.remove();
  }

  const notificationHTML = buildNotificationCardHTML(notification);
  listElement.insertAdjacentHTML('afterbegin', notificationHTML);
}

function updateNotificationBadge(count) {
  const notificationBadge = document.querySelector('.notification-badge');
  if (notificationBadge) {
    if (count > 0) {
      notificationBadge.textContent = String(count);
      notificationBadge.classList.remove('is-hidden');
    } else {
      notificationBadge.classList.add('is-hidden');
    }
  }
}
