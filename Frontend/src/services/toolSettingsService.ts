import { adminServiceApi } from './apiHelper';

export interface ToolSettings {
  toolId: string;
  toolName: string;
  category: string;
  isActive: boolean;
  accessControl: {
    allowedFor: 'all' | 'logged_in_only' | 'pro' | 'custom';
    customRules: {
      freeUsers: {
        enabled: boolean;
        limitType: 'unlimited' | 'number';
        limit: number | null;
        timeWindow: 'daily' | 'weekly' | 'monthly';
      };
      proUsers: {
        enabled: boolean;
        limitType: 'unlimited' | 'number';
        limit: number | null;
        timeWindow: 'daily' | 'weekly' | 'monthly';
      };
      guests: {
        enabled: boolean;
        limitType: 'unlimited' | 'number';
        limit: number | null;
        timeWindow: 'daily' | 'weekly' | 'monthly';
      };
    };
  };
  features: {
    requiresAuth: boolean;
    requiresPremium: boolean;
    showInMenu: boolean;
    showInHeader: boolean;
    isPopular: boolean;
  };
  display: {
    badge: string | null;
    icon: string;
    description: string;
    order: number;
  };
}

class ToolSettingsService {
  private cache: Map<string, ToolSettings> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getToolSettings(toolId: string, forceRefresh: boolean = false): Promise<ToolSettings | null> {
    const now = Date.now();
    const cached = this.cache.get(toolId);
    const expiry = this.cacheExpiry.get(toolId) || 0;

    // Return cached data if still valid (unless forceRefresh)
    if (!forceRefresh && cached && now < expiry) {
      return cached;
    }

    try {
      console.log(`[ToolSettingsService] Fetching tool settings for ${toolId} from admin service...`);
      const response = await adminServiceApi.get(`/admin/public/tool-settings/${toolId}`);
      console.log(`[ToolSettingsService] Response for ${toolId}:`, response.data);
      if (response.data && response.data.data) {
        const settings = response.data.data as ToolSettings;
        this.cache.set(toolId, settings);
        this.cacheExpiry.set(toolId, now + this.CACHE_TTL);
        console.log(`[ToolSettingsService] Cached settings for ${toolId}:`, settings);
        return settings;
      }
    } catch (error) {
      console.error(`[ToolSettingsService] Failed to fetch tool settings for ${toolId}:`, error);
    }

    return null;
  }

  async getAllToolSettings(): Promise<ToolSettings[]> {
    try {
      const response = await adminServiceApi.get('/admin/public/tool-activation');
      if (response.data && response.data.data) {
        const activeIds = new Set<string>((response.data.data as any[]).map(a => a.toolId));
        // Now fetch settings for only active tools
        const settingsRes = await adminServiceApi.get('/admin/public/tool-settings');
        const all = (settingsRes.data?.data as any[]) || [];
        const activeSettings: ToolSettings[] = all.filter(s => activeIds.has(s.toolId));
        activeSettings.forEach(setting => {
          this.cache.set(setting.toolId, setting);
          this.cacheExpiry.set(setting.toolId, Date.now() + this.CACHE_TTL);
        });
        return activeSettings;
      }
    } catch (error) {
      console.warn('Failed to fetch all tool settings:', error);
    }

    return [];
  }

  canUserAccessTool(toolId: string, userPlan: string, isAuthenticated: boolean): boolean {
    console.log(`[canUserAccessTool] Checking access for ${toolId}, userPlan: ${userPlan}, isAuthenticated: ${isAuthenticated}`);
    const settings = this.cache.get(toolId);
    console.log(`[canUserAccessTool] Tool settings from cache:`, settings);
    console.log(`[canUserAccessTool] Settings isActive:`, settings?.isActive);
    
    if (!settings) {
      console.log(`[canUserAccessTool] No settings found for ${toolId}`);
      return false;
    }
    
    // Since admin service only returns active tools, we can assume isActive is true
    // if (!settings.isActive) {
    //   console.log(`[canUserAccessTool] Tool is inactive for ${toolId}`);
    //   return false;
    // }

    const { accessControl, features } = settings;
    console.log(`[canUserAccessTool] Access control:`, accessControl.allowedFor);
    console.log(`[canUserAccessTool] Features:`, features);

    // Check feature requirements
    if (features.requiresAuth && !isAuthenticated) {
      console.log(`[canUserAccessTool] Requires auth but not authenticated`);
      return false;
    }

    if (features.requiresPremium && userPlan !== 'pro' && userPlan !== 'custom') {
      console.log(`[canUserAccessTool] Requires premium but user plan is ${userPlan}`);
      return false;
    }

    // Check access control
    switch (accessControl.allowedFor) {
      case 'all':
        console.log(`[canUserAccessTool] Tool is free for all - returning true`);
        return true;
      
      case 'logged_in_only':
        return isAuthenticated;
      
      case 'pro':
        return isAuthenticated && (userPlan === 'pro' || userPlan === 'custom');
      
      case 'custom':
        if (!isAuthenticated) {
          return accessControl.customRules.guests.enabled;
        } else if (userPlan === 'pro' || userPlan === 'custom') {
          return accessControl.customRules.proUsers.enabled;
        } else {
          return accessControl.customRules.freeUsers.enabled;
        }
      
      default:
        return false;
    }
  }

  getUserLimitForTool(toolId: string, userPlan: string, isAuthenticated: boolean): { limitType: 'unlimited' | 'number'; limit: number | null; timeWindow: string } {
    const settings = this.cache.get(toolId);
    if (!settings) {
      return { limitType: 'number', limit: 0, timeWindow: 'daily' };
    }

    const { accessControl } = settings;

    if (accessControl.allowedFor === 'all') {
      console.log(`[getUserLimitForTool] Tool ${toolId} is free for all - returning unlimited`);
      return { limitType: 'unlimited', limit: null, timeWindow: 'daily' };
    }

    if (accessControl.allowedFor === 'custom') {
      if (!isAuthenticated) {
        return {
          limitType: accessControl.customRules.guests.limitType,
          limit: accessControl.customRules.guests.limit,
          timeWindow: accessControl.customRules.guests.timeWindow
        };
      } else if (userPlan === 'pro' || userPlan === 'custom') {
        return {
          limitType: accessControl.customRules.proUsers.limitType,
          limit: accessControl.customRules.proUsers.limit,
          timeWindow: accessControl.customRules.proUsers.timeWindow
        };
      } else {
        return {
          limitType: accessControl.customRules.freeUsers.limitType,
          limit: accessControl.customRules.freeUsers.limit,
          timeWindow: accessControl.customRules.freeUsers.timeWindow
        };
      }
    }

    // For logged_in_only and pro, return unlimited for now
    return { limitType: 'unlimited', limit: null, timeWindow: 'daily' };
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

export const toolSettingsService = new ToolSettingsService();
