import { FileText } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFFormCreatorPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing form creation:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Form Creation Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="auto" className="text-primary-600" defaultChecked />
            <span>Auto-detect form fields</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="manual" className="text-primary-600" />
            <span>Manual field creation</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="template" className="text-primary-600" />
            <span>Use form template</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Field Types to Include
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Text fields</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Checkboxes</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Radio buttons</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Dropdown lists</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Signature fields</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Date fields</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Form Properties
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Make fields required</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Add field validation</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Add calculation fields</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Add tooltips/help text</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Add field formatting</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Form Appearance
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option value="standard">Standard appearance</option>
          <option value="modern">Modern style</option>
          <option value="minimal">Minimal style</option>
          <option value="custom">Custom styling</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Form Actions
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Add submit button</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Add reset button</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Add print button</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Enable form saving</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="save-template" className="text-primary-600" />
        <label htmlFor="save-template" className="text-sm text-gray-700">
          Save as reusable template
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF Form Creator"
      toolDescription="Create interactive fillable forms from existing PDF documents. Add text fields, checkboxes, dropdowns, and signature fields with validation."
      toolIcon={FileText}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="100MB"
      processingTime="30-60 seconds"
      features={[
        "Auto-detect form fields",
        "Multiple field types",
        "Field validation rules",
        "Required field marking",
        "Calculation capabilities",
        "Custom field styling",
        "Template saving option",
        "Submit button functionality"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF document to convert to a form"
        },
        {
          title: "Choose Method",
          description: "Select auto-detection or manual field creation"
        },
        {
          title: "Configure Fields",
          description: "Set field properties and validation rules"
        },
        {
          title: "Download",
          description: "Get your interactive fillable PDF form"
        }
      ]}
      faqs={[
        {
          question: "How does auto-detection of form fields work?",
          answer: "Our system analyzes the document layout to identify potential form fields like lines, boxes, and labels, then automatically creates appropriate interactive fields in those locations."
        },
        {
          question: "Can I create forms from scanned documents?",
          answer: "Yes, our system can work with scanned documents, though the auto-detection may be less accurate. You can always manually add or adjust fields as needed."
        },
        {
          question: "What types of validation can I add to fields?",
          answer: "You can add various validations including required fields, number ranges, date formats, email validation, and custom regular expression patterns."
        },
        {
          question: "Can I create calculation fields?",
          answer: "Yes, you can create fields that automatically calculate values based on other fields, such as sums, products, averages, and other mathematical operations."
        },
        {
          question: "What's the difference between form appearances?",
          answer: "Standard appearance uses traditional form styling. Modern has a cleaner, contemporary look. Minimal uses subtle styling for a cleaner document. Custom allows specific color and style choices."
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
          answer: "No account is required for basic usage. However, creating a free account gives you access to additional features like template saving and batch processing."
        },
        {
          question: "Can I process multiple files at once?",
          answer: "Yes, our batch processing feature allows you to upload and convert multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        }
      ]}
      relatedTools={[
        {
          name: "Fill PDF Forms",
          path: "/fill-forms",
          description: "Fill out interactive PDF forms"
        },
        {
          name: "Flatten PDF",
          path: "/flatten-pdf",
          description: "Convert form fields to static content"
        },
        {
          name: "Digital Signature",
          path: "/digital-signature",
          description: "Add signature fields to forms"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PDFFormCreatorPage