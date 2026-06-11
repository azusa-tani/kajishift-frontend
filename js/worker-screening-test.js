(function () {
  const STATUS_LABELS = {
    test_submitted: '提出済み・AI判定待ち',
    ai_reviewed: 'AI一次判定済み・管理者確認待ち',
    needs_review: '管理者確認待ち',
    admin_passed: '合格確定',
    admin_failed: '不合格確定'
  };

  const FINAL_STATUSES = new Set(['admin_passed', 'admin_failed']);

  let currentSubmission = null;
  let submitting = false;

  document.addEventListener('DOMContentLoaded', async () => {
    if (typeof checkAuth === 'function' && !checkAuth('worker')) {
      return;
    }

    bindForm();
    await loadSubmission();
  });

  function bindForm() {
    const form = document.getElementById('screeningForm');
    const textarea = document.getElementById('testAnswer');
    const length = document.getElementById('answerLength');

    textarea?.addEventListener('input', () => {
      length.textContent = String(textarea.value.length);
    });

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      await submitAnswer();
    });
  }

  async function loadSubmission() {
    document.getElementById('answerSection')?.classList.add('is-hidden');
    try {
      const [meResponse, submissionResponse] = await Promise.all([
        api.getMe(),
        api.getWorkerScreeningTest()
      ]);
      currentSubmission = unwrap(submissionResponse);
      renderSubmission(currentSubmission, meResponse?.data || {});
    } catch (error) {
      showScreeningError(formatError(error));
      document.getElementById('submissionStatus').innerHTML = '<div class="error-message">提出状況の読み込みに失敗しました。</div>';
    }
  }

  async function submitAnswer() {
    if (submitting) return;

    const textarea = document.getElementById('testAnswer');
    const answer = textarea.value.trim();

    clearScreeningMessage();

    if (!answer) {
      showScreeningError('回答内容を入力してください。');
      textarea.focus();
      return;
    }

    if (answer.length > 20000) {
      showScreeningError('回答は20000文字以内で入力してください。');
      textarea.focus();
      return;
    }

    submitting = true;
    setSubmitDisabled(true, '送信中...');

    try {
      const response = await api.submitWorkerScreeningTest(answer);
      currentSubmission = unwrap(response);
      showScreeningSuccess('回答を受け付けました。管理者の最終判定をお待ちください。');
      renderSubmission(currentSubmission);
    } catch (error) {
      showScreeningError(formatError(error));
    } finally {
      submitting = false;
      setSubmitDisabled(false, '回答を送信する');
    }
  }

  function renderSubmission(submission, user = {}) {
    const statusEl = document.getElementById('submissionStatus');
    const answerSection = document.getElementById('answerSection');
    const submittedSection = document.getElementById('submittedAnswerSection');
    const submittedAnswer = document.getElementById('submittedAnswer');

    if (!submission) {
      if (user.approvalStatus && user.approvalStatus !== 'PENDING') {
        statusEl.innerHTML = `
          <div class="form-note">
            審査テストは審査待ちワーカーのみ提出できます。
          </div>
        `;
        answerSection.classList.add('is-hidden');
        submittedSection.classList.add('is-hidden');
        return;
      }

      statusEl.innerHTML = `
        <div class="form-note">
          まだ回答は提出されていません。設問を確認し、回答を送信してください。
        </div>
      `;
      answerSection.classList.remove('is-hidden');
      submittedSection.classList.add('is-hidden');
      return;
    }

    const status = submission.status || 'test_submitted';
    const statusLabel = STATUS_LABELS[status] || status;
    const aiLabel = getAiDecisionLabel(submission.aiInitialDecision);
    const finalDecision = getFinalDecisionLabel(submission.adminFinalDecision);

    statusEl.innerHTML = `
      <div class="admin-def-list">
        <div class="admin-def-row">
          <dt class="admin-def-label">提出状況</dt>
          <dd class="admin-def-value"><span class="status-badge ${getStatusClass(status)}">${escapeHtml(statusLabel)}</span></dd>
        </div>
        <div class="admin-def-row">
          <dt class="admin-def-label">AI一次判定</dt>
          <dd class="admin-def-value">${escapeHtml(aiLabel)}</dd>
        </div>
        <div class="admin-def-row">
          <dt class="admin-def-label">最終判定</dt>
          <dd class="admin-def-value">${escapeHtml(finalDecision)}</dd>
        </div>
        <div class="admin-def-row">
          <dt class="admin-def-label">提出日時</dt>
          <dd class="admin-def-value">${escapeHtml(formatDateTime(submission.createdAt))}</dd>
        </div>
      </div>
      <p class="text-muted mt-sm">AI判定は参考情報です。合否は管理者の最終確認後に確定します。</p>
    `;

    submittedAnswer.textContent = submission.testAnswer || '';
    submittedSection.classList.remove('is-hidden');

    if (FINAL_STATUSES.has(status) || ['test_submitted', 'ai_reviewed', 'needs_review'].includes(status)) {
      answerSection.classList.add('is-hidden');
    } else {
      answerSection.classList.remove('is-hidden');
    }
  }

  function unwrap(response) {
    return response && response.data !== undefined ? response.data : response;
  }

  function setSubmitDisabled(disabled, label) {
    const btn = document.getElementById('submitScreeningBtn');
    if (!btn) return;
    btn.disabled = disabled;
    btn.textContent = label;
  }

  function showScreeningError(message) {
    const container = document.getElementById('screeningFlash');
    container.innerHTML = `<div class="alert alert-error" role="alert"><strong>エラー</strong>: ${escapeHtml(message)}</div>`;
  }

  function showScreeningSuccess(message) {
    const container = document.getElementById('screeningFlash');
    container.innerHTML = `<div class="alert alert-success" role="status"><strong>完了</strong>: ${escapeHtml(message)}</div>`;
  }

  function clearScreeningMessage() {
    const container = document.getElementById('screeningFlash');
    container.innerHTML = '';
  }

  function formatError(error) {
    if (!error) return 'エラーが発生しました。';
    if (error.status === 400) return error.message || '入力内容を確認してください。';
    if (error.status === 403) return error.message || 'この操作を実行する権限がありません。';
    if (error.status === 409) return error.message || '未確定の回答が既に存在します。';
    if (error.status === 503) return error.message || '現在この操作は一時停止しています。';
    return error.message || 'エラーが発生しました。時間をおいて再度お試しください。';
  }

  function getAiDecisionLabel(decision) {
    switch (decision) {
      case 'pass_candidate': return '合格候補';
      case 'fail_candidate': return '不合格候補';
      case 'needs_review': return '要確認';
      default: return '未判定';
    }
  }

  function getFinalDecisionLabel(decision) {
    switch (decision) {
      case 'passed': return '合格';
      case 'failed': return '不合格';
      default: return '未確定';
    }
  }

  function getStatusClass(status) {
    if (status === 'admin_passed') return 'active';
    if (status === 'admin_failed') return 'error';
    return 'pending';
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
