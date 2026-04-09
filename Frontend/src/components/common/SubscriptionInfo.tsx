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
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading subscription...</span>
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
              <p className="text-sm text-destructive">Error loading subscription</p>
              <p className="text-xs text-muted-foreground">{error}</p>
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
          <p className="text-sm text-muted-foreground">No subscription data available</p>
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
          <CardTitle className="text-lg font-semibold text-card-foreground">
            {userPlan.name}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={isFree ? "secondary" : "default"}
              className={
                isFree
                  ? 'border border-success/30 bg-success/10 text-success'
                  : 'border border-primary/30 bg-primary/10 text-primary'
              }
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
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Credits</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-foreground">
                {remainingCredits === Infinity ? '∞' : remainingCredits}
              </span>
              {userPlan.conversionsLimitType === 'number' && (
                <span className="ml-1 text-xs text-muted-foreground">
                  / {userPlan.conversionsLimit}
                </span>
              )}
            </div>
          </div>

          {/* Available Services */}
          <div>
            <div className="mb-2 flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Available Services</span>
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
              <p className="text-xs text-muted-foreground">{userPlan.description}</p>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="text-xs text-muted-foreground">Status</span>
            <Badge 
              variant={userPlan.status === 'active' ? 'default' : 'secondary'}
              className={
                userPlan.status === 'active'
                  ? 'border border-success/30 bg-success/10 text-success'
                  : 'border border-border bg-muted text-muted-foreground'
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
