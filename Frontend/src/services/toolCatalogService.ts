import { adminServiceApi } from './apiHelper';

export interface CatalogTool { id: string; name: string; description?: string; category?: string; priority?: number; createdAt?: string; updatedAt?: string }

export const toolCatalogService = {
  async listPublic(): Promise<CatalogTool[]> {
    const res = await adminServiceApi.get('/admin/public/pdf-tools');
    return (res as any).data?.data || [];
  },
};


