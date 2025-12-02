import React, { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import router from "./routes/index";
import ThemeConfig from "./theme/index";
import { SidebarProvider } from "./context/SidebarContext";
import { AuthProvider } from "./components/AuthService/AuthContext";
import Loader from "./components/common/loader";
import { AppProvider } from "./context/AppContext";
import { APIProvider } from '../src/context/ApiContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { SupportChatProvider } from './context/SupportChatContext';
import { Toaster } from "react-hot-toast"; 
import SubscriptionPlansModal from './components/common/SubscriptionPlansModal';
import CustomerChatWidget from './components/SupportChat/CustomerChatWidget';

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
        <SupportChatProvider>
          <SubscriptionProvider>
            <AppProvider>
              <SidebarProvider>
                <ThemeConfig>
                  <RouterProvider router={router} />
                  <Toaster />
                  <GlobalPlansModalPortal />
                  <CustomerChatWidget />
                </ThemeConfig>
              </SidebarProvider>
            </AppProvider>
          </SubscriptionProvider>
        </SupportChatProvider>
      </AuthProvider>
    </APIProvider>
  );
};

export default App;

// Portal to listen to global event and mount the plans modal
const GlobalPlansModalPortal: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('app:open-plans-modal', handler as any);
    return () => window.removeEventListener('app:open-plans-modal', handler as any);
  }, []);
  return <SubscriptionPlansModal open={open} onClose={() => setOpen(false)} />;
};
