/**
 * 顧客向け 予約一覧（customer/bookings.html）
 */
(function () {
  'use strict';

  const DT = window.KajishiftBookingDateTime;
  if (!DT) {
    console.error('booking-datetime.js must load before customer-bookings.js');
  }

  let activeTab = 'upcoming';
  let currentCancelBookingId = null;

  function unwrapBookingsResponse(response) {
    if (response == null) return [];
    const payload = response.data !== undefined ? response.data : response;
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.bookings)) return payload.bookings;
    return [];
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  async function loadBookings(tabName) {
    const tab = tabName || activeTab;
    const list = document.getElementById('bookings-list');
    const shell = document.getElementById('bookings-shell');
    if (!list || !shell) return;

    list.innerHTML = '<div class="loading-message">読み込み中...</div>';
    shell.classList.remove('is-visible');
    requestAnimationFrame(() => shell.classList.add('is-visible'));

    try {
      const statusByTab = {
        upcoming: 'PENDING,CONFIRMED,IN_PROGRESS',
        past: 'COMPLETED,CANCELLED',
      };

      const response = await api.getBookings({
        status: statusByTab[tab] || statusByTab.upcoming,
        page: 1,
        limit: 100,
      });

      const bookings = unwrapBookingsResponse(response);

      if (bookings.length > 0) {
        displayBookings(bookings, 'bookings-list');
      } else {
        list.innerHTML = '<p class="no-data">予約が見つかりませんでした</p>';
      }
    } catch (error) {
      console.error('予約一覧の取得エラー:', error);
      if (typeof showError === 'function') {
        showError(error.message || '予約一覧の取得に失敗しました。');
      }
      list.innerHTML = '<p class="error-message">データの読み込みに失敗しました</p>';
    }
  }

  function displayBookings(bookings, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    bookings.forEach((booking) => {
      container.appendChild(createBookingCard(booking));
    });
  }

  function generateStars(rating) {
    const r = Number(rating);
    if (!Number.isFinite(r)) return '☆☆☆☆☆';
    const fullStars = Math.floor(r);
    const hasHalfStar = r % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
  }

  function createBookingCard(booking) {
    const card = document.createElement('div');
    const st = booking && booking.status ? String(booking.status) : '';
    card.className = `booking-card-large ${st === 'COMPLETED' || st === 'CANCELLED' ? 'completed' : ''}`;

    const range = DT
      ? DT.formatBookingRangeForCard(booking || {})
      : { dateStr: '日付未設定', timeStr: '時間未設定', hours: 2 };
    const { dateStr, timeStr, hours } = range;

    const statusText =
      {
        PENDING: '予約確定',
        CONFIRMED: '予約確定',
        IN_PROGRESS: '進行中',
        COMPLETED: '完了',
        CANCELLED: 'キャンセル',
      }[st] || st || '—';

    const statusClass = st ? st.toLowerCase().replace(/_/g, '-') : '';

    const workerName = booking.worker ? booking.worker.name : '未割り当て';
    const workerRating =
      booking.worker && booking.worker.rating != null
        ? Number(booking.worker.rating).toFixed(1)
        : null;

    let price = booking.totalAmount || 0;
    if (!price && booking.worker && booking.worker.hourlyRate && booking.duration) {
      price = booking.worker.hourlyRate * booking.duration;
    }

    const bid = booking && booking.id ? String(booking.id) : '';

    let actionsHtml = '';
    if (st === 'COMPLETED' || st === 'CANCELLED') {
      if (st === 'COMPLETED' && !booking.reviewed) {
        actionsHtml = `
        <button type="button" class="btn btn-outline" onclick="window.__customerBookings.openReviewModal('${bid}')">レビューを書く</button>
        <a href="booking-detail.html?id=${bid}" class="btn btn-primary">詳細を見る</a>
      `;
      } else {
        actionsHtml = `
        <span class="reviewed-badge">${booking.reviewed ? 'レビュー済み' : ''}</span>
        <a href="booking-detail.html?id=${bid}" class="btn btn-primary">詳細を見る</a>
      `;
      }
    } else {
      actionsHtml = `
      <button type="button" class="btn btn--outline btn-action" onclick="window.__customerBookings.goToChangeBooking('${bid}')">予約変更</button>
      <button type="button" class="btn btn--outline btn-action" onclick="window.__customerBookings.openChat('${bid}')">チャット</button>
      <button type="button" class="btn btn--outline btn-action danger" onclick="window.__customerBookings.openCancelModal('${bid}')">キャンセル</button>
      <a href="booking-detail.html?id=${bid}" class="btn btn-primary">詳細を見る</a>
    `;
    }

    card.innerHTML = `
    <div class="booking-card-header">
      <div class="booking-date-spot">
        <div class="booking-date-icon" aria-hidden="true">📅</div>
        <div class="booking-date-time-large">
          <div class="date-large">${escapeHtml(dateStr)}</div>
          <div class="time-large">${escapeHtml(timeStr)}（${escapeHtml(String(hours))}時間）</div>
        </div>
      </div>
      <span class="booking-status ${escapeHtml(statusClass)}">${escapeHtml(statusText)}</span>
    </div>

    <div class="booking-card-body">
      <div class="booking-service">
        <h3>${escapeHtml(booking.serviceType || 'サービス')}</h3>
        <p class="booking-address">📍 ${escapeHtml(booking.address || '住所未設定')}</p>
      </div>

      ${
        booking.worker
          ? `
      <div class="booking-worker-info">
        <div class="worker-avatar-small">👤</div>
        <div class="worker-info-text">
          <h4>${escapeHtml(workerName)}</h4>
          ${
            workerRating
              ? `
          <div class="worker-rating-small">
            <span class="stars">${generateStars(workerRating)}</span>
            <span class="rating-score">${escapeHtml(workerRating)}</span>
          </div>
          `
              : ''
          }
        </div>
      </div>
      `
          : ''
      }

      <div class="booking-price">
        <span class="price-label">${st === 'COMPLETED' || st === 'CANCELLED' ? '支払済み' : '料金'}</span>
        <span class="price-amount">${price > 0 ? '¥' + Number(price).toLocaleString() : '未確定'}</span>
      </div>

      ${
        booking.notes
          ? `
      <div class="booking-notes">
        <h4>依頼内容</h4>
        <p>${escapeHtml(booking.notes)}</p>
      </div>
      `
          : ''
      }

      ${
        st !== 'COMPLETED' && st !== 'CANCELLED'
          ? `
      <div class="cancellation-info">
        <p class="info-text">
          <strong>予約変更について:</strong> 48時間前まで無料で変更可能です<br>
          <strong>キャンセル料:</strong> 48-24時間前は50%、24時間以内は100%
        </p>
      </div>
      `
          : ''
      }
    </div>

    <div class="booking-card-actions">
      ${actionsHtml}
    </div>
  `;

    return card;
  }

  /**
   * 予約変更：まず日時・住所の確認・変更（booking.html）へ（PUT 後にワーカー選択へ進む）
   */
  function goToChangeBooking(bookingId) {
    if (!bookingId) {
      if (typeof showError === 'function') showError('予約IDが取得できませんでした');
      return;
    }
    const me = typeof api.getUser === 'function' ? api.getUser() : null;
    if (!me || String(me.role || '').toUpperCase() !== 'CUSTOMER') {
      if (typeof showError === 'function') showError('ログイン情報を確認してください');
      return;
    }
    window.location.href = `booking.html?id=${encodeURIComponent(bookingId)}`;
  }

  function openCancelModal(id) {
    currentCancelBookingId = id;
    const el = document.getElementById('cancelModal');
    if (el) el.classList.add('is-open');
  }

  function openChat(id) {
    window.location.href = 'chat.html?booking=' + encodeURIComponent(id);
  }

  function openReviewModal(id) {
    window.location.href = `booking-detail.html?id=${encodeURIComponent(id)}&review=true`;
  }

  function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('is-open');
    if (modalId === 'cancelModal') currentCancelBookingId = null;
  }

  async function confirmCancel() {
    if (!currentCancelBookingId) return;
    if (!confirm('本当にキャンセルしますか？')) return;

    try {
      await api.cancelBooking(currentCancelBookingId);
      if (typeof showSuccess === 'function') showSuccess('予約をキャンセルしました');
      closeModal('cancelModal');
      await loadBookings(activeTab);
    } catch (error) {
      console.error('キャンセルエラー:', error);
      if (typeof showError === 'function') {
        showError(error.message || '予約のキャンセルに失敗しました');
      }
    }
  }

  window.__customerBookings = {
    goToChangeBooking,
    openCancelModal,
    openChat,
    openReviewModal,
    closeModal,
    confirmCancel,
    loadBookings,
  };

  window.closeModal = closeModal;
  window.confirmCancel = confirmCancel;

  document.addEventListener('DOMContentLoaded', async function () {
    if (typeof checkAuth === 'function' && !checkAuth('customer')) {
      return;
    }

    await loadBookings(activeTab);

    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', async function () {
        const tab = this.dataset.tab;
        if (!tab || tab === activeTab) return;

        document.querySelectorAll('.tab-btn').forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        this.classList.add('active');
        this.setAttribute('aria-selected', 'true');

        activeTab = tab;
        await loadBookings(activeTab);
      });
    });
  });

  window.onclick = function (event) {
    if (event.target.classList && event.target.classList.contains('modal')) {
      event.target.classList.remove('is-open');
    }
  };
})();
