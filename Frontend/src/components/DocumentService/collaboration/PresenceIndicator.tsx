import { cn } from "../../common/lib/utils";
import type { CollaborativeUser } from "../../common/types/collaboration";

interface PresenceIndicatorProps {
  users: CollaborativeUser[];
  maxVisible?: number;
}

export function PresenceIndicator({ users, maxVisible = 5 }: PresenceIndicatorProps) {
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = Math.max(0, users.length - maxVisible);

  return (
    <div className="flex items-center space-x-1">
      {visibleUsers.map((user, index) => (
        <div
          key={user.id}
          className="relative group"
          style={{ zIndex: visibleUsers.length - index }}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs font-medium text-white",
              user.isTyping && "ring-2 ring-blue-400 ring-opacity-75 animate-pulse"
            )}
            style={{ backgroundColor: user.color }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>

          {/* Activity Indicator */}
          {user.isTyping && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" />
          )}

          {/* Tooltip */}
          <div className="absolute bottom-top left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {user.name}
            {user.isTyping && (
              <span className="block text-green-300">typing...</span>
            )}
          </div>
        </div>
      ))}

      {remainingCount > 0 && (
        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center text-xs font-medium text-gray-600">
          +{remainingCount}
        </div>
      )}
    </div>
  );
}