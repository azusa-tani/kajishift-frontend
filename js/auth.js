/**
 * 認証ヘルパー関数
 * 認証チェック、ログイン状態管理など
 */

/**
 * 認証が必要なページで認証チェックを行う
 * @param {string} requiredRole - 必要なロール（'customer', 'worker', 'admin'）
 * @param {string} redirectPath - 未認証時のリダイレクト先（デフォルト: ログインページ）
 */
function checkAuth(requiredRole = null, redirectPath = null) {
  const token = api.token;
  const user = api.getUser();

  // トークンがない場合は未認証
  if (!token) {
    redirectToLogin(requiredRole, redirectPath);
    return false;
  }

  // ユーザー情報がない場合は取得を試みる
  if (!user) {
    api.getMe()
      .then((response) => {
        if (response.data) {
          api.setUser(response.data);
          // ロールチェック
          if (requiredRole && response.data.role.toLowerCase() !== requiredRole) {
            redirectToLogin(requiredRole, redirectPath);
            return false;
          }
        }
      })
      .catch(() => {
        // トークンが無効な場合はクリアしてリダイレクト
        api.clearToken();
        redirectToLogin(requiredRole, redirectPath);
        return false;
      });
    return false; // 非同期処理中なので一旦false
  }

  // ロールチェック
  if (requiredRole && user.role.toLowerCase() !== requiredRole) {
    redirectToLogin(requiredRole, redirectPath);
    return false;
  }

  return true;
}

/**
 * ログインページにリダイレクト
 */
function redirectToLogin(role = null, customPath = null) {
  if (customPath) {
    window.location.href = customPath;
    return;
  }

  // 現在のパスからロールを推測
  const currentPath = window.location.pathname;
  if (currentPath.includes('/customer/')) {
    window.location.href = '/customer/login.html';
  } else if (currentPath.includes('/worker/')) {
    window.location.href = '/worker/login.html';
  } else if (currentPath.includes('/admin/')) {
    window.location.href = '/admin/login.html';
  } else if (role) {
    window.location.href = `/${role}/login.html`;
  } else {
    // デフォルトはトップページ
    window.location.href = '/index.html';
  }
}

/**
 * ログアウト処理
 */
function logout() {
  api.clearToken();
  
  // 現在のパスからロールを推測してログインページにリダイレクト
  const currentPath = window.location.pathname;
  if (currentPath.includes('/customer/')) {
    window.location.href = '/customer/login.html';
  } else if (currentPath.includes('/worker/')) {
    window.location.href = '/worker/login.html';
  } else if (currentPath.includes('/admin/')) {
    window.location.href = '/admin/login.html';
  } else {
    window.location.href = '/index.html';
  }
}

/**
 * エラーメッセージを表示
 */
function showError(message, container = null) {
  const errorContainer = container || document.querySelector('.error-message') || document.body;
  
  // 既存のエラーメッセージを削除
  const existingError = errorContainer.querySelector('.alert-error');
  if (existingError) {
    existingError.remove();
  }

  // エラーメッセージを表示
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-error';
  errorDiv.setAttribute('role', 'alert');
  errorDiv.innerHTML = `
    <strong>エラー</strong>: ${message}
    <button type="button" class="alert-close" onclick="this.parentElement.remove()" aria-label="閉じる">×</button>
  `;
  
  errorContainer.insertBefore(errorDiv, errorContainer.firstChild);
  
  // 5秒後に自動で削除
  setTimeout(() => {
    if (errorDiv.parentElement) {
      errorDiv.remove();
    }
  }, 5000);
}

/**
 * 成功メッセージを表示
 */
function showSuccess(message, container = null) {
  const successContainer = container || document.querySelector('.success-message') || document.body;
  
  // 既存の成功メッセージを削除
  const existingSuccess = successContainer.querySelector('.alert-success');
  if (existingSuccess) {
    existingSuccess.remove();
  }

  // 成功メッセージを表示
  const successDiv = document.createElement('div');
  successDiv.className = 'alert alert-success';
  successDiv.setAttribute('role', 'alert');
  successDiv.innerHTML = `
    <strong>成功</strong>: ${message}
    <button type="button" class="alert-close" onclick="this.parentElement.remove()" aria-label="閉じる">×</button>
  `;
  
  successContainer.insertBefore(successDiv, successContainer.firstChild);
  
  // 5秒後に自動で削除
  setTimeout(() => {
    if (successDiv.parentElement) {
      successDiv.remove();
    }
  }, 5000);
}

/**
 * ローディング状態を表示
 */
function showLoading(element, text = '読み込み中...') {
  if (typeof element === 'string') {
    element = document.querySelector(element);
  }
  
  if (!element) return;

  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading-overlay';
  loadingDiv.innerHTML = `
    <div class="loading-spinner"></div>
    <p>${text}</p>
  `;
  
  element.style.position = 'relative';
  element.appendChild(loadingDiv);
  
  return loadingDiv;
}

/**
 * ローディング状態を非表示
 */
function hideLoading(loadingElement) {
  if (loadingElement && loadingElement.parentElement) {
    loadingElement.remove();
  }
}

/**
 * 依頼者ページの通知バッジを API の未読件数と同期する（静的 HTML のダミー表示の解消）
 * Socket.io のイベントと併用し、ページ初回表示時の整合性を取る。
 */
function parseUnreadNotificationCount(response) {
  if (!response) return 0;
  if (typeof response.count === 'number') return response.count;
  if (response.data != null && typeof response.data.count === 'number') return response.data.count;
  return 0;
}

async function syncCustomerNotificationBadge() {
  const path = window.location && window.location.pathname ? window.location.pathname : '';
  if (!path.includes('/customer/')) return;
  if (typeof api === 'undefined' || !api || !api.token) {
    document.querySelectorAll('.notification-badge').forEach((el) => {
      el.textContent = '0';
      el.classList.add('is-hidden');
    });
    return;
  }

  try {
    const response = await api.getUnreadNotificationCount();
    const count = parseUnreadNotificationCount(response);
    document.querySelectorAll('.notification-badge').forEach((el) => {
      if (count > 0) {
        el.textContent = String(count);
        el.classList.remove('is-hidden');
      } else {
        el.textContent = '0';
        el.classList.add('is-hidden');
      }
    });
    const btn = document.getElementById('notificationBtn');
    if (btn) {
      btn.setAttribute('aria-label', count > 0 ? `通知（${count}件の未読）` : '通知');
    }
  } catch (e) {
    console.error('未読通知数の同期に失敗しました:', e);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  syncCustomerNotificationBadge();
});

window.syncCustomerNotificationBadge = syncCustomerNotificationBadge;
