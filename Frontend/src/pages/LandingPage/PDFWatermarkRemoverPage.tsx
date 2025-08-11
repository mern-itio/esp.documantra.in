import { FileText } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const PDFWatermarkRemoverPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing watermark removal:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Watermark Type
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="auto" className="text-primary-600" defaultChecked />
            <span>Auto-detect watermarks</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="text" className="text-primary-600" />
            <span>Text watermarks</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="image" className="text-primary-600" />
            <span>Image watermarks</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="both" className="text-primary-600" />
            <span>Both text and image watermarks</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Watermark Text (if known)
        </label>
        <input
          type="text"
          placeholder="e.g., CONFIDENTIAL, DRAFT, etc."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Enter text to help identify specific watermarks</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Removal Intensity
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="intensity" value="light" className="text-primary-600" />
            <span>Light (preserves document quality)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="intensity" value="medium" className="text-primary-600" defaultChecked />
            <span>Medium (recommended)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="intensity" value="aggressive" className="text-primary-600" />
            <span>Aggressive (for stubborn watermarks)</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Apply to Pages
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="pages" value="all" className="text-primary-600" defaultChecked />
            <span>All pages</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="pages" value="range" className="text-primary-600" />
            <span>Page range</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page Range (if selected)
        </label>
        <input
          type="text"
          placeholder="e.g., 1-5, 10, 15-20"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="content-repair" className="text-primary-600" defaultChecked />
        <label htmlFor="content-repair" className="text-sm text-gray-700">
          Repair content under watermarks
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="create-backup" className="text-primary-600" defaultChecked />
        <label htmlFor="create-backup" className="text-sm text-gray-700">
          Create backup of original file
        </label>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Important Note</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Watermark removal results vary based on how the watermark was applied. Some watermarks may be partially visible after removal or require aggressive settings that could affect document quality.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="PDF Watermark Remover"
      toolDescription="Remove watermarks, stamps, and logos from PDF documents. Clean up documents by eliminating text or image watermarks while preserving content."
      toolIcon={FileText}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="100MB"
      processingTime="30-90 seconds"
      features={[
        "Text watermark removal",
        "Image watermark removal",
        "Multiple intensity levels",
        "Content repair technology",
        "Batch processing support",
        "Page-specific removal",
        "Auto-detection algorithms",
        "Quality preservation options"
      ]}
      howToSteps={[
        {
          title: "Upload PDF",
          description: "Select the PDF file with watermarks to remove"
        },
        {
          title: "Choose Type",
          description: "Select watermark type and removal intensity"
        },
        {
          title: "Set Options",
          description: "Configure page range and repair settings"
        },
        {
          title: "Download",
          description: "Get your PDF with watermarks removed"
        }
      ]}
      faqs={[
        {
          question: "Can all watermarks be completely removed?",
          answer: "Results vary depending on how the watermark was applied. Simple overlay watermarks can usually be completely removed. Watermarks that are deeply embedded or part of the content may be more difficult to remove completely."
        },
        {
          question: "Will removing watermarks affect document quality?",
          answer: "Our technology aims to preserve document quality. Light and medium intensity settings have minimal impact. Aggressive settings may affect quality in some areas, especially around the watermark."
        },
        {
          question: "How does content repair work?",
          answer: "Our content repair technology analyzes the surrounding content and uses AI to reconstruct what should be under the watermark, helping to restore the original appearance."
        },
        {
          question: "Can I remove watermarks from specific pages only?",
          answer: "Yes, you can specify page ranges to apply watermark removal only to certain pages of your document."
        },
        {
          question: "Is watermark removal permanent?",
          answer: "Yes, watermark removal is permanent and cannot be undone. We recommend keeping a backup of your original file."
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
          answer: "Yes, our batch processing feature allows you to upload and remove watermarks from multiple files simultaneously, saving you time and effort."
        },
        {
          question: "What happens if my internet connection is interrupted?",
          answer: "If your connection is interrupted during upload, you can resume the upload when reconnected. Processed files are temporarily stored for 1 hour."
        }
      ]}
      relatedTools={[
        {
          name: "Add Watermark",
          path: "/add-watermark",
          description: "Add watermarks to PDF documents"
        },
        {
          name: "Edit PDF",
          path: "/edit-pdf",
          description: "Edit PDF content and formatting"
        },
        {
          name: "Remove Background",
          path: "/remove-background",
          description: "Remove backgrounds from PDFs"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default PDFWatermarkRemoverPage