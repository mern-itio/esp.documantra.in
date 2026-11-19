function parseUserAgent(uaRaw = '') {
  const ua = String(uaRaw || '');
  let browserName = 'Unknown';
  let browserVersion = '';
  let osName = 'Unknown';
  let deviceType = 'desktop';

  if (/tablet|ipad|playbook|silk/i.test(ua)) deviceType = 'tablet';
  else if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) deviceType = 'mobile';

  if (/windows nt/i.test(ua)) osName = 'Windows';
  else if (/android/i.test(ua)) osName = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) osName = 'iOS';
  else if (/mac os x/i.test(ua)) osName = 'macOS';
  else if (/linux/i.test(ua)) osName = 'Linux';

  const browsers = [
    { name: 'Edge', re: /edg\/([\d.]+)/i },
    { name: 'Chrome', re: /chrome\/([\d.]+)/i },
    { name: 'Firefox', re: /firefox\/([\d.]+)/i },
    { name: 'Safari', re: /version\/([\d.]+).*safari/i },
    { name: 'Opera', re: /opr\/([\d.]+)/i },
  ];
  for (const b of browsers) {
    const m = ua.match(b.re);
    if (m) {
      browserName = b.name;
      browserVersion = m[1] || '';
      break;
    }
  }

  return { browserName, browserVersion, osName, deviceType, userAgent: ua.slice(0, 512) };
}

module.exports = { parseUserAgent };
