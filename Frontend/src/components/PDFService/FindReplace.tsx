import React, { useState, useRef } from 'react';
import { findReplaceService } from '../../services/findReplaceService';
import type {
  FindReplaceRequest,
  FindReplaceResponse,
  FindReplaceOptions,
  // FindReplaceMatch,
  FindReplacePreview
} from '../../types/findReplace';
import { Button } from '../DocumentService/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  CheckCircle, 
  FileText, 
  Settings, 
  RotateCcw, 
  Info, 
  Search,
  Replace,
  Regex,
  CaseSensitive,
  WholeWord,
  FileSearch,
  BarChart3,
  AlertCircle,
  CheckSquare,
  XCircle,
  Search as FindReplaceIcon,
  Download,
  Eye,
  Zap,
} from 'lucide-react';
import FindReplaceToolbar from './FindReplaceToolbar';

const FindReplace: React.FC = () => {
   const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<FindReplaceResponse | null>(null);
  const [preview, setPreview] = useState<FindReplacePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'options' | 'matches' | 'results' | 'preview'>('options');
  const [options, setOptions] = useState<FindReplaceOptions>({
    searchText: '',
    replaceText: '',
    useRegex: false,
    caseSensitive: false,
    wholeWord: false,
    replaceAll: false,
    selectedMatches: []
  });
  const [showToolbar, setShowToolbar] = useState(false);
  // const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      setPreview(null);
      setSuccess(null);
    } else if (file) {
      setError('Please select a valid PDF file');
    }
  };

  const handleOptionChange = (key: keyof FindReplaceOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleMatchSelection = (matchIndex: number, isSelected: boolean) => {
    setOptions(prev => {
      const currentMatches = prev.selectedMatches || [];
      const newSelectedMatches = isSelected 
        ? [...currentMatches, matchIndex]
        : currentMatches.filter(index => index !== matchIndex);
      return { ...prev, selectedMatches: newSelectedMatches };
    });
  };

  const handleSelectAllMatches = () => {
    if (preview?.matches) {
      setOptions(prev => ({
        ...prev,
        selectedMatches: preview.matches.map((_, index) => index)
      }));
    }
  };

  const handleDeselectAllMatches = () => {
    setOptions(prev => ({ ...prev, selectedMatches: [] }));
  };

  const handlePreview = async () => {
    if (!selectedFile || !options.searchText.trim()) {
      setError('Please select a PDF file and enter search text');
      return;
    }

    const request: Omit<FindReplaceRequest, 'replaceText' | 'replaceAll'> = {
      file: selectedFile,
      searchText: options.searchText,
      useRegex: options.useRegex,
      caseSensitive: options.caseSensitive,
      wholeWord: options.wholeWord
    };

    const validation = findReplaceService.validateRequest(request as FindReplaceRequest);
    if (!validation.valid) {
      setError(validation.message || 'Validation failed');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await findReplaceService.previewFindReplace(request);
      setPreview(response);
      setSuccess(`Found ${response.totalMatches} matches`);
      setActiveTab('preview');
    } catch (err: any) {
      console.error('Preview error:', err);
      setError(`Failed to preview: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFindReplace = async () => {
    if (!selectedFile || !options.searchText.trim()) {
      setError('Please select a PDF file and enter search text');
      return;
    }

    const request: FindReplaceRequest = {
      file: selectedFile,
      ...options
    };

    console.log('Sending request:', {
      searchText: request.searchText,
      replaceText: request.replaceText,
      replaceAll: request.replaceAll,
      selectedMatches: request.selectedMatches,
      selectedMatchesLength: request.selectedMatches?.length
    });

    const validation = findReplaceService.validateRequest(request);
    if (!validation.valid) {
      setError(validation.message || 'Validation failed');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await findReplaceService.findReplace(request);
      setResult(response);
      setSuccess('Find & Replace completed successfully!');
      setActiveTab('results');
    } catch (err: any) {
      console.error('Find & Replace error:', err);
      setError(`Failed to perform find & replace: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (result?.downloadUrl) {
      try {
        await findReplaceService.downloadFile(result.downloadUrl, result.filename);
      } catch (err: any) {
        console.error('Download error:', err);
        setError(`Failed to download file: ${err.message}`);
      }
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setPreview(null);
    setError(null);
    setSuccess(null);
    setActiveTab('options');
    setOptions({
      searchText: '',
      replaceText: '',
      useRegex: false,
      caseSensitive: false,
      wholeWord: false,
      replaceAll: false,
      selectedMatches: []
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleToolbar = () => {
    setShowToolbar(!showToolbar);
  };

  const handleToolbarFind = (toolbarOptions: FindReplaceOptions) => {
    setOptions(toolbarOptions);
    if (selectedFile) {
      handlePreview();
    }
  };

  const handleToolbarReplace = (toolbarOptions: FindReplaceOptions) => {
    setOptions(toolbarOptions);
    if (selectedFile) {
      handleFindReplace();
    }
  };

  const handleToolbarReplaceAll = (toolbarOptions: FindReplaceOptions) => {
    setOptions({ ...toolbarOptions, replaceAll: true });
    if (selectedFile) {
      handleFindReplace();
    }
  };

  const stats = result ? findReplaceService.calculateStats(result.findReplaceResults) : null;

  return (
    <div className="mx-auto p-2 space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                   to={`/pdf-tools${location.search}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Find & Replace</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Search and replace text across PDF documents with advanced options
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={toggleToolbar}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Quick Find</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toolbar */}
      <FindReplaceToolbar
        isVisible={showToolbar}
        onClose={() => setShowToolbar(false)}
        onFind={handleToolbarFind}
        onReplace={handleToolbarReplace}
        onReplaceAll={handleToolbarReplaceAll}
        matches={preview?.matches || []}
        // currentMatchIndex={currentMatchIndex}
        totalMatches={preview?.totalMatches || 0}
        isProcessing={isProcessing}
        error={error || undefined}
      />

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - File Upload and Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Upload PDF File
            </h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center space-y-2 text-gray-600 hover:text-blue-600 mx-auto"
              >
                <Upload className="w-12 h-12" />
                <span className="text-lg font-medium">
                  {selectedFile ? selectedFile.name : 'Click to upload PDF'}
                </span>
                {selectedFile && (
                  <span className="text-sm text-gray-500">
                    Size: {findReplaceService.formatFileSize(selectedFile.size)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Configuration Options */}
          {selectedFile && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-center mb-6">
                <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border">
                  <button
                    onClick={() => setActiveTab('options')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                      activeTab === 'options'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Options</span>
                  </button>
                  {preview && (
                    <button
                      onClick={() => setActiveTab('matches')}
                      className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                        activeTab === 'matches'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <FileSearch className="w-4 h-4" />
                      <span>Matches ({preview.matches.length})</span>
                    </button>
                  )}
                  {preview && (
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                        activeTab === 'preview'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                  )}
                  {result && (
                    <button
                      onClick={() => setActiveTab('results')}
                      className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                        activeTab === 'results'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Results</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Options Tab */}
              {activeTab === 'options' && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <FindReplaceIcon className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Find & Replace Configuration</h3>
                    <p className="text-sm text-gray-600">Configure search and replace options</p>
                  </div>

                  {/* Search and Replace Text */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 border-b pb-2 flex items-center">
                      <Search className="w-4 h-4 mr-2" />
                      Search & Replace
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Search Text *
                        </label>
                        <input
                          type="text"
                          value={options.searchText}
                          onChange={(e) => handleOptionChange('searchText', e.target.value)}
                          placeholder="Enter text to search for..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Replace With
                        </label>
                        <input
                          type="text"
                          value={options.replaceText}
                          onChange={(e) => handleOptionChange('replaceText', e.target.value)}
                          placeholder="Enter replacement text..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Search Options */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 border-b pb-2 flex items-center">
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Search Options
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.useRegex}
                          onChange={(e) => handleOptionChange('useRegex', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <Regex className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Use Regex</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.caseSensitive}
                          onChange={(e) => handleOptionChange('caseSensitive', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <CaseSensitive className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Case Sensitive</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.wholeWord}
                          onChange={(e) => handleOptionChange('wholeWord', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <WholeWord className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Whole Word</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.replaceAll}
                          onChange={(e) => handleOptionChange('replaceAll', e.target.checked)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <Zap className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Replace All</span>
                      </label>
                    </div>
                    
                    {/* Help text for Replace All */}
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">Replace All Option:</p>
                          <ul className="space-y-1 text-xs">
                            <li>• <strong>Unchecked:</strong> Replaces only the first match found</li>
                            <li>• <strong>Checked:</strong> Replaces all matches found in the document</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center space-x-4 mt-6">
                    <Button
                      onClick={handlePreview}
                      disabled={isProcessing || !selectedFile || !options.searchText.trim()}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{isProcessing ? 'Processing...' : 'Preview'}</span>
                    </Button>

                    <Button
                      onClick={handleFindReplace}
                      disabled={isProcessing || !selectedFile || !options.searchText.trim()}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                    >
                      <Replace className="w-4 h-4" />
                      <span>
                        {isProcessing 
                          ? 'Processing...' 
                          : options.replaceAll 
                            ? 'Replace All' 
                            : 'Replace First'
                        }
                      </span>
                    </Button>

                    <Button
                      onClick={resetForm}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Matches Tab */}
              {activeTab === 'matches' && preview && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <FileSearch className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Select Matches to Replace</h3>
                    <p className="text-sm text-gray-600">
                      Found {preview.totalMatches} matches. Select which ones to replace.
                    </p>
                  </div>

                  {/* Selection Controls */}
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {(options.selectedMatches || []).length} of {preview.matches.length} selected
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleSelectAllMatches}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        onClick={handleDeselectAllMatches}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>

                  {/* Matches List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {preview.matches.map((match, index) => (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg transition-colors ${
                          (options.selectedMatches || []).includes(index)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={(options.selectedMatches || []).includes(index)}
                            onChange={(e) => handleMatchSelection(index, e.target.checked)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                Match #{index + 1}
                              </span>
                              <span className="text-xs text-gray-500">
                                Page {match.page} • Position {match.position}
                              </span>
                            </div>
                            <div className="text-sm text-gray-700 bg-gray-100 p-2 rounded font-mono">
                              {match.context}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Found: <span className="font-semibold text-blue-600">"{match.text}"</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Replace Selected Button */}
                  {(options.selectedMatches || []).length > 0 && (
                    <div className="text-center space-y-3">
                      <Button
                        onClick={handleFindReplace}
                        disabled={isProcessing || !options.replaceText.trim()}
                        className={`px-8 py-3 ${
                          isProcessing || !options.replaceText.trim()
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                        } text-white`}
                      >
                        <Replace className="w-4 h-4 mr-2" />
                        Replace {(options.selectedMatches || []).length} Selected Match{(options.selectedMatches || []).length > 1 ? 'es' : ''}
                      </Button>
                      
                      {!options.replaceText.trim() && (
                        <div className="text-sm text-red-600">
                          Please enter replacement text in the Options tab
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Preview Tab */}
              {activeTab === 'preview' && preview && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <Eye className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Search Preview</h3>
                    <p className="text-sm text-gray-600">Found {preview.totalMatches} matches</p>
                  </div>

                  {/* Visual Legend */}
                  {options.replaceText.trim() && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <span className="bg-red-100 text-red-600 line-through px-2 py-1 rounded text-xs">OLD</span>
                          <span className="text-gray-600">= Text to be replaced</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">NEW</span>
                          <span className="text-gray-600">= Replacement text</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Matches */}
                  {preview.matches.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-800 border-b pb-2 flex items-center">
                        <FileSearch className="w-4 h-4 mr-2" />
                        Matches ({preview.matches.length})
                      </h4>
                      
                      <div className="max-h-96 overflow-y-auto space-y-3">
                        {preview.matches.map((match, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-600">Match {index + 1}</span>
                              <span className="text-xs text-gray-500">Page {match.page}</span>
                            </div>
                            <div className="text-sm text-gray-700">
                              <span className="text-gray-500">
                                {match.context.substring(0, match.matchStart)}
                              </span>
                              {options.replaceText.trim() ? (
                                <>
                                  <span className="bg-red-100 text-red-600 line-through px-1 rounded">
                                    {match.context.substring(match.matchStart, match.matchEnd)}
                                  </span>
                                  <span className="bg-green-100 text-green-600 px-1 rounded ml-1">
                                    {options.replaceText}
                                  </span>
                                </>
                              ) : (
                                <span className="bg-yellow-200 px-1 rounded">
                                  {match.context.substring(match.matchStart, match.matchEnd)}
                                </span>
                              )}
                              <span className="text-gray-500">
                                {match.context.substring(match.matchEnd)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Matches */}
                  {preview.matches.length === 0 && (
                    <div className="text-center py-8">
                      <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">No Matches Found</h3>
                      <p className="text-gray-600">Try adjusting your search criteria or check the spelling.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Results Tab */}
              {activeTab === 'results' && result && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Find & Replace Results</h3>
                    <p className="text-sm text-gray-600">Operation completed successfully</p>
                  </div>

                  {/* Statistics */}
                  {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalMatches}</div>
                        <div className="text-sm text-blue-800">Total Matches</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.totalReplacements}</div>
                        <div className="text-sm text-green-800">Replacements</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{stats.pagesAffected}</div>
                        <div className="text-sm text-purple-800">Pages Affected</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {result.findReplaceResults.searchText.length}
                        </div>
                        <div className="text-sm text-orange-800">Search Length</div>
                      </div>
                    </div>
                  )}

                  {/* Download Button */}
                  <div className="text-center">
                    <Button
                      onClick={handleDownload}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 mx-auto"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Processed PDF</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Results and Information */}
        <div className="space-y-6">
          {/* Results Section */}
          {result && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h3 className="text-lg font-semibold text-green-800">Find & Replace Complete!</h3>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">File:</span>
                  <span className="text-sm text-gray-600">{result.filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Pages:</span>
                  <span className="text-sm text-gray-600">{result.totalPages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Search:</span>
                  <span className="text-sm text-gray-600 font-mono">{result.findReplaceResults.searchText}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Replace:</span>
                  <span className="text-sm text-gray-600 font-mono">{result.findReplaceResults.replaceText}</span>
                </div>
              </div>
            </div>
          )}

          {/* Help Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              How It Works
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>1. Upload:</strong> Select your PDF file</p>
              <p><strong>2. Configure:</strong> Set search and replace options</p>
              <p><strong>3. Preview:</strong> See matches before replacing</p>
              <p><strong>4. Process:</strong> Perform find & replace operation</p>
              <p><strong>5. Download:</strong> Get your processed PDF</p>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Features
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Regular expression support</p>
              <p>• Case-sensitive matching</p>
              <p>• Whole word matching</p>
              <p>• Preview before replacing</p>
              <p>• Batch operations</p>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-400">
            <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-1 text-sm text-blue-700">
              <p><strong>Ctrl+F:</strong> Open find toolbar</p>
              <p><strong>Ctrl+H:</strong> Toggle replace mode</p>
              <p><strong>F3:</strong> Find next match</p>
              <p><strong>Shift+F3:</strong> Find previous match</p>
              <p><strong>Escape:</strong> Close toolbar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Processing find & replace...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindReplace;
