export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem('deviceId');
    if (existing) return existing;
    const id = crypto?.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem('deviceId', id);
    return id;
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
