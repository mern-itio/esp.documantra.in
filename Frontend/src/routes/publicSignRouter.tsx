import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import PublicSignerLayout from '../layouts/PublicSignerLayout';
import PublicWizard from '../pages/PublicFlow/PublicWizard';
import EnvelopeCreator from '../pages/eSign/EnvelopeCreator';
import PublicSignerPage from '../pages/eSign/PublicSignerPage';
import SignAppearanceDemoPage from '../pages/eSign/SignAppearanceDemoPage';
import RecipientPortalPage from '../pages/eSign/RecipientPortalPage';
import PublicSendSuccessPage from '../pages/PublicFlow/PublicSendSuccessPage';
import ThankYouPage from '../pages/eSign/ThankYou';
import SignerStatusPage from '../pages/eSign/SignerStatusPage';
import FinishLaterPage from '../pages/eSign/FinishLaterPage';
import PrivacyPolicyPage from '../pages/LandingPage/PrivacyPolicyPage';
import TermsOfServicePage from '../pages/LandingPage/TermsOfServicePage';
import ElectronicRecordDisclosurePage from '../pages/LandingPage/ElectronicRecordDisclosurePage';
import CookiePolicyPage from '../pages/LandingPage/CookiePolicyPage';
import { LEGAL_PATHS } from '../constants/legalPaths';

const LegacyPublicSignRedirect = () => {
  const location = useLocation();
  return (
    <Navigate
      to={{ pathname: '/', search: location.search, hash: location.hash }}
      replace
    />
  );
};

const LegacyEditorRedirect = () => {
  const location = useLocation();
  const rest = location.pathname.replace(/^\/public-sign\/editor\/?/, '');
  const suffix = rest ? `/${rest}` : '';
  return (
    <Navigate
      to={{ pathname: `/editor${suffix}`, search: location.search, hash: location.hash }}
      replace
    />
  );
};

const publicSignRouter = createBrowserRouter([
  { path: '/', element: <PublicWizard /> },
  { path: '/editor', element: <EnvelopeCreator /> },
  { path: '/sent', element: <PublicSendSuccessPage /> },
  { path: '/public-sign', element: <LegacyPublicSignRedirect /> },
  { path: '/public-sign/editor', element: <LegacyEditorRedirect /> },
  { path: '/public-sign/editor/*', element: <LegacyEditorRedirect /> },
  { path: '/e-sign/recipient-portal', element: <RecipientPortalPage /> },
  // Legal pages (canonical URLs only; aliases redirect)
  { path: LEGAL_PATHS.privacyPolicy, element: <PrivacyPolicyPage /> },
  { path: LEGAL_PATHS.termsOfUse, element: <TermsOfServicePage /> },
  { path: LEGAL_PATHS.electronicRecordDisclosure, element: <ElectronicRecordDisclosurePage /> },
  { path: LEGAL_PATHS.cookiePolicy, element: <CookiePolicyPage /> },
  { path: '/privacy', element: <Navigate to={LEGAL_PATHS.privacyPolicy} replace /> },
  { path: '/terms', element: <Navigate to={LEGAL_PATHS.termsOfUse} replace /> },
  { path: '/terms-of-service', element: <Navigate to={LEGAL_PATHS.termsOfUse} replace /> },
  { path: '/cookies', element: <Navigate to={LEGAL_PATHS.cookiePolicy} replace /> },
  // Must be registered before e-sign/signer/:id — otherwise "status" is parsed as :id.
  { path: '/e-sign/signer/status/:envelopeId/:recipientId', element: <SignerStatusPage /> },
  { path: '/e-sign/signer/finish-later/:envelopeId/:recipientId', element: <FinishLaterPage /> },
  {
    element: <PublicSignerLayout />,
    children: [
      { path: 'e-sign/signer/:id/:recipientId/:cycleId?', element: <PublicSignerPage /> },
      { path: 'e-sign/preview/:id', element: <PublicSignerPage /> },
      { path: 'e-sign/sign-appearance-demo', element: <SignAppearanceDemoPage /> },
      { path: '/e-sign/signer/thank-you', element: <ThankYouPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default publicSignRouter;
