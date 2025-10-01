import { Accessibility } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFAccessibilityCheckerPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF accessibility check:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Accessibility Standards
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">WCAG 2.1 AA</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">PDF/UA (Universal Accessibility)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Section 508</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">HHS (Health and Human Services)</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Check Categories
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Document structure and tags</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Alternative text for images</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Reading order</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Color contrast</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Form field accessibility</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Table structure</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Language specification</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Report Detail Level
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="detail" value="summary" className="text-primary-600" />
            <span>Summary (overview only)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="detail" value="standard" className="text-primary-600" defaultChecked />
            <span>Standard (issues with locations)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="detail" value="detailed" className="text-primary-600" />
            <span>Detailed (comprehensive analysis)</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Report Format
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="pdf" className="text-primary-600" defaultChecked />
            <span>PDF Report</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="html" className="text-primary-600" />
            <span>HTML Report</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="format" value="both" className="text-primary-600" />
            <span>Both PDF and HTML</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="recommendations" className="text-primary-600" defaultChecked />
        <label htmlFor="recommendations" className="text-sm text-gray-700">
          Include remediation recommendations
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="visual-indicators" className="text-primary-600" defaultChecked />
        <label htmlFor="visual-indicators" className="text-sm text-gray-700">
          Add visual indicators of issues
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF Accessibility Checker"
      toolDescription="Analyze PDF documents for accessibility compliance. Identify issues and get recommendations to make your PDFs accessible to everyone."
      toolIcon={Accessibility}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf', 'html']}
      maxFileSize="2MB"
      processingTime="30-90 seconds"
      features={[
        "WCAG 2.1 compliance checking",
        "PDF/UA validation",
        "Section 508 verification",
        "Document structure analysis",
        "Alt text verification",
        "Color contrast checking",
        "Reading order validation",
        "Detailed remediation guidance"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to check for accessibility"
        },
        {
          title: "Choose Standards",
          description: "Select which accessibility standards to check against"
        },
        {
          title: "Analyze",
          description: "Our system performs comprehensive accessibility analysis"
        },
        {
          title: "View Report",
          description: "Get detailed accessibility report with recommendations"
        }
      ]}
      faqs={[
        {
          question: "What is PDF accessibility?",
          answer: "PDF accessibility ensures documents can be used by people with disabilities, including those using screen readers, keyboard navigation, or who have visual, cognitive, or motor impairments."
        },
        {
          question: "What accessibility issues can this tool detect?",
          answer: "Our tool checks for missing document structure, improper tagging, missing alternative text for images, poor color contrast, unspecified language, inaccessible form fields, improper table structure, and many other accessibility barriers."
        },
        {
          question: "What's the difference between WCAG, PDF/UA, and Section 508?",
          answer: "WCAG (Web Content Accessibility Guidelines) provides general web accessibility standards. PDF/UA is specifically for PDF universal accessibility. Section 508 refers to U.S. federal regulations requiring government information to be accessible."
        },
        {
          question: "Can this tool fix accessibility issues?",
          answer: "This tool identifies issues and provides recommendations, but doesn't automatically fix them. For remediation, you can use our PDF Editor or other specialized tools following the recommendations in the report."
        },
        {
          question: "Why is PDF accessibility important?",
          answer: "Accessible PDFs ensure equal access to information for all users, including those with disabilities. It's also often a legal requirement for government, education, and many business sectors."
        },
        {
          question: "How secure are my files during processing?",
          answer: "Your files are protected with 256-bit SSL encryption during upload and processing. We use the same security standards as banks and financial institutions."
        },
        {
          question: "How long do you store my files?",
          answer: "We automatically delete all uploaded files after 1 hour for your privacy and security. You can also manually delete files immediately after processing."
        },
        {
          question: "Is this tool really free to use?",
          answer: "Yes! Our PDF tools are completely free to use with no hidden costs. You can process unlimited files without any charges."
        },
        {
          question: "Why do you delete files automatically?",
          answer: "We automatically delete files after 1 hour to protect your privacy and ensure your sensitive documents don't remain on our servers longer than necessary."
        },
        {
          question: "Do I need to create an account to use this tool?",
          answer: "No account is required for basic usage. However, creating a free account gives you access to additional features like file history and batch processing."
        },
        {
          question: "Can I process multiple files at once?",
          answer: "Yes, our batch processing feature allows you to upload and check multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        }
      ]}
      relatedTools={[
        {
          name: "Edit PDF",
          path: "/edit-pdf",
          description: "Fix accessibility issues"
        },
        {
          name: "OCR PDF",
          path: "/ocr-pdf",
          description: "Make scanned PDFs accessible"
        },
        {
          name: "Add Alt Text",
          path: "/add-alt-text",
          description: "Add image descriptions"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PDFAccessibilityCheckerPage