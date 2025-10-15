import { useSubscription } from '../context/SubscriptionContext';

interface UseSubscriptionCheckReturn {
  canUseService: (service: string) => boolean;
  hasCredits: (requiredCredits: number) => boolean;
  getRemainingCredits: () => number;
  isFreePlan: () => boolean;
  userPlan: any;
  loading: boolean;
}

/**
 * Hook for checking subscription-based permissions and limits
 */
export const useSubscriptionCheck = (): UseSubscriptionCheckReturn => {
  const {
    userPlan,
    loading,
    hasSufficientCredits,
    isServiceAvailable,
    getRemainingCredits,
    isFreePlan
  } = useSubscription();

  const canUseService = (service: string): boolean => {
    if (loading || !userPlan) return false;
    return isServiceAvailable(service);
  };

  const hasCredits = (requiredCredits: number): boolean => {
    if (loading || !userPlan) return false;
    return hasSufficientCredits(requiredCredits);
  };

  return {
    canUseService,
    hasCredits,
    getRemainingCredits,
    isFreePlan,
    userPlan,
    loading
  };
};

/**
 * Hook for PDF service operations
 */
export const usePDFSubscriptionCheck = () => {
  const subscriptionCheck = useSubscriptionCheck();
  
  const canUsePDFTools = (): boolean => {
    return subscriptionCheck.canUseService('pdf');
  };

  const canProcessPDF = (requiredCredits: number = 1): boolean => {
    return subscriptionCheck.hasCredits(requiredCredits) && canUsePDFTools();
  };

  return {
    ...subscriptionCheck,
    canUsePDFTools,
    canProcessPDF
  };
};

/**
 * Hook for E-Sign service operations
 */
export const useESignSubscriptionCheck = () => {
  const subscriptionCheck = useSubscriptionCheck();
  
  const canUseESignTools = (): boolean => {
    return subscriptionCheck.canUseService('esign');
  };

  const canCreateEnvelope = (requiredCredits: number = 1): boolean => {
    return subscriptionCheck.hasCredits(requiredCredits) && canUseESignTools();
  };

  return {
    ...subscriptionCheck,
    canUseESignTools,
    canCreateEnvelope
  };
};
