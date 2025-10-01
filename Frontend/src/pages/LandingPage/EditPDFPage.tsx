import { Edit, Type, Image, Square } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const EditPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF editing:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Editing Mode
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="mode" value="text" className="text-primary-600" defaultChecked />
            <Type className="h-5 w-5 text-blue-500" />
            <div>
              <div className="font-medium">Text Editing</div>
              <div className="text-sm text-gray-600">Edit, add, or remove text</div>
            </div>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="mode" value="image" className="text-primary-600" />
            <Image className="h-5 w-5 text-green-500" />
            <div>
              <div className="font-medium">Image Editing</div>
              <div className="text-sm text-gray-600">Add, replace, or remove images</div>
            </div>
          </label>
          <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="radio" name="mode" value="annotation" className="text-primary-600" />
            <Square className="h-5 w-5 text-purple-500" />
            <div>
              <div className="font-medium">Annotations</div>
              <div className="text-sm text-gray-600">Add shapes, highlights, and comments</div>
            </div>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Settings (for text editing)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>Arial</option>
            <option>Times New Roman</option>
            <option>Helvetica</option>
            <option>Calibri</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>12pt</option>
            <option>14pt</option>
            <option>16pt</option>
            <option>18pt</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="preserve-layout" className="text-primary-600" defaultChecked />
        <label htmlFor="preserve-layout" className="text-sm text-gray-700">
          Preserve original layout
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="auto-save" className="text-primary-600" defaultChecked />
        <label htmlFor="auto-save" className="text-sm text-gray-700">
          Auto-save changes
        </label>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Edit PDF"
      toolDescription="Edit PDF documents directly in your browser. Add text, images, shapes, and annotations with ease."
      toolIcon={Edit}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="2MB"
      processingTime="Instant editing"
      features={[
        "Real-time PDF editing in browser",
        "Add, edit, and delete text",
        "Insert and replace images",
        "Draw shapes and annotations",
        "Highlight and comment tools",
        "Undo/redo functionality",
        "Font and formatting options",
        "Page management tools"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file you want to edit"
        },
        {
          title: "Choose Tool",
          description: "Select text, image, or annotation editing mode"
        },
        {
          title: "Make Changes",
          description: "Edit your document with our intuitive tools"
        },
        {
          title: "Save & Download",
          description: "Save your changes and download the edited PDF"
        }
      ]}
      faqs={[
        {
          question: "Can I edit any PDF file?",
          answer: "You can edit most PDF files. However, some PDFs with complex layouts or security restrictions may have limited editing capabilities."
        },
        {
          question: "Will the original formatting be preserved?",
          answer: "Yes, our editor preserves the original formatting and layout while allowing you to make necessary changes."
        },
        {
          question: "Can I add images to my PDF?",
          answer: "Yes, you can insert new images, replace existing ones, or remove images from your PDF document."
        },
        {
          question: "Is there an undo function?",
          answer: "Yes, you can undo and redo changes during your editing session to easily correct mistakes."
        },
        {
          question: "Can I edit password-protected PDFs?",
          answer: "You can edit password-protected PDFs if you provide the correct password during upload."
        }
      ]}
      relatedTools={[
        {
          name: "PDF to Word",
          path: "/pdf-to-word",
          description: "Convert to Word for advanced editing"
        },
        {
          name: "Add Watermark",
          path: "/add-watermark",
          description: "Add watermarks to your PDF"
        },
        {
          name: "Fill PDF Forms",
          path: "/fill-pdf-forms",
          description: "Fill out PDF forms electronically"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default EditPDFPage