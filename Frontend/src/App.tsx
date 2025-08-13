import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './routes/index';
import ThemeConfig from './theme/index';
import { AuthProvider } from './components/AuthService/AuthContext';
import Loader from './components/common/loader';
import { AppProvider } from './context/AppContext'; // <-- Import AppProvider (adjust path if needed)

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;

  return (
    <AuthProvider>
      <AppProvider> {/* <-- Wrap with AppProvider */}
        <ThemeConfig>
          <RouterProvider router={router} />
        </ThemeConfig>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;