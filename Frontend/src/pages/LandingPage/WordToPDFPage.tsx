import { FileText } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const WordToPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing Word to PDF:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          PDF Quality
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="high" className="text-primary-600" defaultChecked />
            <span>High Quality (Print-ready)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="medium" className="text-primary-600" />
            <span>Medium Quality (Web-optimized)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="quality" value="compressed" className="text-primary-600" />
            <span>Compressed (Smaller file size)</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Orientation
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="auto">Keep original orientation</option>
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Size
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="auto">Keep original size</option>
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
          <option value="legal">Legal</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-hyperlinks" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-hyperlinks" className="text-sm text-gray-700">
          Preserve hyperlinks
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-bookmarks" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-bookmarks" className="text-sm text-gray-700">
          Create PDF bookmarks from headings
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Word to PDF Converter"
      toolDescription="Convert Word documents to PDF format while preserving formatting, images, and layout. Perfect for sharing and archiving."
      toolIcon={FileText}
      acceptedFormats={['.docx', '.doc', '.rtf']}
      outputFormats={['pdf']}
      maxFileSize="100MB"
      processingTime="15-30 seconds"
      features={[
        "Perfect formatting preservation",
        "Maintains images and graphics",
        "Preserves hyperlinks and bookmarks",
        "Multiple quality options",
        "Batch conversion support",
        "Password protection option",
        "Custom page settings",
        "Fast processing speed"
      ]}
      howToSteps={[
        {
          title: "Upload Word",
          description: "Select your Word document (.docx, .doc, .rtf)"
        },
        {
          title: "Choose Settings",
          description: "Select PDF quality and page options"
        },
        {
          title: "Convert",
          description: "Our system converts your document to PDF"
        },
        {
          title: "Download",
          description: "Get your PDF file ready for sharing"
        }
      ]}
      faqs={[
        {
          question: "Will my Word formatting be preserved?",
          answer: "Yes, our converter maintains all formatting including fonts, colors, images, tables, and layout exactly as they appear in Word."
        },
        {
          question: "Can I convert password-protected Word documents?",
          answer: "Yes, you can convert password-protected Word documents. You'll need to enter the password during upload."
        },
        {
          question: "What Word formats are supported?",
          answer: "We support .docx, .doc, and .rtf formats. Both modern and legacy Word document formats are fully supported."
        },
        {
          question: "Can I batch convert multiple Word files?",
          answer: "Yes, you can upload and convert multiple Word documents simultaneously to save time."
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
          name: "PDF to Word",
          path: "/pdf-to-word",
          description: "Convert PDF files back to Word format"
        },
        {
          name: "Compress PDF",
          path: "/compress-pdf",
          description: "Reduce PDF file size after conversion"
        },
        {
          name: "Protect PDF",
          path: "/protect-pdf",
          description: "Add password protection to your PDF"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default WordToPDFPage