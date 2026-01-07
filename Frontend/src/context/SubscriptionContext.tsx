import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { SubscriptionService, SubscriptionStorage } from '../services/subscriptionService';
import type { SubscriptionPlan } from '../types';
import { useAuth } from '../components/AuthService/AuthContext';

interface SubscriptionContextType {
  userPlan: SubscriptionPlan | null;
  loading: boolean;
  error: string | null;
  refreshPlan: () => Promise<void>;
  upgradeToPlan: (planId: string) => Promise<{ plan: SubscriptionPlan; invoice: any }>;
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
  const { isAuthenticated } = useAuth();

  // Fetch subscription plan from API
  const refreshPlan = async () => {
    // Only fetch plan if user is authenticated
    if (!isAuthenticated) {
      setLoading(false);
      setUserPlan(null);
      return;
    }

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
      // If 403 or 401, user is not authenticated, clear plan
      if (err && typeof err === 'object' && 'response' in err) {
        const httpError = err as { response?: { status?: number } };
        if (httpError.response?.status === 403 || httpError.response?.status === 401) {
          setUserPlan(null);
          SubscriptionStorage.clearPlan();
        }
      }
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

  // Upgrade to a specific plan by planId
  const upgradeToPlan = async (planId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { plan: upgradedPlan, invoice } = await SubscriptionService.upgradeToPlan(planId);
      setUserPlan(upgradedPlan);
      SubscriptionStorage.savePlan(upgradedPlan);
      
      // Update user plan in localStorage (userData) so it persists after re-login
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          parsedUser.plan = upgradedPlan.name || upgradedPlan.type || 'free';
          localStorage.setItem('userData', JSON.stringify(parsedUser));
          
          // Dispatch custom event to notify AuthContext to update user state
          window.dispatchEvent(new CustomEvent('subscription-updated', { 
            detail: { planName: parsedUser.plan } 
          }));
        }
      } catch (err) {
        console.warn('Failed to update userData in localStorage:', err);
      }
      
      return { plan: upgradedPlan, invoice };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upgrade subscription plan';
      setError(errorMessage);
      console.error('Error upgrading subscription plan:', err);
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

  // Load subscription plan from localStorage on mount, then fetch from API if needed
  useEffect(() => {
    const loadInitialPlan = async () => {
      // If user is not authenticated, don't try to fetch plan
      if (!isAuthenticated) {
        setLoading(false);
        setUserPlan(null);
        SubscriptionStorage.clearPlan();
        return;
      }

      // First, try to load from localStorage
      const storedPlan = SubscriptionStorage.getPlan();
      if (storedPlan) {
        setUserPlan(storedPlan);
        setLoading(false); // Set loading to false if we have stored plan
        // Optionally refresh in background to get latest data
        try {
          const plan = await SubscriptionService.getUserPlan();
          setUserPlan(plan);
          SubscriptionStorage.savePlan(plan);
        } catch (err) {
          // If refresh fails (e.g., 403), clear stored plan
          if (err && typeof err === 'object' && 'response' in err) {
            const httpError = err as { response?: { status?: number } };
            if (httpError.response?.status === 403 || httpError.response?.status === 401) {
              setUserPlan(null);
              SubscriptionStorage.clearPlan();
            } else {
              // Other errors, keep using stored plan
              console.warn('Failed to refresh subscription plan, using stored plan:', err);
            }
          } else {
            console.warn('Failed to refresh subscription plan, using stored plan:', err);
          }
        }
      } else {
        // No stored plan, fetch from API
        await refreshPlan();
      }
    };

    loadInitialPlan();
  }, [isAuthenticated]);

  const value: SubscriptionContextType = {
    userPlan,
    loading,
    error,
    refreshPlan,
    upgradeToPlan,
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
