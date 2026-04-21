/**
 * 予約の scheduledDate（ISO/Date）と startTime（"HH:mm"）を結合して表示・計算する共通ユーティリティ
 * （API が startTime を時刻文字列で返す前提。new Date("10:00") は不正になるため使用しない）
 */
(function (global) {
  'use strict';

  function parseStartTimeParts(startTime) {
    if (startTime == null || startTime === '') return [0, 0];
    const s = String(startTime).trim();
    const m = /^(\d{1,2}):(\d{2})/.exec(s);
    if (!m) return [0, 0];
    let h = parseInt(m[1], 10);
    let min = parseInt(m[2], 10);
    if (h < 0 || h > 23 || min < 0 || min > 59) return [0, 0];
    return [h, min];
  }

  /**
   * ローカル暦日 + 開始時刻から開始 Date を生成
   * @param {string|Date} scheduledDate
   * @param {string} [startTime]
   * @returns {Date|null}
   */
  function getBookingStartLocal(scheduledDate, startTime) {
    if (scheduledDate == null || scheduledDate === '') return null;
    const d = scheduledDate instanceof Date ? scheduledDate : new Date(scheduledDate);
    if (Number.isNaN(d.getTime())) return null;
    const [hh, mm] = parseStartTimeParts(startTime);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm, 0, 0);
  }

  /**
   * @param {Date|null} start
   * @param {number} durationHours
   * @returns {Date|null}
   */
  function getBookingEndLocal(start, durationHours) {
    if (!start || Number.isNaN(start.getTime())) return null;
    const dur = Number(durationHours);
    const h = Number.isFinite(dur) && dur > 0 ? dur : 2;
    return new Date(start.getTime() + h * 60 * 60 * 1000);
  }

  /**
   * 一覧カード用: 日付行・時間レンジ行・時間数
   * @param {object} booking
   */
  function formatBookingRangeForCard(booking) {
    const duration = booking && booking.duration != null ? Number(booking.duration) : 2;
    const start = getBookingStartLocal(
      booking && booking.scheduledDate,
      booking && booking.startTime
    );
    const end =
      booking && booking.endTime
        ? new Date(booking.endTime)
        : getBookingEndLocal(start, duration);

    const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
    const timeFormatter = new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (!start || Number.isNaN(start.getTime())) {
      return {
        dateStr: '日付未設定',
        timeStr: '時間未設定',
        hours: Number.isFinite(duration) ? duration : 2,
      };
    }

    const dateStr = dateFormatter.format(start);
    let hours = Number.isFinite(duration) && duration > 0 ? duration : 2;
    let timeStr;
    if (end && !Number.isNaN(end.getTime())) {
      timeStr = `${timeFormatter.format(start)}〜${timeFormatter.format(end)}`;
      hours = Math.max(1, Math.round((end - start) / (1000 * 60 * 60)));
    } else {
      const est = getBookingEndLocal(start, hours);
      timeStr = est
        ? `${timeFormatter.format(start)}〜${timeFormatter.format(est)}`
        : timeFormatter.format(start);
    }

    return { dateStr, timeStr, hours };
  }

  /**
   * ワーカー選択画面サマリー用（1行）
   * @param {object} booking
   * @returns {{ line: string, start: Date|null, end: Date|null }}
   */
  function formatBookingSummaryLine(booking) {
    if (!booking) {
      return { line: '—', start: null, end: null };
    }
    const duration = booking.duration != null ? Number(booking.duration) : 0;
    const start = getBookingStartLocal(booking.scheduledDate, booking.startTime);
    const end =
      booking.endTime && !Number.isNaN(new Date(booking.endTime).getTime())
        ? new Date(booking.endTime)
        : getBookingEndLocal(start, duration);

    if (!start || Number.isNaN(start.getTime())) {
      return { line: '日付未設定', start: null, end: end };
    }

    const dateStr = start.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
    const tf = new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit' });
    const timePart =
      end && !Number.isNaN(end.getTime())
        ? `${tf.format(start)}〜${tf.format(end)}`
        : tf.format(start);

    return { line: `${dateStr} ${timePart}`, start, end };
  }

  global.KajishiftBookingDateTime = {
    getBookingStartLocal,
    getBookingEndLocal,
    formatBookingRangeForCard,
    formatBookingSummaryLine,
    parseStartTimeParts,
  };
})(typeof window !== 'undefined' ? window : globalThis);
