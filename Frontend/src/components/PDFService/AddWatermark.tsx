import React, { useState, useRef } from 'react';
import { addWatermarkService } from '../../services/addWatermarkService';
import type {
  AddTextWatermarkRequest,
  AddImageWatermarkRequest,
  WatermarkResponse,
  WatermarkPosition,
  WatermarkPreset
} from '../../types/addWatermark';
import { Button } from '../DocumentService/ui/button';
import { Input } from '../DocumentService/ui/input';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Upload, Download, Eye, Type, Image, Settings, RotateCcw } from 'lucide-react';

const AddWatermark: React.FC = () => {
   const location = useLocation();
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [result, setResult] = useState<WatermarkResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // Text watermark form state
  const [textFormData, setTextFormData] = useState({
    text: 'CONFIDENTIAL',
    position: 'center',
    fontSize: 48,
    fontColor: '#FF0000',
    opacity: 0.3,
    rotation: -45,
    startPage: 1,
    endPage: '',
    excludePages: ''
  });

  // Image watermark form state
  const [imageFormData, setImageFormData] = useState({
    position: 'center',
    opacity: 0.3,
    rotation: 0,
    scale: 1.0,
    startPage: 1,
    endPage: '',
    excludePages: ''
  });

  const positionOptions: WatermarkPosition[] = [
    { value: 'top-left', label: 'Top Left', description: 'Top left corner' },
    { value: 'top-center', label: 'Top Center', description: 'Top center' },
    { value: 'top-right', label: 'Top Right', description: 'Top right corner' },
    { value: 'middle-left', label: 'Middle Left', description: 'Left side middle' },
    { value: 'center', label: 'Center', description: 'Page center' },
    { value: 'middle-right', label: 'Middle Right', description: 'Right side middle' },
    { value: 'bottom-left', label: 'Bottom Left', description: 'Bottom left corner' },
    { value: 'bottom-center', label: 'Bottom Center', description: 'Bottom center' },
    { value: 'bottom-right', label: 'Bottom Right', description: 'Bottom right corner' }
  ];

  const watermarkPresets: WatermarkPreset[] = [
    { value: 'confidential', label: 'Confidential', description: 'Standard confidential watermark', text: 'CONFIDENTIAL', fontSize: 48, fontColor: '#FF0000', opacity: 0.3, rotation: -45 },
    { value: 'draft', label: 'Draft', description: 'Draft document watermark', text: 'DRAFT', fontSize: 48, fontColor: '#FFA500', opacity: 0.4, rotation: -45 },
    { value: 'approved', label: 'Approved', description: 'Approved document watermark', text: 'APPROVED', fontSize: 48, fontColor: '#008000', opacity: 0.3, rotation: -45 },
    { value: 'urgent', label: 'Urgent', description: 'Urgent document watermark', text: 'URGENT', fontSize: 48, fontColor: '#FF0000', opacity: 0.5, rotation: -45 },
    { value: 'internal', label: 'Internal Use', description: 'Internal use only watermark', text: 'INTERNAL USE ONLY', fontSize: 36, fontColor: '#0000FF', opacity: 0.3, rotation: -45 }
  ];

  const handlePdfFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedPdfFile(file);
      setError('');
      setResult(null);
      setPreviewUrl('');
    } else if (file) {
      setError('Please select a valid PDF file');
    }
  };

  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImageFile(file);
      setError('');
    } else if (file) {
      setError('Please select a valid image file');
    }
  };

  const handleInputChange = (field: string, value: string | number, formType: 'text' | 'image') => {
    if (formType === 'text') {
      setTextFormData(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      setImageFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const applyPreset = (preset: WatermarkPreset) => {
    setTextFormData(prev => ({
      ...prev,
      text: preset.text,
      fontSize: preset.fontSize,
      fontColor: preset.fontColor,
      opacity: preset.opacity,
      rotation: preset.rotation
    }));
  };

  const handlePreview = async () => {
    if (!selectedPdfFile) {
      setError('Please select a PDF file first');
      return;
    }

    if (activeTab === 'text' && !textFormData.text.trim()) {
      setError('Please enter watermark text');
      return;
    }

    setIsPreviewing(true);
    setError('');

    try {
      if (activeTab === 'text') {
        const previewRequest = {
          file: selectedPdfFile,
          text: textFormData.text,
          position: textFormData.position,
          fontSize: textFormData.fontSize,
          fontColor: textFormData.fontColor,
          opacity: textFormData.opacity,
          rotation: textFormData.rotation,
          startPage: textFormData.startPage,
          endPage: textFormData.endPage,
          excludePages: textFormData.excludePages,
          previewPage: 1 // Default value for backward compatibility
        };

        const response = await addWatermarkService.previewWatermark(previewRequest);
        // console.log('Preview response:', response.previewUrl);
        setPreviewUrl(`${import.meta.env.VITE_PDF_SERVICE_URL}${response.previewUrl}`);
        setSuccess('Preview generated successfully!');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to generate preview');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleAddTextWatermark = async () => {
    if (!selectedPdfFile) {
      setError('Please select a PDF file');
      return;
    }

    const validation = addWatermarkService.validateTextWatermark({
      file: selectedPdfFile,
      ...textFormData,
      endPage: textFormData.endPage ? parseInt(textFormData.endPage) : undefined
    });

    if (!validation.valid) {
      setError(validation.message || 'Validation failed');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const request: AddTextWatermarkRequest = {
        file: selectedPdfFile,
        ...textFormData,
        endPage: textFormData.endPage ? parseInt(textFormData.endPage) : undefined
      };

      const response = await addWatermarkService.addTextWatermark(request);
      setResult(response);
      setSuccess('Text watermark added successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to add watermark');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddImageWatermark = async () => {
    if (!selectedPdfFile || !selectedImageFile) {
      setError('Please select both PDF and image files');
      return;
    }

    const validation = addWatermarkService.validateImageWatermark({
      pdfFile: selectedPdfFile,
      imageFile: selectedImageFile,
      ...imageFormData,
      endPage: imageFormData.endPage ? parseInt(imageFormData.endPage) : undefined
    });

    if (!validation.valid) {
      setError(validation.message || 'Validation failed');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const request: AddImageWatermarkRequest = {
        pdfFile: selectedPdfFile,
        imageFile: selectedImageFile,
        ...imageFormData,
        endPage: imageFormData.endPage ? parseInt(imageFormData.endPage) : undefined
      };

      const response = await addWatermarkService.addImageWatermark(request);
      setResult(response);
      setSuccess('Image watermark added successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to add watermark');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (result?.downloadUrl) {
      try {
        await addWatermarkService.downloadFile(result.downloadUrl, result.filename);
      } catch (error: any) {
        setError(`Failed to download file: ${error.message}`);
      }
    }
  };

  const clearResults = () => {
    setResult(null);
    setSelectedPdfFile(null);
    setSelectedImageFile(null);
    setError('');
    setSuccess('');
    setPreviewUrl('');
    if (pdfFileInputRef.current) pdfFileInputRef.current.value = '';
    if (imageFileInputRef.current) imageFileInputRef.current.value = '';
  };

  return (
    <div className="mx-auto p-2 space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to={`/pdf-tools${location.search}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add Watermark</h1>
              <p className="mt-2 text-sm text-gray-600">
                Add text or image watermarks to your PDF documents with customizable positioning and styling
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-5 h-5 text-green-500 mr-2">✓</div>
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-5 h-5 text-red-500 mr-2">✗</div>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('text')}
            className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'text'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Type className="w-5 h-5" />
            <span>Text Watermark</span>
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'image'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Image className="w-5 h-5" />
            <span>Image Watermark</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* File Upload Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Files</h2>
          
          {/* PDF File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select PDF File *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                ref={pdfFileInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePdfFileSelect}
                className="hidden"
              />
              <button
                onClick={() => pdfFileInputRef.current?.click()}
                className="flex flex-col items-center space-y-2 text-gray-600 hover:text-blue-600 mx-auto"
              >
                <Upload className="w-12 h-12" />
                <span className="text-lg font-medium">
                  {selectedPdfFile ? selectedPdfFile.name : 'Click to upload PDF'}
                </span>
                {selectedPdfFile && (
                  <span className="text-sm text-gray-500">
                    Size: {addWatermarkService.formatFileSize(selectedPdfFile.size)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Image File Upload (only for image watermark tab) */}
          {activeTab === 'image' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Image File *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => imageFileInputRef.current?.click()}
                  className="flex flex-col items-center space-y-2 text-gray-600 hover:text-blue-600 mx-auto"
                >
                  <Image className="w-12 h-12" />
                  <span className="text-lg font-medium">
                    {selectedImageFile ? selectedImageFile.name : 'Click to upload image'}
                  </span>
                  {selectedImageFile && (
                    <span className="text-sm text-gray-500">
                      Size: {addWatermarkService.formatFileSize(selectedImageFile.size)}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Watermark Configuration */}
        {activeTab === 'text' ? (
          /* Text Watermark Configuration */
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Text Watermark Settings</h2>
            
            {/* Watermark Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quick Presets
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {watermarkPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => applyPreset(preset)}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="font-medium text-gray-900">{preset.label}</div>
                    <div className="text-sm text-gray-600">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Watermark Text *
              </label>
              <Input
                type="text"
                value={textFormData.text}
                onChange={(e) => handleInputChange('text', e.target.value, 'text')}
                placeholder="Enter watermark text"
                className="w-full"
              />
            </div>

            {/* Position and Styling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <select
                  value={textFormData.position}
                  onChange={(e) => handleInputChange('position', e.target.value, 'text')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {positionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </label>
                <Input
                  type="number"
                  value={textFormData.fontSize}
                  onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value), 'text')}
                  min="8"
                  max="200"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Color
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={textFormData.fontColor}
                    onChange={(e) => handleInputChange('fontColor', e.target.value, 'text')}
                    className="w-16 h-10 p-1 border border-gray-300 rounded"
                  />
                  <Input
                    type="text"
                    value={textFormData.fontColor}
                    onChange={(e) => handleInputChange('fontColor', e.target.value, 'text')}
                    placeholder="#FF0000"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opacity
                </label>
                <Input
                  type="number"
                  value={textFormData.opacity}
                  onChange={(e) => handleInputChange('opacity', parseFloat(e.target.value), 'text')}
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rotation (degrees)
                </label>
                <Input
                  type="number"
                  value={textFormData.rotation}
                  onChange={(e) => handleInputChange('rotation', parseInt(e.target.value), 'text')}
                  min="-180"
                  max="180"
                  className="w-full"
                />
              </div>
            </div>

            {/* Page Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Page
                </label>
                <Input
                  type="number"
                  value={textFormData.startPage}
                  onChange={(e) => handleInputChange('startPage', parseInt(e.target.value), 'text')}
                  min="1"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Page (optional)
                </label>
                <Input
                  type="number"
                  value={textFormData.endPage}
                  onChange={(e) => handleInputChange('endPage', e.target.value, 'text')}
                  min="1"
                  placeholder="All pages"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exclude Pages (optional)
                </label>
                <Input
                  type="text"
                  value={textFormData.excludePages}
                  onChange={(e) => handleInputChange('excludePages', e.target.value, 'text')}
                  placeholder="e.g., 1,3,5"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Image Watermark Configuration */
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Image Watermark Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <select
                  value={imageFormData.position}
                  onChange={(e) => handleInputChange('position', e.target.value, 'image')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {positionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opacity
                </label>
                <Input
                  type="number"
                  value={imageFormData.opacity}
                  onChange={(e) => handleInputChange('opacity', parseFloat(e.target.value), 'image')}
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rotation (degrees)
                </label>
                <Input
                  type="number"
                  value={imageFormData.rotation}
                  onChange={(e) => handleInputChange('rotation', parseInt(e.target.value), 'image')}
                  min="-180"
                  max="180"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scale
                </label>
                <Input
                  type="number"
                  value={imageFormData.scale}
                  onChange={(e) => handleInputChange('scale', parseFloat(e.target.value), 'image')}
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  className="w-full"
                />
              </div>
            </div>

            {/* Page Range for Image */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Page
                </label>
                <Input
                  type="number"
                  value={imageFormData.startPage}
                  onChange={(e) => handleInputChange('startPage', parseInt(e.target.value), 'image')}
                  min="1"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Page (optional)
                </label>
                <Input
                  type="number"
                  value={imageFormData.endPage}
                  onChange={(e) => handleInputChange('endPage', e.target.value, 'image')}
                  min="1"
                  placeholder="All pages"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exclude Pages (optional)
                </label>
                <Input
                  type="text"
                  value={imageFormData.excludePages}
                  onChange={(e) => handleInputChange('excludePages', e.target.value, 'image')}
                  placeholder="e.g., 1,3,5"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Button
            onClick={handlePreview}
            disabled={!selectedPdfFile || isPreviewing}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>{isPreviewing ? 'Generating...' : 'Preview'}</span>
          </Button>

          <Button
            onClick={activeTab === 'text' ? handleAddTextWatermark : handleAddImageWatermark}
            disabled={isProcessing || !selectedPdfFile || (activeTab === 'image' && !selectedImageFile)}
            className="flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>{isProcessing ? 'Processing...' : 'Add Watermark'}</span>
          </Button>

          <Button
            onClick={clearResults}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear</span>
          </Button>
        </div>

        {/* Preview Section */}
        {previewUrl && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
            <div className="border border-gray-200 rounded-lg p-4">
              <iframe
                src={previewUrl}
                className="w-full h-96 border-0"
                title="Watermark Preview"
              />
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-800">Watermark Added Successfully!</h3>
              <Button
                onClick={handleDownload}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                <span>Download Watermarked PDF</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">File:</span> {result.filename}
              </div>
              <div>
                <span className="font-medium text-gray-700">Size:</span> {addWatermarkService.formatFileSize(result.fileSize)}
              </div>
              <div>
                <span className="font-medium text-gray-700">Pages Processed:</span> {result.pagesProcessed}
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span> {activeTab === 'text' ? 'Text Watermark' : 'Image Watermark'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddWatermark;
