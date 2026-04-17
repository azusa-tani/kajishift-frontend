/**
 * ワーカープロフィール: 対応エリア・利用可能時間の選択式 UI（serviceAreaText / availabilityText に JSON 保存、従来テキストも表示互換）
 */
(function (global) {
  const PREFECTURES = [
    '北海道',
    '青森県',
    '岩手県',
    '宮城県',
    '秋田県',
    '山形県',
    '福島県',
    '茨城県',
    '栃木県',
    '群馬県',
    '埼玉県',
    '千葉県',
    '東京都',
    '神奈川県',
    '新潟県',
    '富山県',
    '石川県',
    '福井県',
    '山梨県',
    '長野県',
    '岐阜県',
    '静岡県',
    '愛知県',
    '三重県',
    '滋賀県',
    '京都府',
    '大阪府',
    '兵庫県',
    '奈良県',
    '和歌山県',
    '鳥取県',
    '島根県',
    '岡山県',
    '広島県',
    '山口県',
    '徳島県',
    '香川県',
    '愛媛県',
    '高知県',
    '福岡県',
    '佐賀県',
    '長崎県',
    '熊本県',
    '大分県',
    '宮崎県',
    '鹿児島県',
    '沖縄県',
  ];

  /** 主要都道府県の市区町村プルダウン。無い県は「市区町村を入力」に切替 */
  const CITIES_BY_PREF = {
    北海道: [
      '札幌市',
      '函館市',
      '小樽市',
      '旭川市',
      '室蘭市',
      '釧路市',
      '帯広市',
      '北見市',
      '夕張市',
      '岩見沢市',
      '網走市',
      '留萌市',
      '苫小牧市',
      '稚内市',
      '美唄市',
      '芦別市',
      '江別市',
      '赤平市',
      '紋別市',
      '士別市',
      '名寄市',
      '三笠市',
      '根室市',
      '千歳市',
      '滝川市',
      '砂川市',
      '歌志内市',
      '深川市',
      '富良野市',
      '登別市',
      '恵庭市',
      '伊達市',
      '北広島市',
      '石狩市',
      '北斗市',
      '石狩郡当別町',
      '石狩郡新篠津村',
      '松前郡松前町',
      'その他（下の欄に入力）',
    ],
    東京都: [
      '千代田区',
      '中央区',
      '港区',
      '新宿区',
      '文京区',
      '台東区',
      '墨田区',
      '江東区',
      '品川区',
      '目黒区',
      '大田区',
      '世田谷区',
      '渋谷区',
      '中野区',
      '杉並区',
      '豊島区',
      '北区',
      '荒川区',
      '板橋区',
      '練馬区',
      '足立区',
      '葛飾区',
      '江戸川区',
      '八王子市',
      '立川市',
      '武蔵野市',
      '三鷹市',
      '青梅市',
      '府中市',
      '昭島市',
      '調布市',
      '町田市',
      '小金井市',
      '小平市',
      '日野市',
      '東村山市',
      '国分寺市',
      '国立市',
      '福生市',
      '狛江市',
      '東大和市',
      '清瀬市',
      '東久留米市',
      '武蔵村山市',
      '多摩市',
      '稲城市',
      '羽村市',
      'あきる野市',
      '西東京市',
      'その他（下の欄に入力）',
    ],
    神奈川県: [
      '横浜市',
      '川崎市',
      '相模原市',
      '横須賀市',
      '平塚市',
      '鎌倉市',
      '藤沢市',
      '小田原市',
      '茅ヶ崎市',
      '逗子市',
      '三浦市',
      '秦野市',
      '厚木市',
      '大和市',
      '伊勢原市',
      '海老名市',
      '座間市',
      '南足柄市',
      '綾瀬市',
      'その他（下の欄に入力）',
    ],
    大阪府: [
      '大阪市',
      '堺市',
      '岸和田市',
      '豊中市',
      '池田市',
      '吹田市',
      '泉大津市',
      '高槻市',
      '貝塚市',
      '守口市',
      '枚方市',
      '茨木市',
      '八尾市',
      '泉佐野市',
      '富田林市',
      '寝屋川市',
      '河内長野市',
      '松原市',
      '大東市',
      '和泉市',
      '箕面市',
      '柏原市',
      '羽曳野市',
      '門真市',
      '摂津市',
      '高石市',
      '藤井寺市',
      '東大阪市',
      '泉南市',
      '四條畷市',
      '交野市',
      '大阪狭山市',
      '阪南市',
      'その他（下の欄に入力）',
    ],
    愛知県: [
      '名古屋市',
      '豊橋市',
      '岡崎市',
      '一宮市',
      '瀬戸市',
      '半田市',
      '春日井市',
      '豊川市',
      '津島市',
      '碧南市',
      '刈谷市',
      '豊田市',
      '安城市',
      '西尾市',
      '蒲郡市',
      '犬山市',
      '常滑市',
      '江南市',
      '小牧市',
      '稲沢市',
      '新城市',
      '東海市',
      '大府市',
      '知多市',
      '知立市',
      '尾張旭市',
      '高浜市',
      '岩倉市',
      '豊明市',
      '日進市',
      '田原市',
      '愛西市',
      '清須市',
      '北名古屋市',
      '弥富市',
      'みよし市',
      'あま市',
      '長久手市',
      'その他（下の欄に入力）',
    ],
    福岡県: [
      '北九州市',
      '福岡市',
      '大牟田市',
      '久留米市',
      '直方市',
      '飯塚市',
      '田川市',
      '柳川市',
      '八女市',
      '筑後市',
      '大川市',
      '行橋市',
      '豊前市',
      '中間市',
      '小郡市',
      '筑紫野市',
      '春日市',
      '大野城市',
      '宗像市',
      '太宰府市',
      '古賀市',
      '福津市',
      'うきは市',
      '宮若市',
      '嘉麻市',
      '朝倉市',
      'みやま市',
      '糸島市',
      'その他（下の欄に入力）',
    ],
    埼玉県: [
      'さいたま市',
      '川越市',
      '熊谷市',
      '川口市',
      '行田市',
      '秩父市',
      '所沢市',
      '飯能市',
      '加須市',
      '本庄市',
      '東松山市',
      '春日部市',
      '狭山市',
      '羽生市',
      '鴻巣市',
      '深谷市',
      '上尾市',
      '草加市',
      '越谷市',
      '蕨市',
      '戸田市',
      '入間市',
      '朝霞市',
      '志木市',
      '和光市',
      '新座市',
      '桶川市',
      '久喜市',
      '北本市',
      '八潮市',
      '富士見市',
      '三郷市',
      '蓮田市',
      '坂戸市',
      '幸手市',
      '鶴ヶ島市',
      '日高市',
      '吉川市',
      'ふじみ野市',
      '白岡市',
      'その他（下の欄に入力）',
    ],
  };

  const DAY_ORDER = [
    { key: 'mon', label: '月曜日' },
    { key: 'tue', label: '火曜日' },
    { key: 'wed', label: '水曜日' },
    { key: 'thu', label: '木曜日' },
    { key: 'fri', label: '金曜日' },
    { key: 'sat', label: '土曜日' },
    { key: 'sun', label: '日曜日' },
  ];

  const TIME_OPTIONS = (function () {
    const out = [];
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 30]) {
        out.push(`${String(h).padStart(2, '0')}:${m === 0 ? '00' : '30'}`);
      }
    }
    out.push('24:00');
    return out;
  })();

  function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  function parseServiceAreaText(raw) {
    const s = (raw || '').trim();
    if (!s) return [];
    if (s.startsWith('{')) {
      try {
        const o = JSON.parse(s);
        if (o && o.v === 1 && Array.isArray(o.rows)) return o.rows;
      } catch {
        /* fallthrough */
      }
    }
    const rows = [];
    s.split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const parts = line.split('|').map((x) => x.trim());
        const left = parts[0] || '';
        const rest = parts.slice(1).join(' ').trim();
        let pref = '北海道';
        let city = left;
        let ward = rest;
        const hit = PREFECTURES.find((p) => left.startsWith(p));
        if (hit) {
          pref = hit;
          city = left.slice(hit.length).trim() || left;
        }
        rows.push({ pref, city, ward });
      });
    return rows;
  }

  function stringifyServiceAreaRows(rows) {
    const clean = (rows || [])
      .map((r) => ({
        pref: (r.pref || '').trim(),
        city: (r.city || '').trim(),
        ward: (r.ward || '').trim(),
      }))
      .filter((r) => r.pref && (r.city || r.ward));
    if (!clean.length) return '';
    return JSON.stringify({ v: 1, rows: clean });
  }

  function defaultAvailabilityDays() {
    return DAY_ORDER.map((d) => ({
      key: d.key,
      closed: false,
      start: '09:00',
      end: '18:00',
    }));
  }

  function parseAvailabilityText(raw) {
    const s = (raw || '').trim();
    if (!s) return defaultAvailabilityDays();
    if (s.startsWith('{')) {
      try {
        const o = JSON.parse(s);
        if (o && o.v === 1 && Array.isArray(o.days)) {
          const map = {};
          o.days.forEach((d) => {
            if (d && d.key) map[d.key] = d;
          });
          return DAY_ORDER.map(({ key }) => {
            const x = map[key] || {};
            return {
              key,
              closed: Boolean(x.closed),
              start: x.start || '09:00',
              end: x.end || '18:00',
            };
          });
        }
      } catch {
        /* fallthrough */
      }
    }
    return defaultAvailabilityDays();
  }

  function stringifyAvailabilityDays(days) {
    const list = DAY_ORDER.map(({ key }) => {
      const x = (days || []).find((d) => d.key === key) || {};
      return {
        key,
        closed: Boolean(x.closed),
        start: x.start || '09:00',
        end: x.end || '18:00',
      };
    });
    return JSON.stringify({ v: 1, days: list });
  }

  function PREFecturesOptions(selected) {
    return (
      '<option value="">' +
      '都道府県を選択' +
      '</option>' +
      PREFECTURES.map((p) => `<option value="${escapeHtml(p)}"${p === selected ? ' selected' : ''}>${escapeHtml(p)}</option>`).join('')
    );
  }

  function refreshCityRow(row) {
    const pref = row.querySelector('.js-area-pref')?.value || '';
    const wrap = row.querySelector('.js-area-city-wrap');
    const sel = row.querySelector('.js-area-city-select');
    const manual = row.querySelector('.js-area-city-manual');
    if (!wrap || !sel || !manual) return;
    const cities = CITIES_BY_PREF[pref];
    if (cities && cities.length) {
      sel.classList.remove('is-hidden');
      manual.classList.add('is-hidden');
      sel.innerHTML =
        '<option value="">市区町村を選択</option>' +
        cities.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      const cur = manual.value.trim();
      if (cur && !cities.includes(cur)) {
        sel.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(cur)}" selected>${escapeHtml(cur)}</option>`);
      }
    } else {
      sel.classList.add('is-hidden');
      manual.classList.remove('is-hidden');
      if (!manual.value) manual.placeholder = '市区町村名を入力';
    }
  }

  function buildAreaRow(row) {
    const pref = row.pref || '北海道';
    const city = row.city || '';
    const ward = row.ward || '';
    const div = document.createElement('div');
    div.className = 'service-area-row card-standard';
    div.style.marginBottom = '12px';
    div.style.padding = '12px';
    div.innerHTML = `
      <div class="profile-select-grid">
        <div class="form-group">
          <label>都道府県</label>
          <select class="form-input js-area-pref" required>${PREFecturesOptions(pref)}</select>
        </div>
        <div class="form-group js-area-city-wrap">
          <label>市区町村</label>
          <select class="form-input js-area-city-select"></select>
          <input type="text" class="form-input js-area-city-manual is-hidden" maxlength="80" placeholder="市区町村名" />
        </div>
        <div class="form-group">
          <label>区・町など（任意）</label>
          <input type="text" class="form-input js-area-ward" maxlength="120" placeholder="例：中央区、南区" value="${escapeHtml(ward)}" />
        </div>
        <div class="form-group profile-select-row-actions">
          <label class="is-hidden">操作</label>
          <button type="button" class="btn btn--outline btn-small js-area-remove" aria-label="この行を削除">削除</button>
        </div>
      </div>`;
    const prefSel = div.querySelector('.js-area-pref');
    const manual = div.querySelector('.js-area-city-manual');
    const cities = CITIES_BY_PREF[pref];
    if (cities && cities.length) {
      const sel = div.querySelector('.js-area-city-select');
      sel.innerHTML =
        '<option value="">市区町村を選択</option>' +
        cities.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      if (city && cities.includes(city)) {
        sel.value = city;
      } else if (city) {
        sel.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(city)}" selected>${escapeHtml(city)}</option>`);
      }
    } else {
      manual.classList.remove('is-hidden');
      div.querySelector('.js-area-city-select').classList.add('is-hidden');
      manual.value = city;
    }
    prefSel.addEventListener('change', () => {
      manual.value = '';
      refreshCityRow(div);
    });
    div.querySelector('.js-area-remove').addEventListener('click', () => {
      div.remove();
    });
    return div;
  }

  function mountServiceAreaEditor(mountEl, rawText) {
    mountEl.innerHTML = '';
    const rows = parseServiceAreaText(rawText);
    const list = rows.length ? rows : [{ pref: '北海道', city: '', ward: '' }];
    list.forEach((r) => mountEl.appendChild(buildAreaRow(r)));
    mountEl.querySelectorAll('.service-area-row').forEach((row) => refreshCityRow(row));
  }

  function readServiceAreaFromMount(mountEl) {
    const rows = [];
    mountEl.querySelectorAll('.service-area-row').forEach((row) => {
      const pref = row.querySelector('.js-area-pref')?.value?.trim() || '';
      let city = '';
      const sel = row.querySelector('.js-area-city-select');
      const manual = row.querySelector('.js-area-city-manual');
      if (sel && !sel.classList.contains('is-hidden')) {
        city = sel.value?.trim() || '';
      } else if (manual) {
        city = manual.value?.trim() || '';
      }
      const ward = row.querySelector('.js-area-ward')?.value?.trim() || '';
      rows.push({ pref, city, ward });
    });
    return stringifyServiceAreaRows(rows);
  }

  function renderServiceAreaCard(el, raw) {
    if (!el) return;
    const s = (raw || '').trim();
    if (!s) {
      el.innerHTML = '<div class="empty-message">未設定（「編集」から入力できます）</div>';
      return;
    }
    let rows = [];
    if (s.startsWith('{')) {
      try {
        const o = JSON.parse(s);
        if (o && o.v === 1 && Array.isArray(o.rows)) rows = o.rows;
      } catch {
        rows = [];
      }
    }
    if (!rows.length) {
      parseServiceAreaText(raw).forEach((r) => rows.push(r));
    }
    if (!rows.length) {
      el.innerHTML = '<div class="empty-message">未設定（「編集」から入力できます）</div>';
      return;
    }
    el.innerHTML =
      '<div class="area-list">' +
      rows
        .map((r) => {
          const line = [r.pref, r.city].filter(Boolean).join(' ') + (r.ward ? `（${r.ward}）` : '');
          return `<div class="area-item"><span class="area-name">${escapeHtml(line || '-')}</span></div>`;
        })
        .join('') +
      '</div>';
  }

  function renderAvailabilityCard(el, raw) {
    if (!el) return;
    const s = (raw || '').trim();
    if (!s) {
      el.innerHTML = '<div class="empty-message">未設定（「編集」から入力できます）</div>';
      return;
    }
    if (!s.startsWith('{')) {
      el.innerHTML =
        '<div class="availability-table profile-availability-read"><pre class="profile-freeform-text">' +
        escapeHtml(s) +
        '</pre></div>';
      return;
    }
    const days = parseAvailabilityText(raw);
    const rows = DAY_ORDER.map(({ key, label }) => {
      const d = days.find((x) => x.key === key) || {};
      const closed = Boolean(d.closed);
      const text = closed ? '受付しない' : `${d.start || '09:00'} 〜 ${d.end || '18:00'}`;
      return `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(text)}</td></tr>`;
    }).join('');
    el.innerHTML = `<div class="availability-table"><table><thead><tr><th>曜日</th><th>利用可能時間</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function mountAvailabilityEditor(mountEl, raw) {
    const days = parseAvailabilityText(raw);
    const map = {};
    days.forEach((d) => {
      map[d.key] = d;
    });
    mountEl.innerHTML = DAY_ORDER.map(({ key, label }) => {
      const d = map[key] || { closed: false, start: '09:00', end: '18:00' };
      const timeOpts = TIME_OPTIONS.map((t) => `<option value="${t}">${escapeHtml(t)}</option>`).join('');
      return `
        <div class="availability-day-row card-standard" data-day="${key}">
          <div class="availability-day-label">${escapeHtml(label)}</div>
          <div class="availability-day-controls">
            <label class="checkbox-inline"><input type="checkbox" class="js-day-closed" ${d.closed ? 'checked' : ''} /> 受付しない</label>
            <div class="js-day-time-range">
              <span>開始</span>
              <select class="form-input js-day-start">${timeOpts}</select>
              <span>終了</span>
              <select class="form-input js-day-end">${timeOpts}</select>
            </div>
          </div>
        </div>`;
    }).join('');
    DAY_ORDER.forEach(({ key }) => {
      const row = mountEl.querySelector(`[data-day="${key}"]`);
      if (!row) return;
      const d = map[key] || {};
      const startSel = row.querySelector('.js-day-start');
      const endSel = row.querySelector('.js-day-end');
      if (startSel) startSel.value = d.start || '09:00';
      if (endSel) endSel.value = d.end || '18:00';
      const cb = row.querySelector('.js-day-closed');
      const range = row.querySelector('.js-day-time-range');
      const sync = () => {
        const closed = cb.checked;
        range.style.opacity = closed ? '0.45' : '1';
        range.querySelectorAll('select').forEach((sel) => {
          sel.disabled = closed;
        });
      };
      cb.addEventListener('change', sync);
      sync();
    });
  }

  function readAvailabilityFromMount(mountEl) {
    const days = DAY_ORDER.map(({ key }) => {
      const row = mountEl.querySelector(`[data-day="${key}"]`);
      if (!row) return { key, closed: false, start: '09:00', end: '18:00' };
      const closed = row.querySelector('.js-day-closed')?.checked || false;
      let start = row.querySelector('.js-day-start')?.value || '09:00';
      let end = row.querySelector('.js-day-end')?.value || '18:00';
      if (!closed && start >= end && end !== '24:00') {
        end = '18:00';
      }
      return { key, closed, start, end };
    });
    return stringifyAvailabilityDays(days);
  }

  global.WORKER_PROFILE_AREA_TIME = {
    mountServiceAreaEditor,
    mountAvailabilityEditor,
    readServiceAreaFromMount,
    readAvailabilityFromMount,
    renderServiceAreaCard,
    renderAvailabilityCard,
    addServiceAreaRow(mountEl) {
      mountEl.appendChild(buildAreaRow({ pref: '北海道', city: '', ward: '' }));
      refreshCityRow(mountEl.lastElementChild);
    },
  };
})(window);
