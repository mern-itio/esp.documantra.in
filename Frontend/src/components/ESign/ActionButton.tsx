import type { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary';

interface ActionButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  variant?: ButtonVariant;
  tooltip?: string;
}

export default function ActionButton({
  onClick,
  loading,
  disabled = false,
  children,
  className = '',
  icon,
  variant = 'secondary',
  tooltip,
}: ActionButtonProps) {
  const baseClasses =
    'relative flex items-center justify-center gap-2 px-6 py-2 rounded-lg transition-all duration-200';

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary:
      'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
  };

  return (
    <div className="relative inline-block group"> {/* <-- group moved here */}
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
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        ) : (
          icon
        )}
        {loading ? 'Loading...' : children}
      </button>

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-10 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap z-10">
          {tooltip}
          <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  );
}
