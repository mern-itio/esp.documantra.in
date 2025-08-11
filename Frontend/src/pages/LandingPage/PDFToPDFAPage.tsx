import { Archive } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFToPDFAPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF to PDF/A:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          PDF/A Version
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="version" value="1b" className="text-primary-600" />
            <span>PDF/A-1b (Basic compliance)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="version" value="2b" className="text-primary-600" defaultChecked />
            <span>PDF/A-2b (Recommended)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="version" value="3b" className="text-primary-600" />
            <span>PDF/A-3b (Latest standard)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="version" value="2u" className="text-primary-600" />
            <span>PDF/A-2u (Unicode support)</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Conversion Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Embed fonts</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Convert images to RGB</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Remove transparency</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Remove interactive elements</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Compliance Level
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="strict">Strict (full compliance)</option>
          <option value="balanced" selected>Balanced (recommended)</option>
          <option value="relaxed">Relaxed (maximize compatibility)</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="validate" className="text-primary-600" defaultChecked />
        <label htmlFor="validate" className="text-sm text-gray-700">
          Validate after conversion
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="report" className="text-primary-600" defaultChecked />
        <label htmlFor="report" className="text-sm text-gray-700">
          Generate compliance report
        </label>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Archive className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">PDF/A for Archiving</h4>
            <p className="text-sm text-blue-700 mt-1">
              PDF/A is an ISO-standardized version of PDF designed for long-term archiving of electronic documents. It ensures documents can be opened and viewed correctly in the future, regardless of the software used.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF to PDF/A Converter"
      toolDescription="Convert standard PDF documents to PDF/A format for long-term archiving and preservation. Ensure future accessibility and compliance with archival standards."
      toolIcon={Archive}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="100MB"
      processingTime="30-90 seconds"
      features={[
        "Multiple PDF/A versions",
        "Font embedding",
        "Color space conversion",
        "Transparency removal",
        "Interactive element handling",
        "Compliance validation",
        "Detailed conversion report",
        "Batch conversion support"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to convert to PDF/A"
        },
        {
          title: "Choose Version",
          description: "Select PDF/A version and compliance level"
        },
        {
          title: "Set Options",
          description: "Configure conversion parameters"
        },
        {
          title: "Download",
          description: "Get your PDF/A compliant document"
        }
      ]}
      faqs={[
        {
          question: "What is PDF/A and why is it important?",
          answer: "PDF/A is an ISO-standardized version of PDF designed for long-term archiving of electronic documents. It ensures documents remain readable and accessible for decades, regardless of software changes."
        },
        {
          question: "What's the difference between PDF/A versions?",
          answer: "PDF/A-1 is the basic standard, PDF/A-2 adds JPEG2000 and transparency support, PDF/A-3 allows file attachments, and PDF/A-4 is the newest version with additional features."
        },
        {
          question: "Will my document look the same after conversion?",
          answer: "In most cases, yes. However, some features not allowed in PDF/A (like transparency or external references) will be modified to comply with the standard."
        },
        {
          question: "What happens to forms and interactive elements?",
          answer: "Interactive elements like forms, JavaScript, and multimedia are either removed or converted to static content in PDF/A, as these elements aren't allowed in the archival format."
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
          answer: "Yes, our batch processing feature allows you to upload and convert multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        },
        {
          question: "What's the maximum file size I can convert?",
          answer: "Free users can convert files up to 100MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "Validate PDF",
          path: "/validate-pdf",
          description: "Check PDF/A compliance"
        },
        {
          name: "Optimize PDF",
          path: "/optimize-pdf",
          description: "Optimize PDF for better performance"
        },
        {
          name: "Edit Metadata",
          path: "/edit-metadata",
          description: "Edit PDF document properties"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PDFToPDFAPage