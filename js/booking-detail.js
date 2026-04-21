// 認証チェックとデータ読み込み
document.addEventListener('DOMContentLoaded', async function() {
  // 認証チェック
  if (!checkAuth('customer')) {
    return; // リダイレクトされる
  }
  
  // URLパラメータから予約IDを取得
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('id');
  
  if (!bookingId) {
    showError('予約IDが指定されていません');
    setTimeout(() => {
      window.location.href = 'bookings.html';
    }, 2000);
    return;
  }
  
  // UUID形式の簡易バリデーション（数値のみのIDは無効）
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(bookingId)) {
    showError('無効な予約IDです。予約一覧から正しい予約を選択してください。');
    document.getElementById('booking-detail-card').innerHTML = `
      <div class="error-message">
        <p><strong>無効な予約ID</strong></p>
        <p>予約IDはUUID形式である必要があります。</p>
        <p class="text-muted mt-md text-sm">
          予約ID: ${bookingId}<br>
          予約一覧から正しい予約を選択してください。
        </p>
        <div class="mt-md">
          <a href="bookings.html" class="btn btn--outline btn-action">予約一覧に戻る</a>
        </div>
      </div>
    `;
    return;
  }
  
  // 予約詳細を読み込む
  await loadBookingDetail(bookingId);
});

let currentBooking = null;

// 予約詳細を読み込む
async function loadBookingDetail(bookingId) {
  try {
    console.log('予約詳細を読み込み中... bookingId:', bookingId);
    
    if (!bookingId) {
      throw new Error('予約IDが指定されていません');
    }
    
    const response = await api.getBookingById(bookingId);
    console.log('APIレスポンス:', response);
    
    // レスポンスの形式を確認
    currentBooking = response.data || response;
    
    if (!currentBooking) {
      throw new Error('予約が見つかりません');
    }
    
    console.log('予約データ:', currentBooking);
    
    // 予約詳細を表示
    displayBookingDetail(currentBooking);
    
    // ワーカー情報を表示（ワーカーが選択されている場合）
    if (currentBooking.worker) {
      displayWorkerInfo(currentBooking.worker);
    }
    
    // 地図セクションを表示
    if (currentBooking.address) {
      document.getElementById('map-address').textContent = currentBooking.address;
      document.getElementById('map-section').classList.remove('is-hidden');
    }

    // レビューセクションを表示（完了済みの予約の場合）
    if (currentBooking.status === 'COMPLETED') {
      await loadReviewSection(currentBooking);
    }
  } catch (error) {
    console.error('予約詳細の取得エラー:', error);
    console.error('エラー詳細:', {
      message: error.message,
      stack: error.stack,
      bookingId: bookingId
    });
    
    const errorMessage = error.message || '予約詳細の取得に失敗しました';
    showError(errorMessage);
    
    document.getElementById('booking-detail-card').innerHTML = `
      <div class="error-message">
        <p><strong>データの読み込みに失敗しました</strong></p>
        <p>${errorMessage}</p>
        <p class="text-muted mt-md text-sm">
          予約ID: ${bookingId || '未指定'}<br>
          ブラウザのコンソール（F12）で詳細なエラー情報を確認できます。
        </p>
        <div class="mt-md">
          <a href="bookings.html" class="btn btn--outline btn-action">予約一覧に戻る</a>
        </div>
      </div>
    `;
  }
}

// 予約詳細を表示
function displayBookingDetail(booking) {
  const headerEl = document.getElementById('bookingDetailHeader');
  const infoCard = document.getElementById('booking-info-card');
  
  const scheduledDate = new Date(booking.scheduledDate);
  const dateStr = scheduledDate.toLocaleDateString('ja-JP', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'short'
  });
  
  const startTime = booking.startTime || '';
  const duration = booking.duration || 0;
  let timeStr = '';
  if (startTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const endMinutes = startHour * 60 + startMin + (duration * 60);
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    timeStr = `${startTime}-${endTime}（${duration}時間）`;
  } else {
    timeStr = '時間未設定';
  }
  
  const statusText = {
    'PENDING': '予約確定',
    'CONFIRMED': '予約確定',
    'IN_PROGRESS': '進行中',
    'COMPLETED': '完了',
    'CANCELLED': 'キャンセル'
  }[booking.status] || booking.status;
  
  const statusClass = booking.status.toLowerCase().replace('_', '-');
  
  const price = booking.totalAmount || 0;
  const priceDisplay = price > 0 ? `¥${price.toLocaleString()}` : '未確定';
  
  const workerName = booking.worker ? booking.worker.name : '未割り当て';
  const workerRating = booking.worker && booking.worker.rating ? booking.worker.rating.toFixed(1) : null;
  
  let actionsHtml = '';
  if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
    // 過去の予約
    actionsHtml = `
      <a href="bookings.html" class="btn btn--outline btn-action">予約一覧に戻る</a>
    `;
  } else {
    // 今後の予約
    actionsHtml = `
      ${booking.worker ? `<button class="btn btn--outline btn-action" onclick="window.location.href='chat.html?booking=${booking.id}'">チャット</button>` : ''}
      <button class="btn btn--outline btn-action" onclick="window.location.href='booking.html?id=${booking.id}'">予約変更</button>
      <button class="btn btn--outline btn-action danger" onclick="openCancelModal()">キャンセル</button>
    `;
  }
  
  // ヘッダー（サービス名＋ステータス＋ステップ）
  headerEl.innerHTML = `
    <div class="header-main">
      <h1 class="service-title">${booking.serviceType || 'サービス'}</h1>
      <span class="booking-status ${statusClass}">${statusText}</span>
      <div class="booking-price-large">${priceDisplay}</div>
    </div>
    <ol class="status-steps">
      <li class="step ${['CONFIRMED','PENDING','IN_PROGRESS','COMPLETED'].includes(booking.status) ? 'is-active' : ''}">
        <span class="step-dot"></span><span class="step-label">予約確定</span>
      </li>
      <li class="step ${['IN_PROGRESS','COMPLETED'].includes(booking.status) ? 'is-active' : ''}">
        <span class="step-dot"></span><span class="step-label">作業中</span>
      </li>
      <li class="step ${['COMPLETED'].includes(booking.status) ? 'is-active' : ''}">
        <span class="step-dot"></span><span class="step-label">完了</span>
      </li>
    </ol>
  `;

  // メイン情報カード
  infoCard.innerHTML = `
    <div class="info-grid">
      <div class="info-item">
        <div class="info-icon">📅</div>
        <div class="info-text">
          <div class="info-title">日時</div>
          <div class="info-value">${dateStr} ${timeStr}</div>
        </div>
      </div>
      <div class="info-item">
        <div class="info-icon">📍</div>
        <div class="info-text">
          <div class="info-title">場所</div>
          <div class="info-value">${booking.address || '住所未設定'}</div>
        </div>
      </div>
      <div class="info-item">
        <div class="info-icon">💳</div>
        <div class="info-text">
          <div class="info-title">料金</div>
          <div class="info-value">${priceDisplay}</div>
        </div>
      </div>
    </div>

    <section class="booking-notes">
      <h2>依頼内容</h2>
      <p>${booking.notes || '特記事項なし'}</p>
    </section>

    <div class="booking-detail-actions">
      ${actionsHtml}
    </div>
  `;

  // モバイル固定アクション（チャット優先）
  const fixedBar = document.getElementById('fixedActionBar');
  if (booking.worker && booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED') {
    fixedBar.classList.remove('is-hidden');
    fixedBar.innerHTML = `
      <button class="btn btn-primary btn-action" onclick="window.location.href='chat.html?booking=${booking.id}'">チャットで連絡</button>
    `;
  } else {
    fixedBar.classList.add('is-hidden');
  }
}

// ワーカー情報を表示
function displayWorkerInfo(worker) {
  const workerCard = document.getElementById('worker-info-card');
  const workerDetails = document.getElementById('worker-details');
  const existingActions = workerCard.querySelector('.worker-actions');
  if (existingActions) {
    existingActions.remove();
  }
  
  const rating = worker.rating ? worker.rating.toFixed(1) : null;
  const reviewCount = worker.reviewCount || 0;
  const hourlyRate = worker.hourlyRate ? `¥${worker.hourlyRate.toLocaleString()}/時` : '';
  
  workerDetails.innerHTML = `
    <div class="worker-avatar-large">👤</div>
    <div class="worker-text">
      <h3>${worker.name}</h3>
      ${rating ? `
      <div class="worker-rating">
        <span class="stars">${generateStars(rating)}</span>
        <span class="rating-score">${rating}</span>
        <span class="rating-count">（評価数: ${reviewCount}件）</span>
      </div>
      ` : ''}
      ${hourlyRate ? `
      <div class="worker-stats-small">
        <span>時給: ${hourlyRate}</span>
      </div>
      ` : ''}
      ${worker.bio ? `
      <p class="worker-bio">${worker.bio}</p>
      ` : ''}
    </div>
  `;
  
  workerCard.classList.remove('is-hidden');
  
  // ワーカーのアクションボタン
  const workerActions = document.createElement('div');
  workerActions.className = 'worker-actions btn-group';
  const status = currentBooking ? currentBooking.status : '';

  const profileBtnEl = document.createElement('button');
  profileBtnEl.type = 'button';
  profileBtnEl.className = 'btn btn--outline btn-action';
  profileBtnEl.textContent = 'プロフィールを見る';
  if (status === 'PENDING' && currentBooking && currentBooking.id) {
    profileBtnEl.addEventListener('click', () => {
      window.location.href = `select-worker.html?id=${encodeURIComponent(currentBooking.id)}`;
    });
  } else {
    profileBtnEl.addEventListener('click', () => openWorkerProfileModal(worker.id));
  }
  workerActions.appendChild(profileBtnEl);

  if (currentBooking && currentBooking.status !== 'COMPLETED' && currentBooking.status !== 'CANCELLED') {
    const chatBtn = document.createElement('button');
    chatBtn.type = 'button';
    chatBtn.className = 'btn btn-primary btn-action';
    chatBtn.textContent = 'チャットで連絡';
    chatBtn.addEventListener('click', () => {
      window.location.href = `chat.html?booking=${currentBooking.id}`;
    });
    workerActions.appendChild(chatBtn);
  }

  workerCard.appendChild(workerActions);
}

async function openWorkerProfileModal(workerId) {
  const contentEl = document.getElementById('workerProfileContent');
  const modalEl = document.getElementById('workerProfileModal');
  if (!contentEl || !modalEl) return;

  contentEl.innerHTML = '<div class="loading-message">読み込み中...</div>';
  modalEl.classList.add('is-open');

  try {
    const response = await api.getWorkerById(workerId);
    const worker = response.data != null ? response.data : response;

    if (!worker) {
      throw new Error('ワーカー情報が取得できませんでした');
    }

    const rating = worker.rating || 0;
    const reviewCount = worker.reviewCount || 0;
    const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
    const hourlyRate = worker.hourlyRate || 0;

    const content = `
      <div class="admin-card">
        <div class="text-center mb-lg">
          <div class="text-4xl mb-sm">👤</div>
          <h2 class="mb-sm">${escapeHtml(worker.name || '名前未設定')}</h2>
          <div class="mb-sm">
            <span class="stars">${stars}</span>
            <span class="rating-score">${rating.toFixed(1)}</span>
            <span class="rating-count">（評価数: ${reviewCount}件）</span>
          </div>
        </div>

        <div class="worker-stats worker-profile-stats mb-lg">
          <div class="stat-item">
            <span class="stat-label">時給</span>
            <span class="stat-value no-wrap">¥${hourlyRate.toLocaleString()}/時間</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">実績</span>
            <span class="stat-value no-wrap">${reviewCount}件</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">完了予約数</span>
            <span class="stat-value no-wrap">${worker.completedBookings || 0}件</span>
          </div>
        </div>

        ${worker.bio ? `
        <div class="mb-lg">
          <label class="form-label">自己紹介</label>
          <div class="bg-light rounded-md p-3 whitespace-pre-wrap">${escapeHtml(worker.bio)}</div>
        </div>
        ` : ''}

        <div id="workerProfileReviews" class="mt-lg">
          <h3 class="mb-md">レビュー</h3>
          <div class="loading-message-small">レビューを読み込み中...</div>
        </div>
      </div>
    `;

    contentEl.innerHTML = content;
    await loadWorkerProfileReviewsForDetail(workerId);
  } catch (error) {
    console.error('ワーカープロフィールの読み込みエラー:', error);
    showError('ワーカープロフィールの読み込みに失敗しました: ' + (error.message || 'エラーが発生しました'));
    contentEl.innerHTML = '<div class="error-message">プロフィールを表示できませんでした。</div>';
  }
}

async function loadWorkerProfileReviewsForDetail(workerId) {
  try {
    const response = await api.getReviewsByWorkerId(workerId, { limit: 5 });
    const reviews = (response.data && response.data.reviews) || response.reviews || [];

    const reviewsElement = document.getElementById('workerProfileReviews');
    if (!reviewsElement) return;

    if (reviews.length === 0) {
      reviewsElement.innerHTML = '<h3 class="mb-md">レビュー</h3><div class="empty-message-small">レビューがありません</div>';
      return;
    }

    const reviewsHTML = reviews.map((review) => {
      const s = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      const date = new Date(review.createdAt);
      const dateStr = date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return `
        <div class="bg-light rounded-md p-4 mb-md">
          <div class="flex justify-between mb-sm">
            <span class="stars">${s}</span>
            <span class="text-sm text-muted">${dateStr}</span>
          </div>
          ${review.comment ? `<p class="whitespace-pre-wrap no-margin">${escapeHtml(review.comment)}</p>` : ''}
        </div>
      `;
    }).join('');

    reviewsElement.innerHTML = `
      <h3 class="mb-md">レビュー</h3>
      ${reviewsHTML}
    `;
  } catch (error) {
    console.error('レビュー読み込みエラー:', error);
    const reviewsElement = document.getElementById('workerProfileReviews');
    if (reviewsElement) {
      reviewsElement.innerHTML =
        '<h3 class="mb-md">レビュー</h3><div class="error-message-small">レビューの読み込みに失敗しました</div>';
    }
  }
}

function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 星評価を生成
function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
}

let currentCancelBookingId = null;

function openCancelModal() {
  if (!currentBooking) return;
  
  currentCancelBookingId = currentBooking.id;
  
  // キャンセル料を計算
  const now = new Date();
  const scheduledDate = new Date(currentBooking.scheduledDate);
  const hoursUntilBooking = (scheduledDate - now) / (1000 * 60 * 60);
  
  let cancelFee = 0;
  let feeText = '¥0（48時間以上前のため）';
  
  if (hoursUntilBooking < 24) {
    cancelFee = currentBooking.totalAmount || 0;
    feeText = `¥${cancelFee.toLocaleString()}（24時間以内のため100%）`;
  } else if (hoursUntilBooking < 48) {
    cancelFee = Math.floor((currentBooking.totalAmount || 0) * 0.5);
    feeText = `¥${cancelFee.toLocaleString()}（48-24時間前のため50%）`;
  }
  
  // キャンセル料情報を更新
  const feeAmountElement = document.querySelector('.fee-amount');
  if (feeAmountElement) {
    feeAmountElement.innerHTML = `今回のキャンセル料: <strong>${feeText}</strong>`;
  }
  
  document.getElementById('cancelModal').classList.add('is-open');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('is-open');
  currentCancelBookingId = null;
}

async function confirmCancel() {
  if (!currentCancelBookingId) return;
  
  if (confirm('本当にキャンセルしますか？')) {
    try {
      await api.cancelBooking(currentCancelBookingId);
      showSuccess('予約をキャンセルしました');
      closeModal('cancelModal');
      // 予約一覧にリダイレクト
      setTimeout(() => {
        window.location.href = 'bookings.html';
      }, 1000);
    } catch (error) {
      console.error('キャンセルエラー:', error);
      showError(error.message || '予約のキャンセルに失敗しました');
    }
  }
}

// レビューセクションを読み込む
async function loadReviewSection(booking) {
  const reviewSection = document.getElementById('review-section');
  const reviewContent = document.getElementById('review-content');
  
  reviewSection.classList.remove('is-hidden');

  // 予約にレビューが既に存在するかチェック
  if (booking.review) {
    // 既存のレビューを表示
    displayExistingReview(booking.review);
  } else {
    // レビュー投稿フォームを表示
    displayReviewForm(booking);
  }
}

// 既存のレビューを表示
function displayExistingReview(review) {
  const reviewContent = document.getElementById('review-content');
  
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const date = new Date(review.createdAt);
  const dateStr = date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  reviewContent.innerHTML = `
    <div class="review-card">
      <div class="review-header">
        <div class="review-rating">
          <span class="stars">${stars}</span>
          <span class="rating-score">${review.rating}.0</span>
        </div>
        <div class="review-date">${dateStr}</div>
      </div>
      ${review.comment ? `
      <div class="review-comment">
        <p>${escapeHtml(review.comment)}</p>
      </div>
      ` : ''}
    </div>
  `;
}

// レビュー投稿フォームを表示
function displayReviewForm(booking) {
  const reviewContent = document.getElementById('review-content');
  
  reviewContent.innerHTML = `
    <div class="review-form-card">
      <p>この予約についてレビューを投稿してください。</p>
      <button class="btn btn-primary btn-action" onclick="openReviewModal('${booking.id}')">レビューを投稿する</button>
    </div>
  `;
}

// レビューモーダルを開く
function openReviewModal(bookingId) {
  currentReviewBookingId = bookingId;
  document.getElementById('reviewForm').reset();
  document.getElementById('reviewModal').classList.add('is-open');
}

let currentReviewBookingId = null;

// レビューフォーム送信
document.getElementById('reviewForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentReviewBookingId) {
    showError('予約IDが取得できません');
    return;
  }

  const rating = document.querySelector('input[name="rating"]:checked');
  if (!rating) {
    showError('評価を選択してください');
    return;
  }

  const comment = document.getElementById('reviewComment').value.trim();

  try {
    await api.createReview({
      bookingId: currentReviewBookingId,
      rating: parseInt(rating.value),
      comment: comment || null
    });

    showSuccess('レビューを投稿しました');
    closeModal('reviewModal');
    
    // 予約詳細を再読み込み
    await loadBookingDetail(currentReviewBookingId);
  } catch (error) {
    console.error('レビュー投稿エラー:', error);
    showError('レビューの投稿に失敗しました: ' + (error.message || 'エラーが発生しました'));
  }
});

window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.classList.remove('is-open');
  }
}
