import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  Settings, 
  Palette, 
  Type, 
  MapPin, 
  Calendar,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Stamp,
  RotateCcw,
  Image as ImageIcon,
  X,
  ArrowLeft
} from 'lucide-react';
import { stampService } from '../../services/stampService';

import type { 
  StampRequest, 
  StampResponse, 
  StampOptions, 
  StampType,
  StampLibrary,
  DateFormat
} from '../../types/stamps';
import { Link } from 'react-router-dom';


const AddStamps: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<StampOptions>({
    stampType: { value: 'approved', label: 'Approved', description: 'Approval stamp' },
    customText: '',
    position: 'bottom-right',
    pageNumber: 'all',
    stampColor: 'red',
    stampSize: 'medium',
    includeDate: false,
    dateFormat: 'MM/DD/YYYY',
    opacity: 0.8
  });
  const [result, setResult] = useState<StampResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'options' | 'preview' | 'results'>('options');
  const [stampLibrary, setStampLibrary] = useState<StampLibrary | null>(null);
  const [dateFormats, setDateFormats] = useState<DateFormat[]>([]);
  
  // New state for enhanced features
  const [customStampText, setCustomStampText] = useState('');
  const [customStampImage, setCustomStampImage] = useState<File | null>(null);
  const [stampMode, setStampMode] = useState<'library' | 'custom-text' | 'custom-image'>('library');
  const [stampedPreviewUrl, setStampedPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load stamp library and date formats on component mount
  React.useEffect(() => {
    setStampLibrary(stampService.getStampLibrary());
    setDateFormats(stampService.getDateFormats());
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedImage = event.target.files?.[0];
    if (selectedImage) {
      // Validate image file
      if (!selectedImage.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      if (selectedImage.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image file size must be less than 5MB');
        return;
      }
      setCustomStampImage(selectedImage);
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setCustomStampImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleStampTypeChange = (stampType: StampType) => {
    setOptions(prev => ({ ...prev, stampType }));
  };

  // Removed unused function

  const handlePositionChange = (position: string) => {
    setOptions(prev => ({ ...prev, position: position as any }));
  };

  const handlePageNumberChange = (pageNumber: string) => {
    setOptions(prev => ({ ...prev, pageNumber }));
  };

  const handleStampColorChange = (stampColor: string) => {
    setOptions(prev => ({ ...prev, stampColor: stampColor as any }));
  };

  const handleStampSizeChange = (stampSize: string) => {
    setOptions(prev => ({ ...prev, stampSize: stampSize as any }));
  };

  const handleIncludeDateChange = (includeDate: boolean) => {
    setOptions(prev => ({ ...prev, includeDate }));
  };

  const handleDateFormatChange = (dateFormat: string) => {
    setOptions(prev => ({ ...prev, dateFormat }));
  };

  const handleOpacityChange = (opacity: number) => {
    setOptions(prev => ({ ...prev, opacity }));
  };

  const handleAddStamps = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    // Validate based on stamp mode
    if (stampMode === 'custom-text' && !customStampText.trim()) {
      setError('Please enter custom stamp text');
      return;
    }

    if (stampMode === 'custom-image' && !customStampImage) {
      setError('Please select a custom stamp image');
      return;
    }

    // Prepare stamp type based on mode
    let stampType: StampType;
    let customText = '';

    switch (stampMode) {
      case 'custom-text':
        stampType = { value: 'custom', label: 'Custom Text', description: 'Custom text stamp' };
        customText = customStampText;
        break;
      case 'custom-image':
        stampType = { value: 'custom-image', label: 'Custom Image', description: 'Custom image stamp' };
        customText = customStampImage?.name || '';
        break;
      default:
        stampType = options.stampType;
        customText = options.customText;
    }

    const request: StampRequest = {
      file,
      stampType,
      customText,
      customImage: stampMode === 'custom-image' ? customStampImage || undefined : undefined,
      position: options.position,
      pageNumber: options.pageNumber,
      stampColor: options.stampColor,
      stampSize: options.stampSize,
      includeDate: options.includeDate,
      dateFormat: options.dateFormat,
      opacity: options.opacity
    };

    const validation = stampService.validateRequest(request);
    if (!validation.valid) {
      setError(validation.message || 'Invalid request');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await stampService.addStamps(request);
      setResult(response);
      setActiveTab('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add stamps');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;

    try {
      await stampService.downloadFile(result.downloadUrl, result.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setActiveTab('options');
    setCustomStampText('');
    setCustomStampImage(null);
    setStampMode('library');
    setStampedPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const generateStampedPreview = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      // Determine stamp type and custom text based on mode
      let stampType = options.stampType;
      let customText = options.customText;

      switch (stampMode) {
        case 'custom-text':
          stampType = { value: 'custom', label: 'Custom Text', description: 'Custom text stamp' };
          customText = customStampText;
          break;
        case 'custom-image':
          stampType = { value: 'custom-image', label: 'Custom Image', description: 'Custom image stamp' };
          customText = customStampImage?.name || '';
          break;
        default:
          stampType = options.stampType;
          customText = options.customText;
      }

      const request: StampRequest = {
        file,
        stampType,
        customText,
        customImage: stampMode === 'custom-image' ? customStampImage || undefined : undefined,
        position: options.position,
        pageNumber: options.pageNumber,
        stampColor: options.stampColor,
        stampSize: options.stampSize,
        includeDate: options.includeDate,
        dateFormat: options.dateFormat,
        opacity: options.opacity
      };

      const response = await stampService.getPreview(request);
      
      if (response.success && response.previewUrl) {
        setStampedPreviewUrl(response.previewUrl);
        setActiveTab('preview');
      }
    } catch (err) {
      console.error('Error generating preview:', err);
      setError('Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const getStampPreview = () => {
    let stampText = '';
    
    switch (stampMode) {
      case 'custom-text':
        stampText = customStampText || 'Custom Text';
        break;
      case 'custom-image':
        stampText = customStampImage?.name || 'Custom Image';
        break;
      default:
        stampText = options.stampType.value === 'custom' 
          ? options.customText 
          : options.stampType.label;
    }
    
    const dateText = options.includeDate 
      ? `\n${new Date().toLocaleDateString()}`
      : '';

    return `${stampText}${dateText}`;
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      black: 'bg-black',
      gray: 'bg-gray-500',
      orange: 'bg-orange-500',
      purple: 'bg-purple-500'
    };
    return colorMap[color] || 'bg-red-500';
  };

  const getSizeClass = (size: string) => {
    const sizeMap: Record<string, string> = {
      small: 'text-xs',
      medium: 'text-sm',
      large: 'text-base',
      xlarge: 'text-lg'
    };
    return sizeMap[size] || 'text-sm';
  };

  return (
  <div className="mx-auto p-2 bg-white space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-6">
              <Link
                to="/pdf-tools"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Add Stamp</h1>
                <p className="mt-2 text-sm text-gray-600">
                 Insert stamps and custom annotations
                </p>
              </div>
            </div>
          </div>
        </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select PDF File
        </label>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Choose File
          </button>
          {file && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
              <span className="text-gray-400">
                ({stampService.formatFileSize(file.size)})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('options')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'options'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="h-4 w-4 inline mr-2" />
          Options
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'preview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Eye className="h-4 w-4 inline mr-2" />
          Preview
        </button>
        {result && (
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'results'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CheckCircle className="h-4 w-4 inline mr-2" />
            Results
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'options' && (
        <div >
          {/* Left Column - Stamp Configuration */}
          <div className="space-y-6">
            {/* Stamp Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Stamp Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setStampMode('library')}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    stampMode === 'library'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Stamp className="h-4 w-4 inline mr-1" />
                  Library
                </button>
                <button
                  onClick={() => setStampMode('custom-text')}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    stampMode === 'custom-text'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Type className="h-4 w-4 inline mr-1" />
                  Custom Text
                </button>
                <button
                  onClick={() => setStampMode('custom-image')}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    stampMode === 'custom-image'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ImageIcon className="h-4 w-4 inline mr-1" />
                  Custom Image
                </button>
              </div>
            </div>

            {/* Stamp Library */}
            {stampMode === 'library' && stampLibrary && (
              <div className='border-b border-gray-200 p-2'>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose from Library
                </label>
                <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                  {stampLibrary.categories.map(category => (
                    <div key={category.id} className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-600">{category.name}</h4>
                      <div className="space-y-1">
                        {category.stamps.map(stamp => (
                          <button
                            key={stamp.id}
                            onClick={() => handleStampTypeChange({
                              value: stamp.type,
                              label: stamp.name,
                              description: stamp.description
                            })}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-colors ${
                              options.stampType.value === stamp.type
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="font-medium">{stamp.name}</div>
                            <div className="text-xs text-gray-500">{stamp.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Text Input */}
            {stampMode === 'custom-text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Stamp Text
                </label>
                <textarea
                  value={customStampText}
                  onChange={(e) => setCustomStampText(e.target.value)}
                  placeholder="Enter your custom stamp text..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {customStampText.length}/200 characters
                </p>
              </div>
            )}

            {/* Custom Image Upload */}
            {stampMode === 'custom-image' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Stamp Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {customStampImage ? (
                    <div className="text-center">
                      <img
                        src={URL.createObjectURL(customStampImage)}
                        alt="Custom stamp"
                        className="max-h-32 mx-auto mb-2 rounded"
                      />
                      <p className="text-sm text-gray-600 mb-2">{customStampImage.name}</p>
                      <button
                        onClick={handleRemoveImage}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        <X className="h-4 w-4 inline mr-1" />
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Upload a custom stamp image</p>
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Choose Image
                      </button>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPG, PNG, GIF. Max size: 5MB
                </p>
              </div>
            )}

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                Position
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  'top-left', 'top-center', 'top-right',
                  'center-left', 'center', 'center-right',
                  'bottom-left', 'bottom-center', 'bottom-right'
                ].map(position => (
                  <button
                    key={position}
                    onClick={() => handlePositionChange(position)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      options.position === position
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {position.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Number
              </label>
              <input
                type="text"
                value={options.pageNumber}
                onChange={(e) => handlePageNumberChange(e.target.value)}
                placeholder="all, 1, 2, 3..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use "all" for all pages, or specify page numbers (e.g., "1,3,5")
              </p>
            </div>

            {/* Color and Size */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="h-4 w-4 inline mr-1" />
                  Stamp Color
                </label>
                <div className="flex gap-2">
                  {['red', 'blue', 'green', 'black', 'gray', 'orange', 'purple'].map(color => (
                    <button
                      key={color}
                      onClick={() => handleStampColorChange(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        options.stampColor === color ? 'border-gray-800' : 'border-gray-300'
                      } ${getColorClass(color)}`}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Type className="h-4 w-4 inline mr-1" />
                  Stamp Size
                </label>
                <div className="flex gap-2">
                  {['small', 'medium', 'large', 'xlarge'].map(size => (
                    <button
                      key={size}
                      onClick={() => handleStampSizeChange(size)}
                      className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                        options.stampSize === size
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date Options */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeDate"
                  checked={options.includeDate}
                  onChange={(e) => handleIncludeDateChange(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="includeDate" className="ml-2 text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Include Date
                </label>
              </div>

              {options.includeDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Format
                  </label>
                  <select
                    value={options.dateFormat}
                    onChange={(e) => handleDateFormatChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {dateFormats.map(format => (
                      <option key={format.value} value={format.value}>
                        {format.label} ({format.example})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Opacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opacity: {Math.round(options.opacity * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={options.opacity}
                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

        </div>
      )}

      {activeTab === 'preview' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Stamp Preview</h3>
          
          {stampedPreviewUrl ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Preview Generated Successfully!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  This shows how your PDF will look with the stamp applied.
                </p>
              </div>
              
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <iframe
                  src={stampedPreviewUrl}
                  className="w-full h-96"
                  title="Stamped PDF Preview"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <Eye className="h-5 w-5" />
                  <span className="font-medium">Generate Preview</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Click the "Preview" button to see how your PDF will look with the stamp applied.
                </p>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
                <div className="relative w-full h-96 bg-white border border-gray-200 rounded-lg">
                  {/* Position indicator */}
                  <div className={`absolute ${options.position === 'top-left' ? 'top-4 left-4' : 
                    options.position === 'top-center' ? 'top-4 left-1/2 transform -translate-x-1/2' :
                    options.position === 'top-right' ? 'top-4 right-4' :
                    options.position === 'center-left' ? 'top-1/2 left-4 transform -translate-y-1/2' :
                    options.position === 'center' ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' :
                    options.position === 'center-right' ? 'top-1/2 right-4 transform -translate-y-1/2' :
                    options.position === 'bottom-left' ? 'bottom-4 left-4' :
                    options.position === 'bottom-center' ? 'bottom-4 left-1/2 transform -translate-x-1/2' :
                    'bottom-4 right-4'}`}>
                    {stampMode === 'custom-image' && customStampImage ? (
                      <img
                        src={URL.createObjectURL(customStampImage)}
                        alt="Stamp preview"
                        className="max-h-16 max-w-32 object-contain"
                        style={{ opacity: options.opacity }}
                      />
                    ) : (
                      <div className={`px-4 py-2 rounded-lg border-2 ${getColorClass(options.stampColor)} text-white ${getSizeClass(options.stampSize)} font-bold text-center`}
                           style={{ opacity: options.opacity }}>
                        {getStampPreview()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Stamps added successfully!</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Stamp Details</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Total Stamps: {result.stampDetails.totalStamps}</div>
                <div>Pages Stamped: {result.stampDetails.pagesStamped}</div>
                <div>Stamp Type: {options.stampType.label}</div>
                <div>Position: {options.position}</div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">File Information</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Original Size: {stampService.formatFileSize(result.originalFileSize)}</div>
                <div>New Size: {stampService.formatFileSize(result.fileSize)}</div>
                <div>Size Change: {result.fileSize > result.originalFileSize ? '+' : ''}{stampService.formatFileSize(result.fileSize - result.originalFileSize)}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Stamped PDF
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Process Another File
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      {activeTab !== 'results' && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleAddStamps}
            disabled={!file || loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Stamp className="h-4 w-4" />
            )}
            {loading ? 'Adding Stamps...' : 'Add Stamps'}
          </button>

          <button
            onClick={generateStampedPreview}
            disabled={!file || loading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      )}
    </div>
  );
};

export default AddStamps;
