import type { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary';

interface ActionButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  variant?: ButtonVariant; // Controlled variant prop
}

export default function ActionButton({
  onClick,
  loading,
  disabled = false,
  children,
  className = '',
  icon,
  variant = 'primary', // Default variant
}: ActionButtonProps) {
  const baseClasses = 'flex items-center gap-2 px-6 py-2 rounded-lg transition-colors';

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${
        loading
          ? 'bg-blue-400 cursor-not-allowed text-white'
          : variantClasses[variant]
      } ${className}`}
    >
      {loading ? (
        <svg
          className="animate-spin w-4 h-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        icon
      )}
      {loading ? 'Loading...' : children}
    </button>
  );
}
