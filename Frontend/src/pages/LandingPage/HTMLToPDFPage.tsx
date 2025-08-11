import { Globe } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const HTMLToPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing HTML to PDF:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Input Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="file" className="text-primary-600" defaultChecked />
            <span>Upload HTML file</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="url" className="text-primary-600" />
            <span>Convert from URL</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="code" className="text-primary-600" />
            <span>Paste HTML code</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Website URL (if converting from URL)
        </label>
        <input
          type="url"
          placeholder="https://example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Size
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
          <option value="legal">Legal</option>
          <option value="a3">A3</option>
          <option value="custom">Custom Size</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Orientation
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="orientation" value="portrait" className="text-primary-600" defaultChecked />
            <span>Portrait</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="orientation" value="landscape" className="text-primary-600" />
            <span>Landscape</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="include-background" className="text-primary-600" defaultChecked />
        <label htmlFor="include-background" className="text-sm text-gray-700">
          Include background graphics
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="wait-for-load" className="text-primary-600" defaultChecked />
        <label htmlFor="wait-for-load" className="text-sm text-gray-700">
          Wait for page to fully load
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="HTML to PDF Converter"
      toolDescription="Convert HTML files, web pages, and HTML code to PDF documents. Perfect for archiving web content and creating reports."
      toolIcon={Globe}
      acceptedFormats={['.html', '.htm']}
      outputFormats={['pdf']}
      maxFileSize="50MB"
      processingTime="30-60 seconds"
      features={[
        "Convert HTML files to PDF",
        "Convert web pages from URL",
        "Paste HTML code directly",
        "Preserve CSS styling",
        "Multiple page sizes",
        "Background graphics support",
        "Responsive design handling",
        "Custom margins and settings"
      ]}
      howToSteps={[
        {
          title: "Choose Input",
          description: "Upload HTML file, enter URL, or paste HTML code"
        },
        {
          title: "Set Options",
          description: "Configure page size, orientation, and styling"
        },
        {
          title: "Convert",
          description: "Our system renders HTML and creates PDF"
        },
        {
          title: "Download",
          description: "Get your PDF version of the HTML content"
        }
      ]}
      faqs={[
        {
          question: "Can I convert any website to PDF?",
          answer: "Yes, you can convert most public websites to PDF by entering their URL. Some sites with restrictions may not be accessible."
        },
        {
          question: "Will CSS styling be preserved?",
          answer: "Yes, we preserve CSS styling including fonts, colors, layouts, and responsive design elements."
        },
        {
          question: "Can I convert password-protected websites?",
          answer: "No, we cannot access password-protected or login-required websites. You would need to save the HTML locally first."
        },
        {
          question: "What about JavaScript content?",
          answer: "We can render basic JavaScript content, but complex dynamic content may not appear exactly as in a browser."
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
          answer: "Free users can convert files up to 50MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "PDF to HTML",
          path: "/pdf-to-html",
          description: "Convert PDF files back to HTML format"
        },
        {
          name: "Web Page Screenshot",
          path: "/webpage-screenshot",
          description: "Capture screenshots of web pages"
        },
        {
          name: "Word to PDF",
          path: "/word-to-pdf",
          description: "Convert Word documents to PDF"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default HTMLToPDFPage