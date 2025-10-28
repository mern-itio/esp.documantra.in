import { adminServiceApi } from './apiHelper';
export interface CatalogTool {
  _id?: string;
  id: string;
  name: string;
  description?: string;
  category?: string;
  priority?: number;
  icon?: string;
  complexity?: 'easy' | 'medium' | 'advanced';
  avgProcessingTime?: string;
  popularity?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const toolCatalogService = {
  async listPublic(): Promise<CatalogTool[]> {
    const res = await adminServiceApi.get('/admin/public/pdf-tools');
    const list = (res as any).data?.data || [];
    // Persist id->_id map for interceptors to resolve tool object ids from route slugs
    try {
      const map: Record<string, string> = {};
      const nameMap: Record<string, string> = {};
      list.forEach((t: any) => { if (t?.id && t?._id) map[t.id] = String(t._id); });
      list.forEach((t: any) => { if (t?._id && t?.name) nameMap[String(t._id)] = t.name; });
      if (Object.keys(map).length) localStorage.setItem('toolCatalogIdMap', JSON.stringify(map));
      if (Object.keys(nameMap).length) localStorage.setItem('toolCatalogNameMap', JSON.stringify(nameMap));
    } catch {}
    return list;
  },
};


