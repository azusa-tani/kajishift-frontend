/**
 * ワーカーヘッダーの通知ベル：未読件数を API で更新する（各 worker/*.html で読み込み）
 */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('notificationBtn');
    var badge = document.querySelector('.worker-header .notification-badge');
    if (!btn || !badge) return;
    if (typeof api === 'undefined' || typeof api.getUnreadNotificationCount !== 'function') return;
    if (!localStorage.getItem('token')) return;

    api
      .getUnreadNotificationCount()
      .then(function (res) {
        var count =
          res.data && typeof res.data.count === 'number'
            ? res.data.count
            : typeof res.count === 'number'
              ? res.count
              : 0;
        if (count > 0) {
          badge.textContent = String(count);
          badge.classList.remove('is-hidden');
          btn.setAttribute('aria-label', '通知（' + count + '件の未読）');
        } else {
          badge.textContent = '0';
          badge.classList.add('is-hidden');
          btn.setAttribute('aria-label', '通知');
        }
      })
      .catch(function () {
        badge.classList.add('is-hidden');
      });
  });
})();
