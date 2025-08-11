import { Edit } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const FillFormsPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing form filling:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Form Filling Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="interactive" className="text-primary-600" defaultChecked />
            <span>Interactive form filling</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="data" className="text-primary-600" />
            <span>Fill from data file (CSV/JSON)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="method" value="template" className="text-primary-600" />
            <span>Use saved template data</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Data File Upload (for bulk filling)
        </label>
        <input
          type="file"
          accept=".csv,.json"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Upload CSV or JSON file with form data</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Flatten form after filling</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Keep form fields editable</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Add digital signature</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Settings for Text Fields
        </label>
        <div className="grid grid-cols-2 gap-3">
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>Arial</option>
            <option>Times New Roman</option>
            <option>Helvetica</option>
            <option>Calibri</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>Auto</option>
            <option>10pt</option>
            <option>12pt</option>
            <option>14pt</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="save-template" className="text-primary-600" />
        <label htmlFor="save-template" className="text-sm text-gray-700">
          Save filled data as template
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="validate-fields" className="text-primary-600" defaultChecked />
        <label htmlFor="validate-fields" className="text-sm text-gray-700">
          Validate form fields
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Fill PDF Forms"
      toolDescription="Complete PDF forms electronically. Fill out interactive forms, flatten fields, and save templates for future use."
      toolIcon={Edit}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="100MB"
      processingTime="15-30 seconds"
      features={[
        "Interactive form filling",
        "Bulk data import from CSV/JSON",
        "Form field validation",
        "Template saving and reuse",
        "Form flattening options",
        "Digital signature support",
        "Font customization",
        "Professional formatting"
      ]}
      howToSteps={[
        {
          title: "Upload Form",
          description: "Select the PDF form you want to fill out"
        },
        {
          title: "Fill Fields",
          description: "Complete form fields interactively or import data"
        },
        {
          title: "Set Options",
          description: "Choose output settings and formatting"
        },
        {
          title: "Download",
          description: "Get your completed PDF form"
        }
      ]}
      faqs={[
        {
          question: "What types of PDF forms can I fill?",
          answer: "We support all standard PDF form types including text fields, checkboxes, radio buttons, dropdown lists, and signature fields."
        },
        {
          question: "Can I fill multiple forms with the same data?",
          answer: "Yes, you can save your data as a template or import from CSV/JSON files to quickly fill multiple forms with the same information."
        },
        {
          question: "What is form flattening?",
          answer: "Flattening converts form fields to static text, making the form non-editable but ensuring it displays consistently across all viewers."
        },
        {
          question: "Can I add digital signatures to forms?",
          answer: "Yes, you can add digital signatures to form fields, providing legal validity and authentication to your completed forms."
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
          answer: "No account is required for basic usage. However, creating a free account gives you access to additional features like template storage and batch processing."
        },
        {
          question: "Can I process multiple files at once?",
          answer: "Yes, our batch processing feature allows you to upload and fill multiple forms simultaneously, saving you time and effort."
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
          name: "Create Forms",
          path: "/create-forms",
          description: "Create fillable PDF forms"
        },
        {
          name: "Digital Signature",
          path: "/digital-signature",
          description: "Add digital signatures to documents"
        },
        {
          name: "Flatten PDF",
          path: "/flatten-pdf",
          description: "Convert forms to static content"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default FillFormsPage