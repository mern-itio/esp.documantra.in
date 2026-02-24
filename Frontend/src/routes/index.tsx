import React, { useEffect, useState } from 'react';
import { createBrowserRouter, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthService/AuthContext';

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

import PDFToolsMergePDFPage from '../pages/PDFTools/MergePDFPage';
import PDFToolsSplitPDFPage from '../pages/PDFTools/SplitPDFPage';
import PDFToolsExtractPDFPage from '../pages/PDFTools/ExtractPDFPage';
import PDFToolsDeletePDFPage from '../pages/PDFTools/DeletePDFPage';
import PDFToolsReorderPDFPage from '../pages/PDFTools/ReorderPDFPage';
import PDFToolsRotatePDFPage from '../pages/PDFTools/RotatePDFPage';
import PDFToolsCropPDFPage from '../pages/PDFTools/CropPDFPage';
import PDFToolsInsertPDFPage from '../pages/PDFTools/InsertPDFPage';
import PDFToolsAddPageNumbersPage from '../pages/PDFTools/AddPageNumbersPage';
import PDFToolsAddHeaderFooterPage from '../pages/PDFTools/AddHeaderFooterPage';
import PDFToolsAddPasswordPage from '../pages/PDFTools/AddPasswordPage';
import PDFToolsRemovePasswordPage from '../pages/PDFTools/RemovePasswordPage';
import PDFToolsDigitalSignaturePage from '../pages/PDFTools/DigitalSignaturePage';
import PDFToolsSetPermissionsPage from '../pages/PDFTools/SetPermissions';
import PDFToolsRemoveMetadataPage from '../pages/PDFTools/RemoveMetadataPage';
import PDFToolsEditMetadataPage from '../pages/PDFTools/EditMetadataPage';
import SmartConversion from '../components/PDFService/SmartConversion';
import PDFToolsSpellCheckPage from '../pages/PDFTools/SpellCheckPage';
import PDFToolsFindReplacePage from '../pages/PDFTools/FindReplacePage';
import PDFToolsRedactContentPage from '../pages/PDFTools/RedactContentPage';
import PDFToolsAddStampsPage from '../pages/PDFTools/AddStampsPage';
import PDFToolsDBAddCommentsPage from '../pages/PDFTools/DBAddCommentsPage';
import PDFToolsSharedDocumentPage from '../pages/PDFTools/SharedDocumentPage';
import PDFToolsCompressPDFPage from '../pages/PDFTools/CompressPDFPage';
import PDFToolsOptimizeImagePage from '../pages/PDFTools/OptimizeImagePage';
import PDFToolsOptimizeFontPage from '../pages/PDFTools/OptimizeFontPage';
import PDFToolsRemoveUnusedObjectsPage from '../pages/PDFTools/RemoveUnusedObjectsPage';
import PDFToolsLinearizePDFPage from '../pages/PDFTools/LinearizePDFPage';
import PDFToolsColorOptimizationPage from '../pages/PDFTools/ColorOptimizationPage';
import PDFToolsQualityAnalysisPage from '../pages/PDFTools/QualityAnalysisPage';
import PDFToolsDocumentTrackingPage from '../pages/PDFTools/DocumentTrackingPage';
import PDFToolsBatchOptimizationPage from '../pages/PDFTools/BatchOptimizationPage';
import PDFToolsOCRPage from '../pages/PDFTools/OCRPage';
import PDFToolsMakeSearchablePage from '../pages/PDFTools/MakeSearchablePage';
import PDFToolsExtractTablesPage from '../pages/PDFTools/ExtractTablesPage';
import HandwritingRecognition from '../pages/PDFTools/HandwritingRecognitionPage';
import FillPdfFormPage from '../pages/PDFTools/FillPdfFormPage';
import FormRecognitionPage from '../pages/PDFTools/FormRecognitionPage';
import CalculateFieldsPage from '../pages/PDFTools/CalculateFieldsPage';
import PdfInfoPage from '../pages/PDFTools/PdfInfoPage';
import PdfValidatorPage from '../pages/PDFTools/PdfValidatorPage';
import PdfComparePage from '../pages/PDFTools/PdfComparePage';
import PdfRepairPage from '../pages/PDFTools/PdfRepairPage';
import PdfBookmarksPage from '../pages/PDFTools/PdfBookmarksPage';
import PdfStatisticsPage from '../pages/PDFTools/PdfStatisticsPage';
import SharedDocumentPage from '../pages/DocumentService/SharedDocumentPage';
import SharedDocument from '../pages/SharedDocument';
// import HowItWorksPage from '../pages/LandingPage/HowItWorks';
import StatusPage from '../pages/LandingPage/StatusPage';
import ContactSales from '../pages/LandingPage/ContactSales';
import BlogPage from '../pages/LandingPage/BlogPage';
import AboutPage from '../pages/LandingPage/AboutPage';
import WhyDocuSignerPage from '../pages/LandingPage/WhyDocuSignerPage';
import LoginPage from '../pages/LandingPage/LoginPage';
import SignupPage from '../pages/LandingPage/SignupPage';
import ForgotPasswordPage from '../pages/LandingPage/ForgotPasswordPage';
import ResetPasswordPage from '../pages/LandingPage/ResetPasswordPage';
import PrivacyPolicyPage from '../pages/LandingPage/PrivacyPolicyPage';
import CookiePolicyPage from '../pages/LandingPage/CookiePolicyPage';
import TermsOfServicePage from '../pages/LandingPage/TermsOfServicePage';
import UseCasesPage from '../pages/LandingPage/UseCasesPage';
import WorkspacePage from '../pages/LandingPage/WorkspacePage';
import FeatureComparisonPage from '../pages/LandingPage/FeatureComparisonPage';
import SitemapPage from '../pages/LandingPage/SitemapPage';
import ChoosePlanPage from '../pages/LandingPage/ChoosePlanPage';

// Dashboard Pages
import DashboardPage from '../pages/Dashboard/DashboardPage';
import AuditTrailPage from '../pages/Dashboard/AuditTrailPage';
import CreditsUsagePage from '../pages/Dashboard/CreditsUsagePage';
import CompliancePage from '../pages/Dashboard/CompliancePage';
import RiskManagementPage from '../pages/Dashboard/RiskManagementPage';
import { useDocumentStore } from '../components/common/store/documentStore';
import { EnhancedDocumentGrid } from '../components/DocumentService/documents/EnhancedDocumentGrid';
import { DocumentList } from '../components/DocumentService/documents/DocumentList';
import { EnhancedDocumentAnalytics } from '../components/DocumentService/analytics/EnhancedDocumentAnalytics';
import { DocumentLayout } from '../components/DocumentService/layout/DocumentLayout';
import { UploadModal } from '../components/DocumentService/modals/UploadModal';
import { CollaborationHub } from '../components/DocumentService/collaboration/CollaborationHub';

import { SharedDocumentsPage } from '../pages/DocumentService/SharedDocumentsPage';
import SharedPDFPage from '../pages/DocumentService/SharedPDFPage';
import FoldersPage from '../pages/DocumentService/FoldersPage';
import RecentPage from '../pages/DocumentService/RecentPage';
import FavoritesPage from '../pages/DocumentService/FavoritesPage';
import ArchivedPage from '../pages/DocumentService/ArchivedPage';
import TrashPage from '../pages/DocumentService/TrashPage';

// E-Signature Pages Started
import EsignDashboard from '../pages/eSign/Dashboard';
// import EsignEnvelopeCreator from '../pages/eSign/EnvelopeCreator';
// import EsignEnvelopeDetails from '../pages/eSign/EnvelopeDetails';
import EsignSigningPage from '../pages/eSign/SigningPage';
import EsignAnalytics from '../pages/eSign/Analytics';
import EsignSettings from '../pages/eSign/Settings';
import EsignEnterpriseSettings from '../pages/eSign/EnterpriseSettings';
import EsignESignatureAdmin from '../pages/eSign/ESignatureAdmin';
import { PowerFormEmbed } from '../pages/eSign/PowerFormEmbed';
// E-Signature Pages Ended

// Template Pages Started
// import { Navigation } from './components/Navigation';
import { Dashboard as TemplateDashboard } from '../pages/Template/Dashboard';
import { TemplateDesigner } from '../pages/Template/TemplateDesigner';
import { AdvancedTemplateDesigner } from '../pages/Template/AdvancedTemplateDesigner';
import { AITemplateStudio } from '../pages/Template/AITemplateStudio';
import { TemplateLibrary } from '../pages/Template/TemplateLibrary';
import { FormBuilder } from '../pages/Template/FormBuilder';
import { TemplateMarketplace } from '../pages/Template/TemplateMarketplace';
import { Analytics as TemplateAnylytics } from '../pages/Template/Analytics';
import { APIManagement } from '../pages/Template/APIManagement';
import { WorkflowAutomation } from '../pages/Template/WorkflowAutomation';
import { TemplateAdminDashboard } from '../pages/Template/TemplateAdminDashboard';
import { FormsList } from '../pages/Template/FormList';
import { FormView } from '../pages/Template/FormView';
import { FormEmbed } from '../pages/Template/FormEmbed';
import { FormSubmissions } from '../pages/Template/FormSubmissions';
import AITemplateGenerator from '../pages/Template/AITemplateGenerator';
import UserProfile from '../pages/Account/UserProfile';
// Template Pages Ended


//PDF Tools Started
import type { PDFTool, ProcessingStats } from '../types';
import { mockPDFTools, mockProcessingStats, getActiveMockTools } from '../data/pdfMockData';
import { toolCatalogService } from '../services/toolCatalogService';
import { adminServiceApi } from '../services/apiHelper';
import { ToolsGrid } from '../components/PDFService/ToolsGrid';
import { HelpSystem } from '../components/PDFService/HelpSystem';
import { CloudConnector } from '../components/PDFService/CloudConnector';
import { WorkflowDesigner } from '../components/PDFService/WorkflowDesigner';
import { Analytics } from '../components/PDFService/Analytics';
// import { PDFEditor } from '../components/PDFService/PDFEditor';
// import { PDFViewer } from '../components/PDFService/PDFViewer';
import { Header } from '../components/PDFService/Header';
import CostHeader from '../components/PDFService/CostHeader';
import { PdftoDoc } from '../pages/PDFTools/PDFtoDoc';
import { DoctoPdf } from '../pages/PDFTools/DoctoPdf';
import { PdfToExcel } from '../pages/PDFTools/PdftoExcel';
import { ExcelToPdf } from '../pages/PDFTools/ExceltoPdf';
import { PdftoPpt } from '../pages/PDFTools/PdftoPpt';
import { PptToPdf } from '../pages/PDFTools/PpttoPDF';
import { PdftoText } from '../pages/PDFTools/PdftoText';
import { TextToPdf } from '../pages/PDFTools/TextToPDF';
import { PdfToHtml } from '../pages/PDFTools/PdfToHtml';
import { HtmlToPdf } from '../pages/PDFTools/HtmltoPdf';
import { PdfToImage } from '../pages/PDFTools/PdftoImage';
import { ImageToPDF } from '../pages/PDFTools/ImageToPdf';
import { PdfToEpub } from '../pages/PDFTools/PdfToEpub';
import { BatchConversion } from '../pages/PDFTools/BatchConversion';
import AddWatermark from '../components/PDFService/AddWatermark';

// Api-service imports started 
import ApiServiceDashboard from '../pages/ApiService/Dashboard/main';
import ApiServiceAnalytics from '../pages/ApiService/Analytics/Main';
import ApiServiceProjects from '../pages/ApiService/Projects/Main';
import ApiServiceKey from '../pages/ApiService/Key/Main';
import ApiServiceExplorer from '../pages/ApiService/Explorer/ApiExplorer';
import ApiServiceDocumentation from '../pages/ApiService/Documentation/Main';
import ApiServiceWebhooks from '../pages/ApiService/Webhooks/Main';
import ApiServiceSDK from '../pages/ApiService/Sdk/main';
import ApiServiceTesting from '../pages/ApiService/Testing/Main';
import ApiServiceMarketPlace from '../pages/ApiService/MarketPlace/Main';
import ApiServiceCommunity from '../pages/ApiService/Community/Main';
import ApiServiceSupport from '../pages/ApiService/Support/Main';
import PublicSignerPage from '../pages/eSign/PublicSignerPage';
import CreatePdfFormPage from '../pages/PDFTools/CreatePdfFormPage';
import OAuthCallback from '../pages/OAuthCallback';
import { PdfEditorPage } from '../pages/PDFTools/PdfEditor';
import { PowerForm } from '../pages/eSign/PowerForm';
import AdvancedPDFEditor from '../components/PDFService/AdvancedPDFEditor';
import { AccessibilityPage, AIFeatures, AllInOnePlatformPage, APIDocumentationPage, BugBountyPage, DataResidencyPage, DocuSignerVsAdobeSignPage, DocuSignerVsDocuSignPage, DocuSignerVsHelloSignPage, DocuSignerVsPandaDocPage, UploadDocumentPage, SignerPage } from '../pages/LandingPage';
import SecurityOverviewPage from '../pages/LandingPage/SecurityOverviewPage';
import ESignServiceWebAppPage from '../pages/LandingPage/InsidePages/ESignServiceWebAppPage';
import AIPoweredFeaturesPage from '../pages/LandingPage/AIPoweredFeaturesPage';
import EnvelopeDetailPage from '../pages/eSign/EnvelopeDetailPage';
import EnvelopeCreator from '../pages/eSign/EnvelopeCreator';
import AgreementPage from '../pages/eSign/AgreementPage';
import EnvelopeTypes from '../pages/eSign/EnvelopeTypes';
import ManageRecipients from '../pages/eSign/ManageRecipients';
import EnvelopeGuideSupport from '../pages/eSign/EnvelopeGuideSupport';
import HelpSupportPage from '../pages/LandingPage/HelpSupportPage';
// import { elements } from 'chart.js';
import PowerFormCreate from '../pages/eSign/PowerFormCreate';
import SubscriptionManagementPage from '../pages/Account/SubscriptionManagementPage';
import InvoicePage from '../pages/Account/InvoicePage';
import ThankYouPage from '../pages/eSign/ThankYou';
import NotificationsPage from '../pages/Notifications/NotificationsPage';
import SignerCycle from '../pages/eSign/SignerCycle';
import CreateOrganizationPage from '../pages/Organization/CreateOrganizationPage';
import MyOrganizationPage from '../pages/Organization/MyOrganizationPage';
import OrganizationFolder from '../pages/Organization/organizationFolder';

import ClientsSection from '../components/LandingPage/clientSection';
import IndustriesSection from '../components/LandingPage/IndustriesSection';
import BookDemoPage from '../pages/LandingPage/BookDemoPage';

import EmailPage from '../pages/EmailService/EmailPage';
import InvitationPage from '../pages/Organization/invitaionPage';
import FolderDetailPage from '../pages/Organization/folderDetailPage';
import RolePage from '../pages/Organization/RolePage';
import AadhaarSignatureJourneySection from '../components/LandingPage/AadhaarSignatureJourneySection';
import ExploreServicesSection from '../components/LandingPage/ExploreServicesSection';
import ContractManagementSection from '../components/LandingPage/ContractManagementSection';
import DigitaCertificate from '../components/LandingPage/DigitaCertificate';

// Lightweight wrapper to show PDF header on individual tool pages
const PDFToolHeaderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className='bg-white p-2'>
      <CostHeader />
      <div>
        {children}
      </div>
    </div>
  );
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
  const [filteredMock, setFilteredMock] = useState<any>(mockPDFTools);
  const [catalogTools, setCatalogTools] = useState<Array<{ _id?: string; id: string; name: string; description?: string; category?: string; priority?: number; icon?: string; complexity?: 'easy' | 'medium' | 'advanced'; avgProcessingTime?: string; popularity?: number }>>([]);
  const [activeToolIds, setActiveToolIds] = useState<Set<string>>(new Set());
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
      } catch (e) {
        // On failure, show none to avoid exposing inactive tools
        setFilteredMock({} as any);
      }
      try {
        const tools = await toolCatalogService.listPublic();
        if (!mounted) return;
        setCatalogTools(Array.isArray(tools) ? tools : []);
      } catch { }
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
        const filteredTools = getFilteredTools();

        return (
          <div>
            <ToolsGrid
              key={`${selectedCategory}-${searchQuery}`}
              tools={filteredTools}
              onToolSelect={handleToolSelect}
              favoriteTools={favoriteTools}
              onToggleFavorite={toggleFavorite}
              recentTools={recentTools}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
            />
          </div>
        );
    }
  };

  return (
    <div className='bg-white p-2'>
      {isPro && (
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentView={currentView}
          onViewChange={setCurrentView}
          stats={processingStats}
        />
      )}
      {renderCurrentView()}
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
  const { isAuthenticated } = useAuth();
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

// Guest Routes (Public)
const guestRoutes = [
  { path: '/', element: <LandingPageLayout /> },
  { path: '/login', element: <GuestRoute><LoginPage /></GuestRoute> },
  { path: '/signup', element: <GuestRoute><SignupPage /></GuestRoute> },
  { path: '/forgot-password', element: <GuestRoute><ForgotPasswordPage /></GuestRoute> },
  { path: '/reset-password', element: <GuestRoute><ResetPasswordPage /></GuestRoute> },
  { path: '/privacy-policy', element: <PrivacyPolicyPage /> },
  { path: '/cookie-policy', element: <CookiePolicyPage /> },
  { path: '/use-cases', element: <UseCasesPage /> },
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
  { path: '/notifications', element: <NotificationsPage /> },
  { path: '/account/email-configuration', element: <EmailPage/>},
  // API-service routes
  { path: '/api-service/dashboard', element: <ApiServiceDashboard /> },
  { path: '/api-service/analytics', element: <ApiServiceAnalytics /> },
  { path: '/api-service/projects', element: <ApiServiceProjects /> },
  { path: '/api-service/keys', element: <ApiServiceKey /> },
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
          { path: '/e-sign/edit/:envelopeId', element: <EnvelopeCreator /> },
          { path: '/e-sign/guide', element: <EnvelopeGuideSupport /> },
          { path: '/e-sign/form-builder/:id', element: <FormBuilder /> },


        ],
      },
      {
        // Public Signer Routes
        element: <PublicSignerLayout />,
        children: [
          { path: 'e-sign/signer/:id/:recipientId/:cycleId?', element: <PublicSignerPage /> },
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
    ]
  }
]);
export default router;
