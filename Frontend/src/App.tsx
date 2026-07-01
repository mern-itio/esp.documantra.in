import React, { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import router from "./routes/index";
import publicSignRouter from "./routes/publicSignRouter";
import { isPublicSignOnlyApp } from "./config/appMode";
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
import CreditPurchaseModal from './components/common/CreditPurchaseModal';
import CustomerChatWidget from './components/SupportChat/CustomerChatWidget';
import AIAssistantButton from './components/AIAssistant/AIAssistantButton';
import { useSubscription } from './context/SubscriptionContext';

const ConditionalWidgets: React.FC = () => {
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;    
      if (path.includes('/e-sign/form-builder/')) {
        setShouldHide(true);
        return;
      }
      if (path.includes('/e-sign/signer/')) {
        setShouldHide(true);
        return;
      }
      if (path === '/e-sign/create') {
        setShouldHide(true);
        return;
      }   
      
      setShouldHide(false);
    };
    checkRoute();
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(checkRoute, 0);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(checkRoute, 0);
    };
    window.addEventListener('popstate', checkRoute);    
    const interval = setInterval(checkRoute, 500);    
    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', checkRoute);
      clearInterval(interval);
    };
  }, []);

  if (shouldHide) {
    return null;
  }

  return (
    <div className="fixed right-6 bottom-85 flex flex-col gap-4 z-50">
      <CustomerChatWidget />
      <AIAssistantButton />
    </div>
  );
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const publicSignOnly = isPublicSignOnlyApp();
  const activeRouter = publicSignOnly ? publicSignRouter : router;

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
                  <RouterProvider router={activeRouter} />
                  <Toaster
                    containerStyle={{ zIndex: 10100 }}
                    toastOptions={{
                      style: { zIndex: 10100 },
                    }}
                  />
                  {!publicSignOnly && (
                    <>
                      <GlobalPlansModalPortal />
                      <ConditionalWidgets />
                    </>
                  )}
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

// Portal to listen to global event and conditionally show plans or credit purchase modal.
// Must be rendered inside <SubscriptionProvider> so it can read the user's plan.
const GlobalPlansModalPortal: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const { isFreePlan } = useSubscription();

  React.useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('app:open-plans-modal', handler as any);
    return () => window.removeEventListener('app:open-plans-modal', handler as any);
  }, []);

  // Free users → show subscription plans to upgrade
  // Paid users who exhausted credits → show credit top-up modal with low-credit banner
  if (isFreePlan()) {
    return <SubscriptionPlansModal open={open} onClose={() => setOpen(false)} />;
  }
  return <CreditPurchaseModal open={open} onClose={() => setOpen(false)} lowCredits />;
};
