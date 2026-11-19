const { referringDomain } = require('./sanitize');

function classifyTrafficSource({
  referrer = '',
  utmSource = '',
  utmMedium = '',
  gclid = '',
  fbclid = '',
} = {}) {
  if (gclid) return 'Paid Advertising';
  if (fbclid) return 'Social Media';
  const medium = String(utmMedium || '').toLowerCase();
  const source = String(utmSource || '').toLowerCase();
  if (medium.includes('cpc') || medium.includes('ppc') || medium.includes('paid') || source.includes('ads')) {
    return 'Paid Advertising';
  }
  if (medium.includes('email') || source.includes('email')) return 'Email';
  if (medium.includes('social') || ['facebook', 'instagram', 'linkedin', 'twitter', 'x'].some((s) => source.includes(s))) {
    return 'Social Media';
  }
  if (utmSource || utmMedium) return `UTM:${utmSource || utmMedium}`;

  const host = referringDomain(referrer);
  if (!host) return 'Direct / Unknown';
  if (host.includes('google.')) return 'Google Organic Search';
  if (host.includes('bing.')) return 'Bing Organic Search';
  if (host.includes('yahoo.')) return 'Yahoo Organic Search';
  if (host.includes('duckduckgo.')) return 'DuckDuckGo';
  if (host.includes('chatgpt.') || host.includes('openai.') || host.includes('chat.openai')) {
    return 'ChatGPT Referral';
  }
  if (host.includes('perplexity.') || host.includes('claude.') || host.includes('gemini.')) {
    return 'AI Referral';
  }
  if (
    host.includes('facebook.') ||
    host.includes('instagram.') ||
    host.includes('linkedin.') ||
    host.includes('twitter.') ||
    host.includes('t.co') ||
    host.includes('x.com') ||
    host.includes('youtube.')
  ) {
    return 'Social Media';
  }
  if (host === 'documantra.in' || host.endsWith('.documantra.in')) return 'Internal';
  return `External Website Referral`;
}

module.exports = { classifyTrafficSource };
