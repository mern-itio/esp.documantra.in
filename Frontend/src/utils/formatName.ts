export const toTitleCase = (name?: string): string => {
  if (!name) return 'User';

  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/** Safe initials for avatars — never throws on empty/missing names (new signup). */
export const getInitials = (fullName?: string | null, email?: string | null): string => {
  const trimmed = (fullName || '').trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0]?.[0];
      const last = parts[parts.length - 1]?.[0];
      if (first && last) return (first + last).toUpperCase();
    }
    const firstChar = parts[0]?.[0];
    if (firstChar) return firstChar.toUpperCase();
  }

  const emailTrimmed = (email || '').trim();
  if (emailTrimmed.includes('@')) {
    const local = emailTrimmed.split('@')[0]?.trim();
    if (local?.[0]) return local[0].toUpperCase();
  }
  if (emailTrimmed[0]) return emailTrimmed[0].toUpperCase();

  return 'U';
};