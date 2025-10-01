
interface AvatarProps {
  name: string;
  email?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Generate consistent background colors based on name/email
const getAvatarColor = (name: string, email?: string): string => {
  const identifier = email || name;
  const colors = [
    'bg-red-500',
    'bg-blue-500', 
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
    'bg-emerald-500',
    'bg-violet-500'
  ];
  
  // Generate a simple hash from the identifier
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
};

// Get initials from name or email
const getInitials = (name: string, email?: string): string => {
  const displayName = name || email || 'U';
  
  // If it's an email, extract the part before @
  if (displayName.includes('@')) {
    const emailPart = displayName.split('@')[0];
    return emailPart.charAt(0).toUpperCase();
  }
  
  // For names, get first letter
  return displayName.charAt(0).toUpperCase();
};

const sizeClasses = {
  sm: 'w-4 h-4 text-xs',
  md: 'w-6 h-6 text-sm',
  lg: 'w-8 h-8 text-base',
  xl: 'w-12 h-12 text-lg'
};

export function Avatar({ name, email, size = 'md', className = '' }: AvatarProps) {
  const initials = getInitials(name, email);
  const bgColor = getAvatarColor(name, email);
  const sizeClass = sizeClasses[size];
  
  return (
    <div 
      className={`
        ${sizeClass} 
        ${bgColor} 
        text-white 
        rounded-full 
        flex 
        items-center 
        justify-center 
        font-medium 
        flex-shrink-0
        ${className}
      `}
      title={name || email}
    >
      {initials}
    </div>
  );
}
