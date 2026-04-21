/**
 * Socket.io 接続管理（全ロール共通）
 * - JWT は auth: { token } で送信
 * - DOMContentLoaded 時にトークンがあれば自動接続（js/socket-bootstrap 相当の処理を内包）
 */

function socketExtractPayload(raw) {
  if (raw == null) return null;
  if (typeof raw === 'object' && raw.data !== undefined) {
    return raw.data;
  }
  return raw;
}

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = Infinity;
    this.reconnectDelay = 1000;
    this._authToken = null;
    this._serverURL = null;
    this._globalHandlersRegistered = false;
    this.listeners = {
      notification: [],
      message: [],
      unreadCount: [],
    };
  }

  /**
   * 既存ソケットを破棄（リスナーは残す：ページ用コールバックのため）
   */
  _destroySocketInstance() {
    if (!this.socket) return;
    try {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    } catch (e) {
      console.warn('Socket 切断時の警告:', e);
    }
    this.socket = null;
    this.isConnected = false;
  }

  connect(token, serverURL = null) {
    if (typeof io === 'undefined') {
      console.error('Socket.io クライアントが読み込まれていません（CDN の socket.io を先に読み込んでください）');
      return;
    }

    if (!token) {
      console.warn('Socket.io: トークンがないため接続しません');
      return;
    }

    const tokenStr = String(token);
    let resolvedUrl = serverURL;
    if (!resolvedUrl) {
      if (window.SOCKET_SERVER_URL) {
        resolvedUrl = window.SOCKET_SERVER_URL;
      } else {
        const isDevelopment =
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname === '';
        resolvedUrl = isDevelopment
          ? 'http://localhost:3000'
          : 'https://kajishift-backend-production.up.railway.app';
      }
    }

    // 同一トークン・接続済みなら何もしない
    if (this.socket && this.socket.connected && this._authToken === tokenStr) {
      return;
    }

    // トークン変更または未接続 → 作り直し
    if (this.socket) {
      this._destroySocketInstance();
    }

    this._authToken = tokenStr;
    this._serverURL = resolvedUrl;

    try {
      this.socket = io(resolvedUrl, {
        auth: {
          token: tokenStr,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 8000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('Socket.io 接続エラー:', error);
    }
  }

  /**
   * 明示的に接続を確保（既存ページの connect(token) と互換）
   */
  ensureConnected(token, serverURL = null) {
    this.connect(token, serverURL);
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket.io 接続成功');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      if (typeof window.syncNotificationBadgesGlobally === 'function') {
        window.syncNotificationBadgesGlobally();
      }
    });

    this.socket.on('connected', (data) => {
      console.log('Socket.io 接続確認:', data);
      this.isConnected = true;
    });

    const dispatchNotification = (raw) => {
      const payload = socketExtractPayload(raw);
      if (payload == null && raw == null) return;
      const data = payload != null ? payload : raw;
      this.listeners.notification.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('通知コールバックエラー:', error);
        }
      });
    };

    this.socket.on('notification', dispatchNotification);

    const dispatchMessage = (raw) => {
      const payload = socketExtractPayload(raw);
      if (payload == null && raw == null) return;
      const data = payload != null ? payload : raw;
      this.listeners.message.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('メッセージコールバックエラー:', error);
        }
      });
    };

    this.socket.on('message', dispatchMessage);
    this.socket.on('new_message', dispatchMessage);

    this.socket.on('unread-count', (raw) => {
      const data = socketExtractPayload(raw);
      let count;
      if (data && typeof data.count === 'number') {
        count = data.count;
      } else if (raw && typeof raw.count === 'number') {
        count = raw.count;
      } else {
        return;
      }
      console.log('未読通知数更新:', count);
      this.listeners.unreadCount.forEach((callback) => {
        try {
          callback(count);
        } catch (error) {
          console.error('未読通知数コールバックエラー:', error);
        }
      });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.io connect_error:', error);
      this.isConnected = false;
      this.reconnectAttempts++;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.io 切断:', reason);
      this.isConnected = false;
      if (reason === 'io server disconnect' && this.socket) {
        this.socket.connect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket.io error:', error);
    });

    this._registerGlobalSideEffectsOnce();
  }

  /**
   * どのページでもベルバッジを更新（重複登録しない）
   */
  _registerGlobalSideEffectsOnce() {
    if (this._globalHandlersRegistered) return;
    this._globalHandlersRegistered = true;

    this.onUnreadCount((count) => {
      if (typeof window.applySocketUnreadCountToBadges === 'function') {
        window.applySocketUnreadCountToBadges(count);
      }
    });

    this.onNotification(() => {
      if (typeof window.syncNotificationBadgesGlobally === 'function') {
        window.syncNotificationBadgesGlobally();
      } else if (typeof window.syncCustomerNotificationBadge === 'function') {
        window.syncCustomerNotificationBadge();
      }
    });
  }

  onNotification(callback) {
    if (typeof callback === 'function') {
      this.listeners.notification.push(callback);
    }
  }

  onMessage(callback) {
    if (typeof callback === 'function') {
      this.listeners.message.push(callback);
    }
  }

  onUnreadCount(callback) {
    if (typeof callback === 'function') {
      this.listeners.unreadCount.push(callback);
    }
  }

  off(eventType, callback) {
    if (this.listeners[eventType]) {
      const index = this.listeners[eventType].indexOf(callback);
      if (index > -1) {
        this.listeners[eventType].splice(index, 1);
      }
    }
  }

  removeAllListeners() {
    this.listeners.notification = [];
    this.listeners.message = [];
    this.listeners.unreadCount = [];
    this._globalHandlersRegistered = false;
  }

  disconnect() {
    this._destroySocketInstance();
    this.removeAllListeners();
    this._authToken = null;
  }

  getConnectionStatus() {
    return this.isConnected && this.socket && this.socket.connected;
  }
}

const socketManager = new SocketManager();
if (typeof window !== 'undefined') {
  window.socketManager = socketManager;
}

function kajishiftInitSocketIfLoggedIn() {
  if (typeof api === 'undefined') return;
  const token = api.token || localStorage.getItem('token');
  if (!token) return;
  if (typeof io === 'undefined') return;
  socketManager.connect(token);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', kajishiftInitSocketIfLoggedIn);
}
