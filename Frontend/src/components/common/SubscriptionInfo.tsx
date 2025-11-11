import React from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { Card, CardContent, CardHeader, CardTitle } from '../DocumentService/ui/card';
import Badge from '../DocumentService/ui/badge';
import { RefreshCw, CreditCard, Zap } from 'lucide-react';
import { Button } from '../DocumentService/ui/button';

interface SubscriptionInfoProps {
  showRefreshButton?: boolean;
  className?: string;
}

export const SubscriptionInfo: React.FC<SubscriptionInfoProps> = ({ 
  showRefreshButton = true, 
  className = '' 
}) => {
  const { 
    userPlan, 
    loading, 
    error, 
    refreshPlan, 
    getRemainingCredits, 
    isFreePlan 
  } = useSubscription();

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Loading subscription...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Error loading subscription</p>
              <p className="text-xs text-gray-500">{error}</p>
            </div>
            {showRefreshButton && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshPlan}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userPlan) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-sm text-gray-600">No subscription data available</p>
        </CardContent>
      </Card>
    );
  }

  const remainingCredits = getRemainingCredits();
  const isFree = isFreePlan();

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {userPlan.name}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={isFree ? "secondary" : "default"}
              className={isFree ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800 border border-yellow-300"}
            >
              {userPlan.type.toUpperCase()}
            </Badge>
            {showRefreshButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={refreshPlan}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Credits Information */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Credits</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold">
                {remainingCredits === Infinity ? '∞' : remainingCredits}
              </span>
              {userPlan.conversionsLimitType === 'number' && (
                <span className="text-xs text-gray-500 ml-1">
                  / {userPlan.conversionsLimit}
                </span>
              )}
            </div>
          </div>

          {/* Available Services */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <CreditCard className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Available Services</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {userPlan.services.map((service) => (
                <Badge 
                  key={service} 
                  variant="outline" 
                  className="text-xs"
                >
                  {service.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>

          {/* Plan Description */}
          {userPlan.description && (
            <div>
              <p className="text-xs text-gray-600">{userPlan.description}</p>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-gray-500">Status</span>
            <Badge 
              variant={userPlan.status === 'active' ? 'default' : 'secondary'}
              className={
                userPlan.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }
            >
              {userPlan.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionInfo;
