import { subscriptionApi } from './apiHelper';
import type { SubscriptionPlan, Invoice } from '../types';

export interface SubscriptionUpgradeResult {
  plan: SubscriptionPlan;
  invoice: Invoice | null;
}

export class SubscriptionService {
  /**
   * Fetch user's current subscription plan
   */
  static async  getUserPlan(): Promise<SubscriptionPlan> {
    try {
      const response = await subscriptionApi.get('/user-plan/me');
      console.log('Fetched user plan:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user plan:', error);
      // Return default free plan if error occurs
      return {
        name: 'Free Plan .....',
        type: 'free',
        price: 0,
        conversionsLimitType: 'number',
        conversionsLimit: 5,
        description: 'Free plan with limited conversions',
        services: ['pdf', 'esign'],
        creditsBalance: 5,
        toolCosts: [],
        authCosts: [],
        documentCosts: { credits: 0 },
        shareCosts: { credits: 0 },
        pdfShareCosts: { credits: 0 },
        status: 'active',
        isFree: true
      };
    }
  }

  /**
   * Update user's subscription plan
   */
  static async updateUserPlan(planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    try {
      const response = await subscriptionApi.put('/user-plan/update', planData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating user plan:', error);
      throw error;
    }
  }

  /**
   * Upgrade user's subscription to a specific plan by ID
   */
  static async upgradeToPlan(planId: string): Promise<SubscriptionUpgradeResult> {
    try {
      const response = await subscriptionApi.post('/user-plan/upgrade', { planId });
      const data = response.data?.data;

      // Backend returns { plan, invoice }, but keep a fallback if only plan is returned
      const plan: SubscriptionPlan = data?.plan || data;
      const invoice: Invoice | null = data?.invoice || null;

      return { plan, invoice };
    } catch (error) {
      console.error('Error upgrading user plan:', error);
      throw error;
    }
  }

  /**
   * Check if user has sufficient credits for an operation
   */
  static hasSufficientCredits(requiredCredits: number, userPlan: SubscriptionPlan): boolean {
    if (userPlan.conversionsLimitType === 'unlimited') {
      return true;
    }
    return userPlan.creditsBalance >= requiredCredits;
  }

  /**
   * Check if a service is available in the user's plan
   */
  static isServiceAvailable(service: string, userPlan: SubscriptionPlan): boolean {
    return userPlan.services.includes(service) || userPlan.services.length === 0;
  }

  /**
   * Get remaining credits for the user
   */
  static getRemainingCredits(userPlan: SubscriptionPlan): number {
    if (userPlan.conversionsLimitType === 'unlimited') {
      return Infinity;
    }
    return userPlan.creditsBalance;
  }

  /**
   * Check if user is on free plan
   */
  static isFreePlan(userPlan: SubscriptionPlan): boolean {
    return userPlan.isFree || userPlan.type === 'free';
  }

  /**
   * Fetch latest invoice for the current user
   */
  static async getLatestInvoice(): Promise<Invoice | null> {
    try {
      const response = await subscriptionApi.get('/invoices/latest');
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching latest invoice:', error);
      return null;
    }
  }

  /**
   * Fetch all invoices for the current user
   */
  static async getAllInvoices(): Promise<Invoice[]> {
    try {
      const response = await subscriptionApi.get('/invoices/me');
      return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  /**
   * Download invoice or receipt file for a given invoice
   */
  static async downloadInvoiceFile(invoiceId: string, type: 'invoice' | 'receipt'): Promise<void> {
    try {
      const url =
        type === 'invoice'
          ? `/invoices/${invoiceId}/download`
          : `/invoices/${invoiceId}/receipt`;

      const response = await subscriptionApi.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream',
      });

      // Derive filename from headers if available
      const disposition = response.headers['content-disposition'] || '';
      const match = /filename="?([^"]+)"?/.exec(disposition);
      const fallbackName = type === 'invoice' ? 'invoice.pdf' : 'receipt.pdf';
      const filename = match?.[1] || fallbackName;

      const link = document.createElement('a');
      const href = URL.createObjectURL(blob);
      link.href = href;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    } catch (error) {
      console.error('Error downloading invoice file:', error);
      throw error;
    }
  }
}

// Local storage helpers for subscription data
export class SubscriptionStorage {
  private static readonly STORAGE_KEY = 'userSubscriptionPlan';

  /**
   * Save subscription plan to localStorage
   */
  static savePlan(plan: SubscriptionPlan): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(plan));
    } catch (error) {
      console.error('Error saving subscription plan to localStorage:', error);
    }
  }

  /**
   * Get subscription plan from localStorage
   */
  static getPlan(): SubscriptionPlan | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting subscription plan from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear subscription plan from localStorage
   */
  static clearPlan(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing subscription plan from localStorage:', error);
    }
  }

  /**
   * Update credits in stored plan
   */
  static updateCredits(newCreditsBalance: number): void {
    try {
      const plan = this.getPlan();
      if (plan) {
        plan.creditsBalance = newCreditsBalance;
        this.savePlan(plan);
      }
    } catch (error) {
      console.error('Error updating credits in localStorage:', error);
    }
  }
}
