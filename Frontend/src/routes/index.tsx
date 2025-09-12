import React, { useEffect, useState } from 'react';
import { createBrowserRouter, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthService/AuthContext';

// Layouts
import DashboardLayout from '../layouts/DashboardLayout';
import GuestLayout from '../layouts/GuestLayout';
import PublicSignerLayout from '../layouts/PublicSignerLayout';
// import AdminLayout from '../layouts/AdminLayout';

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

// Landing Page Pages
import PDFToWordPage from '../pages/LandingPage/PDFToWordPage';
import MergePDFPage from '../pages/LandingPage/MergePDFPage';
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
import PDFToolsSpellCheckPage from '../pages/PDFTools/SpellCheckPage';
import PDFToolsFindReplacePage from '../pages/PDFTools/FindReplacePage';
import PDFToolsRedactContentPage from '../pages/PDFTools/RedactContentPage';
import PDFToolsAddStampsPage from '../pages/PDFTools/AddStampsPage';
import PDFToolsAddCommentsPage from '../pages/PDFTools/AddCommentsPage';
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
import CompressPDFPage from '../pages/LandingPage/CompressPDFPage';
import SplitPDFPage from '../pages/LandingPage/SplitPDFPage';
import PDFToExcelPage from '../pages/LandingPage/PDFToExcelPage';
import ProtectPDFPage from '../pages/LandingPage/ProtectPDFPage';
import EditPDFPage from '../pages/LandingPage/EditPDFPage';
import PDFToJPGPage from '../pages/LandingPage/PDFToJPGPage';
import RotatePDFPage from '../pages/LandingPage/RotatePDFPage';
import OCRPDFPage from '../pages/LandingPage/OCRPDFPage';
import PDFToPowerPointPage from '../pages/LandingPage/PDFToPowerPointPage';
import PDFToTextPage from '../pages/LandingPage/PDFToTextPage';
import WordToPDFPage from '../pages/LandingPage/WordToPDFPage';
import JPGToPDFPage from '../pages/LandingPage/JPGToPDFPage';
import UnlockPDFPage from '../pages/LandingPage/UnlockPDFPage';
import WatermarkPDFPage from '../pages/LandingPage/WatermarkPDFPage';
import ExtractPagesPage from '../pages/LandingPage/ExtractPagesPage';
import DeletePagesPage from '../pages/LandingPage/DeletePagesPage';
import CropPDFPage from '../pages/LandingPage/CropPDFPage';
import PageNumbersPage from '../pages/LandingPage/PageNumbersPage';
import HTMLToPDFPage from '../pages/LandingPage/HTMLToPDFPage';
import FlattenPDFPage from '../pages/LandingPage/FlattenPDFPage';
import DeskewPDFPage from '../pages/LandingPage/DeskewPDFPage';
import ExtractImagesPage from '../pages/LandingPage/ExtractImagesPage';
import GrayscalePDFPage from '../pages/LandingPage/GrayscalePDFPage';
import HeaderFooterPage from '../pages/LandingPage/HeaderFooterPage';
import NUpPage from '../pages/LandingPage/NUpPage';
import BatesNumberingPage from '../pages/LandingPage/BatesNumberingPage';
import CreateBookmarksPage from '../pages/LandingPage/CreateBookmarksPage';
import EditMetadataPage from '../pages/LandingPage/EditMetadataPage';
import PowerPointToPDFPage from '../pages/LandingPage/PowerPointToPDFPage';
import ExcelToPDFPage from '../pages/LandingPage/ExcelToPDFPage';
import TextToPDFPage from '../pages/LandingPage/TextToPDFPage';
import PNGToPDFPage from '../pages/LandingPage/PNGToPDFPage';
import OrganizePDFPage from '../pages/LandingPage/OrganizePDFPage';
import FillPDFFormsPage from '../pages/LandingPage/FillPDFFormsPage';
import RemoveAnnotationsPage from '../pages/LandingPage/RemoveAnnotationsPage';
import OptimizePDFPage from '../pages/LandingPage/OptimizePDFPage';
import RepairPDFPage from '../pages/LandingPage/RepairPDFPage';
import ResizePDFPage from '../pages/LandingPage/ResizePDFPage';
import DigitalSignaturePage from '../pages/LandingPage/DigitalSignaturePage';
import EnhancePDFPage from '../pages/LandingPage/EnhancePDFPage';
import CompressImagesPage from '../pages/LandingPage/CompressImagesPage';
import ValidatePDFPage from '../pages/LandingPage/ValidatePDFPage';
import PDFToPNGPage from '../pages/LandingPage/PDFToPNGPage';
import PDFToHTMLPage from '../pages/LandingPage/PDFToHTMLPage';
import RemoveMetadataPage from '../pages/LandingPage/RemoveMetadataPage';
import RedactPDFPage from '../pages/LandingPage/RedactPDFPage';
import PDFToPDFAPage from '../pages/LandingPage/PDFToPDFAPage';
import CompareDocumentsPage from '../pages/LandingPage/CompareDocumentsPage';
import CreateFormsPage from '../pages/LandingPage/CreateFormsPage';
import BookletCreatorPage from '../pages/LandingPage/BookletCreatorPage';
import PrintOptimizerPage from '../pages/LandingPage/PrintOptimizerPage';
import TableOfContentsPage from '../pages/LandingPage/TableOfContentsPage';
import AlternateAndMixPage from '../pages/LandingPage/AlternateAndMixPage';
import SplitByBookmarksPage from '../pages/LandingPage/SplitByBookmarksPage';
import SplitInHalfPage from '../pages/LandingPage/SplitInHalfPage';
import SplitBySizePage from '../pages/LandingPage/SplitBySizePage';
import SplitByTextPage from '../pages/LandingPage/SplitByTextPage';
import AnnotatePDFPage from '../pages/LandingPage/AnnotatePDFPage';
import AddPasswordPage from '../pages/LandingPage/AddPasswordPage';
import ConvertToPDFPage from '../pages/LandingPage/ConvertToPDFPage';
import ExtractTextPage from '../pages/LandingPage/ExtractTextPage';
import MergePDFFilesPage from '../pages/LandingPage/MergePDFFilesPage';
import ReorderPagesPage from '../pages/LandingPage/ReorderPagesPage';
import CompressImagesPDFPage from '../pages/LandingPage/CompressImagesPDFPage';
import AddCommentsPage from '../pages/LandingPage/AddCommentsPage';
import ConvertFromPDFPage from '../pages/LandingPage/ConvertFromPDFPage';
import HighlightTextPage from '../pages/LandingPage/HighlightTextPage';
import AddBackgroundPage from '../pages/LandingPage/AddBackgroundPage';
import NumberPagesPage from '../pages/LandingPage/NumberPagesPage';
import RemoveBackgroundPage from '../pages/LandingPage/RemoveBackgroundPage';
import AddSignaturePage from '../pages/LandingPage/AddSignaturePage';
import RemovePagesPage from '../pages/LandingPage/RemovePagesPage';
import ScanToPDFPage from '../pages/LandingPage/ScanToPDFPage';
import AddPageNumbersPage from '../pages/LandingPage/AddPageNumbersPage';
import AddWatermarkPage from '../pages/LandingPage/AddWatermarkPage';
import AddTextPage from '../pages/LandingPage/AddTextPage';
import EncryptPDFPage from '../pages/LandingPage/EncryptPDFPage';
import ExtractImagesAdvancedPage from '../pages/LandingPage/ExtractImagesAdvancedPage';
import FillFormsPage from '../pages/LandingPage/FillFormsPage';
import RecognizeTextPage from '../pages/LandingPage/RecognizeTextPage';
import AddHeaderFooterPage from '../pages/LandingPage/AddHeaderFooterPage';
import BatchProcessPDFPage from '../pages/LandingPage/BatchProcessPDFPage';
import CompressPDFAdvancedPage from '../pages/LandingPage/CompressPDFAdvancedPage';
import CompressPDFProPage from '../pages/LandingPage/CompressPDFProPage';
import ConvertToWordPage from '../pages/LandingPage/ConvertToWordPage';
import PDFToExcelAdvancedPage from '../pages/LandingPage/PDFToExcelAdvancedPage';
import PDFToImageAdvancedPage from '../pages/LandingPage/PDFToImageAdvancedPage';
import PDFToWordAdvancedPage from '../pages/LandingPage/PDFToWordAdvancedPage';
import PDFWatermarkRemoverPage from '../pages/LandingPage/PDFWatermarkRemoverPage';
import PDFAccessibilityCheckerPage from '../pages/LandingPage/PDFAccessibilityCheckerPage';
import PDFAnnotationRemoverPage from '../pages/LandingPage/PDFAnnotationRemoverPage';
import PDFDocumentScannerPage from '../pages/LandingPage/PDFDocumentScannerPage';
import PDFFormCreatorPage from '../pages/LandingPage/PDFFormCreatorPage';
import PDFMetadataEditorPage from '../pages/LandingPage/PDFMetadataEditorPage';
import PDFPageExtractorPage from '../pages/LandingPage/PDFPageExtractorPage';
import PDFPasswordRemoverPage from '../pages/LandingPage/PDFPasswordRemoverPage';
import PDFSecurityAuditPage from '../pages/LandingPage/PDFSecurityAuditPage';
import PDFSignatureVerifierPage from '../pages/LandingPage/PDFSignatureVerifierPage';
import AllInOnePlatformPage from '../pages/LandingPage/AllInOnePlatformPage';
import APIDocumentationPage from '../pages/LandingPage/APIDocumentationPage';
import BugBountyPage from '../pages/LandingPage/BugBountyPage';
import DataResidencyPage from '../pages/LandingPage/DataResidencyPage';
import DocuSignerVsAdobeSignPage from '../pages/LandingPage/DocuSignerVsAdobeSignPage';
import DocuSignerVsDocuSignPage from '../pages/LandingPage/DocuSignerVsDocuSignPage';
import DocuSignerVsHelloSignPage from '../pages/LandingPage/DocuSignerVsHelloSignPage';
import DocuSignerVsPandaDocPage from '../pages/LandingPage/DocuSignerVsPandaDocPage';
import ESignatureFeaturesPage from '../pages/LandingPage/ESignatureFeaturesPage';
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
  }, [location.search]); // Watch for location search changes

  // Monitor selectedCategory changes
  // useEffect(() => {
  //   console.log('selectedCategory state changed to:', selectedCategory);
  // }, [selectedCategory]);

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
    navigate(`/pdf-tools/${tool.id}`);

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
        // return <PDFEditor onBack={() => setCurrentView('tools')} />;
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


  // PDF Tool Pages
  { path: '/pdf-to-word', element: <PDFToWordPage /> },
  { path: '/merge-pdf', element: <MergePDFPage /> },
  { path: '/compress-pdf', element: <CompressPDFPage /> },
  { path: '/split-pdf', element: <SplitPDFPage /> },
  { path: '/pdf-to-excel', element: <PDFToExcelPage /> },
  { path: '/protect-pdf', element: <ProtectPDFPage /> },
  { path: '/edit-pdf', element: <EditPDFPage /> },
  { path: '/pdf-to-jpg', element: <PDFToJPGPage /> },
  { path: '/rotate-pdf', element: <RotatePDFPage /> },
  { path: '/ocr-pdf', element: <OCRPDFPage /> },
  { path: '/pdf-to-powerpoint', element: <PDFToPowerPointPage /> },
  { path: '/pdf-to-text', element: <PDFToTextPage /> },
  { path: '/word-to-pdf', element: <WordToPDFPage /> },
  { path: '/jpg-to-pdf', element: <JPGToPDFPage /> },
  { path: '/unlock-pdf', element: <UnlockPDFPage /> },
  { path: '/watermark-pdf', element: <WatermarkPDFPage /> },
  { path: '/extract-pages', element: <ExtractPagesPage /> },
  { path: '/delete-pages', element: <DeletePagesPage /> },
  { path: '/crop-pdf', element: <CropPDFPage /> },
  { path: '/page-numbers', element: <PageNumbersPage /> },
  { path: '/html-to-pdf', element: <HTMLToPDFPage /> },
  { path: '/flatten-pdf', element: <FlattenPDFPage /> },
  { path: '/deskew-pdf', element: <DeskewPDFPage /> },
  { path: '/extract-images', element: <ExtractImagesPage /> },
  { path: '/grayscale-pdf', element: <GrayscalePDFPage /> },
  { path: '/header-footer', element: <HeaderFooterPage /> },
  { path: '/n-up', element: <NUpPage /> },
  { path: '/bates-numbering', element: <BatesNumberingPage /> },
  { path: '/create-bookmarks', element: <CreateBookmarksPage /> },
  { path: '/edit-metadata', element: <EditMetadataPage /> },
  { path: '/powerpoint-to-pdf', element: <PowerPointToPDFPage /> },
  { path: '/excel-to-pdf', element: <ExcelToPDFPage /> },
  { path: '/text-to-pdf', element: <TextToPDFPage /> },
  { path: '/png-to-pdf', element: <PNGToPDFPage /> },
  { path: '/organize-pdf', element: <OrganizePDFPage /> },
  { path: '/fill-pdf-forms', element: <FillPDFFormsPage /> },
  { path: '/remove-annotations', element: <RemoveAnnotationsPage /> },
  { path: '/optimize-pdf', element: <OptimizePDFPage /> },
  { path: '/repair-pdf', element: <RepairPDFPage /> },
  { path: '/resize-pdf', element: <ResizePDFPage /> },
  { path: '/digital-signature', element: <DigitalSignaturePage /> },
  { path: '/enhance-pdf', element: <EnhancePDFPage /> },
  { path: '/compress-images', element: <CompressImagesPage /> },
  { path: '/validate-pdf', element: <ValidatePDFPage /> },
  { path: '/pdf-to-png', element: <PDFToPNGPage /> },
  { path: '/pdf-to-html', element: <PDFToHTMLPage /> },
  { path: '/remove-metadata', element: <RemoveMetadataPage /> },
  { path: '/redact-pdf', element: <RedactPDFPage /> },
  { path: '/pdf-to-pdfa', element: <PDFToPDFAPage /> },
  { path: '/compare-documents', element: <CompareDocumentsPage /> },
  { path: '/create-forms', element: <CreateFormsPage /> },
  { path: '/booklet-creator', element: <BookletCreatorPage /> },
  { path: '/print-optimizer', element: <PrintOptimizerPage /> },
  { path: '/table-of-contents', element: <TableOfContentsPage /> },
  { path: '/alternate-and-mix', element: <AlternateAndMixPage /> },
  { path: '/split-by-bookmarks', element: <SplitByBookmarksPage /> },
  { path: '/split-in-half', element: <SplitInHalfPage /> },
  { path: '/split-by-size', element: <SplitBySizePage /> },
  { path: '/split-by-text', element: <SplitByTextPage /> },
  { path: '/annotate-pdf', element: <AnnotatePDFPage /> },
  { path: '/add-password', element: <AddPasswordPage /> },
  { path: '/convert-to-pdf', element: <ConvertToPDFPage /> },
  { path: '/extract-text', element: <ExtractTextPage /> },
  { path: '/merge-pdf-files', element: <MergePDFFilesPage /> },
  { path: '/reorder-pages', element: <ReorderPagesPage /> },
  { path: '/compress-images-pdf', element: <CompressImagesPDFPage /> },
  { path: '/add-comments', element: <AddCommentsPage /> },
  { path: '/convert-from-pdf', element: <ConvertFromPDFPage /> },
  { path: '/highlight-text', element: <HighlightTextPage /> },
  { path: '/add-background', element: <AddBackgroundPage /> },
  { path: '/number-pages', element: <NumberPagesPage /> },
  { path: '/remove-background', element: <RemoveBackgroundPage /> },
  { path: '/add-signature', element: <AddSignaturePage /> },
  { path: '/remove-pages', element: <RemovePagesPage /> },
  { path: '/scan-to-pdf', element: <ScanToPDFPage /> },
  { path: '/add-page-numbers', element: <AddPageNumbersPage /> },
  { path: '/add-watermark', element: <AddWatermarkPage /> },
  { path: '/add-text', element: <AddTextPage /> },
  { path: '/encrypt-pdf', element: <EncryptPDFPage /> },
  { path: '/extract-images-advanced', element: <ExtractImagesAdvancedPage /> },
  { path: '/fill-forms', element: <FillFormsPage /> },
  { path: '/recognize-text', element: <RecognizeTextPage /> },
  { path: '/add-header-footer', element: <AddHeaderFooterPage /> },
  { path: '/batch-process-pdf', element: <BatchProcessPDFPage /> },
  { path: '/compress-pdf-advanced', element: <CompressPDFAdvancedPage /> },
  { path: '/compress-pdf-pro', element: <CompressPDFProPage /> },
  { path: '/convert-to-word', element: <ConvertToWordPage /> },
  { path: '/pdf-to-excel-advanced', element: <PDFToExcelAdvancedPage /> },
  { path: '/pdf-to-image-advanced', element: <PDFToImageAdvancedPage /> },
  { path: '/pdf-to-word-advanced', element: <PDFToWordAdvancedPage /> },
  { path: '/pdf-watermark-remover', element: <PDFWatermarkRemoverPage /> },
  { path: '/pdf-accessibility-checker', element: <PDFAccessibilityCheckerPage /> },
  { path: '/pdf-annotation-remover', element: <PDFAnnotationRemoverPage /> },
  { path: '/pdf-document-scanner', element: <PDFDocumentScannerPage /> },
  { path: '/pdf-form-creator', element: <PDFFormCreatorPage /> },
  { path: '/pdf-metadata-editor', element: <PDFMetadataEditorPage /> },
  { path: '/pdf-page-extractor', element: <PDFPageExtractorPage /> },
  { path: '/pdf-password-remover', element: <PDFPasswordRemoverPage /> },
  { path: '/pdf-security-audit', element: <PDFSecurityAuditPage /> },
  { path: '/pdf-signature-verifier', element: <PDFSignatureVerifierPage /> },
  { path: '/all-in-one-platform', element: <AllInOnePlatformPage /> },
  { path: '/api-documentation', element: <APIDocumentationPage /> },
  { path: '/bug-bounty', element: <BugBountyPage /> },
  { path: '/data-residency', element: <DataResidencyPage /> },
  { path: '/docusigner-vs-adobe-sign', element: <DocuSignerVsAdobeSignPage /> },
  { path: '/docusigner-vs-docusign', element: <DocuSignerVsDocuSignPage /> },
  { path: '/docusigner-vs-hellosign', element: <DocuSignerVsHelloSignPage /> },
  { path: '/docusigner-vs-pandadoc', element: <DocuSignerVsPandaDocPage /> },
  { path: '/esignature-features', element: <ESignatureFeaturesPage /> },
  //   <Route path="/" element={<Dashboard />} />
  // <Route path="/create" element={<EnvelopeCreator />} />
  // <Route path="/envelope/:id" element={<EnvelopeDetails />} />
  // <Route path="/sign/:token" element={<SigningPage />} />
  // <Route path="/analytics" element={<Analytics />} />
  // <Route path="/settings" element={<Settings />} />
  // <Route path="/enterprise" element={<EnterpriseSettings />} />
  // <Route path="/admin" element={<ESignatureAdmin />} />
  // { path: '/how-it-works', element: <HowItWorksPage /> },
  // { path: '/security-overview', element: <SecurityOverviewPage /> },
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
  { path: '/e-sign/envelope/:id', element: <EsignEnvelopeDetails /> },
  { path: '/e-sign/sign/:token', element: <EsignSigningPage /> },
  { path: '/e-sign/analytics', element: <EsignAnalytics /> },
  { path: '/e-sign/settings', element: <EsignSettings /> },
  { path: '/e-sign/enterprise', element: <EsignEnterpriseSettings /> },
  { path: '/e-sign/admin', element: <EsignESignatureAdmin /> },

  // Template Routes
  { path: '/template/dashboard', element: <TemplateDashboard /> },
  { path: '/template/designer', element: <TemplateDesigner /> },
  { path: '/template/advance-designer', element: <AdvancedTemplateDesigner /> },
  { path: '/template/ai-studio', element: <AITemplateStudio /> },
  { path: '/template/library', element: <TemplateLibrary /> },
  { path: '/template/form-builder', element: <FormBuilder /> },
  { path: '/template/marketplace', element: <TemplateMarketplace /> },
  { path: '/template/anylytics', element: <TemplateAnylytics /> },
  { path: '/template/api-management', element: <APIManagement /> },
  { path: '/template/automation', element: <WorkflowAutomation /> },
  { path: '/template/admin-dashboard', element: <TemplateAdminDashboard /> },

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
  { path: '/pdf-tools/spell-check', element: <PDFToolsSpellCheckPage /> },
  { path: '/pdf-tools/find-replace', element: <PDFToolsFindReplacePage /> },
  { path: '/pdf-tools/redact-content', element: <PDFToolsRedactContentPage /> },
  { path: '/pdf-tools/add-stamps', element: <PDFToolsAddStampsPage /> },
  { path: '/pdf-tools/add-comments-db', element: <PDFToolsAddCommentsPage /> },
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
    // Public Signer Routes
    element: <PublicSignerLayout />,
    children: [
      { path: 'e-sign/signer/:id/:recipientId', element: <PublicSignerPage /> },
    ],
  },
]);

export default router;
