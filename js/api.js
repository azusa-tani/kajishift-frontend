/**
 * KAJISHIFT API クライアント
 * バックエンドAPIとの通信を管理
 */

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

        const error = new Error(data.message || 'エラーが発生しました');
        error.status = response.status;
        error.data = data;
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
    const url = `${this.baseURL}/auth/register`;
    const headers = {};

    // FormDataの場合はContent-Typeを設定しない（ブラウザが自動設定）

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '登録に失敗しました');
    }

    const data = await response.json();

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
   * 決済を処理
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
   * カードを追加
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
   * ワーカーを承認/却下（管理者のみ）
   */
  async approveWorker(workerId, approvalStatus) {
    return this.request(`/admin/workers/${workerId}/approve`, {
      method: 'PUT',
      body: { approvalStatus },
    });
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

// グローバルインスタンスを作成
const api = new ApiClient();

// ページ読み込み時にトークンとユーザー情報を復元
if (api.token) {
  // トークンが有効か確認
  api.getMe().catch(() => {
    // トークンが無効な場合はクリア
    api.clearToken();
  });
}
