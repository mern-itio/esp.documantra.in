import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import PublicSignerLayout from '../layouts/PublicSignerLayout';
import PublicWizard from '../pages/PublicFlow/PublicWizard';
import EnvelopeCreator from '../pages/eSign/EnvelopeCreator';
import PublicSignerPage from '../pages/eSign/PublicSignerPage';
import RecipientPortalPage from '../pages/eSign/RecipientPortalPage';
import ThankYouPage from '../pages/eSign/ThankYou';

const LegacyPublicSignRedirect = () => {
  const location = useLocation();
  return (
    <Navigate
      to={{ pathname: '/', search: location.search, hash: location.hash }}
      replace
    />
  );
};

const publicSignRouter = createBrowserRouter([
  { path: '/', element: <PublicWizard /> },
  { path: '/public-sign', element: <LegacyPublicSignRedirect /> },
  { path: '/public-sign/editor', element: <EnvelopeCreator /> },
  { path: '/e-sign/recipient-portal', element: <RecipientPortalPage /> },
  {
    element: <PublicSignerLayout />,
    children: [
      { path: 'e-sign/signer/:id/:recipientId/:cycleId?', element: <PublicSignerPage /> },
      { path: 'e-sign/preview/:id', element: <PublicSignerPage /> },
      { path: '/e-sign/signer/thank-you', element: <ThankYouPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default publicSignRouter;
