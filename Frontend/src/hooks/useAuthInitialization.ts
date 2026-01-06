import { useEffect } from 'react';
import { useDocumentStore } from '../components/common/store/documentStore';
import { useAuth } from '../components/AuthService/AuthContext';

export const useAuthInitialization = () => {
  const { loadUserFromStorage, setCurrentUser, currentUser: storeUser } = useDocumentStore();
  const { setAccount, loadAccountFromStorage } = useDocumentStore();
  const { user: authUser } = useAuth();

  useEffect(() => {
    // Load user data from localStorage when component mounts
    loadUserFromStorage();
    // Load account mode (user/org) from localStorage
    try { loadAccountFromStorage(); } catch {}
  }, [loadUserFromStorage]);

  useEffect(() => {
    // Sync user data between AuthContext and DocumentStore
    if (authUser && (!storeUser || storeUser.email !== authUser.email)) {
      const userForStore = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.fullname,
        role: (authUser.type as 'regular' | 'team_admin' | 'super_admin') || 'regular'
      };
      setCurrentUser(userForStore);
      // Sync account mode into store
      try {
        const acct = localStorage.getItem('accountType') === 'organization' ? 'organization' : 'user';
        const orgId = localStorage.getItem('organizationId') || null;
        setAccount(acct as 'user' | 'organization', orgId);
      } catch {}
    }
  }, [authUser, storeUser, setCurrentUser]);

  return { currentUser: storeUser };
};
