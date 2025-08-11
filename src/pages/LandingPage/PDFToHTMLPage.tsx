import { Globe } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFToHTMLPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF to HTML:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Conversion Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="single" className="text-primary-600" defaultChecked />
            <span>Single HTML page</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="multiple" className="text-primary-600" />
            <span>Multiple HTML pages (one per PDF page)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="responsive" className="text-primary-600" />
            <span>Responsive web design</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Extract and include text</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Extract and include images</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Preserve links</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Preserve layout</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g., 1-10, 15, 20-25"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CSS Styling
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="default">Default styling</option>
          <option value="minimal">Minimal styling</option>
          <option value="custom">Custom CSS</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="include-toc" className="text-primary-600" defaultChecked />
        <label htmlFor="include-toc" className="text-sm text-gray-700">
          Include table of contents
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="zip-output" className="text-primary-600" defaultChecked />
        <label htmlFor="zip-output" className="text-sm text-gray-700">
          Download as ZIP archive
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF to HTML Converter"
      toolDescription="Convert PDF documents to HTML web pages. Preserve text, images, links, and layout for online publishing and web content."
      toolIcon={Globe}
      acceptedFormats={['.pdf']}
      outputFormats={['html', 'zip']}
      maxFileSize="100MB"
      processingTime="30-90 seconds"
      features={[
        "Convert PDF to responsive HTML",
        "Preserve text and formatting",
        "Extract and include images",
        "Maintain hyperlinks",
        "Multiple output options",
        "Table of contents generation",
        "CSS styling options",
        "Batch conversion support"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to convert to HTML"
        },
        {
          title: "Choose Options",
          description: "Select conversion method and content options"
        },
        {
          title: "Convert",
          description: "Our system transforms PDF to HTML format"
        },
        {
          title: "Download",
          description: "Get your HTML files and assets"
        }
      ]}
      faqs={[
        {
          question: "How accurate is the PDF to HTML conversion?",
          answer: "Our conversion maintains high accuracy for text, images, and basic layout. Complex layouts may have some differences due to the fundamental differences between PDF and HTML formats."
        },
        {
          question: "Will all formatting be preserved?",
          answer: "Basic formatting like fonts, colors, and text styles are preserved. Complex elements like exact positioning may differ slightly in the HTML output."
        },
        {
          question: "What happens to images in the PDF?",
          answer: "Images are extracted and saved as separate files (PNG or JPG) and properly referenced in the HTML document."
        },
        {
          question: "Can I edit the HTML after conversion?",
          answer: "Yes, the generated HTML is standard and can be edited with any HTML editor or web development tool."
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
          name: "HTML to PDF",
          path: "/html-to-pdf",
          description: "Convert HTML back to PDF format"
        },
        {
          name: "PDF to Word",
          path: "/pdf-to-word",
          description: "Convert PDF to editable Word documents"
        },
        {
          name: "PDF to Text",
          path: "/pdf-to-text",
          description: "Extract plain text from PDF files"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PDFToHTMLPage