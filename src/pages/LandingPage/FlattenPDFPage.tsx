import { Layers } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const FlattenPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF flatten:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Flatten Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Flatten form fields</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Flatten annotations</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Flatten layers</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Flatten transparency</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Quality
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="high">High Quality</option>
          <option value="medium">Medium Quality</option>
          <option value="optimized">Optimized for Size</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-bookmarks" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-bookmarks" className="text-sm text-gray-700">
          Preserve bookmarks
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-metadata" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-metadata" className="text-sm text-gray-700">
          Preserve document metadata
        </label>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Layers className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">What is PDF Flattening?</h4>
            <p className="text-sm text-blue-700 mt-1">
              Flattening converts interactive elements like form fields and annotations into static content, making the PDF non-editable but ensuring consistent appearance across all viewers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Flatten PDF"
      toolDescription="Flatten PDF forms, annotations, and layers into static content. Ensure consistent appearance across all PDF viewers."
      toolIcon={Layers}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="100MB"
      processingTime="20-40 seconds"
      features={[
        "Flatten form fields to static text",
        "Convert annotations to content",
        "Flatten PDF layers",
        "Remove transparency effects",
        "Preserve document quality",
        "Batch flattening support",
        "Maintain bookmarks and metadata",
        "Ensure cross-platform compatibility"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file with forms or annotations to flatten"
        },
        {
          title: "Choose Options",
          description: "Select what elements to flatten"
        },
        {
          title: "Process",
          description: "Our system flattens the selected elements"
        },
        {
          title: "Download",
          description: "Get your flattened PDF with static content"
        }
      ]}
      faqs={[
        {
          question: "What does flattening a PDF mean?",
          answer: "Flattening converts interactive elements like form fields, annotations, and layers into static content that cannot be edited or modified."
        },
        {
          question: "Why would I want to flatten a PDF?",
          answer: "Flattening ensures consistent appearance across all PDF viewers, prevents unauthorized editing, and reduces file complexity."
        },
        {
          question: "Can I undo PDF flattening?",
          answer: "No, flattening is permanent. The interactive elements are converted to static content and cannot be restored. Keep a backup of your original file."
        },
        {
          question: "Will flattening affect the PDF file size?",
          answer: "Flattening may slightly increase or decrease file size depending on the complexity of the original interactive elements."
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
          name: "Fill PDF Forms",
          path: "/fill-pdf-forms",
          description: "Fill out PDF forms before flattening"
        },
        {
          name: "Remove Annotations",
          path: "/remove-annotations",
          description: "Remove specific annotations from PDF"
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

export default FlattenPDFPage