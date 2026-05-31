import DOMPurify from 'dompurify';

/**
 * Sanitizes any user input string using DOMPurify to prevent XSS.
 */
export function sanitizeInput(value: string): string {
  if (typeof value !== 'string') return '';
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [], // Disallow all HTML tags for pure text security
    ALLOWED_ATTR: []
  }).trim();
}

/**
 * Checks if a string contains suspicious patterns showing executable code or XSS vectors.
 */
export function hasExecutableCode(value: any): boolean {
  if (typeof value === 'object' && value !== null) {
    for (const key of Object.keys(value)) {
      if (hasExecutableCode(key) || hasExecutableCode(value[key])) {
        return true;
      }
    }
    return false;
  }

  if (Array.isArray(value)) {
    return value.some(item => hasExecutableCode(item));
  }

  if (typeof value === 'string') {
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /onerror\s*=/gi,
      /onload\s*=/gi,
      /onclick\s*=/gi,
      /onmouseover\s*=/gi,
      /eval\s*\(/gi,
      /alert\s*\(/gi,
      /document\.cookie/gi,
      /window\./gi,
      /<\/?[a-z][\s\S]*>/gi // General HTML elements
    ];
    return dangerousPatterns.some(pattern => pattern.test(value));
  }

  return false;
}

/**
 * Validates a single checklist item.
 */
function validateChecklistItem(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  const allowedKeys = ['id', 'text', 'isChecked', 'isRequired'];
  const itemKeys = Object.keys(item);
  if (itemKeys.some(key => !allowedKeys.includes(key))) return false;

  return (
    typeof item.id === 'string' &&
    typeof item.text === 'string' &&
    typeof item.isChecked === 'boolean' &&
    typeof item.isRequired === 'boolean'
  );
}

/**
 * Validates a setup object.
 */
function validateSetup(setup: any): boolean {
  if (!setup || typeof setup !== 'object') return false;
  const allowedKeys = [
    'id', 'name', 'assetClass', 'direction', 'accountBalance', 'accountCurrency',
    'riskType', 'riskValue', 'forexPair', 'stopLossPips', 'pipValueUSD',
    'takeProfitPips', 'entryPrice', 'stopLossPrice', 'takeProfitPrice', 'sector',
    'dailyLimitPercent', 'createdAt'
  ];
  const setupKeys = Object.keys(setup);
  if (setupKeys.some(key => !allowedKeys.includes(key))) return false;

  return (
    typeof setup.id === 'string' &&
    typeof setup.name === 'string' &&
    (setup.assetClass === 'forex' || setup.assetClass === 'crypto_stock') &&
    (setup.direction === undefined || setup.direction === 'long' || setup.direction === 'short') &&
    typeof setup.accountBalance === 'number' &&
    typeof setup.accountCurrency === 'string' &&
    (setup.riskType === 'percentage' || setup.riskType === 'amount') &&
    typeof setup.riskValue === 'number' &&
    typeof setup.createdAt === 'string'
  );
}

/**
 * Validates a portfolio trade object.
 */
function validatePortfolioTrade(trade: any): boolean {
  if (!trade || typeof trade !== 'object') return false;
  const allowedKeys = [
    'id', 'ticker', 'assetClass', 'direction', 'entryPrice', 'currentPrice',
    'units', 'lots', 'riskAmount', 'stopLoss', 'takeProfit', 'pnl',
    'trailingStopPrice', 'status', 'enteredAt', 'uncheckedWarning',
    'isPriceUpdated', 'notes', 'sector', 'setup'
  ];
  const tradeKeys = Object.keys(trade);
  if (tradeKeys.some(key => !allowedKeys.includes(key))) return false;

  return (
    typeof trade.id === 'string' &&
    typeof trade.ticker === 'string' &&
    (trade.assetClass === 'forex' || trade.assetClass === 'crypto_stock') &&
    (trade.direction === 'long' || trade.direction === 'short') &&
    typeof trade.entryPrice === 'number' &&
    typeof trade.currentPrice === 'number' &&
    typeof trade.units === 'number' &&
    typeof trade.riskAmount === 'number' &&
    (typeof trade.stopLoss === 'number' || typeof trade.stopLoss === 'string') &&
    (trade.status === 'active' || trade.status === 'won' || trade.status === 'lost') &&
    typeof trade.enteredAt === 'string' &&
    typeof trade.uncheckedWarning === 'boolean'
  );
}

/**
 * Validates a trading plan object.
 */
function validateTradingPlan(plan: any): boolean {
  if (!plan || typeof plan !== 'object') return false;
  const allowedKeys = [
    'id', 'title', 'ticker', 'assetClass', 'direction', 'entryPrice',
    'stopLossPrice', 'takeProfitPrice', 'timeframe', 'conviction', 'notes',
    'status', 'createdAt'
  ];
  const planKeys = Object.keys(plan);
  if (planKeys.some(key => !allowedKeys.includes(key))) return false;

  return (
    typeof plan.id === 'string' &&
    typeof plan.title === 'string' &&
    typeof plan.ticker === 'string' &&
    (plan.assetClass === 'forex' || plan.assetClass === 'crypto_stock') &&
    (plan.direction === 'long' || plan.direction === 'short') &&
    typeof plan.entryPrice === 'number' &&
    typeof plan.stopLossPrice === 'number' &&
    typeof plan.timeframe === 'string' &&
    typeof plan.conviction === 'number' &&
    typeof plan.notes === 'string' &&
    (plan.status === 'pending' || plan.status === 'executed' || plan.status === 'cancelled') &&
    typeof plan.createdAt === 'string'
  );
}

/**
 * Validates a daily limit discipline log object.
 */
function validateDailyLimitLog(log: any): boolean {
  if (!log || typeof log !== 'object') return false;
  const allowedKeys = ['date', 'totalRisk', 'allowedLimit', 'isExceeded', 'breachedByForce'];
  const logKeys = Object.keys(log);
  if (logKeys.some(key => !allowedKeys.includes(key))) return false;

  return (
    typeof log.date === 'string' &&
    typeof log.totalRisk === 'number' &&
    typeof log.allowedLimit === 'number' &&
    typeof log.isExceeded === 'boolean' &&
    typeof log.breachedByForce === 'boolean'
  );
}

/**
 * Validates and sanitizes imported JSON backup data.
 * Throws an error if structurally weird, or if any suspicious scripts are detected.
 * Recursively sanitizes string inputs to prevent any hidden HTML/script execution.
 */
export function validateAndSanitizeImport(rawJSON: any): any {
  if (!rawJSON || typeof rawJSON !== 'object' || Array.isArray(rawJSON)) {
    throw new Error('Định dạng tập tin khôi phục không hợp lệ.');
  }

  // Ensure no unapproved top-level keys
  const allowedTopLevelKeys = [
    'current_tradesetup',
    'trading_saved_setups',
    'trading_checklist_items',
    'trading_plans',
    'trading_active_trades',
    'trading_closed_trades',
    'trading_daily_discipline_logs'
  ];
  const incomingKeys = Object.keys(rawJSON);
  if (incomingKeys.some(key => !allowedTopLevelKeys.includes(key))) {
    throw new Error('Dữ liệu chứa cấu trúc lạ hoặc các thuộc tính không hợp lệ.');
  }

  // Scan entire JSON structure for executable/suspicious scripts
  if (hasExecutableCode(rawJSON)) {
    throw new Error('Phát hiện mã thực thi độc hại (XSS) hoặc cấu trúc lệnh lạ trong file!');
  }

  const result: any = {};

  // 1. Current setup
  if (rawJSON.current_tradesetup !== undefined) {
    if (rawJSON.current_tradesetup === null) {
      result.current_tradesetup = null;
    } else {
      if (!validateSetup(rawJSON.current_tradesetup)) {
        throw new Error('Cấu trúc bản ghi current_tradesetup lỗi hoặc không hợp lệ.');
      }
      result.current_tradesetup = sanitizeObjectProperties(rawJSON.current_tradesetup);
    }
  }

  // 2. Saved setups
  if (rawJSON.trading_saved_setups !== undefined) {
    if (!Array.isArray(rawJSON.trading_saved_setups)) {
      throw new Error('Cấu trúc danh sách trading_saved_setups phải là một mảng.');
    }
    for (const setup of rawJSON.trading_saved_setups) {
      if (!validateSetup(setup)) {
        throw new Error('Phát hiện bản ghi thiết lập giao dịch có cấu trúc không hợp lệ.');
      }
    }
    result.trading_saved_setups = rawJSON.trading_saved_setups.map(sanitizeObjectProperties);
  }

  // 3. Checklist items
  if (rawJSON.trading_checklist_items !== undefined) {
    if (!Array.isArray(rawJSON.trading_checklist_items)) {
      throw new Error('Cấu trúc danh sách trading_checklist_items phải là một mảng.');
    }
    for (const item of rawJSON.trading_checklist_items) {
      if (!validateChecklistItem(item)) {
        throw new Error('Phát hiện mục Checklist có cấu trúc không hợp lệ.');
      }
    }
    result.trading_checklist_items = rawJSON.trading_checklist_items.map(sanitizeObjectProperties);
  }

  // 4. Plans
  if (rawJSON.trading_plans !== undefined) {
    if (!Array.isArray(rawJSON.trading_plans)) {
      throw new Error('Cấu trúc danh sách trading_plans phải là một mảng.');
    }
    for (const plan of rawJSON.trading_plans) {
      if (!validateTradingPlan(plan)) {
        throw new Error('Phát hiện kế hoạch giao dịch (trading_plans) chứa thuộc tính không hợp lệ.');
      }
    }
    result.trading_plans = rawJSON.trading_plans.map(sanitizeObjectProperties);
  }

  // 5. Active trades
  if (rawJSON.trading_active_trades !== undefined) {
    if (!Array.isArray(rawJSON.trading_active_trades)) {
      throw new Error('Cấu trúc danh sách trading_active_trades phải là một mảng.');
    }
    for (const trade of rawJSON.trading_active_trades) {
      if (!validatePortfolioTrade(trade)) {
        throw new Error('Phát hiện giao dịch đang hoạt động có thuộc tính sai lệch.');
      }
    }
    result.trading_active_trades = rawJSON.trading_active_trades.map(sanitizeObjectProperties);
  }

  // 6. Closed trades
  if (rawJSON.trading_closed_trades !== undefined) {
    if (!Array.isArray(rawJSON.trading_closed_trades)) {
      throw new Error('Cấu trúc danh sách trading_closed_trades phải là một mảng.');
    }
    for (const trade of rawJSON.trading_closed_trades) {
      if (!validatePortfolioTrade(trade)) {
        throw new Error('Phát hiện lịch sử giao dịch đã đóng có cấu trúc không phù hợp.');
      }
    }
    result.trading_closed_trades = rawJSON.trading_closed_trades.map(sanitizeObjectProperties);
  }

  // 7. Daily limits logs
  if (rawJSON.trading_daily_discipline_logs !== undefined) {
    if (!Array.isArray(rawJSON.trading_daily_discipline_logs)) {
      throw new Error('Cấu trúc danh sách trading_daily_discipline_logs phải là một mảng.');
    }
    for (const log of rawJSON.trading_daily_discipline_logs) {
      if (!validateDailyLimitLog(log)) {
        throw new Error('Cấu trúc nhật ký kiểm soát giới hạn rủi ro ngày không chính xác.');
      }
    }
    result.trading_daily_discipline_logs = rawJSON.trading_daily_discipline_logs.map(sanitizeObjectProperties);
  }

  return result;
}

/**
 * Helper that takes an object and returns a new object where all string values are sanitized.
 */
function sanitizeObjectProperties(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  const sanitized: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      sanitized[key] = sanitizeInput(val);
    } else if (Array.isArray(val)) {
      sanitized[key] = val.map(item => (typeof item === 'object' ? sanitizeObjectProperties(item) : (typeof item === 'string' ? sanitizeInput(item) : item)));
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeObjectProperties(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}
