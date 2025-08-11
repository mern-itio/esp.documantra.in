import { Grid } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const NUpPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing N-up:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pages per Sheet
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="layout" value="2" className="text-primary-600" defaultChecked />
            <span>2-up</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="layout" value="4" className="text-primary-600" />
            <span>4-up</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="layout" value="6" className="text-primary-600" />
            <span>6-up</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="layout" value="8" className="text-primary-600" />
            <span>8-up</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="layout" value="9" className="text-primary-600" />
            <span>9-up</span>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="layout" value="16" className="text-primary-600" />
            <span>16-up</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Order
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="horizontal">Horizontal (left to right, top to bottom)</option>
          <option value="vertical">Vertical (top to bottom, left to right)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Page Size
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
          <option value="legal">Legal</option>
          <option value="a3">A3</option>
          <option value="tabloid">Tabloid</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Spacing Between Pages
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="none">No spacing</option>
          <option value="small">Small (2mm)</option>
          <option value="medium">Medium (5mm)</option>
          <option value="large">Large (10mm)</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="add-borders" className="text-primary-600" />
        <label htmlFor="add-borders" className="text-sm text-gray-700">
          Add borders around each page
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="maintain-aspect" className="text-primary-600" defaultChecked />
        <label htmlFor="maintain-aspect" className="text-sm text-gray-700">
          Maintain aspect ratio
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="N-up PDF"
      toolDescription="Arrange multiple PDF pages on a single sheet. Perfect for creating handouts, booklets, and saving paper."
      toolIcon={Grid}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="30-60 seconds"
      features={[
        "Multiple layout options (2-up to 16-up)",
        "Flexible page ordering",
        "Custom output page sizes",
        "Adjustable spacing and borders",
        "Aspect ratio preservation",
        "Print optimization",
        "Batch processing support",
        "Professional layouts"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to arrange in N-up layout"
        },
        {
          title: "Choose Layout",
          description: "Select how many pages per sheet (2-up, 4-up, etc.)"
        },
        {
          title: "Set Options",
          description: "Configure page order, spacing, and output size"
        },
        {
          title: "Download",
          description: "Get your N-up arranged PDF file"
        }
      ]}
      faqs={[
        {
          question: "What does 'N-up' mean?",
          answer: "N-up refers to arranging multiple pages on a single sheet. For example, 2-up means 2 pages per sheet, 4-up means 4 pages per sheet, etc."
        },
        {
          question: "Why would I use N-up layout?",
          answer: "N-up layouts save paper when printing, create handouts, make booklets, or provide overview sheets of multiple pages at once."
        },
        {
          question: "Can I control the order of pages?",
          answer: "Yes, you can choose horizontal order (left to right, top to bottom) or vertical order (top to bottom, left to right)."
        },
        {
          question: "Will text remain readable in N-up layout?",
          answer: "Text readability depends on the original page size and the N-up layout chosen. Smaller layouts (like 16-up) may make text very small."
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
          name: "Organize PDF",
          path: "/organize-pdf",
          description: "Reorder pages before N-up layout"
        },
        {
          name: "Booklet Creator",
          path: "/booklet-creator",
          description: "Create booklets with proper page ordering"
        },
        {
          name: "Print Optimizer",
          path: "/print-optimizer",
          description: "Optimize PDFs for printing"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default NUpPage