import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { SubscriptionService, SubscriptionStorage } from '../services/subscriptionService';
import type { SubscriptionPlan } from '../types';

interface SubscriptionContextType {
  userPlan: SubscriptionPlan | null;
  loading: boolean;
  error: string | null;
  refreshPlan: () => Promise<void>;
  updatePlan: (planData: Partial<SubscriptionPlan>) => Promise<void>;
  hasSufficientCredits: (requiredCredits: number) => boolean;
  isServiceAvailable: (service: string) => boolean;
  getRemainingCredits: () => number;
  isFreePlan: () => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [userPlan, setUserPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load subscription plan from localStorage on mount
  useEffect(() => {
    const loadStoredPlan = () => {
      const storedPlan = SubscriptionStorage.getPlan();
      if (storedPlan) {
        setUserPlan(storedPlan);
      }
    };

    loadStoredPlan();
  }, []);

  // Fetch subscription plan from API
  const refreshPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const plan = await SubscriptionService.getUserPlan();
      setUserPlan(plan);
      SubscriptionStorage.savePlan(plan);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subscription plan';
      setError(errorMessage);
      console.error('Error refreshing subscription plan:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update subscription plan
  const updatePlan = async (planData: Partial<SubscriptionPlan>) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedPlan = await SubscriptionService.updateUserPlan(planData);
      setUserPlan(updatedPlan);
      SubscriptionStorage.savePlan(updatedPlan);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update subscription plan';
      setError(errorMessage);
      console.error('Error updating subscription plan:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const hasSufficientCredits = (requiredCredits: number): boolean => {
    if (!userPlan) return false;
    return SubscriptionService.hasSufficientCredits(requiredCredits, userPlan);
  };

  const isServiceAvailable = (service: string): boolean => {
    if (!userPlan) return false;
    return SubscriptionService.isServiceAvailable(service, userPlan);
  };

  const getRemainingCredits = (): number => {
    if (!userPlan) return 0;
    return SubscriptionService.getRemainingCredits(userPlan);
  };

  const isFreePlan = (): boolean => {
    if (!userPlan) return true;
    return SubscriptionService.isFreePlan(userPlan);
  };

  // Auto-refresh plan when component mounts if no stored plan
  useEffect(() => {
    if (!userPlan && !loading) {
      refreshPlan();
    }
  }, [userPlan, loading]);

  const value: SubscriptionContextType = {
    userPlan,
    loading,
    error,
    refreshPlan,
    updatePlan,
    hasSufficientCredits,
    isServiceAvailable,
    getRemainingCredits,
    isFreePlan,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
