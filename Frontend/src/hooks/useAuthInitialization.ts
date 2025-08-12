import { useEffect } from 'react';
import { useDocumentStore } from '../components/common/store/documentStore';

export const useAuthInitialization = () => {
  const { loadUserFromStorage, currentUser } = useDocumentStore();

  useEffect(() => {
    // Load user data from localStorage when component mounts
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  return { currentUser };
};
