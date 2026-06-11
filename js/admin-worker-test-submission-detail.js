(function () {
  const FINAL_STATUSES = new Set(['admin_passed', 'admin_failed']);
  let submission = null;
  let finalizing = false;

  document.addEventListener('DOMContentLoaded', async () => {
    if (typeof checkAuth === 'function' && !checkAuth('admin')) {
      return;
    }

    document.getElementById('passBtn')?.addEventListener('click', () => finalize('passed'));
    document.getElementById('failBtn')?.addEventListener('click', () => finalize('failed'));
    await loadDetail();
  });

  async function loadDetail() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
      showFlash('提出IDが指定されていません。');
      document.getElementById('detailLoading').textContent = '提出IDが指定されていません。';
      return;
    }

    try {
      const response = await api.getAdminWorkerTestSubmission(id);
      submission = unwrap(response);
      renderDetail(submission);
      document.getElementById('detailLoading').classList.add('is-hidden');
      document.getElementById('detailContent').classList.remove('is-hidden');
    } catch (error) {
      showFlash(`提出詳細の読み込みに失敗しました: ${escapeHtml(error.message || 'エラーが発生しました')}`);
      document.getElementById('detailLoading').textContent = '提出詳細の読み込みに失敗しました。';
    }
  }

  async function finalize(finalDecision) {
    if (finalizing || !submission) return;

    const label = finalDecision === 'passed' ? '合格' : '不合格';
    if (!window.confirm(`この提出を${label}で最終確定します。よろしいですか？`)) {
      return;
    }

    finalizing = true;
    setButtonsDisabled(true);

    try {
      const comment = document.getElementById('adminComment')?.value?.trim() || '';
      const response = await api.finalizeWorkerTestSubmission(submission.id, finalDecision, comment);
      submission = unwrap(response);
      showSuccess(`最終判定を${label}で保存しました。`);
      renderDetail(submission);
    } catch (error) {
      showFlash(`最終判定の保存に失敗しました: ${escapeHtml(error.message || 'エラーが発生しました')}`);
    } finally {
      finalizing = false;
      setButtonsDisabled(FINAL_STATUSES.has(submission?.status));
    }
  }

  function renderDetail(data) {
    const worker = data.worker || {};
    document.getElementById('workerInfoList').innerHTML = `
      ${defRow('氏名', worker.name || '-')}
      ${defRow('メールアドレス', worker.email || '-')}
      ${defRow('電話番号', worker.phone || '-')}
      ${defRow('審査ステータス', worker.approvalStatus || '-')}
      ${defRow('提出日時', formatDateTime(data.createdAt))}
      ${defRow('提出ステータス', getStatusLabel(data.status))}
    `;

    document.getElementById('testAnswer').textContent = data.testAnswer || '';

    const warnings = Array.isArray(data.aiWarnings)
      ? data.aiWarnings.join('\n')
      : (data.aiWarnings ? JSON.stringify(data.aiWarnings, null, 2) : '-');

    document.getElementById('aiReviewList').innerHTML = `
      ${defRow('AI点数', data.aiScore == null ? '-' : `${data.aiScore}点`)}
      ${defRow('AI一次判定', getAiDecisionLabel(data.aiInitialDecision))}
      ${defRow('AI理由', data.aiReason || '-')}
      ${defRow('AI注意点', warnings)}
      ${defRow('AIエラー概要', data.aiErrorMessage || '-')}
      ${defRow('AI判定日時', formatDateTime(data.aiReviewedAt))}
    `;

    document.getElementById('adminReviewStatus').innerHTML = `
      ${defRow('最終判定', getFinalDecisionLabel(data.adminFinalDecision))}
      ${defRow('管理者コメント', data.adminComment || '-')}
      ${defRow('最終判定日時', formatDateTime(data.reviewedAt))}
      ${defRow('判定者', data.reviewedByAdmin?.name || data.reviewedByAdminId || '-')}
    `;

    const commentEl = document.getElementById('adminComment');
    if (commentEl && data.adminComment && !commentEl.value) {
      commentEl.value = data.adminComment;
    }

    setButtonsDisabled(FINAL_STATUSES.has(data.status));
    if (FINAL_STATUSES.has(data.status)) {
      document.getElementById('adminComment').disabled = true;
    }
  }

  function setButtonsDisabled(disabled) {
    ['passBtn', 'failBtn'].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = disabled;
    });
  }

  function unwrap(response) {
    return response && response.data !== undefined ? response.data : response;
  }

  function defRow(label, value) {
    return `
      <div class="admin-def-row">
        <dt class="admin-def-label">${escapeHtml(label)}</dt>
        <dd class="admin-def-value">${escapeHtml(value)}</dd>
      </div>
    `;
  }

  function showFlash(message) {
    const el = document.getElementById('submissionDetailFlash');
    if (el) el.innerHTML = `<div class="alert alert-error" role="alert">${message}</div>`;
  }

  function showSuccess(message) {
    const el = document.getElementById('submissionDetailFlash');
    if (el) el.innerHTML = `<div class="alert alert-success" role="status">${escapeHtml(message)}</div>`;
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
