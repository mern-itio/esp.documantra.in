import { MessageSquare } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const AddCommentsPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing comment addition:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comment Type
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="note" className="text-primary-600" defaultChecked />
            <span>Sticky notes</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="text" className="text-primary-600" />
            <span>Text comments</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="highlight" className="text-primary-600" />
            <span>Text highlights with comments</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comment Text
        </label>
        <textarea
          rows={3}
          placeholder="Enter your comment text here..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comment Color
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="yellow">Yellow</option>
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="red">Red</option>
          <option value="purple">Purple</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Author Name
        </label>
        <input
          type="text"
          placeholder="Enter your name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="open-by-default" className="text-primary-600" defaultChecked />
        <label htmlFor="open-by-default" className="text-sm text-gray-700">
          Open comments by default
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="add-date" className="text-primary-600" defaultChecked />
        <label htmlFor="add-date" className="text-sm text-gray-700">
          Add date and time to comments
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Add Comments to PDF"
      toolDescription="Add comments, notes, and feedback to PDF documents. Collaborate on documents with sticky notes, text comments, and highlights."
      toolIcon={MessageSquare}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="2MB"
      processingTime="10-20 seconds"
      features={[
        "Sticky note comments",
        "Text comments and annotations",
        "Highlight with comments",
        "Multiple color options",
        "Author attribution",
        "Date and time stamps",
        "Batch comment addition",
        "Professional collaboration"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to add comments to"
        },
        {
          title: "Choose Type",
          description: "Select comment type and appearance options"
        },
        {
          title: "Add Comments",
          description: "Enter your comment text and position"
        },
        {
          title: "Download",
          description: "Get your PDF with comments added"
        }
      ]}
      faqs={[
        {
          question: "Can others see my comments?",
          answer: "Yes, comments are saved in the PDF and can be viewed by anyone with a standard PDF reader. They can be edited with PDF annotation tools."
        },
        {
          question: "Can I remove comments later?",
          answer: "Yes, comments can be removed later using our 'Remove Annotations' tool or any PDF editor that supports annotation editing."
        },
        {
          question: "Will comments print with the document?",
          answer: "By default, most PDF readers don't print comments unless specifically configured to do so. This allows for non-destructive feedback."
        },
        {
          question: "Can I add comments to specific locations?",
          answer: "Yes, you can place comments at specific locations in the document to provide context-specific feedback."
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
          answer: "Yes, our batch processing feature allows you to upload and add comments to multiple files simultaneously, saving you time and effort."
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
          name: "Annotate PDF",
          path: "/annotate-pdf",
          description: "Advanced PDF annotation tools"
        },
        {
          name: "Remove Annotations",
          path: "/remove-annotations",
          description: "Remove comments and annotations"
        },
        {
          name: "Edit PDF",
          path: "/edit-pdf",
          description: "Edit PDF content and formatting"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default AddCommentsPage