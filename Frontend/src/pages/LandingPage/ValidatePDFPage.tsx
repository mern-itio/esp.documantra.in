import { CheckCircle, AlertCircle } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const ValidatePDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF validation:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Validation Standards
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">PDF/A compliance (archiving)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">PDF/X compliance (printing)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">PDF/UA compliance (accessibility)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">General PDF specification</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Validation Level
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="level" value="basic" className="text-primary-600" />
            <span>Basic validation (structure only)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="level" value="standard" className="text-primary-600" defaultChecked />
            <span>Standard validation (recommended)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="level" value="thorough" className="text-primary-600" />
            <span>Thorough validation (all checks)</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Report Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Generate detailed report</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Include error locations</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Include repair suggestions</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Include document metadata</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="auto-repair" className="text-primary-600" />
        <label htmlFor="auto-repair" className="text-sm text-gray-700">
          Attempt to auto-repair issues
        </label>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Validation Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              PDF validation checks for compliance with standards and specifications. Some issues may not affect document functionality but could impact archiving, printing, or accessibility.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Validate PDF"
      toolDescription="Check PDF documents for compliance with standards and specifications. Identify and fix issues for archiving, printing, and accessibility."
      toolIcon={CheckCircle}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf', 'html']}
      maxFileSize="2MB"
      processingTime="30-60 seconds"
      features={[
        "PDF/A compliance checking",
        "PDF/X print compliance",
        "PDF/UA accessibility validation",
        "Structure and syntax verification",
        "Detailed error reporting",
        "Auto-repair capabilities",
        "Batch validation support",
        "Comprehensive validation report"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to validate"
        },
        {
          title: "Choose Standards",
          description: "Select which standards to validate against"
        },
        {
          title: "Run Validation",
          description: "Our system checks for compliance issues"
        },
        {
          title: "View Report",
          description: "Get detailed validation results and fixes"
        }
      ]}
      faqs={[
        {
          question: "What is PDF/A compliance?",
          answer: "PDF/A is an ISO-standardized version of PDF designed for long-term archiving of electronic documents, ensuring they can be opened and viewed correctly in the future."
        },
        {
          question: "What is PDF/X compliance?",
          answer: "PDF/X is a subset of PDF designed specifically for graphic content exchange in the printing industry, ensuring reliable printing output."
        },
        {
          question: "What is PDF/UA compliance?",
          answer: "PDF/UA (Universal Accessibility) ensures PDFs are accessible to people with disabilities, including those using screen readers and other assistive technologies."
        },
        {
          question: "Can validation fix all PDF issues?",
          answer: "While our auto-repair feature can fix many common issues, some complex problems may require manual intervention or specialized software."
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
          answer: "Yes, our batch processing feature allows you to upload and validate multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        },
        {
          question: "What's the maximum file size I can convert?",
          answer: "Free users can convert files up to 2MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "Repair PDF",
          path: "/repair-pdf",
          description: "Fix issues found during validation"
        },
        {
          name: "PDF to PDF/A",
          path: "/pdf-to-pdfa",
          description: "Convert to archival format"
        },
        {
          name: "Optimize PDF",
          path: "/optimize-pdf",
          description: "Optimize PDF for better performance"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default ValidatePDFPage