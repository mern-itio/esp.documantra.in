import React from 'react';
import { User, Shield, Crown } from 'lucide-react';
import { useDocumentStore } from '../../common/store/documentStore';
import { cn } from '../../common/lib/utils';
import { Button } from '../ui/button';
import type { UserRole } from '../../common/types';

const roleConfig = {
  regular: {
    label: 'Regular User',
    icon: User,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  team_admin: {
    label: 'Team Admin',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  super_admin: {
    label: 'Super Admin',
    icon: Crown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100'
  }
};

export function RoleSwitcher() {
  const { currentUser, setCurrentUser } = useDocumentStore();
  const currentRole = roleConfig[currentUser.role];
  const CurrentIcon = currentRole.icon;

  return (
    <div className="flex items-center space-x-4">
      {/* Current User Info */}
      <div className="flex items-center space-x-3">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-8 h-8 rounded-full"
        />
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
          <div className="flex items-center space-x-1">
            <CurrentIcon className={cn("w-3 h-3", currentRole.color)} />
            <p className={cn("text-xs font-medium", currentRole.color)}>
              {currentRole.label}
            </p>
          </div>
        </div>
      </div>

      {/* Role Switcher - For Testing */}
      <div className="flex items-center space-x-1 p-1 bg-gray-100 rounded-lg">
        {Object.entries(roleConfig).map(([role, config]) => {
          const Icon = config.icon;
          const isActive = currentUser.role === role;
          
          return (
            <Button
              key={role}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                "h-8 px-2",
                isActive && "shadow-sm",
                !isActive && "hover:bg-white"
              )}
              onClick={() => setCurrentUser(role as UserRole)}
              title={config.label}
            >
              <Icon className="w-4 h-4" />
              <span className="ml-1 hidden md:inline text-xs">
                {config.label.split(' ')[0]}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}