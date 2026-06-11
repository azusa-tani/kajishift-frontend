(function () {
  let currentPage = 1;
  let totalPages = 1;

  document.addEventListener('DOMContentLoaded', async () => {
    if (typeof checkAuth === 'function' && !checkAuth('admin')) {
      return;
    }

    applyInitialFilter();

    document.getElementById('reloadSubmissionsBtn')?.addEventListener('click', () => {
      currentPage = 1;
      loadSubmissions();
    });

    document.getElementById('submission-status-filter')?.addEventListener('change', () => {
      currentPage = 1;
      loadSubmissions();
    });

    await loadSubmissions();
  });

  function applyInitialFilter() {
    const status = new URLSearchParams(window.location.search).get('status');
    const select = document.getElementById('submission-status-filter');
    if (status && select) {
      select.value = status;
    }
  }

  async function loadSubmissions() {
    const tbody = document.getElementById('submissionTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-message">読み込み中...</td></tr>';

    try {
      const status = document.getElementById('submission-status-filter')?.value || '';
      const params = { page: currentPage, limit: 20 };
      if (status) params.status = status;

      const response = await api.getAdminWorkerTestSubmissions(params);
      const payload = unwrap(response);
      const submissions = payload?.submissions || [];
      const pagination = payload?.pagination || { page: 1, totalPages: 1, total: submissions.length };

      currentPage = pagination.page || 1;
      totalPages = pagination.totalPages || 1;
      document.getElementById('submissionTotal').textContent = pagination.total || submissions.length;

      renderSubmissions(submissions);
      renderPagination(pagination);
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="7" class="error-message">提出一覧の読み込みに失敗しました</td></tr>';
      showFlash(`提出一覧の読み込みに失敗しました: ${escapeHtml(error.message || 'エラーが発生しました')}`);
    }
  }

  function renderSubmissions(submissions) {
    const tbody = document.getElementById('submissionTableBody');
    tbody.innerHTML = '';

    if (!submissions.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-message">対象の提出はありません</td></tr>';
      return;
    }

    submissions.forEach((submission) => {
      const worker = submission.worker || {};
      const row = `
        <tr>
          <td>${escapeHtml(formatDateTime(submission.createdAt))}</td>
          <td>
            <strong>${escapeHtml(worker.name || '-')}</strong><br />
            <span class="text-muted">${escapeHtml(worker.email || '')}</span>
          </td>
          <td><span class="status-badge ${getStatusClass(submission.status)}">${escapeHtml(getStatusLabel(submission.status))}</span></td>
          <td>${escapeHtml(getAiDecisionLabel(submission.aiInitialDecision))}</td>
          <td>${submission.aiScore == null ? '-' : escapeHtml(String(submission.aiScore))}</td>
          <td>${escapeHtml(getFinalDecisionLabel(submission.adminFinalDecision))}</td>
          <td><a href="worker-test-submission-detail.html?id=${encodeURIComponent(submission.id)}" class="btn-link btn-action-link">詳細</a></td>
        </tr>
      `;
      tbody.insertAdjacentHTML('beforeend', row);
    });
  }

  function renderPagination(pagination) {
    const el = document.getElementById('submissionPagination');
    if (!el) return;

    el.innerHTML = `
      <button class="btn btn-outline" ${currentPage <= 1 ? 'disabled' : ''} id="prevSubmissionPage">前へ</button>
      <span class="page-info">${currentPage} / ${totalPages}</span>
      <button class="btn btn-outline" ${currentPage >= totalPages ? 'disabled' : ''} id="nextSubmissionPage">次へ</button>
    `;

    document.getElementById('prevSubmissionPage')?.addEventListener('click', () => {
      currentPage = Math.max(1, currentPage - 1);
      loadSubmissions();
    });
    document.getElementById('nextSubmissionPage')?.addEventListener('click', () => {
      currentPage = Math.min(pagination.totalPages || totalPages, currentPage + 1);
      loadSubmissions();
    });
  }

  function unwrap(response) {
    return response && response.data !== undefined ? response.data : response;
  }

  function showFlash(message) {
    const el = document.getElementById('screeningListFlash');
    if (el) el.innerHTML = `<div class="alert alert-error" role="alert">${message}</div>`;
  }

  function getStatusLabel(status) {
    return {
      test_submitted: 'AI判定待ち',
      ai_reviewed: 'AI判定済み',
      needs_review: '要確認',
      admin_passed: '合格確定',
      admin_failed: '不合格確定'
    }[status] || status || '-';
  }

  function getStatusClass(status) {
    if (status === 'admin_passed') return 'active';
    if (status === 'admin_failed') return 'error';
    return 'pending';
  }

  function getAiDecisionLabel(decision) {
    return {
      pass_candidate: '合格候補',
      fail_candidate: '不合格候補',
      needs_review: '要確認'
    }[decision] || '未判定';
  }

  function getFinalDecisionLabel(decision) {
    return {
      passed: '合格',
      failed: '不合格'
    }[decision] || '未確定';
  }

  function formatDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }
})();
