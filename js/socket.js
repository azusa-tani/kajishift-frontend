/**
 * Socket.io接続管理クラス
 * リアルタイム通知とメッセージ機能を提供
 */

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1秒
    this.listeners = {
      notification: [],
      message: [],
      unreadCount: []
    };
  }

  /**
   * Socket.io接続を初期化
   * @param {string} token - JWTトークン
   * @param {string} serverURL - サーバーURL（デフォルト: 環境変数または環境に応じた自動切り替え）
   */
  connect(token, serverURL = null) {
    // serverURLが指定されていない場合、環境に応じて自動決定
    if (!serverURL) {
      if (window.SOCKET_SERVER_URL) {
        serverURL = window.SOCKET_SERVER_URL;
      } else {
        // 環境に応じて自動切り替え
        // localhostの場合は開発環境、それ以外は本番環境
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' ||
                             window.location.hostname === '';
        serverURL = isDevelopment 
          ? 'http://localhost:3000'
          : 'https://kajishift-api.onrender.com';
      }
    }
    if (this.socket && this.isConnected) {
      console.log('Socket.ioは既に接続されています');
      return;
    }

    if (!token) {
      console.error('Socket.io接続にトークンが必要です');
      return;
    }

    // Socket.ioクライアントライブラリが読み込まれているか確認
    if (typeof io === 'undefined') {
      console.error('Socket.ioクライアントライブラリが読み込まれていません');
      return;
    }

    try {
      this.socket = io(serverURL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('Socket.io接続エラー:', error);
    }
  }

  /**
   * イベントハンドラーを設定
   */
  setupEventHandlers() {
    if (!this.socket) return;

    // 接続成功
    this.socket.on('connect', () => {
      console.log('Socket.io接続成功');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    // 接続確認
    this.socket.on('connected', (data) => {
      console.log('Socket.io接続確認:', data);
      this.isConnected = true;
    });

    // 通知受信
    this.socket.on('notification', (data) => {
      console.log('新しい通知を受信:', data);
      if (data && data.data) {
        this.listeners.notification.forEach(callback => {
          try {
            callback(data.data);
          } catch (error) {
            console.error('通知コールバックエラー:', error);
          }
        });
      }
    });

    // メッセージ受信
    this.socket.on('message', (data) => {
      console.log('新しいメッセージを受信:', data);
      if (data && data.data) {
        this.listeners.message.forEach(callback => {
          try {
            callback(data.data);
          } catch (error) {
            console.error('メッセージコールバックエラー:', error);
          }
        });
      }
    });

    // 未読通知数更新
    this.socket.on('unread-count', (data) => {
      console.log('未読通知数更新:', data);
      if (data && typeof data.count === 'number') {
        this.listeners.unreadCount.forEach(callback => {
          try {
            callback(data.count);
          } catch (error) {
            console.error('未読通知数コールバックエラー:', error);
          }
        });
      }
    });

    // 接続エラー
    this.socket.on('connect_error', (error) => {
      console.error('Socket.io接続エラー:', error);
      this.isConnected = false;
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Socket.io再接続試行回数の上限に達しました');
      }
    });

    // 切断
    this.socket.on('disconnect', (reason) => {
      console.log('Socket.io切断:', reason);
      this.isConnected = false;

      // 意図的な切断でない場合は再接続を試みる
      if (reason === 'io server disconnect') {
        // サーバー側で切断された場合は手動で再接続
        this.socket.connect();
      }
    });

    // エラー
    this.socket.on('error', (error) => {
      console.error('Socket.ioエラー:', error);
    });
  }

  /**
   * 通知受信イベントのリスナーを登録
   * @param {Function} callback - コールバック関数
   */
  onNotification(callback) {
    if (typeof callback === 'function') {
      this.listeners.notification.push(callback);
    }
  }

  /**
   * メッセージ受信イベントのリスナーを登録
   * @param {Function} callback - コールバック関数
   */
  onMessage(callback) {
    if (typeof callback === 'function') {
      this.listeners.message.push(callback);
    }
  }

  /**
   * 未読通知数更新イベントのリスナーを登録
   * @param {Function} callback - コールバック関数
   */
  onUnreadCount(callback) {
    if (typeof callback === 'function') {
      this.listeners.unreadCount.push(callback);
    }
  }

  /**
   * リスナーを削除
   * @param {string} eventType - イベントタイプ（notification, message, unreadCount）
   * @param {Function} callback - 削除するコールバック関数
   */
  off(eventType, callback) {
    if (this.listeners[eventType]) {
      const index = this.listeners[eventType].indexOf(callback);
      if (index > -1) {
        this.listeners[eventType].splice(index, 1);
      }
    }
  }

  /**
   * すべてのリスナーを削除
   */
  removeAllListeners() {
    this.listeners.notification = [];
    this.listeners.message = [];
    this.listeners.unreadCount = [];
  }

  /**
   * Socket.io接続を切断
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.removeAllListeners();
    }
  }

  /**
   * 接続状態を取得
   * @returns {boolean} 接続中かどうか
   */
  getConnectionStatus() {
    return this.isConnected && this.socket && this.socket.connected;
  }
}

// グローバルインスタンスを作成
const socketManager = new SocketManager();
