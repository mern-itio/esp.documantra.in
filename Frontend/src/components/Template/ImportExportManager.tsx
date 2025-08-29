import React, { useState } from 'react';
import { Upload, Download, FileText, File, Code } from 'lucide-react';

interface ImportExportManagerProps {
  onImport: (file: File, type: string) => void;
  onExport: (format: string) => void;
}

export const ImportExportManager: React.FC<ImportExportManagerProps> = ({
  onImport,
  onExport
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('json');

  const importFormats = [
    { type: 'docx', label: 'Word Document (.docx)', icon: FileText, accept: '.docx' },
    { type: 'pdf', label: 'PDF Document (.pdf)', icon: File, accept: '.pdf' },
    { type: 'html', label: 'HTML File (.html)', icon: Code, accept: '.html' },
    { type: 'json', label: 'JSON Template (.json)', icon: Code, accept: '.json' },
    { type: 'xml', label: 'XML Template (.xml)', icon: Code, accept: '.xml' }
  ];

  const exportFormats = [
    { type: 'json', label: 'JSON Template', description: 'Export as JSON for API use' },
    { type: 'html', label: 'HTML Template', description: 'Export as HTML for web use' },
    { type: 'pdf', label: 'PDF Template', description: 'Export as PDF template' },
    { type: 'docx', label: 'Word Template', description: 'Export as Word document' },
    { type: 'xml', label: 'XML Template', description: 'Export as XML template' }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension) {
        onImport(file, extension);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension) {
        onImport(file, extension);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Import & Export Templates</h2>

      {/* Import Section */}
      <div className="mb-8">
        <h3 className="text-md font-medium text-gray-900 mb-4">Import Template</h3>
        
        {/* Drag & Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop your template file here
          </p>
          <p className="text-gray-600 mb-4">
            or click to browse and select a file
          </p>
          <input
            type="file"
            onChange={handleFileInput}
            accept=".docx,.pdf,.html,.json,.xml"
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium cursor-pointer"
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose File
          </label>
        </div>

        {/* Supported Formats */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Supported formats:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {importFormats.map((format) => {
              const Icon = format.icon;
              return (
                <div key={format.type} className="flex items-center p-2 border border-gray-200 rounded-md">
                  <Icon className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700">{format.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">Export Template</h3>
        
        <div className="space-y-3 mb-6">
          {exportFormats.map((format) => (
            <label key={format.type} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="exportFormat"
                value={format.type}
                checked={selectedFormat === format.type}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">{format.label}</div>
                <div className="text-sm text-gray-600">{format.description}</div>
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={() => onExport(selectedFormat)}
          className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Template
        </button>
      </div>

      {/* Recent Imports/Exports */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {[
            { action: 'Imported', file: 'employment-contract.docx', time: '2 hours ago', type: 'import' },
            { action: 'Exported', file: 'sales-proposal.json', time: '4 hours ago', type: 'export' },
            { action: 'Imported', file: 'nda-template.pdf', time: '1 day ago', type: 'import' },
            { action: 'Exported', file: 'invoice-template.html', time: '2 days ago', type: 'export' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  activity.type === 'import' ? 'bg-blue-500' : 'bg-green-500'
                }`}></div>
                <span className="text-sm text-gray-900">
                  {activity.action} <span className="font-medium">{activity.file}</span>
                </span>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};