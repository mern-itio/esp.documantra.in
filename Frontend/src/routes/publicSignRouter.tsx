import { createBrowserRouter, Navigate } from 'react-router-dom';
import PublicSignerLayout from '../layouts/PublicSignerLayout';
import PublicWizard from '../pages/PublicFlow/PublicWizard';
import EnvelopeCreator from '../pages/eSign/EnvelopeCreator';
import PublicSignerPage from '../pages/eSign/PublicSignerPage';
import ThankYouPage from '../pages/eSign/ThankYou';

const publicSignRouter = createBrowserRouter([
  { path: '/', element: <Navigate to="/public-sign" replace /> },
  { path: '/public-sign', element: <PublicWizard /> },
  { path: '/public-sign/editor', element: <EnvelopeCreator /> },
  {
    element: <PublicSignerLayout />,
    children: [
      { path: 'e-sign/signer/:id/:recipientId/:cycleId?', element: <PublicSignerPage /> },
      { path: 'e-sign/preview/:id', element: <PublicSignerPage /> },
      { path: '/e-sign/signer/thank-you', element: <ThankYouPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/public-sign" replace /> },
]);

export default publicSignRouter;
