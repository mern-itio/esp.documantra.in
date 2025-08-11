
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/LandingPage/Header'
import { AuthProvider } from './components/AuthService/AuthContext'
import Hero from './components/LandingPage/Hero'
import ModernDocumentFeatures from './components/LandingPage/ModernDocumentFeatures'
import ComprehensivePlatform from './components/LandingPage/ComprehensivePlatform'
import PDFTools from './components/LandingPage/PDFTools'
import ESignature from './components/LandingPage/ESignature'
import LegalTemplates from './components/LandingPage/LegalTemplates'
import APISection from './components/LandingPage/APISection'
import Compliance from './components/LandingPage/Compliance'
import Pricing from './components/LandingPage/Pricing'
import FeatureComparison from './components/LandingPage/FeatureComparison'
import AIFeatures from './components/LandingPage/AIFeatures'
import Testimonials from './components/LandingPage/Testimonials'
import FAQ from './components/LandingPage/FAQ'
import CTASection from './components/LandingPage/CTASection'
import PDFToWordPage from './pages/LandingPage/PDFToWordPage'
import MergePDFPage from './pages/LandingPage/MergePDFPage'
import CompressPDFPage from './pages/LandingPage/CompressPDFPage'
import SplitPDFPage from './pages/LandingPage/SplitPDFPage'
import PDFToExcelPage from './pages/LandingPage/PDFToExcelPage'
import ProtectPDFPage from './pages/LandingPage/ProtectPDFPage'
import EditPDFPage from './pages/LandingPage/EditPDFPage'
import PDFToJPGPage from './pages/LandingPage/PDFToJPGPage'
import RotatePDFPage from './pages/LandingPage/RotatePDFPage'
import OCRPDFPage from './pages/LandingPage/OCRPDFPage'
import PDFToPowerPointPage from './pages/LandingPage/PDFToPowerPointPage'
import PDFToTextPage from './pages/LandingPage/PDFToTextPage'
import WordToPDFPage from './pages/LandingPage/WordToPDFPage'
import JPGToPDFPage from './pages/LandingPage/JPGToPDFPage'
import UnlockPDFPage from './pages/LandingPage/UnlockPDFPage'
import WatermarkPDFPage from './pages/LandingPage/WatermarkPDFPage'
import ExtractPagesPage from './pages/LandingPage/ExtractPagesPage'
import DeletePagesPage from './pages/LandingPage/DeletePagesPage'
import CropPDFPage from './pages/LandingPage/CropPDFPage'
import PageNumbersPage from './pages/LandingPage/PageNumbersPage'
import HTMLToPDFPage from './pages/LandingPage/HTMLToPDFPage'
import FlattenPDFPage from './pages/LandingPage/FlattenPDFPage'
import DeskewPDFPage from './pages/LandingPage/DeskewPDFPage'
import ExtractImagesPage from './pages/LandingPage/ExtractImagesPage'
import GrayscalePDFPage from './pages/LandingPage/GrayscalePDFPage'
import HeaderFooterPage from './pages/LandingPage/HeaderFooterPage'
import NUpPage from './pages/LandingPage/NUpPage'
import BatesNumberingPage from './pages/LandingPage/BatesNumberingPage'
import CreateBookmarksPage from './pages/LandingPage/CreateBookmarksPage'
import EditMetadataPage from './pages/LandingPage/EditMetadataPage'
import PowerPointToPDFPage from './pages/LandingPage/PowerPointToPDFPage'
import ExcelToPDFPage from './pages/LandingPage/ExcelToPDFPage'
import TextToPDFPage from './pages/LandingPage/TextToPDFPage'
import PNGToPDFPage from './pages/LandingPage/PNGToPDFPage'
import OrganizePDFPage from './pages/LandingPage/OrganizePDFPage'
import FillPDFFormsPage from './pages/LandingPage/FillPDFFormsPage'
import RemoveAnnotationsPage from './pages/LandingPage/RemoveAnnotationsPage'
import OptimizePDFPage from './pages/LandingPage/OptimizePDFPage'
import RepairPDFPage from './pages/LandingPage/RepairPDFPage'
import ResizePDFPage from './pages/LandingPage/ResizePDFPage'
import DigitalSignaturePage from './pages/LandingPage/DigitalSignaturePage'
import EnhancePDFPage from './pages/LandingPage/EnhancePDFPage'
import CompressImagesPage from './pages/LandingPage/CompressImagesPage'
import ValidatePDFPage from './pages/LandingPage/ValidatePDFPage'
import PDFToPNGPage from './pages/LandingPage/PDFToPNGPage'
import PDFToHTMLPage from './pages/LandingPage/PDFToHTMLPage'
import RemoveMetadataPage from './pages/LandingPage/RemoveMetadataPage'
import RedactPDFPage from './pages/LandingPage/RedactPDFPage'
import PDFToPDFAPage from './pages/LandingPage/PDFToPDFAPage'
import CompareDocumentsPage from './pages/LandingPage/CompareDocumentsPage'
import CreateFormsPage from './pages/LandingPage/CreateFormsPage'
import BookletCreatorPage from './pages/LandingPage/BookletCreatorPage'
import PrintOptimizerPage from './pages/LandingPage/PrintOptimizerPage'
import TableOfContentsPage from './pages/LandingPage/TableOfContentsPage'
import AlternateAndMixPage from './pages/LandingPage/AlternateAndMixPage'
import SplitByBookmarksPage from './pages/LandingPage/SplitByBookmarksPage'
import SplitInHalfPage from './pages/LandingPage/SplitInHalfPage'
import SplitBySizePage from './pages/LandingPage/SplitBySizePage'
import SplitByTextPage from './pages/LandingPage/SplitByTextPage'
import AnnotatePDFPage from './pages/LandingPage/AnnotatePDFPage'
import AddPasswordPage from './pages/LandingPage/AddPasswordPage'
import ConvertToPDFPage from './pages/LandingPage/ConvertToPDFPage'
import ExtractTextPage from './pages/LandingPage/ExtractTextPage'
import MergePDFFilesPage from './pages/LandingPage/MergePDFFilesPage'
import ReorderPagesPage from './pages/LandingPage/ReorderPagesPage'
import CompressImagesPDFPage from './pages/LandingPage/CompressImagesPDFPage'
import AddCommentsPage from './pages/LandingPage/AddCommentsPage'
import ConvertFromPDFPage from './pages/LandingPage/ConvertFromPDFPage'
import HighlightTextPage from './pages/LandingPage/HighlightTextPage'
import AddBackgroundPage from './pages/LandingPage/AddBackgroundPage'
import NumberPagesPage from './pages/LandingPage/NumberPagesPage'
import RemoveBackgroundPage from './pages/LandingPage/RemoveBackgroundPage'
import AddSignaturePage from './pages/LandingPage/AddSignaturePage'
import RemovePagesPage from './pages/LandingPage/RemovePagesPage'
import ScanToPDFPage from './pages/LandingPage/ScanToPDFPage'
import AddPageNumbersPage from './pages/LandingPage/AddPageNumbersPage'
import AddWatermarkPage from './pages/LandingPage/AddWatermarkPage'
import AddTextPage from './pages/LandingPage/AddTextPage'
import EncryptPDFPage from './pages/LandingPage/EncryptPDFPage'
import ExtractImagesAdvancedPage from './pages/LandingPage/ExtractImagesAdvancedPage'
import FillFormsPage from './pages/LandingPage/FillFormsPage'
import RecognizeTextPage from './pages/LandingPage/RecognizeTextPage'
import CompressPDFProPage from './pages/LandingPage/CompressPDFProPage'
import PDFAnnotationRemoverPage from './pages/LandingPage/PDFAnnotationRemoverPage'
import PDFPageExtractorPage from './pages/LandingPage/PDFPageExtractorPage'
import PDFFormCreatorPage from './pages/LandingPage/PDFFormCreatorPage'
import PDFPasswordRemoverPage from './pages/LandingPage/PDFPasswordRemoverPage'
import PDFWatermarkRemoverPage from './pages/LandingPage/PDFWatermarkRemoverPage'
import PDFDocumentScannerPage from './pages/LandingPage/PDFDocumentScannerPage'
import PDFSignatureVerifierPage from './pages/LandingPage/PDFSignatureVerifierPage'
import LoginPage from './pages/LandingPage/LoginPage'
import SignupPage from './pages/LandingPage/SignupPage'
import TermsOfServicePage from './pages/LandingPage/TermsOfServicePage'
import DocuSignerVsHelloSignPage from './pages/LandingPage/DocuSignerVsHelloSignPage'
import DocuSignerVsDocuSignPage from './pages/LandingPage/DocuSignerVsDocuSignPage'
import DocuSignerVsAdobeSignPage from './pages/LandingPage/DocuSignerVsAdobeSignPage'
import DocuSignerVsPandaDocPage from './pages/LandingPage/DocuSignerVsPandaDocPage'
import SecurityOverviewPage from './pages/LandingPage/SecurityOverviewPage'
import AccessibilityPage from './pages/LandingPage/AccessibilityPage'
import DataResidencyPage from './pages/LandingPage/DataResidencyPage'
import StatusPage from './pages/LandingPage/StatusPage'
import BugBountyPage from './pages/LandingPage/BugBountyPage'
import WhyDocuSignerPage from './pages/LandingPage/WhyDocuSignerPage'
import AllInOnePlatformPage from './pages/LandingPage/AllInOnePlatformPage'
import APIDocumentationPage from './pages/LandingPage/APIDocumentationPage'
import AIPoweredFeaturesPage from './pages/LandingPage/AIPoweredFeaturesPage'
import DashboardPage from './pages/LandingPage/DashboardPage'
import Footer from './components/LandingPage/Footer'

function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
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
      <Footer />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* Original PDF Tool Routes */}
          <Route path="/pdf-to-word" element={<PDFToWordPage />} />
          <Route path="/merge-pdf" element={<MergePDFPage />} />
          <Route path="/compress-pdf" element={<CompressPDFPage />} />
          <Route path="/split-pdf" element={<SplitPDFPage />} />
          <Route path="/pdf-to-excel" element={<PDFToExcelPage />} />
          <Route path="/protect-pdf" element={<ProtectPDFPage />} />
          <Route path="/edit-pdf" element={<EditPDFPage />} />
          <Route path="/pdf-to-jpg" element={<PDFToJPGPage />} />
          <Route path="/rotate-pdf" element={<RotatePDFPage />} />
          <Route path="/ocr-pdf" element={<OCRPDFPage />} />

          {/* Second Batch PDF Tool Routes */}
          <Route path="/pdf-to-powerpoint" element={<PDFToPowerPointPage />} />
          <Route path="/pdf-to-text" element={<PDFToTextPage />} />
          <Route path="/word-to-pdf" element={<WordToPDFPage />} />
          <Route path="/jpg-to-pdf" element={<JPGToPDFPage />} />
          <Route path="/unlock-pdf" element={<UnlockPDFPage />} />
          <Route path="/watermark-pdf" element={<WatermarkPDFPage />} />
          <Route path="/extract-pages" element={<ExtractPagesPage />} />
          <Route path="/delete-pages" element={<DeletePagesPage />} />
          <Route path="/crop-pdf" element={<CropPDFPage />} />
          <Route path="/page-numbers" element={<PageNumbersPage />} />

          {/* Third Batch PDF Tool Routes */}
          <Route path="/html-to-pdf" element={<HTMLToPDFPage />} />
          <Route path="/flatten-pdf" element={<FlattenPDFPage />} />
          <Route path="/deskew-pdf" element={<DeskewPDFPage />} />
          <Route path="/extract-images" element={<ExtractImagesPage />} />
          <Route path="/grayscale-pdf" element={<GrayscalePDFPage />} />
          <Route path="/header-footer" element={<HeaderFooterPage />} />
          <Route path="/n-up" element={<NUpPage />} />
          <Route path="/bates-numbering" element={<BatesNumberingPage />} />
          <Route path="/create-bookmarks" element={<CreateBookmarksPage />} />
          <Route path="/edit-metadata" element={<EditMetadataPage />} />

          {/* Fourth Batch PDF Tool Routes */}
          <Route path="/powerpoint-to-pdf" element={<PowerPointToPDFPage />} />
          <Route path="/excel-to-pdf" element={<ExcelToPDFPage />} />
          <Route path="/text-to-pdf" element={<TextToPDFPage />} />
          <Route path="/png-to-pdf" element={<PNGToPDFPage />} />
          <Route path="/organize-pdf" element={<OrganizePDFPage />} />
          <Route path="/fill-pdf-forms" element={<FillPDFFormsPage />} />
          <Route path="/remove-annotations" element={<RemoveAnnotationsPage />} />
          <Route path="/optimize-pdf" element={<OptimizePDFPage />} />
          <Route path="/repair-pdf" element={<RepairPDFPage />} />

          {/* Fifth Batch PDF Tool Routes */}
          <Route path="/resize-pdf" element={<ResizePDFPage />} />
          <Route path="/digital-signature" element={<DigitalSignaturePage />} />
          <Route path="/enhance-pdf" element={<EnhancePDFPage />} />
          <Route path="/compress-images" element={<CompressImagesPage />} />
          <Route path="/validate-pdf" element={<ValidatePDFPage />} />
          <Route path="/pdf-to-png" element={<PDFToPNGPage />} />
          <Route path="/pdf-to-html" element={<PDFToHTMLPage />} />
          <Route path="/remove-metadata" element={<RemoveMetadataPage />} />
          <Route path="/redact-pdf" element={<RedactPDFPage />} />
          <Route path="/pdf-to-pdfa" element={<PDFToPDFAPage />} />

          {/* Sixth Batch PDF Tool Routes */}
          <Route path="/compare-documents" element={<CompareDocumentsPage />} />
          <Route path="/create-forms" element={<CreateFormsPage />} />
          <Route path="/booklet-creator" element={<BookletCreatorPage />} />
          <Route path="/print-optimizer" element={<PrintOptimizerPage />} />
          <Route path="/table-of-contents" element={<TableOfContentsPage />} />
          <Route path="/alternate-mix" element={<AlternateAndMixPage />} />
          <Route path="/split-bookmarks" element={<SplitByBookmarksPage />} />
          <Route path="/split-half" element={<SplitInHalfPage />} />
          <Route path="/split-size" element={<SplitBySizePage />} />
          <Route path="/split-text" element={<SplitByTextPage />} />

          {/* New PDF Tool Routes */}
          <Route path="/annotate-pdf" element={<AnnotatePDFPage />} />
          <Route path="/add-password" element={<AddPasswordPage />} />
          <Route path="/convert-to-pdf" element={<ConvertToPDFPage />} />
          <Route path="/extract-text" element={<ExtractTextPage />} />
          <Route path="/merge-pdf-files" element={<MergePDFFilesPage />} />
          <Route path="/reorder-pages" element={<ReorderPagesPage />} />
          <Route path="/compress-images-pdf" element={<CompressImagesPDFPage />} />
          <Route path="/add-comments" element={<AddCommentsPage />} />
          <Route path="/convert-from-pdf" element={<ConvertFromPDFPage />} />
          <Route path="/highlight-text" element={<HighlightTextPage />} />
          <Route path="/add-background" element={<AddBackgroundPage />} />
          <Route path="/number-pages" element={<NumberPagesPage />} />
          <Route path="/remove-background" element={<RemoveBackgroundPage />} />
          <Route path="/add-signature" element={<AddSignaturePage />} />
          <Route path="/remove-pages" element={<RemovePagesPage />} />
          <Route path="/scan-to-pdf" element={<ScanToPDFPage />} />
          <Route path="/add-page-numbers" element={<AddPageNumbersPage />} />
          <Route path="/add-watermark" element={<AddWatermarkPage />} />
          <Route path="/add-text" element={<AddTextPage />} />
          <Route path="/encrypt-pdf" element={<EncryptPDFPage />} />
          <Route path="/extract-images-advanced" element={<ExtractImagesAdvancedPage />} />
          <Route path="/fill-forms" element={<FillFormsPage />} />
          <Route path="/recognize-text" element={<RecognizeTextPage />} />
          <Route path="/compress-pdf-pro" element={<CompressPDFProPage />} />
          <Route path="/pdf-annotation-remover" element={<PDFAnnotationRemoverPage />} />
          <Route path="/pdf-page-extractor" element={<PDFPageExtractorPage />} />
          <Route path="/pdf-form-creator" element={<PDFFormCreatorPage />} />
          <Route path="/pdf-password-remover" element={<PDFPasswordRemoverPage />} />
          <Route path="/pdf-watermark-remover" element={<PDFWatermarkRemoverPage />} />
          <Route path="/pdf-document-scanner" element={<PDFDocumentScannerPage />} />
          <Route path="/pdf-signature-verifier" element={<PDFSignatureVerifierPage />} />

          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Legal Pages */}
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />

          {/* Comparison Pages */}
          <Route path="/docusigner-vs-docusign" element={<DocuSignerVsDocuSignPage />} />
          <Route path="/docusigner-vs-hellosign" element={<DocuSignerVsHelloSignPage />} />
          <Route path="/docusigner-vs-adobe-sign" element={<DocuSignerVsAdobeSignPage />} />
          <Route path="/docusigner-vs-pandadoc" element={<DocuSignerVsPandaDocPage />} />

          {/* Trust & Security Pages */}
          <Route path="/security-overview" element={<SecurityOverviewPage />} />
          <Route path="/accessibility" element={<AccessibilityPage />} />
          <Route path="/data-residency" element={<DataResidencyPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/bug-bounty" element={<BugBountyPage />} />

          {/* New Pages */}
          <Route path="/why-docusigner" element={<WhyDocuSignerPage />} />
          <Route path="/all-in-one-platform" element={<AllInOnePlatformPage />} />
          <Route path="/api-documentation" element={<APIDocumentationPage />} />
          <Route path="/ai-powered-features" element={<AIPoweredFeaturesPage />} />
        </Routes>

        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App