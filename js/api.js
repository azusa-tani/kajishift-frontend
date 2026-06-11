/**
 * KAJISHIFT API クライアント
 * バックエンドAPIとの通信を管理
 */

const OPS_OPERATION_LABELS = {
  registerUser: 'ユーザー登録',
  createBooking: '新規予約',
  bookingWrite: '予約更新',
  createPaymentIntent: '決済',
  createSetupIntent: 'カード登録準備',
  cardWrite: 'カード管理',
  createReview: 'レビュー投稿',
  sendMessage: 'メッセージ送信',
  uploadFile: 'ファイルアップロード',
  deleteFile: 'ファイル削除',
  favoriteWrite: 'お気に入り管理',
  profileWrite: 'プロフィール更新',
  notificationWrite: '通知更新',
  workerAvailabilityWrite: '利用不可枠更新',
  adminWrite: '管理者更新'
};

function resolveOpsOperation(endpoint, method = 'GET') {
  const normalizedMethod = String(method || 'GET').toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(normalizedMethod)) return null;
  const path = String(endpoint || '').split('?')[0];

  if (path === '/auth/register') return 'registerUser';
  if (path === '/bookings' && normalizedMethod === 'POST') return 'createBooking';
  if (path.startsWith('/bookings/')) return 'bookingWrite';
  if (path === '/payments/intent' || path === '/payments') return 'createPaymentIntent';
  if (path === '/cards/setup-intent') return 'createSetupIntent';
  if (path === '/cards' || path.startsWith('/cards/')) return 'cardWrite';
  if (path === '/reviews') return 'createReview';
  if (path === '/messages') return 'sendMessage';
  if (path === '/upload') return 'uploadFile';
  if (path.startsWith('/upload/')) return 'deleteFile';
  if (path === '/favorites' || path.startsWith('/favorites/')) return 'favoriteWrite';
  if (path === '/users/me' || path === '/users/me/password' || path === '/workers/me') return 'profileWrite';
  if (path === '/workers/me/screening-test') return 'profileWrite';
  if (path.startsWith('/workers/me/unavailable-slots')) return 'workerAvailabilityWrite';
  if (path.startsWith('/notifications/')) return 'notificationWrite';
  if (path.startsWith('/admin/ops/')) return null;
  if (path.startsWith('/admin/')) return 'adminWrite';
  return null;
}

class ApiClient {
  constructor() {
    // 環境変数から取得、未設定の場合は環境に応じて自動切り替え
    // 本番環境では各HTMLファイルの<head>でwindow.API_BASE_URLを設定することも可能
    if (window.API_BASE_URL) {
      this.baseURL = window.API_BASE_URL;
    } else {
      // 環境に応じて自動切り替え
      // localhostの場合は開発環境、それ以外は本番環境
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';
      this.baseURL = isDevelopment 
        ? 'http://localhost:3000/api'
        : 'https://kajishift-backend-production.up.railway.app/api';
    }
    this.token = localStorage.getItem('token') || null;
    this.user = null;
  }

  /**
   * トークンを設定
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  /**
   * トークンをクリア（ログアウト）
   */
  clearToken() {
    try {
      if (typeof window !== 'undefined' && window.socketManager && typeof window.socketManager.disconnect === 'function') {
        window.socketManager.disconnect();
      }
    } catch (e) {
      console.warn('Socket 切断をスキップ:', e);
    }
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * ユーザー情報を保存
   */
  setUser(user) {
    this.user = user;
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }

  /**
   * 保存されたユーザー情報を取得
   */
  getUser() {
    if (this.user) {
      return this.user;
    }
    const stored = localStorage.getItem('user');
    if (stored) {
      this.user = JSON.parse(stored);
      return this.user;
    }
    return null;
  }

  /**
   * 汎用リクエスト関数
   */
  async request(endpoint, options = {}) {
    const method = options.method || 'GET';
    const operation = resolveOpsOperation(endpoint, method);
    if (operation && window.KajishiftOps && typeof window.KajishiftOps.ensureOperationAllowed === 'function') {
      window.KajishiftOps.ensureOperationAllowed(operation);
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // トークンがある場合はAuthorizationヘッダーに追加
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      // レスポンスがJSONでない場合（ファイルダウンロードなど）
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
      }

      const data = await response.json();

      // エラーレスポンスの処理
      if (!response.ok) {
        // 401エラー（認証エラー）の場合はトークンをクリア
        if (response.status === 401) {
          this.clearToken();
          // ログインページにリダイレクト（必要に応じて）
          if (window.location.pathname.includes('/customer/') || 
              window.location.pathname.includes('/worker/') ||
              window.location.pathname.includes('/admin/')) {
            const role = this.getUserRole();
            if (role) {
              window.location.href = `/${role}/login.html`;
            }
          }
        }

        const error = new Error(data.message || data.error || 'エラーが発生しました');
        error.status = response.status;
        error.data = data;
        if ((response.status === 503 || response.status === 423) && data.code === 'OPERATION_PAUSED') {
          if (window.KajishiftOps && typeof window.KajishiftOps.handlePausedResponse === 'function') {
            window.KajishiftOps.handlePausedResponse(data);
          }
        }
        throw error;
      }

      return data;
    } catch (error) {
      // ネットワークエラーなどの処理
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('サーバーに接続できません。ネットワーク接続を確認してください。');
      }
      throw error;
    }
  }

  /**
   * ユーザーのロールを取得
   */
  getUserRole() {
    const user = this.getUser();
    if (user && user.role) {
      return user.role.toLowerCase(); // CUSTOMER -> customer
    }
    return null;
  }

  // ==================== 認証API ====================

  /**
   * ユーザー登録
   */
  async register(data) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: data,
    });

    if (response.data && response.data.token) {
      this.setToken(response.data.token);
      if (response.data.user) {
        this.setUser(response.data.user);
      }
    }

    return response;
  }

  /**
   * ユーザー登録（FormData形式、ファイルアップロード対応）
   */
  async registerWithFile(formData) {
    if (window.KajishiftOps && typeof window.KajishiftOps.ensureOperationAllowed === 'function') {
      window.KajishiftOps.ensureOperationAllowed('registerUser');
    }

    const url = `${this.baseURL}/auth/register`;
    const headers = {};

    // FormDataの場合はContent-Typeを設定しない（ブラウザが自動設定）

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const raw = await response.text();
    let data = {};
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (e) {
        data = {};
      }
    }

    if (!response.ok) {
      if ((response.status === 503 || response.status === 423) && data.code === 'OPERATION_PAUSED') {
        if (window.KajishiftOps && typeof window.KajishiftOps.handlePausedResponse === 'function') {
          window.KajishiftOps.handlePausedResponse(data);
        }
      }
      const msg =
        (data && (data.message || data.error)) ||
        `登録に失敗しました（HTTP ${response.status}）`;
      const err = new Error(msg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    // トークンを保存
    if (data.data && data.data.token) {
      this.setToken(data.data.token);
      if (data.data.user) {
        this.setUser(data.data.user);
      }
    }

    return data;
  }

  /**
   * ログイン
   */
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    if (response.data && response.data.token) {
      this.setToken(response.data.token);
      if (response.data.user) {
        this.setUser(response.data.user);
      }
    }

    return response;
  }

  /**
   * 現在のユーザー情報を取得
   */
  async getMe() {
    const response = await this.request('/auth/me');
    if (response.data) {
      this.setUser(response.data);
    }
    return response;
  }

  /**
   * β運用状態を取得（キャッシュさせない）
   */
  async getPublicStatus() {
    const cacheBuster = encodeURIComponent(`${Date.now()}-${window.KAJISHIFT_CONFIG_VERSION || 'unknown'}`);
    const response = await fetch(`${this.baseURL}/public/status?_=${cacheBuster}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-store'
      },
      cache: 'no-store'
    });

    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || data.error || '運用状態の取得に失敗しました');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  /**
   * パスワードリセットメール送信
   */
  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  }

  /**
   * パスワードリセット
   */
  async resetPassword(token, password) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    });
  }

  // ==================== ユーザーAPI ====================

  /**
   * 自分の情報を取得
   */
  async getUserMe() {
    const response = await this.request('/users/me');
    if (response.data) {
      this.setUser(response.data);
    }
    return response;
  }

  /**
   * 自分の情報を更新
   */
  async updateUserMe(data) {
    const response = await this.request('/users/me', {
      method: 'PUT',
      body: data,
    });
    if (response.data) {
      this.setUser(response.data);
    }
    return response;
  }

  /**
   * パスワード変更（現在のパスワード検証あり）
   */
  async changePassword({ currentPassword, newPassword }) {
    return this.request('/users/me/password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
    });
  }

  /**
   * ユーザー詳細を取得
   */
  async getUserById(userId) {
    return this.request(`/users/${userId}`);
  }

  // ==================== 予約API ====================

  /**
   * 予約一覧を取得
   */
  async getBookings(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/bookings${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * 予約を作成
   */
  async createBooking(data) {
    return this.request('/bookings', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * 予約詳細を取得
   */
  async getBookingById(bookingId) {
    return this.request(`/bookings/${bookingId}`);
  }

  /**
   * 予約を更新
   */
  async updateBooking(bookingId, data) {
    return this.request(`/bookings/${bookingId}`, {
      method: 'PUT',
      body: data,
    });
  }

  /**
   * 予約をキャンセル
   */
  async cancelBooking(bookingId) {
    return this.request(`/bookings/${bookingId}`, {
      method: 'DELETE',
    });
  }

  /**
   * 予約を承諾（ワーカーのみ）
   */
  async acceptBooking(bookingId) {
    return this.request(`/bookings/${bookingId}/accept`, {
      method: 'POST',
    });
  }

  /**
   * 予約を拒否（ワーカーのみ）
   */
  async rejectBooking(bookingId, reason = null) {
    return this.request(`/bookings/${bookingId}/reject`, {
      method: 'POST',
      body: reason ? { reason } : {},
    });
  }

  /**
   * 作業完了（ワーカーのみ）
   */
  async completeBooking(bookingId) {
    return this.request(`/bookings/${bookingId}/complete`, {
      method: 'POST',
    });
  }

  // ==================== ワーカーAPI ====================

  /**
   * ワーカー一覧を取得
   */
  async getWorkers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/workers${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * ワーカー詳細を取得
   */
  async getWorkerById(workerId) {
    return this.request(`/workers/${workerId}`);
  }

  /**
   * ワーカープロフィールを更新
   */
  async updateWorkerProfile(data) {
    return this.request('/workers/me', {
      method: 'PUT',
      body: data,
    });
  }

  /**
   * ワーカー本人のテスト回答状況を取得
   */
  async getWorkerScreeningTest() {
    return this.request('/workers/me/screening-test');
  }

  /**
   * ワーカー本人のテスト回答を送信
   */
  async submitWorkerScreeningTest(testAnswer) {
    return this.request('/workers/me/screening-test', {
      method: 'POST',
      body: { testAnswer },
    });
  }

  /**
   * ワーカー本人の利用不可スロット一覧（GET /workers/me/unavailable-slots）
   * @param {{ startDate: string, endDate: string }} params YYYY-MM-DD（必須）
   */
  async getWorkerUnavailableSlots(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/workers/me/unavailable-slots${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * 利用不可スロットの作成（単一: { date, slotIndex } / 複数: { items, continueOnError? }）
   */
  async createWorkerUnavailableSlot(body) {
    return this.request('/workers/me/unavailable-slots', {
      method: 'POST',
      body,
    });
  }

  /**
   * 期間内の利用不可を一括同期（PUT /workers/me/unavailable-slots/sync）
   */
  async syncWorkerUnavailableSlots(body) {
    return this.request('/workers/me/unavailable-slots/sync', {
      method: 'PUT',
      body,
    });
  }

  /**
   * クエリで削除（DELETE /workers/me/unavailable-slots?date=&slotIndex=）
   */
  async deleteWorkerUnavailableSlotByQuery(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/workers/me/unavailable-slots${queryString ? `?${queryString}` : ''}`, {
      method: 'DELETE',
    });
  }

  /**
   * IDで削除（DELETE /workers/me/unavailable-slots/:id）
   */
  async deleteWorkerUnavailableSlotById(slotId) {
    return this.request(`/workers/me/unavailable-slots/${encodeURIComponent(slotId)}`, {
      method: 'DELETE',
    });
  }

  // ==================== レビューAPI ====================

  /**
   * レビューを投稿
   */
  async createReview(data) {
    return this.request('/reviews', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * ワーカーのレビュー一覧を取得
   */
  async getReviewsByWorkerId(workerId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/reviews/${workerId}${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  // ==================== チャットAPI ====================

  /**
   * メッセージ一覧を取得
   */
  async getMessages(bookingId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/messages/${bookingId}${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * メッセージを送信
   */
  async sendMessage(data) {
    return this.request('/messages', {
      method: 'POST',
      body: data,
    });
  }

  // ==================== 決済API ====================

  /**
   * 決済履歴を取得
   */
  async getPayments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/payments${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * Stripe PaymentIntentを作成
   */
  async createPaymentIntent(bookingId) {
    return this.request('/payments/intent', {
      method: 'POST',
      body: { bookingId },
    });
  }

  /**
   * 旧決済API（互換用・バックエンドは410を返す）
   */
  async createPayment(data) {
    return this.request('/payments', {
      method: 'POST',
      body: data,
    });
  }

  // ==================== カード管理API ====================

  /**
   * カード一覧を取得
   */
  async getCards() {
    return this.request('/cards');
  }

  /**
   * Stripe SetupIntentを作成
   */
  async createCardSetupIntent() {
    return this.request('/cards/setup-intent', {
      method: 'POST',
    });
  }

  /**
   * Stripe PaymentMethod IDでカードを追加
   */
  async addStripeCard(paymentMethodId, isDefault = false) {
    return this.request('/cards', {
      method: 'POST',
      body: { paymentMethodId, isDefault },
    });
  }

  /**
   * カードを追加（互換用）
   */
  async addCard(data) {
    return this.request('/cards', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * カードを更新
   */
  async updateCard(cardId, data) {
    return this.request(`/cards/${cardId}`, {
      method: 'PUT',
      body: data,
    });
  }

  /**
   * カードを削除
   */
  async deleteCard(cardId) {
    return this.request(`/cards/${cardId}`, {
      method: 'DELETE',
    });
  }

  // ==================== サポートAPI ====================

  /**
   * 問い合わせ一覧を取得
   */
  async getSupportTickets(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/support${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * 問い合わせを作成
   */
  async createSupportTicket(data) {
    return this.request('/support', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * 問い合わせ詳細を取得
   */
  async getSupportTicketById(ticketId) {
    return this.request(`/support/${ticketId}`);
  }

  // ==================== 通知API ====================

  /**
   * 通知一覧を取得
   */
  async getNotifications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * 未読通知数を取得
   */
  async getUnreadNotificationCount() {
    return this.request('/notifications/unread-count');
  }

  /**
   * すべての通知を既読にする
   */
  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  /**
   * 通知を既読にする
   */
  async markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  /**
   * 通知を削除
   */
  async deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // ==================== お気に入りAPI ====================

  /**
   * お気に入り一覧を取得
   */
  async getFavorites(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/favorites${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * お気に入りを追加
   */
  async addFavorite(workerId) {
    return this.request('/favorites', {
      method: 'POST',
      body: { workerId },
    });
  }

  /**
   * お気に入りを削除
   */
  async removeFavorite(favoriteId) {
    return this.request(`/favorites/${favoriteId}`, {
      method: 'DELETE',
    });
  }

  /**
   * ワーカーIDでお気に入りを削除
   */
  async removeFavoriteByWorkerId(workerId) {
    return this.request(`/favorites/worker/${workerId}`, {
      method: 'DELETE',
    });
  }

  /**
   * お気に入りかどうかを確認
   */
  async checkFavorite(workerId) {
    return this.request(`/favorites/check/${workerId}`);
  }

  // ==================== 決済API ====================

  /**
   * 決済履歴を取得
   */
  async getPayments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/payments${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * 決済を処理
   */
  async processPayment(data) {
    return this.request('/payments', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * 領収書をダウンロード
   */
  async downloadReceipt(paymentId) {
    const url = `${this.baseURL}/payments/${paymentId}/receipt`;
    const headers = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '領収書のダウンロードに失敗しました');
    }

    // PDFファイルをダウンロード
    const blob = await response.blob();
    const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || `receipt-${paymentId.substring(0, 8)}.pdf`;
    
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.classList.add('is-hidden');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);

    return { message: `${filename}をダウンロードしました` };
  }

  // ==================== ファイルアップロードAPI ====================

  /**
   * ファイルをアップロード
   */
  async uploadFile(file, category = 'GENERAL') {
    if (window.KajishiftOps && typeof window.KajishiftOps.ensureOperationAllowed === 'function') {
      window.KajishiftOps.ensureOperationAllowed('uploadFile');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const url = `${this.baseURL}/upload`;
    const headers = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      if ((response.status === 503 || response.status === 423) && error.code === 'OPERATION_PAUSED') {
        if (window.KajishiftOps && typeof window.KajishiftOps.handlePausedResponse === 'function') {
          window.KajishiftOps.handlePausedResponse(error);
        }
      }
      throw new Error(error.message || 'ファイルのアップロードに失敗しました');
    }

    return response.json();
  }

  /**
   * ファイル一覧を取得
   */
  async getFiles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/upload${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * ファイル情報を取得
   */
  async getFileById(fileId) {
    return this.request(`/upload/${fileId}`);
  }

  /**
   * ファイルをダウンロード
   */
  async downloadFile(fileId) {
    const url = `${this.baseURL}/upload/${fileId}/download`;
    const headers = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      throw new Error('ファイルのダウンロードに失敗しました');
    }

    return response;
  }

  /**
   * ファイルを削除
   */
  async deleteFile(fileId) {
    return this.request(`/upload/${fileId}`, {
      method: 'DELETE',
    });
  }

  // ==================== 管理者API ====================

  /**
   * ユーザー一覧を取得（管理者のみ）
   */
  async getAdminUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/users${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * 管理者を新規登録（既存管理者のみが実行可能）
   */
  async registerAdmin(adminData) {
    return this.request('/admin/register', {
      method: 'POST',
      body: adminData,
    });
  }

  /**
   * ワーカー一覧を取得（管理者のみ）
   */
  async getAdminWorkers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/workers${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * ワーカー詳細を取得（管理者のみ・GET /admin/workers/:id）
   * 未実装のバックエンドでは 404 のため、呼び出し側で GET /workers/:id にフォールバックする
   */
  async getAdminWorkerById(workerId) {
    return this.request(`/admin/workers/${encodeURIComponent(workerId)}`);
  }

  /**
   * 管理者: ワーカーテスト回答一覧を取得
   */
  async getAdminWorkerTestSubmissions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/worker-test-submissions${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * 管理者: ワーカーテスト回答詳細を取得
   */
  async getAdminWorkerTestSubmission(id) {
    return this.request(`/admin/worker-test-submissions/${encodeURIComponent(id)}`);
  }

  /**
   * 管理者: ワーカーテスト回答の最終判定を保存
   */
  async finalizeWorkerTestSubmission(id, finalDecision, adminComment = '') {
    return this.request(`/admin/worker-test-submissions/${encodeURIComponent(id)}/final-review`, {
      method: 'POST',
      body: {
        adminFinalDecision: finalDecision,
        adminComment
      },
    });
  }

  /**
   * ワーカーを承認/却下（管理者のみ）
   */
  async approveWorker(workerId, approvalStatus) {
    return this.request(`/admin/workers/${encodeURIComponent(workerId)}/approve`, {
      method: 'PUT',
      body: { approvalStatus },
    });
  }

  /**
   * ワーカー却下（管理者のみ・approveWorker のショートカット）
   */
  async rejectWorker(workerId) {
    return this.approveWorker(workerId, 'REJECTED');
  }

  /**
   * ユーザーを更新（管理者のみ）
   */
  async updateUser(userId, data) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: data,
    });
  }

  /**
   * ユーザーを削除（管理者のみ）
   */
  async deleteUser(userId) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  /**
   * ワーカーを更新（管理者のみ）
   */
  async updateWorker(workerId, data) {
    return this.request(`/admin/workers/${workerId}`, {
      method: 'PUT',
      body: data,
    });
  }

  /**
   * ワーカーを削除（管理者のみ）
   */
  async deleteWorker(workerId) {
    return this.request(`/admin/workers/${workerId}`, {
      method: 'DELETE',
    });
  }

  /**
   * 問い合わせチケットを更新（管理者のみ）
   */
  async updateSupportTicket(ticketId, data) {
    return this.request(`/admin/support/${ticketId}`, {
      method: 'PUT',
      body: data,
    });
  }

  /**
   * 問い合わせチケットを削除（管理者のみ）
   */
  async deleteSupportTicket(ticketId) {
    return this.request(`/admin/support/${ticketId}`, {
      method: 'DELETE',
    });
  }

  /**
   * 予約レポートを取得（管理者のみ）
   */
  async getAdminBookingReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/reports/bookings${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * 売上レポートを取得（管理者のみ）
   */
  async getAdminRevenueReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/reports/revenue${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * ユーザー統計レポートを取得（管理者のみ）
   */
  async getAdminUserReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/reports/users${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * ワーカー統計レポートを取得（管理者のみ）
   */
  async getAdminWorkerReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/reports/workers${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * 管理ダッシュボード用KPIサマリー（バックエンドが /admin/stats を実装している場合）
   */
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  // ==================== システム設定API ====================

  /**
   * システム設定を取得（管理者のみ）
   */
  async getSystemSettings(category = null) {
    const params = category ? { category } : {};
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/settings${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * システム設定を更新（管理者のみ）
   */
  async updateSystemSettings(settings) {
    return this.request('/admin/settings', {
      method: 'PUT',
      body: settings,
    });
  }

  /**
   * サービスメニュー一覧を取得（管理者のみ）
   */
  async getServiceMenus() {
    return this.request('/admin/services');
  }

  /**
   * サービスメニューを作成（管理者のみ）
   */
  async createServiceMenu(data) {
    return this.request('/admin/services', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * サービスメニューを更新（管理者のみ）
   */
  async updateServiceMenu(serviceId, data) {
    return this.request(`/admin/services/${serviceId}`, {
      method: 'PUT',
      body: data,
    });
  }

  /**
   * サービスメニューを削除（管理者のみ）
   */
  async deleteServiceMenu(serviceId) {
    return this.request(`/admin/services/${serviceId}`, {
      method: 'DELETE',
    });
  }

  /**
   * 対応エリア一覧を取得（管理者のみ）
   */
  async getAreas() {
    return this.request('/admin/areas');
  }

  /**
   * 対応エリアを作成（管理者のみ）
   */
  async createArea(data) {
    return this.request('/admin/areas', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * 対応エリアを更新（管理者のみ）
   */
  async updateArea(areaId, data) {
    return this.request(`/admin/areas/${areaId}`, {
      method: 'PUT',
      body: data,
    });
  }

  /**
   * 対応エリアを削除（管理者のみ）
   */
  async deleteArea(areaId) {
    return this.request(`/admin/areas/${areaId}`, {
      method: 'DELETE',
    });
  }

  /**
   * CSVファイルをダウンロード（管理者のみ）
   * @param {string} reportType - レポートタイプ（bookings, users, workers, revenue）
   * @param {object} params - クエリパラメータ（startDate, endDateなど）
   */
  async downloadCSV(reportType, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/reports/${reportType}/export/csv${queryString ? `?${queryString}` : ''}`;
    
    const url = `${this.baseURL}${endpoint}`;
    const headers = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'CSVのダウンロードに失敗しました' }));
      throw new Error(error.message || 'CSVのダウンロードに失敗しました');
    }

    // ファイル名を取得（Content-Dispositionヘッダーから）
    const contentDisposition = response.headers.get('content-disposition');
    let filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Blobとして取得してダウンロード
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true, filename };
  }

  /**
   * Excelファイルをダウンロード（管理者のみ）
   * @param {string} reportType - レポートタイプ（bookings, users, workers, revenue）
   * @param {object} params - クエリパラメータ（startDate, endDateなど）
   */
  async downloadExcel(reportType, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/reports/${reportType}/export/excel${queryString ? `?${queryString}` : ''}`;
    
    const url = `${this.baseURL}${endpoint}`;
    const headers = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Excelのダウンロードに失敗しました' }));
      throw new Error(error.message || 'Excelのダウンロードに失敗しました');
    }

    // ファイル名を取得（Content-Dispositionヘッダーから）
    const contentDisposition = response.headers.get('content-disposition');
    let filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Blobとして取得してダウンロード
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true, filename };
  }
}

// グローバルインスタンス（必ず window に公開 — 他スクリプトは window.api を参照）
const api = new ApiClient();
window.api = api;
window.ApiClient = ApiClient;
console.log('KAJISHIFT API initialized and attached to window.api');

window.KajishiftOps = {
  status: (() => {
    try {
      return JSON.parse(sessionStorage.getItem('kajishiftOpsStatus') || 'null');
    } catch (error) {
      return null;
    }
  })(),
  async refresh() {
    try {
      const response = await api.getPublicStatus();
      this.status = response.data || null;
      try {
        sessionStorage.setItem('kajishiftOpsStatus', JSON.stringify(this.status));
      } catch (storageError) {
        // ignore storage errors
      }
      this.renderBanner();
      this.renderPausedPanel();
      this.applyPageGuards();
      return this.status;
    } catch (error) {
      console.warn('運用状態の取得に失敗しました:', error);
      return null;
    }
  },
  getMode() {
    return this.status && this.status.mode ? this.status.mode : 'normal';
  },
  getMessage() {
    return this.status && this.status.message ? this.status.message : '';
  },
  getSupportEmail() {
    return (this.status && this.status.support && this.status.support.email) || window.KAJISHIFT_SUPPORT_EMAIL || 'support@kajishift.jp';
  },
  getSupportUrl() {
    return (this.status && this.status.support && this.status.support.url) || window.KAJISHIFT_SUPPORT_URL || '/legal.html#contact';
  },
  getOperationLabel() {
    return (this.status && this.status.operationLabel) || OPS_OPERATION_LABELS[this.getMode()] || this.getMode();
  },
  getCapability(name) {
    return !this.status || !this.status.capabilities || this.status.capabilities[name] !== false;
  },
  isOperationAllowed(operation) {
    const map = {
      registerUser: 'canRegisterUsers',
      createBooking: 'canCreateBookings',
      bookingWrite: 'canMutateBookings',
      createPaymentIntent: 'canCreatePaymentIntents',
      createSetupIntent: 'canCreateSetupIntents',
      cardWrite: 'canWriteCards',
      createReview: 'canCreateReviews',
      sendMessage: 'canSendMessages',
      uploadFile: 'canUploadFiles',
      deleteFile: 'canDeleteFiles',
      favoriteWrite: 'canWriteFavorites',
      profileWrite: 'canWriteProfiles',
      notificationWrite: 'canWriteNotifications',
      workerAvailabilityWrite: 'canWriteWorkerAvailability',
      adminWrite: 'canAdminWrite'
    };
    return this.getCapability(map[operation]);
  },
  ensureOperationAllowed(operation) {
    if (this.isOperationAllowed(operation)) return true;
    const error = new Error(this.getMessage() || '現在、この操作は一時停止しています。');
    error.status = 503;
    error.data = {
      code: 'OPERATION_PAUSED',
      operation,
      operationLabel: OPS_OPERATION_LABELS[operation] || operation,
      mode: this.getMode(),
      message: error.message,
      resumeAt: this.status && this.status.resumeAt,
      reason: this.status && this.status.reason,
      severity: this.status && this.status.severity
    };
    this.handlePausedResponse(error.data);
    throw error;
  },
  canCreateBookings() {
    return this.getCapability('canCreateBookings');
  },
  canMutateBookings() {
    return this.getCapability('canMutateBookings');
  },
  canCreatePaymentIntents() {
    return this.getCapability('canCreatePaymentIntents');
  },
  canCreateSetupIntents() {
    return this.getCapability('canCreateSetupIntents');
  },
  canWriteProfiles() {
    return this.getCapability('canWriteProfiles');
  },
  canRegisterUsers() {
    return this.getCapability('canRegisterUsers');
  },
  canWriteCards() {
    return this.getCapability('canWriteCards');
  },
  canCreateReviews() {
    return this.getCapability('canCreateReviews');
  },
  canSendMessages() {
    return this.getCapability('canSendMessages');
  },
  canUploadFiles() {
    return this.getCapability('canUploadFiles');
  },
  canWriteFavorites() {
    return this.getCapability('canWriteFavorites');
  },
  canWriteWorkerAvailability() {
    return this.getCapability('canWriteWorkerAvailability');
  },
  canAdminWrite() {
    return this.getCapability('canAdminWrite');
  },
  handlePausedResponse(data) {
    this.status = {
      ...(this.status || {}),
      mode: data.mode || (this.status && this.status.mode) || 'maintenance',
      message: data.message || this.getMessage(),
      resumeAt: data.resumeAt || null,
      reason: data.reason || null,
      severity: data.severity || 'warning',
      blockedOperations: Array.from(new Set([...(this.status && this.status.blockedOperations ? this.status.blockedOperations : []), data.operation].filter(Boolean)))
    };
    this.renderBanner();
    this.renderPausedPanel(data);
    this.applyPageGuards();
    if (typeof window.showError === 'function') {
      window.showError(data.message || '現在、この操作は一時停止しています。');
    }
  },
  renderBanner() {
    const existing = document.getElementById('kajishiftOpsBanner');
    if (existing) existing.remove();

    if (!this.status || this.getMode() === 'normal') {
      this.renderPausedPanel();
      return;
    }

    const banner = document.createElement('div');
    banner.id = 'kajishiftOpsBanner';
    banner.className = `ops-banner ops-banner--${this.getMode()}`;

    const title = document.createElement('strong');
    title.textContent = `KAJISHIFT β版: ${this.getOperationLabel()}`;
    const message = document.createElement('span');
    message.textContent = this.getMessage();
    banner.appendChild(title);
    banner.appendChild(message);

    if (this.status.resumeAt) {
      const resume = document.createElement('span');
      resume.className = 'ops-banner__resume';
      resume.textContent = `復旧予定: ${this.status.resumeAt}`;
      banner.appendChild(resume);
    }

    const contact = document.createElement('a');
    contact.href = this.getSupportUrl();
    contact.textContent = `連絡先: ${this.getSupportEmail()}`;
    contact.className = 'ops-banner__contact';
    banner.appendChild(contact);

    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'ops-banner__refresh';
    retry.textContent = '状態を再確認';
    retry.addEventListener('click', () => this.refresh());
    banner.appendChild(retry);

    document.body.insertBefore(banner, document.body.firstChild);
  },
  renderPausedPanel(data = null) {
    const existing = document.getElementById('kajishiftOpsPausedPanel');
    if (existing) existing.remove();
    if (!this.status || this.getMode() === 'normal') return;

    const panel = document.createElement('div');
    panel.id = 'kajishiftOpsPausedPanel';
    panel.className = 'ops-paused-panel';
    panel.setAttribute('role', 'status');
    panel.innerHTML = `
      <div class="ops-paused-panel__inner">
        <strong>現在一部機能を停止しています</strong>
        <span>${this.getOperationLabel()}</span>
        <p>${data && data.operationLabel ? `${data.operationLabel}: ` : ''}${this.getMessage()}</p>
        ${this.status.resumeAt ? `<p class="ops-paused-panel__meta">復旧予定: ${this.status.resumeAt}</p>` : ''}
        <p class="ops-paused-panel__meta">お急ぎの場合は <a href="${this.getSupportUrl()}">${this.getSupportEmail()}</a> へご連絡ください。</p>
        <button type="button" class="btn btn--outline btn-small" id="kajishiftOpsRefreshBtn">状態を再確認</button>
      </div>
    `;
    document.body.appendChild(panel);
    const refreshBtn = document.getElementById('kajishiftOpsRefreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.refresh());
  },
  disableElements(selector, message) {
    document.querySelectorAll(selector).forEach((el) => {
      if (el.dataset.opsDisabled === 'true') return;
      el.dataset.opsDisabled = 'true';
      if ('disabled' in el) el.disabled = true;
      el.setAttribute('aria-disabled', 'true');
      el.classList.add('is-disabled');
      if (el.tagName === 'BUTTON') {
        el.dataset.opsOriginalText = el.textContent;
        el.textContent = message;
      }
    });
  },
  restoreElements() {
    document.querySelectorAll('[data-ops-disabled="true"]').forEach((el) => {
      if ('disabled' in el) el.disabled = false;
      el.removeAttribute('aria-disabled');
      el.classList.remove('is-disabled');
      if (el.dataset.opsOriginalText) {
        el.textContent = el.dataset.opsOriginalText;
      }
      delete el.dataset.opsDisabled;
      delete el.dataset.opsOriginalText;
    });
  },
  applyPageGuards() {
    if (!this.status || this.getMode() === 'normal') {
      this.restoreElements();
      return;
    }

    if (!this.canCreateBookings()) {
      const form = document.getElementById('booking-wizard');
      if (form && (!new URLSearchParams(window.location.search).get('id') || !this.canMutateBookings())) {
        form.querySelectorAll('input, select, textarea, button').forEach((el) => {
          el.disabled = true;
        });
        const formError = document.getElementById('formError');
        if (formError) {
          formError.textContent = this.getMessage();
          formError.style.display = 'block';
        }
      }
      document.querySelectorAll('a[href$="booking.html"]').forEach((link) => {
        if (link.classList.contains('active')) return;
        link.classList.add('is-disabled-link');
        link.setAttribute('aria-disabled', 'true');
      });
    }

    if (!this.canRegisterUsers()) {
      document.querySelectorAll('a[href$="register.html"], a[href*="/register.html"]').forEach((link) => {
        link.classList.add('is-disabled-link');
        link.setAttribute('aria-disabled', 'true');
      });
    }

    if (!this.canCreatePaymentIntents()) {
      this.disableElements('.js-payment-confirm-btn, button[onclick*="startPaymentProcess"]', '現在、決済受付を一時停止しています');
    }

    if (!this.canCreateSetupIntents() || !this.canWriteCards()) {
      this.disableElements('button[onclick*="openCardModal"], #cardSubmitBtn, #editCardSubmitBtn, #cardForm button[type="submit"], #editCardForm button[type="submit"]', '現在、カード登録を一時停止しています');
    }

    if (!this.canSendMessages()) {
      this.disableElements('#messageInput, #sendBtn', '現在、送信を一時停止しています');
    }

    if (!this.canUploadFiles()) {
      this.disableElements('#attachBtn, #fileInput', '現在、添付を一時停止しています');
    }

    if (!this.canCreateReviews()) {
      this.disableElements('button[onclick*="openReviewModal"], #reviewForm button[type="submit"]', '現在、レビュー投稿を一時停止しています');
    }

    document.querySelectorAll('[data-ops-operation]').forEach((el) => {
      const operation = el.getAttribute('data-ops-operation');
      if (!this.isOperationAllowed(operation)) {
        this.disableElements(`[data-ops-operation="${operation}"]`, this.getMessage() || '現在、この操作は一時停止しています');
      }
    });

    if (this.getMode() === 'maintenance') {
      document.querySelectorAll('form').forEach((form) => {
        if (form.id === 'loginForm' || form.id === 'supportForm') return;
        form.querySelectorAll('input, select, textarea, button').forEach((el) => {
          el.disabled = true;
          el.dataset.opsDisabled = 'true';
          el.setAttribute('aria-disabled', 'true');
        });
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.KajishiftOps.refresh();
  window.setInterval(() => {
    window.KajishiftOps.refresh();
  }, 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) window.KajishiftOps.refresh();
  });
  window.addEventListener('focus', () => window.KajishiftOps.refresh());
});

// ページ読み込み時に 1 回だけ /auth/me を呼ぶ（ポーリングやループは行わない）
if (api.token) {
  api.getMe().catch(() => {
    api.clearToken();
  });
}
