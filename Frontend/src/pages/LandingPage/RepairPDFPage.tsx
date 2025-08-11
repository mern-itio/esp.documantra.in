import { Wrench } from 'lucide-react'
import PDFToolLayout from '../../components/LandingPage/shared/PDFToolLayout'

const RepairPDFPage = () => {
  const handleProcess = async (files: File[], settings: any) => {
    console.log('Processing PDF repair:', files, settings)
  }

  const processingSettings = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Repair Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Fix corrupted file structure</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Repair damaged pages</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Recover missing fonts</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" defaultChecked />
            <span className="text-sm">Fix broken links and bookmarks</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="text-primary-600" />
            <span className="text-sm">Repair image corruption</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recovery Level
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="level" value="basic" className="text-primary-600" defaultChecked />
            <span>Basic repair (fast)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="level" value="advanced" className="text-primary-600" />
            <span>Advanced repair (thorough)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="level" value="deep" className="text-primary-600" />
            <span>Deep recovery (maximum effort)</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="create-backup" className="text-primary-600" defaultChecked />
        <label htmlFor="create-backup" className="text-sm text-gray-700">
          Create backup of original file
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="optimize-after" className="text-primary-600" />
        <label htmlFor="optimize-after" className="text-sm text-gray-700">
          Optimize file after repair
        </label>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Wrench className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">PDF Repair</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Our repair tool can fix many common PDF issues, but severely corrupted files may not be fully recoverable. We'll attempt to salvage as much content as possible.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <PDFToolLayout
      toolName="Repair PDF"
      toolDescription="Fix corrupted or damaged PDF files. Recover content from broken PDFs and restore functionality to damaged documents."
      toolIcon={Wrench}
      acceptedFormats={['.pdf']}
      outputFormats={['pdf']}
      maxFileSize="200MB"
      processingTime="60-180 seconds"
      features={[
        "Fix corrupted file structure",
        "Repair damaged pages",
        "Recover missing content",
        "Restore broken links",
        "Multiple recovery levels",
        "Content salvage operations",
        "Automatic optimization",
        "Backup creation"
      ]}
      howToSteps={[
        {
          title: "Upload Damaged PDF",
          description: "Select the corrupted or damaged PDF file"
        },
        {
          title: "Choose Repair Level",
          description: "Select basic, advanced, or deep recovery"
        },
        {
          title: "Start Repair",
          description: "Our system attempts to fix the issues"
        },
        {
          title: "Download Fixed PDF",
          description: "Get your repaired PDF file"
        }
      ]}
      faqs={[
        {
          question: "What types of PDF corruption can be repaired?",
          answer: "We can fix file structure issues, damaged pages, missing fonts, broken links, and many other common PDF problems."
        },
        {
          question: "Can all corrupted PDFs be repaired?",
          answer: "While we can fix many issues, severely corrupted files may not be fully recoverable. We'll salvage as much content as possible."
        },
        {
          question: "What's the difference between repair levels?",
          answer: "Basic repair is fast and fixes common issues. Advanced repair is more thorough. Deep recovery uses maximum effort for severely damaged files."
        },
        {
          question: "Will the repaired PDF look exactly like the original?",
          answer: "We aim to preserve the original appearance, but some formatting or content may be lost depending on the extent of corruption."
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
          name: "Optimize PDF",
          path: "/optimize-pdf",
          description: "Optimize repaired PDFs for better performance"
        },
        {
          name: "Validate PDF",
          path: "/validate-pdf",
          description: "Check PDF integrity and compliance"
        },
        {
          name: "Recover PDF",
          path: "/recover-pdf",
          description: "Advanced PDF recovery tools"
        }
      ]}
      onProcess={handleProcess}
      processingSettings={processingSettings}
    />
  )
}

export default RepairPDFPage