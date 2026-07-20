const MAX_MONTHLY_CREDITS = 10_000_000;
const MAX_PRICE = 1_000_000;
const MAX_CREDIT_PACKAGE_CREDITS = 10_000_000;

const parseBoundedNumber = (
  value,
  fieldName,
  { allowZero = true, max = MAX_MONTHLY_CREDITS, required = false } = {}
) => {
  if (value === undefined || value === null || value === '') {
    if (required) {
      return { ok: false, message: `${fieldName} is required` };
    }
    return { ok: true, value: undefined };
  }

  const num = Number(value);
  if (!Number.isFinite(num)) {
    return { ok: false, message: `${fieldName} must be a valid number` };
  }
  if (num < 0) {
    return { ok: false, message: `${fieldName} cannot be negative` };
  }
  if (!allowZero && num <= 0) {
    return { ok: false, message: `${fieldName} must be greater than zero` };
  }
  if (num > max) {
    return { ok: false, message: `${fieldName} exceeds the allowed maximum` };
  }

  return { ok: true, value: num };
};

const validateCostList = (items, label) => {
  if (items === undefined || items === null) {
    return { ok: true };
  }
  if (!Array.isArray(items)) {
    return { ok: false, message: `${label} must be an array` };
  }

  for (const item of items) {
    const result = parseBoundedNumber(item?.credits, `${label} credits`);
    if (!result.ok) {
      return result;
    }
  }

  return { ok: true };
};

const validateNestedCredits = (value, fieldName) => {
  if (!value || value.credits === undefined || value.credits === null) {
    return { ok: true };
  }
  return parseBoundedNumber(value.credits, `${fieldName}.credits`);
};

const sanitizePlanPayload = (payload = {}) => {
  const allowed = [
    'name',
    'services',
    'type',
    'toolCosts',
    'authCosts',
    'documentCosts',
    'shareCosts',
    'pdfShareCosts',
    'monthlyCredits',
    'pricePerPeriod',
    'period',
  ];

  return allowed.reduce((acc, key) => {
    if (payload[key] !== undefined) {
      acc[key] = payload[key];
    }
    return acc;
  }, {});
};

const validatePlanPayload = (payload = {}, { isUpdate = false, existingPlan = null } = {}) => {
  const planType = payload.type ?? existingPlan?.type ?? 'paid';

  if (!isUpdate) {
    if (!payload?.name || !String(payload.name).trim()) {
      return { ok: false, message: 'Plan name is required' };
    }
  }

  const monthlyCredits = parseBoundedNumber(payload.monthlyCredits, 'monthlyCredits', {
    required: !isUpdate,
  });
  if (!monthlyCredits.ok) {
    return monthlyCredits;
  }

  const pricePerPeriod = parseBoundedNumber(payload.pricePerPeriod, 'pricePerPeriod', {
    required: !isUpdate,
    allowZero: planType === 'free',
    max: MAX_PRICE,
  });
  if (!pricePerPeriod.ok) {
    return pricePerPeriod;
  }

  if (pricePerPeriod.value !== undefined) {
    if (planType === 'free' && pricePerPeriod.value !== 0) {
      return { ok: false, message: 'Free plans must have pricePerPeriod set to 0' };
    }
    if (planType !== 'free' && pricePerPeriod.value <= 0) {
      return { ok: false, message: 'Paid plans must have a price greater than 0' };
    }
  }

  for (const result of [
    validateCostList(payload.toolCosts, 'toolCosts'),
    validateCostList(payload.authCosts, 'authCosts'),
    validateNestedCredits(payload.documentCosts, 'documentCosts'),
    validateNestedCredits(payload.shareCosts, 'shareCosts'),
    validateNestedCredits(payload.pdfShareCosts, 'pdfShareCosts'),
  ]) {
    if (!result.ok) {
      return result;
    }
  }

  if (payload.period && !['monthly', 'yearly'].includes(payload.period)) {
    return { ok: false, message: 'period must be monthly or yearly' };
  }

  if (payload.type && !['free', 'paid'].includes(payload.type)) {
    return { ok: false, message: 'type must be free or paid' };
  }

  return {
    ok: true,
    sanitized: sanitizePlanPayload(payload),
  };
};

const sanitizeCreditPackagePayload = (payload = {}) => {
  const allowed = ['name', 'description', 'credits', 'price', 'currency', 'isRecommended'];
  return allowed.reduce((acc, key) => {
    if (payload[key] !== undefined) {
      acc[key] = payload[key];
    }
    return acc;
  }, {});
};

const validateCreditPackagePayload = (payload = {}, { isUpdate = false } = {}) => {
  if (!isUpdate) {
    if (!payload?.name || !String(payload.name).trim()) {
      return { ok: false, message: 'Package name is required' };
    }
  }

  const credits = parseBoundedNumber(payload.credits, 'credits', {
    required: !isUpdate,
    max: MAX_CREDIT_PACKAGE_CREDITS,
  });
  if (!credits.ok) {
    return credits;
  }

  const price = parseBoundedNumber(payload.price, 'price', {
    required: !isUpdate,
    max: MAX_PRICE,
  });
  if (!price.ok) {
    return price;
  }

  if (!isUpdate && price.value !== undefined && price.value <= 0) {
    return { ok: false, message: 'price must be greater than zero' };
  }

  if (isUpdate && price.value !== undefined && price.value < 0) {
    return { ok: false, message: 'price cannot be negative' };
  }

  const allowedCurrencies = new Set(['INR', 'USD', 'EUR', 'GBP']);
  let currency;
  if (payload.currency !== undefined && payload.currency !== null && payload.currency !== '') {
    const normalized = String(payload.currency).trim().toUpperCase();
    if (!allowedCurrencies.has(normalized)) {
      return { ok: false, message: 'currency must be one of INR, USD, EUR, GBP' };
    }
    currency = normalized;
  }

  const sanitized = sanitizeCreditPackagePayload(payload);
  if (currency) sanitized.currency = currency;
  else if (!isUpdate) sanitized.currency = 'INR';

  return {
    ok: true,
    sanitized,
  };
};

module.exports = {
  validatePlanPayload,
  validateCreditPackagePayload,
  sanitizePlanPayload,
  sanitizeCreditPackagePayload,
};
