import React, { useEffect, useState } from 'react';
import { createBrowserRouter, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthService/AuthContext';

// Layouts
import DashboardLayout from '../layouts/DashboardLayout';
import GuestLayout from '../layouts/GuestLayout';
import PublicSignerLayout from '../layouts/PublicSignerLayout';
import SharedDocumentLayout from '../layouts/SharedDocumentLayout';
// Admin imports
import { AdminAuthProvider } from '../admin/auth';
import AdminRoutes from '../admin/AdminRoutes';

// Landing Page Components
import Hero from '../components/LandingPage/Hero';
import ModernDocumentFeatures from '../components/LandingPage/ModernDocumentFeatures';
import ComprehensivePlatform from '../components/LandingPage/ComprehensivePlatform';
import PDFTools from '../components/LandingPage/PDFTools';
import ESignature from '../components/LandingPage/ESignature';
import LegalTemplates from '../components/LandingPage/LegalTemplates';
import APISection from '../components/LandingPage/APISection';
import Compliance from '../components/LandingPage/Compliance';
import Pricing from '../components/LandingPage/Pricing';
import FeatureComparison from '../components/LandingPage/FeatureComparison';
import AIFeatures from '../components/LandingPage/AIFeatures';
import Testimonials from '../components/LandingPage/Testimonials';
import FAQ from '../components/LandingPage/FAQ';
import CTASection from '../components/LandingPage/CTASection';

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
// import SecurityOverviewPage from '../pages/LandingPage/SecurityOverview';
import StatusPage from '../pages/LandingPage/StatusPage';
import WhyDocuSignerPage from '../pages/LandingPage/WhyDocuSignerPage';
import AccessibilityPage from '../pages/LandingPage/AccessibilityPage';
import LoginPage from '../pages/LandingPage/LoginPage';
import SignupPage from '../pages/LandingPage/SignupPage';
import PrivacyPolicyPage from '../pages/LandingPage/PrivacyPolicyPage';
import TermsOfServicePage from '../pages/LandingPage/TermsOfServicePage';

// Dashboard Pages
import DashboardPage from '../pages/Dashboard/DashboardPage';
import AuditTrailPage from '../pages/Dashboard/AuditTrailPage';
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
import EsignEnvelopeCreator from '../pages/eSign/EnvelopeCreator';
import EsignEnvelopeDetails from '../pages/eSign/EnvelopeDetails';
import EsignSigningPage from '../pages/eSign/SigningPage';
import EsignAnalytics from '../pages/eSign/Analytics';
import EsignSettings from '../pages/eSign/Settings';
import EsignEnterpriseSettings from '../pages/eSign/EnterpriseSettings';
import EsignESignatureAdmin from '../pages/eSign/ESignatureAdmin';
import {PowerFormEmbed} from '../pages/eSign/PowerFormEmbed';
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
// Template Pages Ended

//PDF Tools Started
import type { PDFTool, ProcessingStats } from '../types';
import { mockPDFTools, mockProcessingStats } from '../data/pdfMockData';
import { ToolsGrid } from '../components/PDFService/ToolsGrid';
import { HelpSystem } from '../components/PDFService/HelpSystem';
import { CloudConnector } from '../components/PDFService/CloudConnector';
import { WorkflowDesigner } from '../components/PDFService/WorkflowDesigner';
import { Analytics } from '../components/PDFService/Analytics';
// import { PDFEditor } from '../components/PDFService/PDFEditor';
// import { PDFViewer } from '../components/PDFService/PDFViewer';
import { Header } from '../components/PDFService/Header';
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
    let allTools: any[] = [];

    if (selectedCategory === 'all') {
      // @ts-ignore - TypeScript can't infer the complex union type correctly
      allTools = Object.values(mockPDFTools).flatMap(category => category.tools);
      // console.log('Getting all tools from all categories, total:', allTools.length);
    } else {
      const categoryData = mockPDFTools[selectedCategory as keyof typeof mockPDFTools];
      if (categoryData) {
        allTools = categoryData.tools;
        // console.log(`Getting tools from category '${selectedCategory}', found:`, allTools.length);
      } else {
        console.warn(`Category '${selectedCategory}' not found in mockPDFTools`);
        // console.log('Available categories:', Object.keys(mockPDFTools));
        allTools = [];
      }
    }

    if (searchQuery.trim()) {
      const searchFiltered = allTools.filter(tool =>
        tool.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.features?.some((feature: string) => feature.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      // console.log(`Search query '${searchQuery}' filtered tools from ${allTools.length} to ${searchFiltered.length}`);
      return searchFiltered;
    }

    // console.log(`Final filtered tools: Category=${selectedCategory}, Total tools=${allTools.length}`);
    return allTools;
  };

  const handleToolSelect = (tool: PDFTool) => {
    // console.log('Tool selected:', tool);
    // console.log('Navigating to:', `/pdf-tools/${tool.id}`);
    // setSelectedTool(tool);
    
    // Get current category from URL or tool's category
    const urlParams = new URLSearchParams(location.search);
    const currentCategory = urlParams.get('category') || tool.category;
    
    // Navigate with category parameter to maintain sidebar state
    const navigateUrl = currentCategory 
      ? `/pdf-tools/${tool.id}?category=${currentCategory}`
      : `/pdf-tools/${tool.id}`;
    
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
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentView={currentView}
        onViewChange={setCurrentView}
        stats={processingStats}
      />
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
// Landing Page Layout Component
const LandingPageLayout = () => (
  <div>
    <Hero />
    <ModernDocumentFeatures />
    <ComprehensivePlatform />
    <PDFTools />
    <ESignature />
    <LegalTemplates />
    <APISection />
    <Compliance />
    <Pricing />
    <FeatureComparison />
    <AIFeatures />
    <Testimonials />
    <FAQ />
    <CTASection />
  </div>
);

// Guest Routes (Public)
const guestRoutes = [
  { path: '/', element: <LandingPageLayout /> },
  { path: '/login', element: <GuestRoute><LoginPage /></GuestRoute> },
  { path: '/signup', element: <GuestRoute><SignupPage /></GuestRoute> },
  { path: '/privacy-policy', element: <PrivacyPolicyPage /> },
  { path: '/terms-of-service', element: <TermsOfServicePage /> },
  { path: '/status', element: <StatusPage /> },
  { path: '/oauth-callback', element: <OAuthCallback /> },
  
  // Public Shared Document Route (No Authentication Required)

  // PDF Tool Pages
  { path: '/pdf-to-word', element: <PdftoDoc /> },
  { path: '/merge-pdf', element: <PDFToolsMergePDFPage /> },
  { path: '/compress-pdf', element: <PDFToolsCompressPDFPage /> },
  { path: '/split-pdf', element: <PDFToolsSplitPDFPage /> },
  { path: '/pdf-to-excel', element: <PdfToExcel /> },
  { path: '/protect-pdf', element: <PDFToolsAddPasswordPage /> },
  { path: '/pdf-to-jpg', element: <PdfToImage /> },
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
  { path: '/why-docusigner', element: <WhyDocuSignerPage /> },
  { path: '/accessibility', element: <AccessibilityPage /> },
];

// Authenticated User Routes
const authRoutes = [
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/audit-trail', element: <AuditTrailPage /> },
  { path: '/compliance', element: <CompliancePage /> },
  { path: '/risk-management', element: <RiskManagementPage /> },

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
  { path: '/e-sign/create', element: <EsignEnvelopeCreator /> },
  { path: '/e-sign/edit/:envelopeId', element: <EsignEnvelopeCreator /> },
  { path: '/e-sign/envelope/:id', element: <EsignEnvelopeDetails /> },
  { path: '/e-sign/sign/:token', element: <EsignSigningPage /> },
  { path: '/e-sign/analytics', element: <EsignAnalytics /> },
  { path: '/e-sign/settings', element: <EsignSettings /> },
  { path: '/e-sign/enterprise', element: <EsignEnterpriseSettings /> },
  { path: '/e-sign/admin', element: <EsignESignatureAdmin /> },
  { path: '/e-sign/power-form-embed/:formId/:envelopeId', element: <PowerFormEmbed/>},

  // Template Routes
  { path: '/template/dashboard', element: <TemplateDashboard /> },
  { path: '/template/designer', element: <TemplateDesigner /> },
  { path: '/template/advance-designer', element: <AdvancedTemplateDesigner /> },
  { path: '/template/ai-studio', element: <AITemplateStudio /> },
  { path: '/template/library', element: <TemplateLibrary /> },
  { path: '/template/form-builder/:id', element: <FormBuilder /> },
  { path: '/template/marketplace', element: <TemplateMarketplace /> },
  { path: '/template/anylytics', element: <TemplateAnylytics /> },
  { path: '/template/api-management', element: <APIManagement /> },
  { path: '/template/automation', element: <WorkflowAutomation /> },
  { path: '/template/admin-dashboard', element: <TemplateAdminDashboard /> },
  { path: '/template/form-list', element: <FormsList/>},
  { path: '/template/form-embed/:id', element: <FormEmbed/>},
  { path: '/template/form-submissions/:id', element: <FormSubmissions/>},

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
  { path: '/pdf-tools/pdf-to-word', element: <PdftoDoc /> },
  { path: '/pdf-tools/word-to-pdf', element: <DoctoPdf /> },
  { path: '/pdf-tools/pdf-to-excel', element: <PdfToExcel /> },
  { path: '/pdf-tools/excel-to-pdf', element: <ExcelToPdf /> },
  { path: '/pdf-tools/pdf-to-powerpoint', element: <PdftoPpt /> },
  { path: '/pdf-tools/powerpoint-to-pdf', element: <PptToPdf /> },
  { path: '/pdf-tools/pdf-to-img', element: <PdfToImage /> },
  { path: '/pdf-tools/img-to-pdf', element: <ImageToPDF /> },
  { path: '/pdf-tools/pdf-to-text', element: <PdftoText /> },
  { path: '/pdf-tools/text-to-pdf', element: <TextToPdf /> },
  { path: '/pdf-tools/pdf-to-html', element: <PdfToHtml /> },
  { path: '/pdf-tools/html-to-pdf', element: <HtmlToPdf /> },
  { path: '/pdf-tools/pdf-to-epub', element: <PdfToEpub /> },
  { path: '/pdf-tools/batch-conversion', element: <BatchConversion /> },
  { path: '/pdf-tools/pdf-editor', element: <AdvancedPDFEditor /> },
  { path: '/pdf-tools/add-text', element: <AdvancedPDFEditor /> },
  { path: '/pdf-tools/add-images', element: <AdvancedPDFEditor /> },
  { path: '/pdf-tools/add-shapes', element: <AdvancedPDFEditor /> },
  { path: '/pdf-tools/highlight-text', element: <AdvancedPDFEditor /> },
  { path: '/pdf-tools/draw-annotations', element: <AdvancedPDFEditor /> },
  { path: '/pdf-tools/merge-pdf', element: <PDFToolsMergePDFPage /> },
  { path: '/pdf-tools/split-pdf', element: <PDFToolsSplitPDFPage /> },
  { path: '/pdf-tools/extract-pdf', element: <PDFToolsExtractPDFPage /> },
  { path: '/pdf-tools/delete-pdf', element: <PDFToolsDeletePDFPage /> },
  { path: '/pdf-tools/reorder-pdf', element: <PDFToolsReorderPDFPage /> },
  { path: '/pdf-tools/rotate-pdf', element: <PDFToolsRotatePDFPage /> },
  { path: '/pdf-tools/crop-pdf', element: <PDFToolsCropPDFPage /> },
  { path: '/pdf-tools/insert-pdf', element: <PDFToolsInsertPDFPage /> },
  { path: '/pdf-tools/add-page-numbers', element: <PDFToolsAddPageNumbersPage /> },
  { path: '/pdf-tools/add-header-footer', element: <PDFToolsAddHeaderFooterPage /> },
  { path: '/pdf-tools/add-password', element: <PDFToolsAddPasswordPage /> },
  { path: '/pdf-tools/remove-password', element: <PDFToolsRemovePasswordPage /> },
  { path: '/pdf-tools/digital-signature', element: <PDFToolsDigitalSignaturePage /> },
  { path: '/pdf-tools/set-permissions', element: <PDFToolsSetPermissionsPage /> },
  { path: '/pdf-tools/remove-metadata', element: <PDFToolsRemoveMetadataPage /> },
  { path: '/pdf-tools/edit-metadata', element: <PDFToolsEditMetadataPage /> },
  { path: '/pdf-tools/smart-conversion', element: <SmartConversion /> },
  { path: '/pdf-tools/spell-check', element: <PDFToolsSpellCheckPage /> },
  { path: '/pdf-tools/find-replace', element: <PDFToolsFindReplacePage /> },
  { path: '/pdf-tools/redact-content', element: <PDFToolsRedactContentPage /> },
  { path: '/pdf-tools/add-stamps', element: <PDFToolsAddStampsPage /> },
  { path: '/pdf-tools/add-comments', element: <PDFToolsDBAddCommentsPage /> },
  { path: '/pdf-comments/shared/:linkToken', element: <PDFToolsSharedDocumentPage /> },
  { path: '/pdf-tools/compress-pdf', element: <PDFToolsCompressPDFPage /> },
  { path: '/pdf-tools/optimize-image', element: <PDFToolsOptimizeImagePage /> },
  { path: '/pdf-tools/optimize-font', element: <PDFToolsOptimizeFontPage /> },
  { path: '/pdf-tools/remove-unused-objects', element: <PDFToolsRemoveUnusedObjectsPage /> },
  { path: '/pdf-tools/linearize-pdf', element: <PDFToolsLinearizePDFPage /> },
  { path: '/pdf-tools/color-optimization', element: <PDFToolsColorOptimizationPage /> },
  { path: '/pdf-tools/quality-analysis', element: <PDFToolsQualityAnalysisPage /> },
  { path: '/pdf-tools/document-tracking', element: <PDFToolsDocumentTrackingPage /> },
  { path: '/pdf-tools/batch-optimization', element: <PDFToolsBatchOptimizationPage /> },
  { path: '/pdf-tools/ocr', element: <PDFToolsOCRPage /> },
  { path: '/pdf-tools/make-searchable', element: <PDFToolsMakeSearchablePage /> },
  { path: '/pdf-tools/extract-tables', element: <PDFToolsExtractTablesPage /> },
  { path: '/pdf-tools/add-watermark', element: <AddWatermark /> },
  { path: '/pdf-tools/handwriting-recognition', element: <HandwritingRecognition /> },
  { path: '/pdf-tools/create-form', element: <CreatePdfFormPage /> },
  { path: '/pdf-tools/fill-form', element: <FillPdfFormPage /> },
  { path: '/pdf-tools/form-recognition', element: <FormRecognitionPage /> },
  { path: '/pdf-tools/calculate-fields', element: <CalculateFieldsPage /> },
  { path: '/pdf-tools/pdf-info', element: <PdfInfoPage /> },
  { path: '/pdf-tools/pdf-validator', element: <PdfValidatorPage /> },
  { path: '/pdf-tools/pdf-compare', element: <PdfComparePage /> },
  { path: '/pdf-tools/pdf-repair', element: <PdfRepairPage /> },
  { path: '/pdf-tools/pdf-bookmarks', element: <PdfBookmarksPage /> },
  { path: '/pdf-tools/pdf-statistics', element: <PdfStatisticsPage /> },
  { path: '/shared-document/:linkToken', element: <SharedDocumentPage /> },


];


const router = createBrowserRouter([
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
    // Admin Routes - handled by AdminRoutes component
    path: '/admin/*',
    element: <AdminAuthProvider><AdminRoutes /></AdminAuthProvider>,
  },
  {
    // Public Signer Routes
    element: <PublicSignerLayout />,
    children: [
      { path: 'e-sign/signer/:id/:recipientId/:cycleId?', element: <PublicSignerPage /> },
      { path: '/template/form-view/:id', element:<FormView/>},
      { path: '/e-sign/power-form/:formId/:envelopeId', element:<PowerForm/>}
    ],
  },
  {
    // Shared Document Routes (Clean layout without header/footer)
    element: <SharedDocumentLayout />,
    children: [
      { path: '/shared/:shareToken', element: <SharedDocument /> },
    ],
  },
]);
export default router;
