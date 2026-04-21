// ページ読み込み時にバリデーションを設定
document.addEventListener('DOMContentLoaded', function() {
  // 日付の最小値を今日に設定、最大値を3ヶ月後に設定
  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);
  const maxDateStr = maxDate.toISOString().split('T')[0];
  
  const dateInput = document.getElementById('booking-date');
  dateInput.setAttribute('min', today);
  dateInput.setAttribute('max', maxDateStr);
  
  // リアルタイムバリデーション設定
  setupRealTimeValidation(dateInput, (value) => Validators.dateRange(value, 3));
  setupRealTimeValidation(document.getElementById('start-time'), Validators.required);
  setupRealTimeValidation(document.getElementById('duration'), Validators.required);
  setupRealTimeValidation(document.getElementById('address-pref'), Validators.required);
  setupRealTimeValidation(document.getElementById('address-city'), Validators.required);
  setupRealTimeValidation(document.getElementById('address-detail'), Validators.required);
});

// 買い物オプションの表示/非表示
document.getElementById('shopping-option').addEventListener('change', function() {
  const detail = document.getElementById('shopping-detail');
  detail.classList.toggle('is-hidden', !this.checked);
  
  // 買い物オプションが選択された場合、リストのバリデーションを追加
  if (this.checked) {
    const shoppingList = document.getElementById('shopping-list');
    setupRealTimeValidation(shoppingList, Validators.required);
  }
});

// 認証チェック
document.addEventListener('DOMContentLoaded', async function() {
  // 認証チェック
  if (!checkAuth('customer')) {
    return; // リダイレクトされる
  }
  
  // URLパラメータから予約IDを取得（更新の場合）
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('id');
  const workerId = urlParams.get('workerId');

  // お気に入り導線: workerId付きで来た場合はクイック予約モード
  if (workerId) {
    preferredWorkerId = workerId;
    isQuickBookingMode = true;
    await setupQuickBookingMode(workerId);
  }
  
  if (bookingId) {
    // 予約更新モード：既存の予約データを読み込む
    await loadBookingForEdit(bookingId);
  }
});

// 予約更新用に既存データを読み込む
async function loadBookingForEdit(bookingId) {
  try {
    const response = await api.getBookingById(bookingId);
    const booking = response.data;
    
    if (!booking) {
      throw new Error('予約が見つかりません');
    }
    
    // フォームにデータを設定
    const scheduledDate = new Date(booking.scheduledDate);
    document.getElementById('booking-date').value = scheduledDate.toISOString().split('T')[0];
    document.getElementById('start-time').value = booking.startTime || '';
    document.getElementById('duration').value = booking.duration || '';
    document.getElementById('address-detail').value = booking.address || '';
    document.getElementById('notes').value = booking.notes || '';
    
    // サービス種別を設定
    if (booking.serviceType) {
      const serviceTypeMap = {
        '掃除・清掃': 'cleaning',
        '掃除': 'cleaning',
        '料理': 'cooking',
        '片付け': 'tidying',
        '洗濯・アイロン': 'laundry',
        '洗濯': 'laundry',
        '買い物代行': 'shopping',
        '買い物代行（日用品・食材）': 'shopping',
        'その他': 'other'
      };
      
      const serviceValue = serviceTypeMap[booking.serviceType];
      if (serviceValue) {
        const checkbox = document.querySelector(`input[name="service"][value="${serviceValue}"]`);
        if (checkbox) {
          checkbox.checked = true;
        }
      }
    }
    
    // フォームのタイトルを変更
    const header = document.querySelector('.booking-header h1');
    if (header) {
      header.textContent = '予約を変更';
    }
    
    // 送信ボタンのテキストを変更
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.textContent = '変更内容を保存';
    }
  } catch (error) {
    console.error('予約データの読み込みエラー:', error);
    showError('予約データの読み込みに失敗しました');
  }
}

// フォーム送信時のバリデーションとAPI連携
document.getElementById('booking-wizard').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const validations = {
    'booking-date': (value) => Validators.dateRange(value, 3),
    'start-time': Validators.required,
    'duration': Validators.required,
    'address-pref': Validators.required,
    'address-city': Validators.required,
    'address-detail': Validators.required
  };
  
  // 買い物オプションが選択されている場合、リストも必須
  if (document.getElementById('shopping-option').checked) {
    validations['shopping-list'] = Validators.required;
  }
  
  // 依頼内容のチェックボックスが1つ以上選択されているか確認
  const serviceCheckboxes = document.querySelectorAll('input[name="service"]:checked');
  if (serviceCheckboxes.length === 0) {
    showError('依頼内容を1つ以上選択してください');
    return;
  }
  
  if (!validateForm(this, validations)) {
    const firstError = this.querySelector('.has-error input, .has-error select');
    if (firstError) {
      firstError.focus();
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  
  // フォームデータを取得
  const date = document.getElementById('booking-date').value;
  const startTime = document.getElementById('start-time').value;
  const duration = parseInt(document.getElementById('duration').value);
  const addressDetail = document.getElementById('address-detail').value;
  const addressBuilding = document.getElementById('address-building').value;
  const notes = document.getElementById('notes').value;
  
  // サービス種別を決定（最初に選択されたものを使用、または複数を結合）
  const selectedServices = Array.from(serviceCheckboxes).map(cb => {
    const value = cb.value;
    const labelMap = {
      'cleaning': '掃除',
      'cooking': '料理',
      'tidying': '片付け',
      'laundry': '洗濯',
      'shopping': '買い物代行（日用品・食材）',
      'other': 'その他'
    };
    return labelMap[value] || value;
  });
  const serviceType = selectedServices[0]; // 最初の選択をサービス種別として使用
  
  // 住所を結合
  const address = addressDetail + (addressBuilding ? ` ${addressBuilding}` : '');
  
  // 日付と時刻を結合してscheduledDateを作成
  const scheduledDate = new Date(`${date}T${startTime}:00`);
  
  const bookingData = {
    serviceType,
    scheduledDate: scheduledDate.toISOString(),
    startTime,
    duration,
    address,
    notes: notes || null
  };
  
  const submitButton = this.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  
  // ローディング状態
  submitButton.disabled = true;
  submitButton.textContent = '送信中...';
  
  try {
    // URLパラメータから予約IDを取得（更新の場合）
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('id');
    
    let response;
    if (bookingId) {
      // 予約更新
      response = await api.updateBooking(bookingId, bookingData);
      showSuccess('予約を更新しました');
    } else {
      // 予約作成
      response = await api.createBooking(bookingData);

      // お気に入り導線: workerId指定がある場合はワーカー選択をスキップして即確定
      if (isQuickBookingMode && preferredWorkerId && response.data && response.data.id) {
        await api.updateBooking(response.data.id, { workerId: preferredWorkerId });
        showSuccess('予約を作成してワーカーを確定しました');
      } else {
        showSuccess('予約を作成しました');
      }
    }
    
    // ワーカー選択ページまたは予約詳細ページに遷移
    setTimeout(() => {
      if (bookingId) {
        window.location.href = `select-worker.html?bookingId=${bookingId}`;
      } else if (response.data && response.data.id) {
        // 新規作成: クイック予約時は詳細、通常はワーカー選択へ
        if (isQuickBookingMode && preferredWorkerId) {
          window.location.href = `booking-detail.html?id=${response.data.id}`;
        } else {
          window.location.href = `select-worker.html?bookingId=${response.data.id}`;
        }
      } else {
        // フォールバック：予約一覧に遷移
        window.location.href = 'bookings.html';
      }
    }, 1000);
  } catch (error) {
    console.error('予約作成/更新エラー:', error);
    showError(error.message || '予約の作成に失敗しました。入力内容を確認してください。');
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
});

// ===== ウィザード制御 =====
let currentStep = 1;
const maxStep = 3;
let preferredWorkerId = null;
let isQuickBookingMode = false;
let quickDefaultData = { address: '', services: [] };

function updateStepView() {
  // ステップ本体
  document.querySelectorAll('.wizard-step').forEach(section => {
    const step = Number(section.getAttribute('data-step'));
    if (step === currentStep) {
      section.classList.add('active');
    } else {
      section.classList.remove('active');
    }
  });

  // ステップインジケーター
  document.querySelectorAll('.step-indicator__item').forEach(ind => {
    const step = Number(ind.getAttribute('data-step'));
    if (step <= currentStep) {
      ind.classList.add('is-active');
    } else {
      ind.classList.remove('is-active');
    }
  });

  // ボタン制御
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  const submitBtn = document.getElementById('btn-submit');

  prevBtn.disabled = currentStep === 1;
  if (currentStep < maxStep) {
    nextBtn.classList.remove('is-hidden');
    submitBtn.classList.add('is-hidden');
  } else {
    nextBtn.classList.add('is-hidden');
    submitBtn.classList.remove('is-hidden');
  }
}

function validateCurrentStep() {
  const form = document.getElementById('booking-wizard');
  const validationsStep1 = {
    'booking-date': (value) => Validators.dateRange(value, 3),
    'start-time': Validators.required,
    'duration': Validators.required
  };
  const validationsStep2 = {
    'address-pref': Validators.required,
    'address-city': Validators.required,
    'address-detail': Validators.required
  };
  if (currentStep === 1) {
    return validateForm(form, validationsStep1);
  }
  if (currentStep === 2) {
    // 依頼内容は少なくとも1つ
    const serviceChecked = document.querySelectorAll('input[name="service"]:checked').length > 0;
    const addrOk = validateForm(form, validationsStep2);
    if (!serviceChecked) {
      showError('依頼内容を1つ以上選択してください');
      return false;
    }
    return addrOk;
  }
  if (currentStep === 3) {
    // オプションが有効な場合、買い物リストを必須に
    if (document.getElementById('shopping-option').checked) {
      const list = document.getElementById('shopping-list');
      if (!Validators.required(list.value)) {
        showError('買い物リストを入力してください');
        list.focus();
        return false;
      }
    }
    return true;
  }
  return true;
}

function nextStep() {
  if (!validateCurrentStep()) return;
  if (currentStep < maxStep) {
    currentStep += 1;
    updateStepView();
  }
}
function prevStep() {
  if (currentStep > 1) {
    currentStep -= 1;
    updateStepView();
  }
}

document.getElementById('btn-next').addEventListener('click', nextStep);
document.getElementById('btn-prev').addEventListener('click', prevStep);

// 初期表示
updateStepView();

// ===== お気に入り導線: クイック予約モード =====
async function setupQuickBookingMode(workerId) {
  try {
    const workerResponse = await api.getWorkerById(workerId);
    const worker = workerResponse.data;

    const header = document.querySelector('.booking-header p');
    if (header && worker) {
      header.textContent = `${worker.name || '選択済みワーカー'}さんを指名して最短で予約できます`;
    }

    // 送信ボタン文言を調整
    const submitBtn = document.getElementById('btn-submit');
    if (submitBtn) {
      submitBtn.textContent = '予約を確定する';
    }

    // 住所の自動補完（ユーザープロフィールから）
    await loadQuickDefaultData();
    renderQuickShortcutCard();
  } catch (error) {
    console.error('クイック予約モード初期化エラー:', error);
  }
}

async function loadQuickDefaultData() {
  try {
    const profile = await api.getMe();
    const user = profile.data || {};

    quickDefaultData.address = user.address || '';

    // 最新予約からサービス内容を推測
    try {
      const recent = await api.getBookings({ page: 1, limit: 1 });
      const recentBooking = recent.data?.bookings?.[0] || recent.data?.[0] || null;
      if (recentBooking && recentBooking.serviceType) {
        quickDefaultData.services = mapServiceTypeToValues(recentBooking.serviceType);
      }
    } catch (error) {
      console.warn('最新予約の取得に失敗:', error);
    }
  } catch (error) {
    console.error('住所自動補完エラー:', error);
  }
}

function renderQuickShortcutCard() {
  const card = document.getElementById('quickShortcutCard');
  const addressSummary = document.getElementById('quickAddressSummary');
  const serviceSummary = document.getElementById('quickServiceSummary');
  const quickBtn = document.getElementById('quickNextBtn');
  if (!card || !addressSummary || !serviceSummary || !quickBtn || !isQuickBookingMode) return;

  const serviceLabels = {
    cleaning: '掃除',
    cooking: '料理',
    tidying: '片付け',
    laundry: '洗濯',
    shopping: '買い物代行',
    other: 'その他'
  };

  addressSummary.textContent = quickDefaultData.address || '未登録';
  serviceSummary.textContent = quickDefaultData.services.length
    ? quickDefaultData.services.map(v => serviceLabels[v] || v).join('、')
    : '未登録';

  card.classList.remove('is-hidden');
  quickBtn.addEventListener('click', () => {
    applyQuickDefaultsToStep2();
    if (validateCurrentStep()) {
      nextStep();
    }
  });
}

function applyQuickDefaultsToStep2() {
  const addressInput = document.getElementById('address-detail');
  if (addressInput && !addressInput.value && quickDefaultData.address) {
    addressInput.value = quickDefaultData.address;
  }

  // 既存選択が無いときのみサービスを反映
  const checked = document.querySelectorAll('input[name="service"]:checked');
  if (checked.length === 0 && quickDefaultData.services.length > 0) {
    quickDefaultData.services.forEach(value => {
      const checkbox = document.querySelector(`input[name="service"][value="${value}"]`);
      if (checkbox) checkbox.checked = true;
    });
  }
}

function mapServiceTypeToValues(serviceType) {
  const text = String(serviceType || '');
  const values = [];
  if (text.includes('掃除')) values.push('cleaning');
  if (text.includes('料理')) values.push('cooking');
  if (text.includes('片付け')) values.push('tidying');
  if (text.includes('洗濯')) values.push('laundry');
  if (text.includes('買い物')) values.push('shopping');
  if (values.length === 0) values.push('other');
  return Array.from(new Set(values));
}
