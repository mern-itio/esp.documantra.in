import { useState, useEffect } from 'react';
import { useAdminApi } from '../services';
import type { ApiResponse, PaginatedResponse } from '../services';

// Custom hook for admin data fetching
export const useAdminData = <T>(
  fetchFunction: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchFunction();
        
        if (response.success) {
          setData(response.data || null);
        } else {
          setError(response.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  const refetch = () => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchFunction();
        
        if (response.success) {
          setData(response.data || null);
        } else {
          setError(response.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  };

  return { data, loading, error, refetch };
};

// Hook for paginated data
export const useAdminPaginatedData = <T>(
  fetchFunction: (page: number, limit: number, filters?: any) => Promise<ApiResponse<PaginatedResponse<T>>>,
  initialPage: number = 1,
  initialLimit: number = 10,
  filters: any = {}
) => {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (page: number = pagination.page, limit: number = pagination.limit) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchFunction(page, limit, filters);
      
      if (response.success && response.data) {
        setData(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, pagination.limit, ...Object.values(filters)]);

  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const changeLimit = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  return {
    data,
    pagination,
    loading,
    error,
    goToPage,
    changeLimit,
    refetch: () => fetchData(),
  };
};

// Hook for dashboard stats
export const useDashboardStats = () => {
  const adminApi = useAdminApi();
  return useAdminData(() => adminApi.getDashboardStats());
};

// Hook for users data
export const useUsers = (filters: any = {}) => {
  const adminApi = useAdminApi();
  return useAdminPaginatedData(
    (page, limit) => adminApi.getUsers({ page, limit, ...filters }),
    1,
    10,
    filters
  );
};

// Hook for documents data
export const useDocuments = (filters: any = {}) => {
  const adminApi = useAdminApi();
  return useAdminPaginatedData(
    (page, limit) => adminApi.getDocuments({ page, limit, ...filters }),
    1,
    10,
    filters
  );
};

// Hook for e-signs data
export const useESigns = (filters: any = {}) => {
  const adminApi = useAdminApi();
  return useAdminPaginatedData(
    (page, limit) => adminApi.getESigns({ page, limit, ...filters }),
    1,
    10,
    filters
  );
};
