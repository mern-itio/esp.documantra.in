import { Book } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const BookletCreatorPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing booklet creation:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Booklet Type
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="standard" className="text-primary-600" defaultChecked />
            <span>Standard booklet (2-up)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="perfect" className="text-primary-600" />
            <span>Perfect binding</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="magazine" className="text-primary-600" />
            <span>Magazine style</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Size
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
          <option value="legal">Legal</option>
          <option value="a5">A5</option>
          <option value="a3">A3</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Binding Edge
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="binding" value="left" className="text-primary-600" defaultChecked />
            <span>Left edge</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="binding" value="right" className="text-primary-600" />
            <span>Right edge</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Printing Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Auto-rotate pages</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Add page borders</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Add crop marks</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Add page numbers</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gutter Size (binding margin)
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="small">Small (0.25 inch)</option>
          <option value="medium" selected>Medium (0.5 inch)</option>
          <option value="large">Large (0.75 inch)</option>
          <option value="custom">Custom size</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="auto-adjust" className="text-primary-600" defaultChecked />
        <label htmlFor="auto-adjust" className="text-sm text-gray-700">
          Auto-adjust content for best fit
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Booklet Creator"
      toolDescription="Convert PDF documents into printable booklets with proper page ordering. Create professional-looking booklets for printing and binding."
      toolIcon={Book}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="30-60 seconds"
      features={[
        "Multiple booklet styles",
        "Automatic page ordering",
        "Binding margin options",
        "Crop marks and borders",
        "Page number addition",
        "Various paper sizes",
        "Print optimization",
        "Professional output"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF document to convert to a booklet"
        },
        {
          title: "Choose Style",
          description: "Select booklet type and binding options"
        },
        {
          title: "Set Layout",
          description: "Configure page size and printing options"
        },
        {
          title: "Download",
          description: "Get your print-ready booklet PDF"
        }
      ]}
      faqs={[
        {
          question: "What is a PDF booklet?",
          answer: "A PDF booklet arranges pages in a special order so that when printed double-sided and folded, they create a book-like document with pages in the correct reading order."
        },
        {
          question: "How do I print the booklet?",
          answer: "Print the booklet PDF using your printer's double-sided printing feature. After printing, fold the pages in half and staple or bind along the fold line."
        },
        {
          question: "What's the difference between booklet types?",
          answer: "Standard booklet is simple 2-up printing for folding. Perfect binding is for glue binding with separate signatures. Magazine style includes cover pages and is optimized for saddle stitching."
        },
        {
          question: "What if my document has an odd number of pages?",
          answer: "We automatically add blank pages as needed to ensure proper printing layout and page ordering."
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
          answer: "Free users can convert files up to 200MB. Premium users have higher limits and can process larger files without restrictions."
        }
      ]}
      relatedTools={[
        {
          name: "N-up PDF",
          path: "/n-up",
          description: "Arrange multiple pages on one sheet"
        },
        {
          name: "Print Optimizer",
          path: "/print-optimizer",
          description: "Optimize PDFs for printing"
        },
        {
          name: "Page Numbers",
          path: "/page-numbers",
          description: "Add page numbers to documents"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default BookletCreatorPage