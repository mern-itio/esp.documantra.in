export const toTitleCase = (name?: string): string => {
    if (!name) return 'User';
  
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };