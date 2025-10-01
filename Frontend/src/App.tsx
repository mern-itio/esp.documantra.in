import React, { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import router from "./routes/index";
import ThemeConfig from "./theme/index";
import { AuthProvider } from "./components/AuthService/AuthContext";
import Loader from "./components/common/loader";
import { AppProvider } from "./context/AppContext";
import { APIProvider } from '../src/context/ApiContext';
import { Toaster } from "react-hot-toast"; 

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;

  return (
     <APIProvider>
    <AuthProvider>
      <AppProvider>
        <ThemeConfig>
          <RouterProvider router={router} />
           <Toaster />
        </ThemeConfig>
      </AppProvider>
    </AuthProvider>
    </APIProvider>
  );
};

export default App;
