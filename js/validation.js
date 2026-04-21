/**
 * フォームバリデーション共通関数
 */

// バリデーション関数
const Validators = {
  // メールアドレス
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return 'メールアドレスを入力してください';
    if (!emailRegex.test(value)) return '正しいメールアドレスを入力してください';
    return null;
  },

  // パスワード
  password: (value) => {
    if (!value) return 'パスワードを入力してください';
    if (value.length < 8) return 'パスワードは8文字以上で入力してください';
    if (!/[a-zA-Z]/.test(value)) return 'パスワードに英字を含めてください';
    if (!/[0-9]/.test(value)) return 'パスワードに数字を含めてください';
    return null;
  },

  // パスワード強度チェック
  passwordStrength: (value) => {
    if (!value) return { strength: 'none', text: '' };
    
    let strength = 0;
    if (value.length >= 8) strength++;
    if (value.length >= 12) strength++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) strength++;
    if (/[0-9]/.test(value)) strength++;
    if (/[^a-zA-Z0-9]/.test(value)) strength++;

    if (strength <= 2) return { strength: 'weak', text: '弱い' };
    if (strength <= 3) return { strength: 'medium', text: '普通' };
    return { strength: 'strong', text: '強い' };
  },

  // 電話番号
  phone: (value) => {
    if (!value) return '電話番号を入力してください';
    const phoneRegex = /^[0-9]{2,4}-?[0-9]{2,4}-?[0-9]{3,4}$/;
    const cleaned = value.replace(/-/g, '');
    if (cleaned.length < 10 || cleaned.length > 11) {
      return '正しい電話番号を入力してください（10-11桁）';
    }
    if (!phoneRegex.test(value)) return '正しい電話番号の形式で入力してください（例: 090-1234-5678）';
    return null;
  },

  // 必須チェック
  required: (value) => {
    if (!value || value.trim() === '') return 'この項目は必須です';
    return null;
  },

  // 最小文字数
  minLength: (value, min) => {
    if (!value) return `この項目は必須です`;
    if (value.length < min) return `${min}文字以上で入力してください`;
    return null;
  },

  // 最大文字数
  maxLength: (value, max) => {
    if (value && value.length > max) return `${max}文字以内で入力してください`;
    return null;
  },

  // パスワード確認
  passwordConfirm: (password, confirmPassword) => {
    if (!confirmPassword) return 'パスワード（確認）を入力してください';
    if (password !== confirmPassword) return 'パスワードが一致しません';
    return null;
  },

  // カード番号（Luhnアルゴリズム）
  cardNumber: (value) => {
    if (!value) return 'カード番号を入力してください';
    const cleaned = value.replace(/\s/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) {
      return '正しいカード番号を入力してください';
    }
    // Luhnアルゴリズムでチェック
    let sum = 0;
    let isEven = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    if (sum % 10 !== 0) return '正しいカード番号を入力してください';
    return null;
  },

  // カード有効期限
  cardExpiry: (value) => {
    if (!value) return '有効期限を入力してください';
    const regex = /^(\d{2})\/(\d{2})$/;
    const match = value.match(regex);
    if (!match) return '正しい形式で入力してください（MM/YY）';
    
    const month = parseInt(match[1]);
    const year = parseInt('20' + match[2]);
    
    if (month < 1 || month > 12) return '正しい月を入力してください（01-12）';
    
    const now = new Date();
    const expiryDate = new Date(year, month, 0);
    if (expiryDate < now) return '有効期限が切れています';
    
    return null;
  },

  // 日付（未来の日付のみ）
  futureDate: (value) => {
    if (!value) return '日付を選択してください';
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) return '過去の日付は選択できません';
    return null;
  },

  // 日付範囲（3ヶ月以内）
  dateRange: (value, months = 3) => {
    if (!value) return '日付を選択してください';
    const selectedDate = new Date(value);
    const today = new Date();
    const maxDate = new Date();
    maxDate.setMonth(today.getMonth() + months);
    
    if (selectedDate < today) return '過去の日付は選択できません';
    if (selectedDate > maxDate) return `${months}ヶ月以内の日付を選択してください`;
    return null;
  }
};

/** @param {unknown} el */
function isFieldElement(el) {
  return Boolean(
    el &&
      typeof el === 'object' &&
      el.nodeType === 1 &&
      typeof el.closest === 'function'
  );
}

/**
 * 入力欄直下にエラーを表示（`auth.js` の `showError(message)` と名前が被らないよう分離）
 * input が無い・DOM でない場合はページ上部の #errorMessage / .error-message にフォールバック
 */
function showFieldError(input, message) {
  const text = message != null ? String(message) : '';

  if (!isFieldElement(input)) {
    const pageEl =
      (typeof document !== 'undefined' && document.getElementById('errorMessage')) ||
      (typeof document !== 'undefined' && document.querySelector('.error-message'));
    if (pageEl) {
      pageEl.textContent = text;
      pageEl.classList.remove('is-hidden');
    }
    return;
  }

  const formGroup = input.closest('.form-group');
  if (!formGroup) {
    const pageEl =
      document.getElementById('errorMessage') || document.querySelector('.error-message');
    if (pageEl) {
      pageEl.textContent = text;
      pageEl.classList.remove('is-hidden');
    }
    return;
  }

  formGroup.classList.add('has-error');
  formGroup.classList.remove('has-success');

  // エラーIDを生成
  const errorId = (input.id || 'field') + '-error';

  let errorElement = formGroup.querySelector('.form-error');
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.className = 'form-error';
    errorElement.id = errorId;
    errorElement.setAttribute('role', 'alert');
    errorElement.setAttribute('aria-live', 'polite');
    formGroup.appendChild(errorElement);
  }
  errorElement.textContent = text;

  // ARIA属性を設定
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', errorId);

  // 既存のaria-describedbyを保持（ヒントなどがある場合）
  const existingDescribedBy = input.getAttribute('aria-describedby');
  if (existingDescribedBy && !existingDescribedBy.includes(errorId)) {
    input.setAttribute('aria-describedby', existingDescribedBy + ' ' + errorId);
  }
}

// エラーメッセージ削除
function clearError(input) {
  if (!isFieldElement(input)) return;

  const formGroup = input.closest('.form-group');
  if (!formGroup) return;

  formGroup.classList.remove('has-error');
  formGroup.classList.add('has-success');

  const errorElement = formGroup.querySelector('.form-error');
  if (errorElement) {
    errorElement.remove();
  }

  // ARIA属性をクリア
  input.setAttribute('aria-invalid', 'false');
  const errorId = (input.id || 'field') + '-error';
  const existingDescribedBy = input.getAttribute('aria-describedby');
  if (existingDescribedBy) {
    const describedBy = existingDescribedBy.split(' ').filter(id => id !== errorId).join(' ');
    if (describedBy) {
      input.setAttribute('aria-describedby', describedBy);
    } else {
      input.removeAttribute('aria-describedby');
    }
  }
}

// リアルタイムバリデーション
function setupRealTimeValidation(input, validator, options = {}) {
  let timeout;
  
  input.addEventListener('blur', () => {
    validateField(input, validator, options);
  });

  input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (input.value) {
        validateField(input, validator, options);
      } else {
        clearError(input);
      }
    }, 300); // 300ms遅延でデバウンス
  });
}

// フィールドバリデーション
function validateField(input, validator, options = {}) {
  const value = input.value;
  const error = validator(value, options);
  
  if (error) {
    showFieldError(input, error);
    return false;
  } else {
    clearError(input);
    return true;
  }
}

// フォーム全体のバリデーション
function validateForm(form, validations) {
  let isValid = true;
  
  for (const [fieldId, validator] of Object.entries(validations)) {
    const field = form.querySelector(`#${fieldId}`);
    if (!field) continue;
    
    const options = typeof validator === 'object' && validator.options ? validator.options : {};
    const validatorFunc = typeof validator === 'function' ? validator : validator.validator;
    
    if (!validateField(field, validatorFunc, options)) {
      isValid = false;
    }
  }
  
  return isValid;
}

// パスワード強度表示
function setupPasswordStrength(passwordInput, strengthContainer) {
  if (!passwordInput || !strengthContainer) return;

  const bar = strengthContainer.querySelector('.password-strength-bar');
  const text = strengthContainer.querySelector('.password-strength-text');
  
  passwordInput.addEventListener('input', () => {
    const strength = Validators.passwordStrength(passwordInput.value);
    
    if (strength.strength === 'none') {
      bar.style.width = '0%';
      bar.className = 'password-strength-bar';
      bar.setAttribute('aria-valuenow', '0');
      if (text) text.textContent = '';
    } else {
      const valueMap = { weak: 33, medium: 66, strong: 100 };
      const value = valueMap[strength.strength] || 0;
      bar.className = `password-strength-bar ${strength.strength}`;
      bar.setAttribute('aria-valuenow', value);
      if (text) {
        text.textContent = `パスワード強度: ${strength.text}`;
        text.setAttribute('aria-label', `パスワード強度は${strength.text}です`);
      }
    }
  });
}

// 電話番号自動フォーマット
function setupPhoneFormat(input) {
  input.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
      if (value.length <= 3) {
        value = value;
      } else if (value.length <= 7) {
        value = value.substring(0, 3) + '-' + value.substring(3);
      } else if (value.length <= 11) {
        value = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7);
      } else {
        value = value.substring(0, 11);
      }
      e.target.value = value;
    }
  });
}

// カード番号自動フォーマット（既存の実装を拡張）
function setupCardNumberFormat(input) {
  input.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s/g, '');
    if (value.length > 0) {
      value = value.match(/.{1,4}/g)?.join(' ') || value;
      if (value.length > 19) value = value.substring(0, 19);
      e.target.value = value;
    }
  });
}

// カード有効期限自動フォーマット（既存の実装を拡張）
function setupCardExpiryFormat(input) {
  input.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
  });
}
