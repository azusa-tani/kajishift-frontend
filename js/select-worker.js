// グローバル変数
let currentBooking = null;
let workers = [];
let selectedWorkerId = null;

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', async function() {
  // 認証チェック
  if (!checkAuth('customer')) {
    return;
  }

  // URLパラメータから予約IDを取得
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('id') || urlParams.get('bookingId');

  if (!bookingId || bookingId === 'undefined') {
    if (typeof showError === 'function') {
      showError('予約IDが指定されていません。予約の流れからやり直してください。');
    }
    setTimeout(() => {
      window.location.href = 'booking.html';
    }, 1500);
    return;
  }

  // 予約情報を取得
  await loadBooking(bookingId);
  
  // ワーカー一覧を取得
  await loadWorkers();

  // モバイル時の料金サマリーフローティング設定
  setupPriceSummaryFloating();
});

// 予約情報を読み込む
async function loadBooking(bookingId) {
  try {
    console.log('Fetching Booking ID:', bookingId);
    const response = await api.getBookingById(bookingId);
    currentBooking = response.data != null ? response.data : response;

    if (!currentBooking || !currentBooking.id) {
      throw new Error('予約が見つかりません');
    }

    const me = typeof api.getUser === 'function' ? api.getUser() : null;
    const customerId = currentBooking.customerId;
    if (customerId && me && me.id && String(customerId) !== String(me.id)) {
      throw new Error('この予約を編集する権限がありません');
    }

    displayBookingSummary(currentBooking);
  } catch (error) {
    console.error('予約情報の読み込みエラー:', error);
    console.dir(error);
    const msg =
      (error && error.message) || '予約情報を読み込めませんでした。予約一覧から開き直してください。';
    if (typeof showError === 'function') {
      showError(msg);
    }
    setTimeout(() => {
      window.location.href = 'bookings.html';
    }, 2000);
  }
}

// 予約サマリーを表示
function displayBookingSummary(booking) {
  if (!booking) {
    document.getElementById('summaryDateTime').textContent = '—';
    document.getElementById('summaryServiceType').textContent = '—';
    document.getElementById('summaryAddress').textContent = '—';
    return;
  }

  const DT = window.KajishiftBookingDateTime;
  if (DT && typeof DT.formatBookingSummaryLine === 'function') {
    const { line } = DT.formatBookingSummaryLine(booking);
    document.getElementById('summaryDateTime').textContent = line;
  } else {
    document.getElementById('summaryDateTime').textContent = '日付未設定';
  }

  document.getElementById('summaryServiceType').textContent = booking.serviceType || '-';
  document.getElementById('summaryAddress').textContent = booking.address || '-';
}

/** 予約の最新住所・依頼内容に基づき GET /workers のクエリを組み立てる（日時はサマリー表示で反映済み） */
function deriveWorkerListParams(booking) {
  const base = { approvalStatus: 'APPROVED', limit: 50 };
  if (!booking) return base;
  const addr = booking.address != null ? String(booking.address).trim() : '';
  const service = booking.serviceType != null ? String(booking.serviceType).trim() : '';
  if (addr) {
    base.area = addr.length > 120 ? addr.slice(0, 120) : addr;
  }
  if (service) {
    base.keyword = service.length > 80 ? service.slice(0, 80) : service;
  }
  return base;
}

// ワーカー一覧を読み込む
async function loadWorkers() {
  try {
    const primary = deriveWorkerListParams(currentBooking);
    let response = await api.getWorkers(primary);
    let list = response.data && response.data.workers;

    if (!list || list.length === 0) {
      const fallbackKeyword = { approvalStatus: 'APPROVED', limit: 50 };
      if (primary.keyword) {
        response = await api.getWorkers({ ...fallbackKeyword, keyword: primary.keyword });
        list = response.data && response.data.workers;
      }
      if (!list || list.length === 0) {
        response = await api.getWorkers(fallbackKeyword);
        list = response.data && response.data.workers;
      }
    }

    if (!Array.isArray(list)) {
      throw new Error('ワーカー一覧の取得に失敗しました');
    }
    workers = list;
    document.getElementById('workerCount').textContent = workers.length;
    displayWorkers(workers);
  } catch (error) {
    console.error('ワーカー一覧の読み込みエラー:', error);
    document.getElementById('workersList').innerHTML = 
      '<div class="error-message">ワーカーの読み込みに失敗しました: ' + (error.message || 'エラーが発生しました') + '</div>';
  }
}

// ワーカー一覧を表示
function displayWorkers(workersList) {
  const container = document.getElementById('workersList');
  
  if (workersList.length === 0) {
    container.innerHTML = '<div class="error-message">利用可能なワーカーが見つかりませんでした</div>';
    return;
  }

  container.innerHTML = workersList.map((worker, index) => {
    const rating = worker.rating || 0;
    const reviewCount = worker.reviewCount || 0;
    const hourlyRate = worker.hourlyRate || 0;
    const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
    
    // 料金を計算
    const duration = currentBooking ? currentBooking.duration : 0;
    const totalPrice = hourlyRate * duration;

    return `
      <div class="worker-card worker-card--modern" data-worker-id="${worker.id}" data-hourly-rate="${hourlyRate}">
        <button class="btn-icon btn-favorite" id="favorite-btn-${worker.id}" onclick="toggleFavorite('${worker.id}')" aria-label="お気に入り">
          <span id="favorite-icon-${worker.id}">♡</span>
        </button>
        <div class="worker-select">
          <input type="radio" name="worker" id="worker${index}" value="${worker.id}" />
          <label for="worker${index}"></label>
        </div>
        <div class="worker-content">
          <div class="worker-header-info">
            <div class="worker-avatar">👤</div>
            <div class="worker-basic">
              <h3>${worker.name || '名前未設定'}</h3>
              <div class="worker-rating">
                <span class="stars">${stars}</span>
                <span class="rating-score">${rating.toFixed(1)}</span>
                <span class="rating-count">（評価数: ${reviewCount}件）</span>
              </div>
            </div>
          </div>
          
          <div class="worker-stats worker-stats--highlight">
            <div class="stat-item">
              <span class="stat-label">実績</span>
              <span class="stat-value">${reviewCount}件</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">返信率</span>
              <span class="stat-value">-</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">時給</span>
              <span class="stat-value">¥${hourlyRate.toLocaleString()}</span>
            </div>
          </div>
          
          ${worker.bio ? `
          <div class="worker-bio">
            <p>${worker.bio}</p>
          </div>
          ` : ''}
          
          <div class="worker-reviews-preview" id="reviews-preview-${worker.id}">
            <div class="loading-message-small">レビューを読み込み中...</div>
          </div>
          
          <div class="worker-actions">
            <button class="btn btn-outline btn-small" onclick="viewWorkerProfile('${worker.id}')">プロフィールを見る</button>
            <button class="btn btn-outline btn-small" onclick="chatWithWorker('${worker.id}')">チャットで相談</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // 各ワーカーのレビューを読み込む
  workersList.forEach(worker => {
    loadWorkerReviews(worker.id, 3); // 最新3件を表示
    checkFavoriteStatus(worker.id); // お気に入り状態を確認
  });

  // ワーカー選択のイベントリスナーを設定
  document.querySelectorAll('input[name="worker"]').forEach(radio => {
    radio.addEventListener('change', function() {
      document.querySelectorAll('.worker-card').forEach(card => {
        card.classList.remove('selected');
      });
      if (this.checked) {
        this.closest('.worker-card').classList.add('selected');
        selectedWorkerId = this.value;
        updatePriceSummary(this.value);
      }
    });
  });

  // ソート機能
  document.getElementById('sortSelect').addEventListener('change', function() {
    sortWorkers(this.value);
  });
}

// ワーカーをソート
function sortWorkers(sortBy) {
  const sorted = [...workers];
  
  switch(sortBy) {
    case 'rating':
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'reviewCount':
      sorted.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
      break;
    case 'hourlyRate':
      sorted.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
      break;
  }
  
  displayWorkers(sorted);
}

// ===== 料金サマリーのフローティング切替 =====
function setupPriceSummaryFloating() {
  const section = document.getElementById('priceSummarySection');
  if (!section) return;

  const showFloatingWithAnimation = () => {
    section.classList.add('price-summary--floating');
    section.classList.remove('price-summary--sticky');
    document.body.classList.add('has-floating-summary');

    // 一度非表示状態を作ってから表示し、フェード+スライドを発火させる
    section.classList.remove('is-visible');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        section.classList.add('is-visible');
      });
    });
  };

  const showSticky = () => {
    section.classList.remove('price-summary--floating', 'is-visible');
    section.classList.add('price-summary--sticky');
    document.body.classList.remove('has-floating-summary');
  };

  const applyMode = () => {
    if (window.innerWidth <= 992) {
      showFloatingWithAnimation();
    } else {
      showSticky();
    }
  };

  // 初期適用
  applyMode();

  // リサイズと向き変更で更新（デバウンス）
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyMode, 150);
  });
  window.addEventListener('orientationchange', applyMode);
}

// 料金サマリーを更新
function updatePriceSummary(workerId) {
  const worker = workers.find(w => w.id === workerId);
  if (!worker || !currentBooking) {
    return;
  }

  const hourlyRate = worker.hourlyRate || 0;
  const duration = currentBooking.duration || 0;
  const totalPrice = hourlyRate * duration;

  document.getElementById('priceDuration').textContent = duration;
  document.getElementById('basePrice').textContent = `¥${totalPrice.toLocaleString()}`;
  document.getElementById('totalPrice').textContent = `¥${totalPrice.toLocaleString()}`;
}

// 予約を確定
async function confirmBooking() {
  const selectedWorker = document.querySelector('input[name="worker"]:checked');
  if (!selectedWorker) {
    alert('ワーカーを選択してください');
    return;
  }

  if (!currentBooking) {
    alert('予約情報が見つかりません');
    return;
  }

  const workerId = selectedWorker.value;
  const confirmBtn = document.querySelector('button[onclick="confirmBooking()"]');
  const originalText = confirmBtn.textContent;

  // ローディング状態
  confirmBtn.disabled = true;
  confirmBtn.textContent = '確定中...';

  try {
    // 予約を更新（ワーカーIDを設定）
    await api.updateBooking(currentBooking.id, {
      workerId: workerId
    });

    alert('予約が確定しました！');
    window.location.href = `booking-detail.html?id=${currentBooking.id}`;
  } catch (error) {
    console.error('予約確定エラー:', error);
    alert('予約の確定に失敗しました: ' + (error.message || 'エラーが発生しました'));
    confirmBtn.disabled = false;
    confirmBtn.textContent = originalText;
  }
}

// ワーカープロフィールを見る
async function viewWorkerProfile(workerId) {
  try {
    document.getElementById('workerProfileContent').innerHTML = '<div class="loading-message">読み込み中...</div>';
    document.getElementById('workerProfileModal').classList.add('is-open');
    
    const response = await api.getWorkerById(workerId);
    const worker = response.data;
    
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
          <h2 class="mb-sm">${worker.name || '名前未設定'}</h2>
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
          <div class="bg-light rounded-md p-3 whitespace-pre-wrap">${worker.bio}</div>
        </div>
        ` : ''}
        
        <div id="workerProfileReviews" class="mt-lg">
          <h3 class="mb-md">レビュー</h3>
          <div class="loading-message-small">レビューを読み込み中...</div>
        </div>
      </div>
    `;

    document.getElementById('workerProfileContent').innerHTML = content;
    
    // レビューを読み込む
    await loadWorkerProfileReviews(workerId);
  } catch (error) {
    console.error('ワーカープロフィールの読み込みエラー:', error);
    if (typeof showError === 'function') {
      showError('ワーカープロフィールの読み込みに失敗しました: ' + (error.message || 'エラーが発生しました'));
    }
    document.getElementById('workerProfileContent').innerHTML =
      '<div class="error-message">エラー: ワーカープロフィールの読み込みに失敗しました</div>';
  }
}

// ワーカープロフィールのレビューを読み込む
async function loadWorkerProfileReviews(workerId) {
  try {
    const response = await api.getReviewsByWorkerId(workerId, { limit: 5 });
    const reviews = response.data?.reviews || [];
    
    const reviewsElement = document.getElementById('workerProfileReviews');
    if (!reviewsElement) return;
    
    if (reviews.length === 0) {
      reviewsElement.innerHTML = '<div class="empty-message-small">レビューがありません</div>';
      return;
    }
    
    const reviewsHTML = reviews.map(review => {
      const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      const date = new Date(review.createdAt);
      const dateStr = date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      return `
        <div class="bg-light rounded-md p-4 mb-md">
          <div class="flex justify-between mb-sm">
            <span class="stars">${stars}</span>
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
      reviewsElement.innerHTML = '<div class="error-message-small">レビューの読み込みに失敗しました</div>';
    }
  }
}

// ワーカーとチャット
async function chatWithWorker(workerId) {
  if (!currentBooking || !currentBooking.id) {
    alert('予約を確定してからチャット機能をご利用いただけます。');
    return;
  }
  
  // 予約が確定している場合、チャットページに遷移
  // ただし、ワーカーが割り当てられていない場合は、まず予約を確定する必要がある
  if (!currentBooking.workerId) {
    alert('このワーカーで予約を確定してからチャット機能をご利用いただけます。');
    return;
  }
  
  // チャットページに遷移
  window.location.href = `chat.html?bookingId=${currentBooking.id}`;
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('is-open');
}

window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.classList.remove('is-open');
  }
}

// ワーカーのレビューを読み込む
async function loadWorkerReviews(workerId, limit = 3) {
  try {
    const response = await api.getReviewsByWorkerId(workerId, { limit });
    const reviews = response.data?.reviews || [];
    
    displayWorkerReviewsPreview(workerId, reviews);
  } catch (error) {
    console.error('レビュー読み込みエラー:', error);
    const previewElement = document.getElementById(`reviews-preview-${workerId}`);
    if (previewElement) {
      previewElement.innerHTML = '<div class="empty-message-small">レビューがありません</div>';
    }
  }
}

// ワーカーのレビュープレビューを表示
function displayWorkerReviewsPreview(workerId, reviews) {
  const previewElement = document.getElementById(`reviews-preview-${workerId}`);
  if (!previewElement) return;

  if (reviews.length === 0) {
    previewElement.innerHTML = '<div class="empty-message-small">レビューがありません</div>';
    return;
  }

  const reviewsHTML = reviews.map(review => {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const date = new Date(review.createdAt);
    const dateStr = date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <div class="review-preview-item">
        <div class="review-preview-header">
          <span class="review-preview-stars">${stars}</span>
          <span class="review-preview-date">${dateStr}</span>
        </div>
        ${review.comment ? `
        <p class="review-preview-comment">${escapeHtml(review.comment.substring(0, 100))}${review.comment.length > 100 ? '...' : ''}</p>
        ` : ''}
      </div>
    `;
  }).join('');

  previewElement.innerHTML = `
    <div class="reviews-preview-list">
      ${reviewsHTML}
    </div>
  `;
}

// お気に入り状態を確認
async function checkFavoriteStatus(workerId) {
  try {
    const response = await api.checkFavorite(workerId);
    const isFavorite = response.data?.isFavorite || false;
    updateFavoriteButton(workerId, isFavorite);
  } catch (error) {
    console.error('お気に入り状態確認エラー:', error);
    // エラー時はデフォルトで非お気に入り状態
    updateFavoriteButton(workerId, false);
  }
}

// お気に入りボタンを更新
function updateFavoriteButton(workerId, isFavorite) {
  const iconElement = document.getElementById(`favorite-icon-${workerId}`);
  const buttonElement = document.getElementById(`favorite-btn-${workerId}`);
  
  if (iconElement) {
    iconElement.textContent = isFavorite ? '♥' : '♡';
    iconElement.classList.toggle('text-danger', isFavorite);
    iconElement.classList.toggle('text-muted', !isFavorite);
  }
  
  if (buttonElement) {
    buttonElement.classList.toggle('favorited', isFavorite);
    buttonElement.setAttribute('aria-label', isFavorite ? 'お気に入りから削除' : 'お気に入りに追加');
  }
}

// お気に入りを追加/削除
async function toggleFavorite(workerId) {
  try {
    // 現在の状態を確認
    const checkResponse = await api.checkFavorite(workerId);
    const isFavorite = checkResponse.data?.isFavorite || false;
    
    if (isFavorite) {
      // お気に入りから削除
      await api.removeFavoriteByWorkerId(workerId);
      updateFavoriteButton(workerId, false);
      showSuccess('お気に入りから削除しました');
    } else {
      // お気に入りに追加
      await api.addFavorite(workerId);
      updateFavoriteButton(workerId, true);
      showSuccess('お気に入りに追加しました');
    }
  } catch (error) {
    console.error('お気に入り操作エラー:', error);
    showError('お気に入りの操作に失敗しました: ' + (error.message || 'エラーが発生しました'));
  }
}

// HTMLエスケープ
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
