import { MessageSquare } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const AnnotatePDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF annotation:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Annotation Tools
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Text comments</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Highlight text</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Draw shapes</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Sticky notes</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Text boxes</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Default Annotation Color
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="yellow">Yellow</option>
          <option value="red">Red</option>
          <option value="green">Green</option>
          <option value="blue">Blue</option>
          <option value="purple">Purple</option>
          <option value="custom">Custom color</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Author Information
        </label>
        <input
          type="text"
          placeholder="Enter your name (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="auto-save" className="text-primary-600" defaultChecked />
        <label htmlFor="auto-save" className="text-sm text-gray-700">
          Auto-save annotations
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="show-toolbar" className="text-primary-600" defaultChecked />
        <label htmlFor="show-toolbar" className="text-sm text-gray-700">
          Show annotation toolbar
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Annotate PDF"
      toolDescription="Add comments, highlights, and notes to PDF documents. Collaborate and provide feedback with professional annotation tools."
      toolIcon={MessageSquare}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="2MB"
      processingTime="Real-time annotation"
      features={[
        "Text comments and notes",
        "Highlight, underline, and strikethrough",
        "Drawing tools and shapes",
        "Sticky notes and callouts",
        "Text boxes and markup",
        "Custom colors and styles",
        "Author attribution",
        "Annotation management"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to annotate"
        },
        {
          title: "Choose Tools",
          description: "Select annotation tools and preferences"
        },
        {
          title: "Add Annotations",
          description: "Add comments, highlights, and notes to the document"
        },
        {
          title: "Save & Download",
          description: "Download your annotated PDF file"
        }
      ]}
      faqs={[
        {
          question: "Can others see my annotations?",
          answer: "Yes, annotations are saved in the PDF and can be viewed by anyone with a standard PDF reader. They can be edited with PDF annotation tools."
        },
        {
          question: "Can I remove annotations later?",
          answer: "Yes, annotations can be removed later using our 'Remove Annotations' tool or any PDF editor that supports annotation editing."
        },
        {
          question: "Will annotations print with the document?",
          answer: "Yes, annotations will print with the document by default. Most PDF readers allow you to control whether annotations print or not."
        },
        {
          question: "Can I collaborate with others using annotations?",
          answer: "Yes, PDF annotations are a standard way to collaborate on documents. Multiple people can add annotations to the same document."
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
          answer: "No account is required for basic usage. However, creating a free account gives you access to additional features like file history and annotation saving."
        },
        {
          question: "Can I process multiple files at once?",
          answer: "Yes, our batch processing feature allows you to upload and annotate multiple files simultaneously, saving you time and effort."
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
          name: "Remove Annotations",
          path: "/remove-annotations",
          description: "Remove annotations from PDF documents"
        },
        {
          name: "Edit PDF",
          path: "/edit-pdf",
          description: "Edit PDF content and formatting"
        },
        {
          name: "Merge PDF",
          path: "/merge-pdf",
          description: "Combine multiple annotated PDFs"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default AnnotatePDFPage