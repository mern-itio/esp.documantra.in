import React, { useEffect, useState } from 'react';
import { createBrowserRouter, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthService/AuthContext';
import { isPublicSignOnlyApp } from '../config/appMode';
import RedirectToEsignPublic from '../components/PublicFlow/RedirectToEsignPublic';
import {
  PublicPDFTools,
  PDFToolsMergePDFPage,
  PDFToolsSplitPDFPage,
  PDFToolsExtractPDFPage,
  PDFToolsDeletePDFPage,
  PDFToolsReorderPDFPage,
  PDFToolsRotatePDFPage,
  PDFToolsCropPDFPage,
  PDFToolsInsertPDFPage,
  PDFToolsAddPageNumbersPage,
  PDFToolsAddHeaderFooterPage,
  PDFToolsAddPasswordPage,
  PDFToolsRemovePasswordPage,
  PDFToolsDigitalSignaturePage,
  PDFToolsSetPermissionsPage,
  PDFToolsRemoveMetadataPage,
  PDFToolsEditMetadataPage,
  SmartConversion,
  PDFToolsSpellCheckPage,
  PDFToolsFindReplacePage,
  PDFToolsRedactContentPage,
  PDFToolsAddStampsPage,
  PDFToolsDBAddCommentsPage,
  PDFToolsSharedDocumentPage,
  PDFToolsCompressPDFPage,
  PDFToolsOptimizeImagePage,
  PDFToolsOptimizeFontPage,
  PDFToolsRemoveUnusedObjectsPage,
  PDFToolsLinearizePDFPage,
  PDFToolsColorOptimizationPage,
  PDFToolsQualityAnalysisPage,
  PDFToolsDocumentTrackingPage,
  PDFToolsBatchOptimizationPage,
  PDFToolsOCRPage,
  PDFToolsMakeSearchablePage,
  PDFToolsExtractTablesPage,
  HandwritingRecognition,
  FillPdfFormPage,
  FormRecognitionPage,
  CalculateFieldsPage,
  PdfInfoPage,
  PdfValidatorPage,
  PdfComparePage,
  PdfRepairPage,
  PdfBookmarksPage,
  PdfStatisticsPage,
  SharedDocumentPage,
  SharedDocument,
  StatusPage,
  ContactSales,
  BlogPage,
  AboutPage,
  WhyDocuSignerPage,
  LoginPage,
  SignupPage,
  FederatedOAuthCallbackPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  PrivacyPolicyPage,
  CookiePolicyPage,
  TermsOfServicePage,
  UseCasesPage,
  WorkspacePage,
  FeatureComparisonPage,
  SitemapPage,
  ChoosePlanPage,
  NotFoundPage,
  DashboardPage,
  AuditTrailPage,
  CreditsUsagePage,
  CompliancePage,
  RiskManagementPage,
  SharedPDFPage,
  FoldersPage,
  RecentPage,
  FavoritesPage,
  ArchivedPage,
  TrashPage,
  EsignDashboard,
  EsignSigningPage,
  EsignAnalytics,
  EsignSettings,
  EsignEnterpriseSettings,
  EsignESignatureAdmin,
  AITemplateGenerator,
  UserProfile,
  RewardsPage,
  SessionManagementPage,
  AuthMethodsPage,
  AddWatermark,
  ApiServiceDashboard,
  ApiServiceAnalytics,
  ApiServiceProjects,
  ApiServiceKey,
  ApiServiceIntegrationDemo,
  ApiServiceExplorer,
  ApiServiceDocumentation,
  ApiServiceWebhooks,
  ApiServiceSDK,
  ApiServiceTesting,
  ApiServiceMarketPlace,
  ApiServiceCommunity,
  ApiServiceSupport,
  PublicSignerPage,
  RecipientPortalPage,
  CreatePdfFormPage,
  OAuthCallback,
  AdvancedPDFEditor,
  SecurityOverviewPage,
  ESignServiceWebAppPage,
  AIPoweredFeaturesPage,
  EnvelopeDetailPage,
  EnvelopeCreator,
  AgreementPage,
  EnvelopeTypes,
  ManageRecipients,
  EnvelopeGuideSupport,
  HelpSupportPage,
  PowerFormCreate,
  SubscriptionManagementPage,
  InvoicePage,
  ThankYouPage,
  SignerStatusPage,
  FinishLaterPage,
  NotificationsPage,
  SignerCycle,
  CreateOrganizationPage,
  MyOrganizationPage,
  OrganizationFolder,
  BookDemoPage,
  EmailPage,
  EmailTemplatesBuilder,
  InvitationPage,
  FolderDetailPage,
  RolePage,
  CouponPage,
  SharedDocumentsPage,
  PowerFormEmbed,
  TemplateDashboard,
  TemplateDesigner,
  AdvancedTemplateDesigner,
  AITemplateStudio,
  TemplateLibrary,
  FormBuilder,
  TemplateMarketplace,
  TemplateAnylytics,
  APIManagement,
  WorkflowAutomation,
  TemplateAdminDashboard,
  FormsList,
  FormView,
  FormEmbed,
  FormSubmissions,
  ToolsGrid,
  HelpSystem,
  CloudConnector,
  WorkflowDesigner,
  Analytics,
  Header,
  PdftoDoc,
  DoctoPdf,
  PdfToExcel,
  ExcelToPdf,
  PdftoPpt,
  PptToPdf,
  PdftoText,
  TextToPdf,
  PdfToHtml,
  HtmlToPdf,
  PdfToImage,
  ImageToPDF,
  PdfToEpub,
  BatchConversion,
  PdfEditorPage,
  PowerForm,
  AccessibilityPage,
  AIFeatures,
  AllInOnePlatformPage,
  APIDocumentationPage,
  BugBountyPage,
  DataResidencyPage,
  DocuSignerVsAdobeSignPage,
  DocuSignerVsDocuSignPage,
  DocuSignerVsHelloSignPage,
  DocuSignerVsPandaDocPage,
  UploadDocumentPage,
  SignerPage,
} from './lazyPages';
// Layouts
import RootLayout from '../layouts/RootLayout';
import DashboardNoSidebarLayout from '../layouts/DashboardNoSidebarLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import GuestLayout from '../layouts/GuestLayout';
import PublicSignerLayout from '../layouts/PublicSignerLayout';
import SharedDocumentLayout from '../layouts/SharedDocumentLayout';
// Landing Page Components (focused: e-sign, Aadhaar verification, PDF tools)
import LandingHero from '../components/LandingPage/LandingHero';
import ESignFlowSection from '../components/LandingPage/ESignFlowSection';
import VerificationSection from '../components/LandingPage/VerificationSection';
import SignatureExperienceSection from '../components/LandingPage/SignatureExperienceSection';
// import PDFToolsShowcaseSection from '../components/LandingPage/PDFToolsShowcaseSection';
// import LandingCTA from '../components/LandingPage/LandingCTA';
import FAQ from '../components/LandingPage/FAQ';
import Pricing from '../components/LandingPage/Pricing';
// import HowItWorksPage from '../pages/LandingPage/HowItWorks';

// Dashboard Pages
import { useDocumentStore } from '../components/common/store/documentStore';
import { EnhancedDocumentGrid } from '../components/DocumentService/documents/EnhancedDocumentGrid';
import { DocumentList } from '../components/DocumentService/documents/DocumentList';
import { EnhancedDocumentAnalytics } from '../components/DocumentService/analytics/EnhancedDocumentAnalytics';
import { DocumentLayout } from '../components/DocumentService/layout/DocumentLayout';
import { UploadModal } from '../components/DocumentService/modals/UploadModal';
import { CollaborationHub } from '../components/DocumentService/collaboration/CollaborationHub';


// E-Signature Pages Started
// import EsignEnvelopeCreator from '../pages/eSign/EnvelopeCreator';
// import EsignEnvelopeDetails from '../pages/eSign/EnvelopeDetails';
// E-Signature Pages Ended

// Template Pages Started
// import { Navigation } from './components/Navigation';
// Template Pages Ended


//PDF Tools Started
import type { PDFTool, ProcessingStats } from '../types';
import { mockPDFTools, mockProcessingStats, getActiveMockTools } from '../data/pdfMockData';
import { toolCatalogService } from '../services/toolCatalogService';
import { adminServiceApi } from '../services/apiHelper';
// import { PDFEditor } from '../components/PDFService/PDFEditor';
// import { PDFViewer } from '../components/PDFService/PDFViewer';

// Api-service imports started 
// import { elements } from 'chart.js';

import ClientsSection from '../components/LandingPage/clientSection';
import IndustriesSection from '../components/LandingPage/IndustriesSection';

import AadhaarSignatureJourneySection from '../components/LandingPage/AadhaarSignatureJourneySection';
import ContractManagementSection from '../components/LandingPage/ContractManagementSection';
import DigitaCertificate from '../components/LandingPage/DigitaCertificate';

// Lightweight wrapper to show PDF header on individual tool pages
//const PDFToolHeaderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  //return (
    //<div className='bg-background p-2'>
      //<CostHeader />
      //<div>
        //{children}
      //</div>
    //</div>
 // );
//};

const PDFToolHeaderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// PDF Tools Layout Component
const PDFToolsLayout = () => {
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  // const [selectedTool, setSelectedTool] = useState<PDFTool | null>(null);
  const [currentView, setCurrentView] = useState<'tools' | 'viewer' | 'editor' | 'batch' | 'analytics' | 'workflows' | 'quality' | 'cloud' | 'help' | 'admin'>('tools');
  const [processingStats, setProcessingStats] = useState<ProcessingStats>(mockProcessingStats);
  const [favoriteTools, setFavoriteTools] = useState<Set<string>>(new Set());
  const [recentTools, setRecentTools] = useState<PDFTool[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPro = (user?.plan || '').toLowerCase() === 'pro';

  // Load active tools from admin and filter mock list
  const [filteredMock, setFilteredMock] = useState<any>({});
  const [catalogTools, setCatalogTools] = useState<Array<{ _id?: string; id: string; name: string; description?: string; category?: string; priority?: number; icon?: string; complexity?: 'easy' | 'medium' | 'advanced'; avgProcessingTime?: string; popularity?: number }>>([]);
  const [activeToolIds, setActiveToolIds] = useState<Set<string>>(new Set());
  const [isToolsLoading, setIsToolsLoading] = useState(true);
  const mockDescMap = React.useMemo(() => {
    const map = new Map<string, string>();
    // @ts-ignore iterate categories
    Object.values<any>(mockPDFTools).forEach((cat: any) => {
      (cat?.tools || []).forEach((t: any) => { if (t?.id && t?.description) map.set(t.id, t.description); });
    });
    return map;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await adminServiceApi.get('/admin/public/tool-activation');
        if (!mounted) return;
        const list = Array.isArray((res as any).data?.data) ? (res as any).data.data : [];
        const activeIds = list.map((a: any) => a.toolId);
        const activeSet = new Set<string>(activeIds);
        setActiveToolIds(activeSet);
        setFilteredMock(getActiveMockTools(activeSet));
      } catch {
        setFilteredMock(getActiveMockTools());
      }
      try {
        const tools = await toolCatalogService.listPublic();
        if (!mounted) return;
        setCatalogTools(Array.isArray(tools) ? tools : []);
      } catch { }
      finally {
        if (mounted) setIsToolsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Handle URL parameters for category filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const category = urlParams.get('category');
    // console.log('URL changed, location.search:', location.search);
    // console.log('Category from URL:', category);

    if (category) {
      setSelectedCategory(category);
      // console.log('Category changed to:', category);
    } else {
      setSelectedCategory('all');
      // console.log('Category set to: all');
    }

    setCurrentView('tools');
  }, [location.search]);

  const getFilteredTools = () => {
    // Prefer backend catalog if available
    if (catalogTools.length > 0) {
      let list = catalogTools
        .filter(t => activeToolIds.size === 0 || activeToolIds.has(t.id))
        .map(t => ({
          _id: (t as any)._id,
          id: t.id,
          name: t.name,
          description: t.description || mockDescMap.get(t.id) || '',
          category: t.category || 'general',
          inputFormats: [],
          outputFormats: [],
          features: [],
          complexity: (t.complexity as any) || 'medium',
          popularity: typeof t.popularity === 'number' ? t.popularity : 50,
          avgProcessingTime: t.avgProcessingTime || '',
          icon: t.icon || 'FileText',
          route: `/pdf-tools/${t.id}`,
          priority: typeof t.priority === 'number' ? t.priority : 9999,
        }))
        .sort((a, b) => (a.priority! - b.priority!));
      if (selectedCategory && selectedCategory !== 'all') {
        list = list.filter(tool => tool.category === selectedCategory);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return list.filter(tool => tool.name.toLowerCase().includes(q));
      }
      return list;
    }

    // Fallback to existing mock filtering if catalog not loaded
    let allTools: any[] = [];
    if (selectedCategory === 'all') {
      // @ts-ignore - TypeScript can't infer the complex union type correctly
      allTools = Object.values(filteredMock).flatMap((category: any) => category.tools);
    } else {
      const categoryData = filteredMock[selectedCategory as keyof typeof filteredMock];
      allTools = categoryData ? categoryData.tools : [];
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return allTools.filter((tool: any) =>
        tool.name?.toLowerCase().includes(q) ||
        tool.description?.toLowerCase().includes(q) ||
        tool.features?.some((feature: string) => feature.toLowerCase().includes(q))
      );
    }
    return allTools;
  };

  const handleToolSelect = (tool: PDFTool) => {
    // Credit gating based on stored subscription plan
    // Do not block navigation; pass tool Mongo _id for later credit checks during conversion
    // console.log('Tool selected:', tool);
    // console.log('Navigating to:', `/pdf-tools/${tool.id}`);
    // setSelectedTool(tool);

    // Get current category from URL or tool's category
    const urlParams = new URLSearchParams(location.search);
    const currentCategory = urlParams.get('category') || tool.category;

    // Navigate with category parameter to maintain sidebar state
    const params = new URLSearchParams();
    if (currentCategory) params.set('category', currentCategory);
    const qs = params.toString();
    const navigateUrl = qs ? `/pdf-tools/${tool.id}?${qs}` : `/pdf-tools/${tool.id}`;

    navigate(navigateUrl);

    // Add to recent tools
    setRecentTools(prev => {
      const filtered = prev.filter(t => t.id !== tool.id);
      return [tool, ...filtered].slice(0, 5);
    });
  };

  const toggleFavorite = (toolId: string) => {
    setFavoriteTools(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(toolId)) {
        newFavorites.delete(toolId);
      } else {
        newFavorites.add(toolId);
      }
      return newFavorites;
    });
  };

  useEffect(() => {
    // Simulate real-time stats updates
    const interval = setInterval(() => {
      setProcessingStats(prev => ({
        ...prev,
        dailyUsage: {
          ...prev.dailyUsage,
          totalOperations: prev.dailyUsage.totalOperations + Math.floor(Math.random() * 5)
        }
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'viewer':
      // return <PDFViewer selectedTool={selectedTool} onBack={() => setCurrentView('tools')} />;
      case 'editor':
        return <PdfEditorPage />;
      case 'batch':
        return <BatchConversion onBack={() => setCurrentView('tools')} />;
      case 'analytics':
        return <Analytics stats={processingStats} onBack={() => setCurrentView('tools')} />;
      case 'workflows':
        return <WorkflowDesigner onBack={() => setCurrentView('tools')} />;
      case 'quality':
        return <PDFToolsQualityAnalysisPage onBack={() => setCurrentView('tools')} />;
      case 'cloud':
        return <CloudConnector onBack={() => setCurrentView('tools')} />;
      case 'help':
        return <HelpSystem onBack={() => setCurrentView('tools')} />;

      default:
        if (isToolsLoading) {
          return (
            <ToolsGrid
              tools={[]}
              onToolSelect={handleToolSelect}
              favoriteTools={favoriteTools}
              onToggleFavorite={toggleFavorite}
              recentTools={recentTools}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              onSearchChange={setSearchQuery}
              isLoading
            />
          );
        }

        const filteredTools = getFilteredTools();

        return (
            <ToolsGrid
              key={`${selectedCategory}-${searchQuery}`}
              tools={filteredTools}
              onToolSelect={handleToolSelect}
              favoriteTools={favoriteTools}
              onToggleFavorite={toggleFavorite}
              recentTools={recentTools}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              onSearchChange={setSearchQuery}
              isLoading={isToolsLoading}
            />
        );
    }
  };

  return (
    <div className="min-h-full">
      {isPro && (
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentView={currentView}
          onViewChange={setCurrentView}
          stats={processingStats}
        />
      )}
      <div className="p-0 md:p-1">{renderCurrentView()}</div>
    </div>
  );
};

//PDF Tools Ended

// Auth Route Wrapper
const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null; // wait for auth state to load before redirecting
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Guest Route Wrapper
const GuestRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};
function DocumentView() {
  const { viewMode } = useDocumentStore();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const handleDocumentAction = (action: string) => {
    if (action === 'upload') {
      setIsUploadModalOpen(true);
    }
  };

  const handleDocumentSelect = (document: any) => {
    setSelectedDocument(document);
  };

  // Listen for AI assistant document open events
  useEffect(() => {
    const handleAIDocumentOpen = async (event: Event) => {
      const customEvent = event as CustomEvent<{ 
        documentId: string; 
        documentName?: string;
        serviceType?: string;
      }>;
      const { documentId, serviceType } = customEvent.detail;
      
      if (!documentId) return;

      // Only handle document-service documents here
      // E-sign envelopes are handled by direct navigation in AIAssistantPanel
      if (serviceType === 'e-sign-service') {
        return; // Already navigated in AIAssistantPanel
      }

      try {
        // Import documentAPI dynamically to avoid circular dependencies
        const { documentAPI } = await import('../services/api');
        const response = await documentAPI.getDocument(documentId);
        if (response.data?.data) {
          setSelectedDocument(response.data.data);
        } else {
          console.error('Document not found:', documentId);
        }
      } catch (error) {
        console.error('Error fetching document from AI assistant:', error);
        // Don't show error if it's a 404 - document might not exist
      }
    };

    window.addEventListener('ai-assistant:open-document', handleAIDocumentOpen);
    return () => {
      window.removeEventListener('ai-assistant:open-document', handleAIDocumentOpen);
    };
  }, []);


  return (
    <>
      {viewMode === 'grid' ? (
        <EnhancedDocumentGrid
          onDocumentAction={handleDocumentAction}
          onDocumentSelect={handleDocumentSelect}
        />
      ) : (
        <DocumentList onDocumentSelect={handleDocumentSelect} />
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}

      {/* Collaboration Hub - Document Detail View */}
      {selectedDocument && (
        <CollaborationHub
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </>
  );
}
// Landing Page Layout Component — e-sign, Aadhaar verification, PDF tools
const LandingPageLayout = () => (
  <div>
    <LandingHero />
    <ESignFlowSection />
    <VerificationSection />
    <ContractManagementSection />
    <SignatureExperienceSection />
    {/* <PDFToolsShowcaseSection /> */}
    <AadhaarSignatureJourneySection />
    <AIFeatures />
    <ClientsSection />
    <IndustriesSection />
    <FAQ />
    <DigitaCertificate />
  </div>
);

const RootGuestRoute = () =>
  isPublicSignOnlyApp() ? <Navigate to="/" replace /> : <LandingPageLayout />;

// Guest Routes (Public)
const guestRoutes = [
  { path: '/', element: <RootGuestRoute /> },
  { path: '/login', element: <GuestRoute><LoginPage /></GuestRoute> },
  { path: '/signup', element: <GuestRoute><SignupPage /></GuestRoute> },
  { path: '/oauth/callback/:provider', element: <GuestRoute><FederatedOAuthCallbackPage /></GuestRoute> },
  { path: '/forgot-password', element: <GuestRoute><ForgotPasswordPage /></GuestRoute> },
  { path: '/reset-password', element: <GuestRoute><ResetPasswordPage /></GuestRoute> },
  { path: '/privacy-policy', element: <PrivacyPolicyPage /> },
  { path: '/cookie-policy', element: <CookiePolicyPage /> },
{path: '/tools',  element: <PublicPDFTools />},  
{ path: '/use-cases', element: <UseCasesPage /> },
{ path: '/public-sign', element: <RedirectToEsignPublic /> },
{
  path: '/public-sign/editor',
  element: <RedirectToEsignPublic />
}, 
 { path: '/workspace', element: <WorkspacePage /> },
  { path: '/feature-comparison', element: <FeatureComparisonPage /> },
  { path: '/sitemap', element: <SitemapPage /> },
  { path: '/security-overview', element: <SecurityOverviewPage /> },
  { path: '/terms-of-service', element: <TermsOfServicePage /> },
  { path: '/status', element: <StatusPage /> },
  { path: '/contact-sales', element: <ContactSales /> },
  { path: '/help-support', element: <HelpSupportPage /> },
  { path: '/blog', element: <BlogPage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/oauth-callback', element: <OAuthCallback /> },
  { path: '/why-draft-sign', element: <WhyDocuSignerPage /> },
  // { path: '/accessibility', element: <AccessibilityPage /> },
  { path: '/draft-n-sign-vs-docusign', element: <DocuSignerVsDocuSignPage /> },
  { path: '/draft-n-sign-vs-adobesign', element: <DocuSignerVsAdobeSignPage /> },
  { path: '/draft-n-sign-vs-hellosign', element: <DocuSignerVsHelloSignPage /> },
  { path: '/draft-n-sign-vs-pandadoc', element: <DocuSignerVsPandaDocPage /> },
  { path: '/pricing', element: <Pricing /> },
  { path: '/all-in-one', element: <AllInOnePlatformPage /> },
  { path: '/ai-powered-features', element: <AIPoweredFeaturesPage /> },
  { path: '/api-documentation', element: <APIDocumentationPage /> },
  { path: '/bug-bounty', element: <BugBountyPage /> },
  { path: '/data-residency', element:<DataResidencyPage /> },
  { path: '/accessibility', element:<AccessibilityPage /> },
  { path: '/book-demo', element:<BookDemoPage /> },
  { path: '/e-sign/web-app', element: <ESignServiceWebAppPage /> },
  { path: '/sign-pdf-online', element: <UploadDocumentPage /> },
  { path: '/sign-pdf-online/signer', element: <SignerPage /> },
  { path: '/sign-pdf-online/plan', element: <ChoosePlanPage /> },
  // Public signer status page should show landing header/footer
  { path: '/e-sign/signer/status/:envelopeId/:recipientId', element: <SignerStatusPage /> },
  { path: '/e-sign/signer/finish-later/:envelopeId/:recipientId', element: <FinishLaterPage /> },
  { path: '/e-sign/recipient-portal', element: <RecipientPortalPage /> },
  // Public Shared Document Route (No Authentication Required)

  // PDF Tool Pages
  { path: '/pdf-to-word', element: <PdftoDoc /> },
  { path: '/merge-pdf', element: <PDFToolsMergePDFPage /> },
  { path: '/compress-pdf', element: <PDFToolsCompressPDFPage /> },
  { path: '/split-pdf', element: <PDFToolsSplitPDFPage /> },
  { path: '/pdf-to-excel', element: <PdfToExcel /> },
  { path: '/protect-pdf', element: <PDFToolsAddPasswordPage /> },
  { path: '/pdf-to-jpg', element: <PdfToImage /> },
  { path: '/img-to-pdf', element: <ImageToPDF /> },
  { path: '/rotate-pdf', element: <PDFToolsRotatePDFPage /> },
  { path: '/ocr-pdf', element: <PDFToolsOCRPage /> },
  { path: '/pdf-to-powerpoint', element: <PdftoPpt /> },
  { path: '/pdf-to-text', element: <PdftoText /> },
  { path: '/word-to-pdf', element: <DoctoPdf /> },
  { path: '/unlock-pdf', element: <PDFToolsRemovePasswordPage /> },
  { path: '/watermark-pdf', element: <AddWatermark /> },
  { path: '/extract-pages', element: <PDFToolsExtractPDFPage /> },
  { path: '/delete-pages', element: <PDFToolsDeletePDFPage /> },
  { path: '/html-to-pdf', element: <HtmlToPdf /> },
  { path: '/powerpoint-to-pdf', element: <PptToPdf /> },
  { path: '/excel-to-pdf', element: <ExcelToPdf /> },
  { path: '/text-to-pdf', element: <TextToPdf /> },
  { path: '/validate-pdf', element: <PdfValidatorPage /> },
  { path: '/pdf-to-html', element: <PdfToHtml /> },
  { path: '/rotate-pdf', element: <PDFToolsRotatePDFPage /> },
  { path: '/redact-pdf', element: <PDFToolsRedactContentPage /> },
  { path: '/repair-pdf', element: <PdfRepairPage /> },
];

// Authenticated User Routes
const authRoutes = [
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/credits-usage', element: <CreditsUsagePage /> },
  { path: '/invoice/:id', element: <InvoicePage /> },
  { path: '/audit-trail', element: <AuditTrailPage /> },
  { path: '/compliance', element: <CompliancePage /> },
  { path: '/risk-management', element: <RiskManagementPage /> },
  { path: '/subscription-management', element: <SubscriptionManagementPage /> },
  { path: '/organization/create', element: <CreateOrganizationPage /> },
  { path: '/organizations/', element: <MyOrganizationPage /> },
  { path: '/organization/folders', element: <OrganizationFolder /> },
  { path: '/organization/invitations/:invUserId', element: <InvitationPage/>},
  { path: '/organization/folder/:folderId', element: <FolderDetailPage /> },
  { path: '/organization/roles/:orgId', element: <RolePage/>},
  { path: '/e-sign/templateLibrary', element: <TemplateLibrary/>},
  // { path: '/test', element: <DocumentUploadSection /> },

  //Document Management Module
  {
    path: '/all-documents',
    element: (
      <DocumentLayout>
        <DocumentView />
      </DocumentLayout>
    )
  },
  {
    path: '/recent',
    element: (
      <DocumentLayout>
        <RecentPage />
      </DocumentLayout>
    )
  },
  {
    path: '/documents/shared',
    element: (
      <DocumentLayout>
        <SharedDocumentsPage />
      </DocumentLayout>
    )
  },
  {
    path: '/documents/shared-pdf',
    element: (
      <DocumentLayout>
        <SharedPDFPage />
      </DocumentLayout>
    )
  },
  {
    path: '/documents/folder',
    element: (
      <FoldersPage />

    )
  },
  {
    path: '/documents/favorites',
    element: (
      <DocumentLayout>
        <FavoritesPage />
      </DocumentLayout>
    )
  },
  {
    path: '/documents/archived',
    element: (
      <DocumentLayout>
        <ArchivedPage />
      </DocumentLayout>
    )
  },
  {
    path: '/documents/trash',
    element: (
      <DocumentLayout>
        <TrashPage />
      </DocumentLayout>
    )
  },
  {
    path: '/analytics',
    element: (
      <DocumentLayout>
        <EnhancedDocumentAnalytics />
      </DocumentLayout>
    )
  },
  // E-Signature Routes
  { path: '/e-sign/dashboard', element: <EsignDashboard /> },
  // moved to no-sidebar layout group below
  { path: '/e-sign/sign/:token', element: <EsignSigningPage /> },
  { path: '/e-sign/create', element: <EnvelopeCreator /> },
  { path: '/e-sign/edit/:envelopeId', element: <EnvelopeCreator /> },

  { path: '/e-sign/analytics', element: <EsignAnalytics /> },
  { path: '/e-sign/aggrement', element: <AgreementPage /> },
  { path: '/e-sign/aggrement/all', element: <AgreementPage /> },
  { path: '/e-sign/aggrement/completed', element: <AgreementPage /> },
  { path: '/e-sign/aggrement/draft', element: <AgreementPage /> },
  { path: '/e-sign/aggrement/in-progress', element: <AgreementPage /> },
  { path: '/e-sign/aggrement/deleted', element: <AgreementPage /> },
  { path: '/e-sign/aggrement/shared-with-me', element: <AgreementPage /> },
  { path: '/e-sign/powerform', element: <AgreementPage /> },
  { path: '/e-sign/powerform/all', element: <AgreementPage /> },
  { path: '/e-sign/powerform/completed', element: <AgreementPage /> },
  { path: '/e-sign/powerform/draft', element: <AgreementPage /> },
  { path: '/e-sign/powerform/in-progress', element: <AgreementPage /> },
  { path: '/e-sign/powerform/deleted', element: <AgreementPage /> },
  { path: '/e-sign/settings', element: <EsignSettings /> },
  { path: '/e-sign/enterprise', element: <EsignEnterpriseSettings /> },
  { path: '/e-sign/admin', element: <EsignESignatureAdmin /> },
  { path: '/e-sign/power-form-embed/:formId/:envelopeId', element: <PowerFormEmbed /> },
  { path: '/e-sign/envelope_types', element: <EnvelopeTypes /> },
  { path: '/e-sign/manage_receipients', element: <ManageRecipients /> },
  { path: '/e-sign/form-list', element: <FormsList /> },
  { path: '/e-sign/powerforms', element: <PowerFormCreate /> },
  { path: '/e-sign/signer-cycles/:id', element: <SignerCycle /> },


  // Template Routes
  { path: '/template/dashboard', element: <TemplateDashboard /> },
  { path: '/template/designer', element: <TemplateDesigner /> },
  { path: '/template/advance-designer', element: <AdvancedTemplateDesigner /> },
  { path: '/template/ai-studio', element: <AITemplateStudio /> },
  { path: '/template/library', element: <TemplateLibrary /> },
  { path: '/template/marketplace', element: <TemplateMarketplace /> },
  { path: '/template/anylytics', element: <TemplateAnylytics /> },
  { path: '/template/api-management', element: <APIManagement /> },
  { path: '/template/automation', element: <WorkflowAutomation /> },
  { path: '/template/admin-dashboard', element: <TemplateAdminDashboard /> },
  { path: '/template/form-embed/:id', element: <FormEmbed /> },
  { path: '/template/form-submissions/:id', element: <FormSubmissions /> },
  { path: '/template/ai-generator', element: <AITemplateGenerator /> },

  // Account
  { path: '/account/profile', element: <UserProfile /> },
  { path: '/account/rewards', element: <RewardsPage /> },
  { path: '/account/rewards/coupons', element: <CouponPage /> },
  { path: '/account/session-management', element: <SessionManagementPage /> },
  { path: '/account/security', element: <AuthMethodsPage /> },
  { path: '/notifications', element: <NotificationsPage /> },
  { path: '/account/email-configuration', element: <EmailPage/>},
  { path: '/account/email-templates', element: <EmailTemplatesBuilder/>},
  // API-service routes
  { path: '/api-service/dashboard', element: <ApiServiceDashboard /> },
  { path: '/api-service/analytics', element: <ApiServiceAnalytics /> },
  { path: '/api-service/projects', element: <ApiServiceProjects /> },
  { path: '/api-service/keys', element: <ApiServiceKey /> },
  { path: '/api-service/demo', element: <ApiServiceIntegrationDemo /> },
  { path: '/api-service/explorer', element: <ApiServiceExplorer /> },
  { path: '/api-service/documentation', element: <ApiServiceDocumentation /> },
  { path: '/api-service/Webhooks', element: <ApiServiceWebhooks /> },
  { path: '/api-service/sdk', element: <ApiServiceSDK /> },
  { path: '/api-service/testing', element: <ApiServiceTesting /> },
  { path: '/api-service/marketplace', element: <ApiServiceMarketPlace /> },
  { path: '/api-service/community', element: <ApiServiceCommunity /> },
  { path: '/api-service/support', element: <ApiServiceSupport /> },
  //PDF Tools Routes
  {
    path: '/pdf-tools',
    element: (
      <PDFToolsLayout />
    )
  },

  // Individual PDF Tool Pages
  { path: '/pdf-tools/pdf-to-word', element: <PDFToolHeaderWrapper><PdftoDoc /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/word-to-pdf', element: <PDFToolHeaderWrapper><DoctoPdf /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/pdf-to-excel', element: <PDFToolHeaderWrapper><PdfToExcel /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/excel-to-pdf', element: <PDFToolHeaderWrapper><ExcelToPdf /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/pdf-to-powerpoint', element: <PDFToolHeaderWrapper><PdftoPpt /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/powerpoint-to-pdf', element: <PDFToolHeaderWrapper><PptToPdf /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/pdf-to-img', element: <PDFToolHeaderWrapper><PdfToImage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/img-to-pdf', element: <PDFToolHeaderWrapper><ImageToPDF /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/pdf-to-text', element: <PDFToolHeaderWrapper><PdftoText /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/text-to-pdf', element: <PDFToolHeaderWrapper><TextToPdf /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/pdf-to-html', element: <PDFToolHeaderWrapper><PdfToHtml /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/html-to-pdf', element: <PDFToolHeaderWrapper><HtmlToPdf /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/pdf-to-epub', element: <PDFToolHeaderWrapper><PdfToEpub /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/batch-conversion', element: <PDFToolHeaderWrapper><BatchConversion /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/pdf-editor', element: <AdvancedPDFEditor /> },
  { path: '/pdf-tools/add-text', element: <AdvancedPDFEditor /> },
  { path: '/pdf-tools/add-images', element: <AdvancedPDFEditor /> },
  { path: '/pdf-tools/add-shapes', element: <AdvancedPDFEditor /> },
  { path: '/pdf-tools/highlight-text', element: <AdvancedPDFEditor /> },
  { path: '/pdf-tools/draw-annotations', element: <AdvancedPDFEditor /> },
  { path: '/pdf-tools/merge-pdf', element: <PDFToolHeaderWrapper><PDFToolsMergePDFPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/split-pdf', element: <PDFToolHeaderWrapper><PDFToolsSplitPDFPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/extract-pdf', element: <PDFToolHeaderWrapper><PDFToolsExtractPDFPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/delete-pdf', element: <PDFToolHeaderWrapper><PDFToolsDeletePDFPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/reorder-pdf', element: <PDFToolHeaderWrapper><PDFToolsReorderPDFPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/rotate-pdf', element: <PDFToolHeaderWrapper><PDFToolsRotatePDFPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/crop-pdf', element: <PDFToolHeaderWrapper><PDFToolsCropPDFPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/insert-pdf', element: <PDFToolHeaderWrapper><PDFToolsInsertPDFPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/add-page-numbers', element: <PDFToolHeaderWrapper><PDFToolsAddPageNumbersPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/add-header-footer', element: <PDFToolHeaderWrapper><PDFToolsAddHeaderFooterPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/add-password', element: <PDFToolHeaderWrapper><PDFToolsAddPasswordPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/remove-password', element: <PDFToolHeaderWrapper><PDFToolsRemovePasswordPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/digital-signature', element: <PDFToolHeaderWrapper><PDFToolsDigitalSignaturePage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/set-permissions', element: <PDFToolHeaderWrapper><PDFToolsSetPermissionsPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/remove-metadata', element: <PDFToolHeaderWrapper><PDFToolsRemoveMetadataPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/edit-metadata', element: <PDFToolHeaderWrapper><PDFToolsEditMetadataPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/smart-conversion', element: <SmartConversion /> },
  { path: '/pdf-tools/spell-check', element: <PDFToolHeaderWrapper><PDFToolsSpellCheckPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/find-replace', element: <PDFToolHeaderWrapper><PDFToolsFindReplacePage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/redact-content', element: <PDFToolHeaderWrapper><PDFToolsRedactContentPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/add-stamps', element: <PDFToolHeaderWrapper><PDFToolsAddStampsPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/add-comments', element: <PDFToolHeaderWrapper><PDFToolsDBAddCommentsPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-comments/shared/:linkToken', element: <PDFToolsSharedDocumentPage /> },
  { path: '/pdf-tools/compress-pdf', element: <PDFToolHeaderWrapper><PDFToolsCompressPDFPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/optimize-image', element: <PDFToolHeaderWrapper><PDFToolsOptimizeImagePage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/optimize-font', element: <PDFToolHeaderWrapper><PDFToolsOptimizeFontPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/remove-unused-objects', element: <PDFToolHeaderWrapper><PDFToolsRemoveUnusedObjectsPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/linearize-pdf', element: <PDFToolHeaderWrapper><PDFToolsLinearizePDFPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/color-optimization', element: <PDFToolHeaderWrapper><PDFToolsColorOptimizationPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/quality-analysis', element: <PDFToolHeaderWrapper><PDFToolsQualityAnalysisPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/document-tracking', element: <PDFToolHeaderWrapper><PDFToolsDocumentTrackingPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/batch-optimization', element: <PDFToolHeaderWrapper><PDFToolsBatchOptimizationPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/ocr', element: <PDFToolHeaderWrapper><PDFToolsOCRPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/make-searchable', element: <PDFToolHeaderWrapper><PDFToolsMakeSearchablePage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/extract-tables', element: <PDFToolHeaderWrapper><PDFToolsExtractTablesPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/add-watermark', element: <PDFToolHeaderWrapper><AddWatermark /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/handwriting-recognition', element: <PDFToolHeaderWrapper><HandwritingRecognition /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/create-form', element: <PDFToolHeaderWrapper><CreatePdfFormPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/fill-form', element: <PDFToolHeaderWrapper><FillPdfFormPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/form-recognition', element: <PDFToolHeaderWrapper><FormRecognitionPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/calculate-fields', element: <PDFToolHeaderWrapper><CalculateFieldsPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/pdf-info', element: <PDFToolHeaderWrapper><PdfInfoPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/pdf-validator', element: <PDFToolHeaderWrapper><PdfValidatorPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/pdf-compare', element: <PDFToolHeaderWrapper><PdfComparePage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/pdf-repair', element: <PDFToolHeaderWrapper><PdfRepairPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/pdf-bookmarks', element: <PDFToolHeaderWrapper><PdfBookmarksPage /></PDFToolHeaderWrapper> },
  { path: '/pdf-tools/pdf-statistics', element: <PDFToolHeaderWrapper><PdfStatisticsPage /></PDFToolHeaderWrapper> },
  { path: '/shared-document/:linkToken', element: <SharedDocumentPage /> },

  // Support Chat Routes


];


const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <GuestLayout />,
        children: guestRoutes,
      },
      {
        element: (
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        ),
        children: authRoutes,
      },
      {
        element: (
          <PrivateRoute>
            <DashboardNoSidebarLayout />
          </PrivateRoute>
        ),
        children: [
          { path: '/e-sign/envelope/:id', element: <EnvelopeDetailPage /> },
          { path: '/e-sign/guide', element: <EnvelopeGuideSupport /> },
          { path: '/e-sign/form-builder/:id', element: <FormBuilder /> },


        ],
      },
      {
        // Public Signer Routes
        element: <PublicSignerLayout />,
        children: [
          { path: 'e-sign/signer/:id/:recipientId/:cycleId?', element: <PublicSignerPage /> },
          { path: 'e-sign/preview/:id', element: <PublicSignerPage /> },
          { path: '/template/form-view/:id', element: <FormView /> },
          { path: '/e-sign/power-form/:envelopeId', element: <PowerForm /> },
          { path: '/e-sign/signer/thank-you', element: <ThankYouPage /> }
        ],
      },
      {
        // Shared Document Routes (Clean layout without header/footer)
        element: <SharedDocumentLayout />,
        children: [
          { path: '/shared/:shareToken', element: <SharedDocument /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ]
  }
]);
export default router;
