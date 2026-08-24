/** Surepass verification API uses full slugs; Stamper V2 order-stamp uses short state codes. */
const SLUG_TO_ORDER_CODE = {
  andaman_and_nicobar: 'AN',
  andhra_pradesh: 'AP',
  arunachal_pradesh: 'AR',
  assam: 'AS',
  bihar: 'BR',
  chandigarh: 'CH',
  chhattisgarh: 'CT',
  goa: 'GA',
  gujarat: 'GJ',
  jammu_and_kashmir: 'JK',
  jharkhand: 'JH',
  karnataka: 'KA',
  manipur: 'MN',
  maharashtra: 'MH',
  meghalaya: 'ML',
  national_capital_territory_of_delhi: 'DL',
  odisha: 'OR',
  punjab: 'PB',
  puducherry: 'PY',
  rajasthan: 'RJ',
  tamil_nadu: 'TN',
  tripura: 'TR',
  uttar_pradesh: 'UP',
  uttarakhand: 'UT',
  union_territory_of_ladakh: 'LA',
  union_territory_of_daman_and_diu: 'DD',
  union_territory_administration_of_dadra_and_nagar_haveli_and_daman_and_diu: 'DN',
  test_state: 'TS',
};

/** Stamper V2 two-letter codes (Surepass docs). */
const STAMPER_STATE_CODES = [
  'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CT', 'DL', 'GA', 'GJ', 'HR', 'HP', 'JH', 'JK',
  'KA', 'KL', 'MH', 'ML', 'MN', 'MP', 'MZ', 'OR', 'PB', 'PY', 'RJ', 'SK', 'TG', 'TN',
  'TR', 'UP', 'UT', 'WB',
];

const ORDER_CODE_TO_SLUG = Object.fromEntries(
  Object.entries(SLUG_TO_ORDER_CODE).map(([slug, code]) => [code, slug]),
);

function slugToOrderCode(slug) {
  return SLUG_TO_ORDER_CODE[String(slug || '').trim()] || null;
}

function orderCodeToSlug(code) {
  return ORDER_CODE_TO_SLUG[String(code || '').trim().toUpperCase()] || null;
}

function formatSlugLabel(slug) {
  return String(slug || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = {
  SLUG_TO_ORDER_CODE,
  STAMPER_STATE_CODES,
  slugToOrderCode,
  orderCodeToSlug,
  formatSlugLabel,
};
