/**
 * 管理画面 — ワーカー詳細（admin/worker-detail.html）
 */

function unwrapApiPayload(response) {
  if (response == null) return null;
  return response.data !== undefined ? response.data : response;
}

const ACCOUNT_TYPE_JA = {
  ORDINARY: '普通',
  CHECKING: '当座',
  SAVINGS: '貯蓄',
  ordinary: '普通',
  checking: '当座',
  savings: '貯蓄',
};

function isEmptyValue(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string' && v.trim() === '') return true;
  return false;
}

function safeText(v, fallback = '—') {
  if (isEmptyValue(v)) return fallback;
  const s = String(v).trim();
  if (s === '' || s === 'undefined' || s === 'null') return fallback;
  return s;
}

function pickFirst(...vals) {
  for (const v of vals) {
    if (!isEmptyValue(v)) return v;
  }
  return null;
}

/**
 * API のネスト（worker.user.*）とフラット両方に対応したビューモデル
 */
function buildWorkerViewModel(raw) {
  const w = raw && typeof raw === 'object' ? raw : {};
  const user = w.user && typeof w.user === 'object' ? w.user : {};

  const id = pickFirst(w.id, w.workerId, user.workerId);
  const name = pickFirst(w.name, user.name);
  const email = pickFirst(w.email, user.email);
  const phone = pickFirst(w.phone, user.phone);
  const address = pickFirst(w.address, user.address);

  const idDocumentUrl = pickFirst(
    w.idDocumentUrl,
    w.idDocument,
    w.identityDocumentUrl,
    user.idDocumentUrl
  );

  let accountTypeRaw = pickFirst(w.accountType, w.account_type);
  if (typeof accountTypeRaw === 'string') {
    accountTypeRaw = accountTypeRaw.trim();
  }

  return {
    id,
    name,
    email,
    phone,
    address,
    bio: w.bio,
    hourlyRate: w.hourlyRate ?? w.hourly_rate,
    rating: w.rating,
    reviewCount: w.reviewCount ?? w.review_count,
    completedBookings: w.completedBookings ?? w.completed_bookings ?? w.completedBookingCount,
    approvalStatus: w.approvalStatus ?? w.approval_status,
    status: pickFirst(w.status, user.status),
    createdAt: pickFirst(w.createdAt, w.created_at, user.createdAt),
    bankName: pickFirst(w.bankName, w.bank_name, user.bankName),
    branchName: pickFirst(w.branchName, w.branch_name, user.branchName),
    accountType: accountTypeRaw,
    accountNumber: pickFirst(w.accountNumber, w.account_number, user.accountNumber),
    accountName: pickFirst(w.accountName, w.account_name, user.accountName),
    idDocumentUrl,
    _raw: w,
  };
}

function formatAccountTypeJa(value) {
  if (isEmptyValue(value)) return null;
  const key = String(value).trim();
  if (ACCOUNT_TYPE_JA[key]) return ACCOUNT_TYPE_JA[key];
  if (ACCOUNT_TYPE_JA[key.toUpperCase?.()]) return ACCOUNT_TYPE_JA[key.toUpperCase()];
  return key;
}

function formatWorkerId(id) {
  if (isEmptyValue(id)) return null;
  const s = String(id);
  return s.length > 12 ? `${s.slice(0, 12)}…` : s;
}

function formatYen(num) {
  if (num === null || num === undefined || num === '') return null;
  const n = Number(num);
  if (!Number.isFinite(n)) return null;
  return `¥${n.toLocaleString('ja-JP')}／時間`;
}

function formatDateJa(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatRating(r) {
  if (r === null || r === undefined || r === '') return null;
  const n = Number(r);
  if (!Number.isFinite(n)) return null;
  return `⭐ ${n.toFixed(1)}`;
}

/** 必須系の空欄: 赤字「未登録」 */
function setDefValueRequired(el, value) {
  if (!el) return;
  const ok = !isEmptyValue(value);
  el.innerHTML = '';
  if (ok) {
    const span = document.createElement('span');
    span.className = 'admin-def-value-text';
    span.textContent = String(value);
    el.appendChild(span);
    el.classList.remove('admin-def-value--danger');
  } else {
    const span = document.createElement('span');
    span.className = 'admin-def-value-empty';
    span.textContent = '未登録';
    el.appendChild(span);
    el.classList.add('admin-def-value--danger');
  }
}

/** 任意テキスト: 空は「未入力」 */
function setDefValueOptional(el, value) {
  if (!el) return;
  const ok = !isEmptyValue(value);
  el.innerHTML = '';
  el.classList.remove('admin-def-value--danger');
  if (ok) {
    const span = document.createElement('span');
    span.className = 'admin-def-value-text admin-def-value-text--pre';
    span.textContent = String(value);
    el.appendChild(span);
  } else {
    const span = document.createElement('span');
    span.className = 'admin-def-value-muted';
    span.textContent = '未入力';
    el.appendChild(span);
  }
}

/** 数値・評価など: 空は「—」 */
function setDefValueDash(el, value, formatFn) {
  if (!el) return;
  el.classList.remove('admin-def-value--danger');
  const formatted = formatFn ? formatFn(value) : value;
  const ok = !isEmptyValue(formatted) && formatted !== null;
  el.innerHTML = '';
  const span = document.createElement('span');
  span.className = 'admin-def-value-text';
  span.textContent = ok ? String(formatted) : '—';
  el.appendChild(span);
}

function getApprovalStatusText(status) {
  switch (status) {
    case 'PENDING':
      return '審査中';
    case 'APPROVED':
      return '承認済み';
    case 'REJECTED':
      return '却下';
    default:
      return safeText(status, '—');
  }
}

function getApprovalBadgeClass(status) {
  switch (status) {
    case 'PENDING':
      return 'status-badge status-badge--approval status-badge--pending-yellow';
    case 'APPROVED':
      return 'status-badge status-badge--approval status-badge--approved-green';
    case 'REJECTED':
      return 'status-badge status-badge--approval status-badge--rejected-red';
    default:
      return 'status-badge status-badge--approval status-badge--neutral';
  }
}

function getAccountStatusText(status) {
  switch (status) {
    case 'ACTIVE':
      return 'アクティブ';
    case 'INACTIVE':
      return '非アクティブ';
    case 'SUSPENDED':
      return '停止中';
    default:
      return safeText(status, '—');
  }
}

function getAccountStatusBadgeClass(status) {
  switch (status) {
    case 'ACTIVE':
      return 'status-badge status-badge--account status-badge--approved-green';
    case 'INACTIVE':
      return 'status-badge status-badge--account status-badge--neutral';
    case 'SUSPENDED':
      return 'status-badge status-badge--account status-badge--rejected-red';
    default:
      return 'status-badge status-badge--account status-badge--neutral';
  }
}

function isImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const u = url.split('?')[0].toLowerCase();
  return /\.(jpe?g|png|gif|webp|bmp)$/i.test(u);
}

function isPdfUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /\.pdf(\?|$)/i.test(url.split('?')[0]);
}

function renderIdDocument(container, url) {
  if (!container) return;
  container.innerHTML = '';
  if (isEmptyValue(url)) {
    const p = document.createElement('p');
    p.className = 'admin-id-doc-empty';
    p.innerHTML =
      '<span class="admin-def-value-empty">未登録</span>（本人確認書類がアップロードされていません）';
    container.appendChild(p);
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'admin-id-doc-preview';

  if (isImageUrl(url)) {
    const img = document.createElement('img');
    img.className = 'admin-id-doc-img';
    img.alt = '本人確認書類プレビュー';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.src = url;
    img.onerror = () => {
      img.replaceWith(renderIdFallbackLink(url));
    };
    wrap.appendChild(img);
  } else if (isPdfUrl(url)) {
    const note = document.createElement('p');
    note.className = 'admin-id-doc-note';
    note.textContent =
      'PDF形式の書類です。ブラウザの設定によっては埋め込み表示できないため、下のボタンから開いてください。';
    wrap.appendChild(note);
    const pdfLink = document.createElement('a');
    pdfLink.href = url;
    pdfLink.target = '_blank';
    pdfLink.rel = 'noopener noreferrer';
    pdfLink.className = 'admin-id-doc-pdf-link';
    pdfLink.innerHTML =
      '<span class="admin-id-doc-pdf-icon" aria-hidden="true">PDF</span><span>書類を開く（新しいタブ）</span>';
    wrap.appendChild(pdfLink);
  } else {
    wrap.appendChild(renderIdFallbackLink(url));
  }

  const actions = document.createElement('div');
  actions.className = 'admin-id-doc-actions';
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.className = 'btn btn--outline btn-action';
  a.textContent = '別タブで開く';
  actions.appendChild(a);
  wrap.appendChild(actions);

  container.appendChild(wrap);
}

function renderIdFallbackLink(url) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.className = 'btn btn--outline btn-action';
  a.textContent = '書類を開く';
  return a;
}

function showFlash(message, type = 'info') {
  const el = document.getElementById('adminWorkerFlash');
  if (!el) {
    if (typeof showError === 'function' && type === 'error') showError(message);
    else if (typeof showSuccess === 'function' && type === 'success') showSuccess(message);
    else alert(message);
    return;
  }
  el.textContent = message;
  el.className = `admin-worker-flash admin-worker-flash--${type}`;
  el.classList.remove('is-hidden');
  clearTimeout(el._flashTimer);
  el._flashTimer = setTimeout(() => {
    el.classList.add('is-hidden');
  }, 6000);
}

let pendingModalAction = null;

function openConfirmModal(opts) {
  const backdrop = document.getElementById('adminConfirmModal');
  const titleEl = document.getElementById('adminConfirmModalTitle');
  const bodyEl = document.getElementById('adminConfirmModalBody');
  const okBtn = document.getElementById('adminConfirmModalOk');
  if (!backdrop || !titleEl || !bodyEl || !okBtn) {
    if (window.confirm(opts.body || '')) opts.onConfirm?.();
    return;
  }

  titleEl.textContent = opts.title || '確認';
  bodyEl.textContent = opts.body || '';
  okBtn.textContent = opts.confirmLabel || '実行';
  okBtn.className = opts.danger
    ? 'btn btn-danger btn-action btn--lg'
    : 'btn btn--primary btn-action btn--lg admin-worker-btn-primary';

  pendingModalAction = opts.onConfirm || null;
  backdrop.classList.remove('is-hidden');
  backdrop.setAttribute('aria-hidden', 'false');
  okBtn.focus();
}

function closeConfirmModal() {
  const backdrop = document.getElementById('adminConfirmModal');
  if (!backdrop) return;
  backdrop.classList.add('is-hidden');
  backdrop.setAttribute('aria-hidden', 'true');
  pendingModalAction = null;
}

function displayWorkerHero(vm) {
  const nameEl = document.getElementById('workerHeroName');
  const subEl = document.getElementById('workerHeroSub');
  const apprEl = document.getElementById('workerHeroApproval');
  const accEl = document.getElementById('workerHeroAccount');

  if (nameEl) {
    nameEl.textContent = safeText(vm.name, '名前未登録');
  }
  if (subEl) {
    subEl.textContent = !isEmptyValue(vm.id)
      ? `ワーカーID: ${String(vm.id)}`
      : 'ワーカーID: —';
  }
  if (apprEl) {
    apprEl.innerHTML = '';
    const span = document.createElement('span');
    span.className = getApprovalBadgeClass(vm.approvalStatus);
    span.textContent = getApprovalStatusText(vm.approvalStatus);
    apprEl.appendChild(span);
  }
  if (accEl) {
    accEl.innerHTML = '';
    const span = document.createElement('span');
    span.className = getAccountStatusBadgeClass(vm.status);
    span.textContent = getAccountStatusText(vm.status);
    accEl.appendChild(span);
  }
}

function displayWorkerDetail(vm) {
  const loading = document.getElementById('loadingMessage');
  const content = document.getElementById('workerContent');
  if (loading) loading.classList.add('is-hidden');
  if (content) content.classList.remove('is-hidden');

  displayWorkerHero(vm);

  const idFormatted = formatWorkerId(vm.id);
  setDefValueRequired(
    document.getElementById('workerId'),
    idFormatted ? `#${idFormatted}` : null
  );
  setDefValueRequired(document.getElementById('workerName'), vm.name);
  setDefValueRequired(document.getElementById('workerEmail'), vm.email);
  setDefValueRequired(document.getElementById('workerPhone'), vm.phone);
  setDefValueRequired(document.getElementById('workerAddress'), vm.address);

  setDefValueDash(document.getElementById('workerCreatedAt'), vm.createdAt, formatDateJa);

  const apprEl = document.getElementById('workerApprovalStatus');
  if (apprEl) {
    apprEl.innerHTML = '';
    const span = document.createElement('span');
    span.className = getApprovalBadgeClass(vm.approvalStatus);
    span.textContent = getApprovalStatusText(vm.approvalStatus);
    apprEl.appendChild(span);
  }

  const stEl = document.getElementById('workerStatus');
  if (stEl) {
    stEl.innerHTML = '';
    const span = document.createElement('span');
    span.className = getAccountStatusBadgeClass(vm.status);
    span.textContent = getAccountStatusText(vm.status);
    stEl.appendChild(span);
  }

  setDefValueOptional(document.getElementById('workerBio'), vm.bio);
  setDefValueDash(document.getElementById('workerHourlyRate'), vm.hourlyRate, formatYen);
  setDefValueDash(document.getElementById('workerRating'), vm.rating, formatRating);
  setDefValueDash(document.getElementById('workerReviewCount'), vm.reviewCount, (v) =>
    v === 0 || v ? String(v) : null
  );
  setDefValueDash(document.getElementById('workerCompletedBookings'), vm.completedBookings, (v) =>
    v === 0 || v ? String(v) : null
  );

  const bankJa = formatAccountTypeJa(vm.accountType);
  setDefValueRequired(document.getElementById('workerBankName'), vm.bankName);
  setDefValueRequired(document.getElementById('workerBranchName'), vm.branchName);
  setDefValueRequired(
    document.getElementById('workerAccountType'),
    bankJa || (isEmptyValue(vm.accountType) ? null : String(vm.accountType))
  );
  setDefValueRequired(document.getElementById('workerAccountNumber'), vm.accountNumber);
  setDefValueRequired(document.getElementById('workerAccountName'), vm.accountName);

  const idStatusEl = document.getElementById('idDocumentStatus');
  if (idStatusEl) {
    idStatusEl.innerHTML = '';
    if (!isEmptyValue(vm.idDocumentUrl)) {
      const span = document.createElement('span');
      span.className = 'status-badge status-badge--approval status-badge--approved-green';
      span.textContent = '提出済み';
      idStatusEl.appendChild(span);
    } else {
      const span = document.createElement('span');
      span.className = 'status-badge status-badge--approval status-badge--rejected-red';
      span.textContent = '未提出';
      idStatusEl.appendChild(span);
    }
  }

  renderIdDocument(document.getElementById('idDocumentPreview'), vm.idDocumentUrl);

  displayActionButtons(vm);
}

function displayActionButtons(vm) {
  const top = document.getElementById('actionButtons');
  const bottom = document.getElementById('actionButtonsBottom');
  const sticky = document.getElementById('workerActionsSticky');

  const htmlPending = `
    <button type="button" class="btn btn--primary btn-action btn--lg admin-worker-btn-primary" data-action="approve" data-status="APPROVED">承認する</button>
    <button type="button" class="btn btn-danger btn-action btn--lg" data-action="approve" data-status="REJECTED">却下する</button>
  `;
  const htmlSuspend = `
    <button type="button" class="btn btn-danger btn-action btn--lg" data-action="suspend">アカウントを停止</button>
  `;
  const htmlActivate = `
    <button type="button" class="btn btn--primary btn-action btn--lg admin-worker-btn-primary" data-action="activate">有効化する</button>
  `;

  let html = '';
  if (vm.approvalStatus === 'PENDING') {
    html = htmlPending;
  } else if (vm.approvalStatus === 'APPROVED' && vm.status !== 'SUSPENDED') {
    html = htmlSuspend;
  } else if (vm.status === 'SUSPENDED') {
    html = htmlActivate;
  }

  if (top) top.innerHTML = html;
  if (bottom) bottom.innerHTML = html;

  if (sticky) {
    if (html) {
      sticky.classList.remove('is-hidden');
    } else {
      sticky.classList.add('is-hidden');
    }
  }
}

function bindActionDelegation() {
  const handler = (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    if (action === 'approve') {
      const status = btn.getAttribute('data-status');
      const isApprove = status === 'APPROVED';
      openConfirmModal({
        title: isApprove ? 'ワーカーを承認' : 'ワーカーを却下',
        body: isApprove
          ? 'このワーカーを承認します。よろしいですか？'
          : 'このワーカーを却下します。よろしいですか？',
        confirmLabel: isApprove ? '承認する' : '却下する',
        danger: !isApprove,
        onConfirm: () => runApprove(status),
      });
    } else if (action === 'suspend') {
      openConfirmModal({
        title: 'アカウント停止',
        body: 'このワーカーアカウントを停止しますか？\n停止後はログインできなくなります。',
        confirmLabel: '停止する',
        danger: true,
        onConfirm: () => runSuspend(),
      });
    } else if (action === 'activate') {
      openConfirmModal({
        title: 'アカウント有効化',
        body: 'このワーカーアカウントを有効化しますか？',
        confirmLabel: '有効化する',
        danger: false,
        onConfirm: () => runActivate(),
      });
    }
  };
  document.getElementById('actionButtons')?.addEventListener('click', handler);
  document.getElementById('actionButtonsBottom')?.addEventListener('click', handler);
}

async function runApprove(approvalStatus) {
  const statusText = approvalStatus === 'APPROVED' ? '承認' : '却下';
  try {
    await window.api.approveWorker(window.__workerDetailId, approvalStatus);
    showFlash(`ワーカーを${statusText}しました`, 'success');
    await loadWorkerDetail();
  } catch (error) {
    console.error(error);
    showFlash(
      `ワーカーの${statusText}に失敗しました: ${error.message || 'エラーが発生しました'}`,
      'error'
    );
  }
}

async function runSuspend() {
  try {
    await window.api.updateWorker(window.__workerDetailId, { status: 'SUSPENDED' });
    showFlash('ワーカーを停止しました', 'success');
    await loadWorkerDetail();
  } catch (error) {
    console.error(error);
    showFlash('ワーカーの停止に失敗しました: ' + (error.message || 'エラーが発生しました'), 'error');
  }
}

async function runActivate() {
  try {
    await window.api.updateWorker(window.__workerDetailId, { status: 'ACTIVE' });
    showFlash('ワーカーを有効化しました', 'success');
    await loadWorkerDetail();
  } catch (error) {
    console.error(error);
    showFlash('ワーカーの有効化に失敗しました: ' + (error.message || 'エラーが発生しました'), 'error');
  }
}

async function fetchWorkerPayload(id) {
  try {
    const r = await window.api.getAdminWorkerById(id);
    return unwrapApiPayload(r);
  } catch (e) {
    if (e.status === 404 || e.status === 405) {
      const r = await window.api.getWorkerById(id);
      return unwrapApiPayload(r);
    }
    throw e;
  }
}

async function loadWorkerDetail() {
  const id = window.__workerDetailId;
  const loading = document.getElementById('loadingMessage');
  if (loading) {
    loading.classList.remove('is-hidden');
    loading.textContent = 'ワーカー情報を読み込み中...';
  }
  document.getElementById('workerContent')?.classList.add('is-hidden');

  try {
    const payload = await fetchWorkerPayload(id);
    if (!payload || (typeof payload === 'object' && !Object.keys(payload).length)) {
      throw new Error('ワーカー情報が取得できませんでした');
    }
    const vm = buildWorkerViewModel(payload);
    window.__workerDetailVm = vm;
    displayWorkerDetail(vm);
    await loadReviews(id);
  } catch (error) {
    console.error('ワーカー詳細の読み込みエラー:', error);
    if (loading) {
      loading.textContent = 'エラー: ' + (error.message || 'ワーカー情報の読み込みに失敗しました');
    }
    showFlash('ワーカー詳細の読み込みに失敗しました: ' + (error.message || 'エラー'), 'error');
  }
}

function unwrapReviewsResponse(response) {
  const p = unwrapApiPayload(response);
  if (!p) return [];
  if (Array.isArray(p.reviews)) return p.reviews;
  if (Array.isArray(p.data?.reviews)) return p.data.reviews;
  if (Array.isArray(p.items)) return p.items;
  if (Array.isArray(p)) return p;
  return [];
}

async function loadReviews(workerId) {
  const section = document.getElementById('reviewsSection');
  if (!section) return;
  section.innerHTML = '<div class="loading-message">レビューを読み込み中...</div>';

  try {
    const response = await window.api.getReviewsByWorkerId(workerId, { limit: 20 });
    const reviews = unwrapReviewsResponse(response);
    displayReviews(reviews);
  } catch (error) {
    console.error(error);
    section.innerHTML =
      '<div class="empty-message">レビューの読み込みに失敗しました</div>';
  }
}

function displayReviews(reviews) {
  const reviewsSection = document.getElementById('reviewsSection');
  if (!reviewsSection) return;

  if (!Array.isArray(reviews) || reviews.length === 0) {
    reviewsSection.innerHTML = '<div class="empty-message">レビューはまだありません</div>';
    return;
  }

  const frag = document.createDocumentFragment();
  const list = document.createElement('div');
  list.className = 'admin-review-list';

  reviews.forEach((review) => {
    const ratingNum = Number(review.rating);
    const stars = Number.isFinite(ratingNum) ? Math.min(5, Math.max(0, Math.round(ratingNum))) : 0;
    const createdAt = review.createdAt ? new Date(review.createdAt) : null;
    const dateStr =
      createdAt && !Number.isNaN(createdAt.getTime())
        ? createdAt.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : '—';

    const customerName = safeText(
      review.customer?.name || review.customerName,
      '匿名'
    );
    const comment = safeText(review.comment, '未入力');

    const item = document.createElement('article');
    item.className = 'admin-review-item';
    item.innerHTML = `
      <div class="admin-review-item__head">
        <div class="admin-review-item__rating">${'⭐'.repeat(stars)}<span class="admin-review-item__rating-num">${Number.isFinite(ratingNum) ? ratingNum.toFixed(1) : '—'}</span></div>
        <time class="admin-review-item__date" datetime="${review.createdAt || ''}">${dateStr}</time>
      </div>
      <p class="admin-review-item__author"><strong>${escapeHtml(customerName)}</strong></p>
      <p class="admin-review-item__body">${escapeHtml(comment)}</p>
    `;
    list.appendChild(item);
  });

  frag.appendChild(list);
  reviewsSection.innerHTML = '';
  reviewsSection.appendChild(frag);
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function initAdminWorkerDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  window.__workerDetailId = id;

  if (!id) {
    const loading = document.getElementById('loadingMessage');
    if (loading) {
      loading.textContent = 'エラー: ワーカーIDが指定されていません';
    }
    showFlash('ワーカーIDが指定されていません', 'error');
    return;
  }

  document.getElementById('adminConfirmModalClose')?.addEventListener('click', closeConfirmModal);
  document.getElementById('adminConfirmModalCancel')?.addEventListener('click', closeConfirmModal);
  document.getElementById('adminConfirmModalOk')?.addEventListener('click', () => {
    const fn = pendingModalAction;
    closeConfirmModal();
    if (typeof fn === 'function') {
      void Promise.resolve(fn()).catch((err) => console.error(err));
    }
  });
  document.getElementById('adminConfirmModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'adminConfirmModal' || e.target.classList.contains('admin-modal__backdrop')) {
      closeConfirmModal();
    }
  });

  bindActionDelegation();
  loadWorkerDetail();
}

function startAdminWorkerDetailPage() {
  if (typeof checkAuth === 'function' && !checkAuth('admin')) {
    return;
  }
  initAdminWorkerDetail();
}

/**
 * api.js より先に実行されるケースでも window.api 準備を待ってから初期化する
 */
document.addEventListener('DOMContentLoaded', () => {
  let apiWaitAttempts = 0;
  const API_WAIT_MAX = 100;

  const init = () => {
    if (!window.api) {
      apiWaitAttempts += 1;
      if (apiWaitAttempts > API_WAIT_MAX) {
        console.error(
          'api.js が読み込まれませんでした。ネットワークと script の順序を確認してください。'
        );
        const loading = document.getElementById('loadingMessage');
        if (loading) {
          loading.textContent = 'エラー: API クライアント（api.js）の読み込みに失敗しました';
        }
        return;
      }
      console.error('api.js is not loaded yet. Retrying in 100ms...');
      setTimeout(init, 100);
      return;
    }
    startAdminWorkerDetailPage();
  };

  init();
});

/** ヘッダーのログアウトボタン用 */
function logout() {
  if (!window.confirm('ログアウトしますか？')) return;
  if (window.api && typeof window.api.clearToken === 'function') {
    window.api.clearToken();
  }
  try {
    sessionStorage.removeItem('adminLoggedIn');
  } catch (e) {
    /* ignore */
  }
  window.location.href = 'login.html';
}
window.logout = logout;
