
import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './routes/index';
import ThemeConfig from './theme/index';
import { AuthProvider } from './components/AuthService/AuthContext';
import { useAuthInitialization } from './hooks/useAuthInitialization';
import Loader from './components/common/loader';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;

  return (
    <AuthProvider>
      <ThemeConfig>
        <AppContent />
      </ThemeConfig>
    </AuthProvider>
  );
};

// Separate component to use hooks
const AppContent: React.FC = () => {
  // Initialize document store with user data
  useAuthInitialization();
  
  return <RouterProvider router={router} />;
};

export default App;