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
  RotateCcw,
  Info,
  Search,
  Replace,
  Regex,
  CaseSensitive,
  WholeWord,
  FileSearch,
  AlertCircle,
  CheckSquare,
  XCircle,
  Search as FindReplaceIcon,
  Download,
  Eye,
  Zap,
} from 'lucide-react';
// import FindReplaceToolbar from './FindReplaceToolbar';

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
  // const [showToolbar, setShowToolbar] = useState(false);
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

    if (!options.replaceText || !options.replaceText.trim()) {
      setError('Please enter replacement text before processing.');
      // Keep user on Options tab
      setActiveTab('options');
      return;
    }

    // Block processing if we already know there are no matches
    if (preview && preview.totalMatches === 0) {
      setError('No matches found. Please adjust your search and try again.');
      setActiveTab('options');
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

      const totalMatches = response?.findReplaceResults?.totalMatches ?? 0;

      if (totalMatches === 0) {
        setError('No matches found. Please adjust your search and try again.');
        setResult(null);
        // Do not navigate to results when nothing matched
        setActiveTab('options');
        return;
      } else {
        setSuccess('Find & Replace completed successfully!');
      }
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

  const removeFile = () => {
    setSelectedFile(null);
    setResult(null);
    setPreview(null);
    setError(null);
    setSuccess(null);
    setActiveTab('options');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  // const toggleToolbar = () => {
  //   setShowToolbar(!showToolbar);
  // };

  // const handleToolbarFind = (toolbarOptions: FindReplaceOptions) => {
  //   setOptions(toolbarOptions);
  //   if (selectedFile) {
  //     handlePreview();
  //   }
  // };

  // const handleToolbarReplace = (toolbarOptions: FindReplaceOptions) => {
  //   setOptions(toolbarOptions);
  //   if (selectedFile) {
  //     handleFindReplace();
  //   }
  // };

  // const handleToolbarReplaceAll = (toolbarOptions: FindReplaceOptions) => {
  //   setOptions({ ...toolbarOptions, replaceAll: true });
  //   if (selectedFile) {
  //     handleFindReplace();
  //   }
  // };

  const stats = result ? findReplaceService.calculateStats(result.findReplaceResults) : null;

  return (
    <div className="mx-auto p-2 space-y-6">
      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setError(null)}></div>
          <div className="relative bg-background rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-destructive mt-0.5" />
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-foreground mb-1">Action required</h4>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
            <div className="mt-4 text-right">
              <Button onClick={() => setError(null)} className="bg-primary hover:bg-primary/90">OK</Button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-background shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                to={`/pdf-tools${location.search}`}
                className="p-2 hover:bg-background rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Find & Replace</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Search and replace text across PDF documents with advanced options
                </p>
              </div>
            </div>
            {/* <div className="flex items-center space-x-2">
              <Button
                onClick={toggleToolbar}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Quick Find</span>
              </Button>
            </div> */}
          </div>
        </div>
      </div>

      {/* Floating Toolbar */}
      {/* <FindReplaceToolbar
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
      /> */}

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-success border border-success rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-success-foreground mr-2" />
            <p className="text-success-foreground">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-destructive border border-destructive rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-destructive-foreground mr-2" />
            <p className="text-destructive-foreground">{error}</p>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-6 ${selectedFile ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
        {/* Left Panel - File Upload and Configuration */}
        <div className={`space-y-6 ${selectedFile ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
          {/* File Upload Section */}
            <div className="bg-background rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Upload PDF File
              </h2>            
            </div>

            {!selectedFile ? (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center space-y-2 text-muted-foreground hover:text-primary mx-auto"
                >
                  <Upload className="w-12 h-12" />
                  <span className="text-lg font-medium">Click to upload PDF</span>
                  <span className="text-sm text-muted-foreground">Maximum file size: 2MB</span>
                </button>
              </div>
            ) : (
              <div className="bg-success border border-success rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{selectedFile.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Size: {findReplaceService.formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="text-destructive hover:text-destructive/80 p-1 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            {/* Keyboard Shortcuts */}

          </div>
            {!selectedFile && (
          <div className="bg-background rounded-xl shadow-lg p-6 border-l-4 border-primary">
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><strong>Ctrl+F:</strong> Open find toolbar</p>
              <p><strong>Ctrl+H:</strong> Toggle replace mode</p>
              <p><strong>F3:</strong> Find next match</p>
              <p><strong>Shift+F3:</strong> Find previous match</p>
              <p><strong>Escape:</strong> Close toolbar</p>
            </div>
          </div>
            )}
          {/* Configuration Options */}
          {selectedFile && (
            <div className="bg-background rounded-xl shadow-lg p-6">
              {/* Tab Navigation */}
              <div className="flex border-b border-border mb-6">
                <button
                  onClick={() => setActiveTab('options')}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'options'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-primary'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>Options</span>
                </button>
                
                {preview && (
                  <>
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'preview'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-muted-foreground hover:text-primary'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('matches')}
                      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'matches'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-primary'
                      }`}
                    >
                      <FileSearch className="w-4 h-4" />
                      <span>Select Matches</span>
                    </button>
                  </>
                )}
                
                {result && result.findReplaceResults && result.findReplaceResults.totalMatches > 0 && (
                  <button
                    onClick={() => setActiveTab('results')}
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'results'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-primary'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Results</span>
                  </button>
                )}
              </div>

              {/* Options Tab */}
              {activeTab === 'options' && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <FindReplaceIcon className="w-12 h-12 mx-auto mb-2 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Find & Replace Configuration</h3>
                    <p className="text-sm text-muted-foreground">Configure search and replace options</p>
                  </div>

                  {/* Search and Replace Text */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-foreground border-b pb-2 flex items-center">
                      <Search className="w-4 h-4 mr-2" />
                      Search & Replace
                    </h4>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                          Search Text *
                        </label>
                        <input
                          type="text"
                          value={options.searchText}
                          onChange={(e) => handleOptionChange('searchText', e.target.value)}
                          placeholder="Enter text to search for..."
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                          Replace With
                        </label>
                        <input
                          type="text"
                          value={options.replaceText}
                          onChange={(e) => handleOptionChange('replaceText', e.target.value)}
                          placeholder="Enter replacement text..."
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Search Options */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-foreground border-b pb-2 flex items-center">
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Search Options
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.useRegex}
                          onChange={(e) => handleOptionChange('useRegex', e.target.checked)}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <Regex className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Use Regex</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.caseSensitive}
                          onChange={(e) => handleOptionChange('caseSensitive', e.target.checked)}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <CaseSensitive className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Case Sensitive</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.wholeWord}
                          onChange={(e) => handleOptionChange('wholeWord', e.target.checked)}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <WholeWord className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Whole Word</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.replaceAll}
                          onChange={(e) => handleOptionChange('replaceAll', e.target.checked)}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <Zap className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">Replace All</span>
                      </label>
                    </div>

                    {/* Help text for Replace All */}
                    <div className="mt-3 p-3 bg-primary/10 border border-primary rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-foreground">
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
                      className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{isProcessing ? 'Processing...' : 'Preview'}</span>
                    </Button>

                    <Button
                      onClick={handleFindReplace}
                      disabled={isProcessing || !selectedFile || !options.searchText.trim() || (!!preview && preview.totalMatches === 0)}
                      className="flex items-center space-x-2 bg-success hover:bg-success/90"
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
                    {preview && preview.totalMatches === 0 && (
                        <div className="text-sm text-destructive-foreground bg-destructive/10 px-3 py-2 rounded-lg">
                        No matches found to replace
                      </div>
                    )}

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
                    <FileSearch className="w-12 h-12 mx-auto mb-2 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Select Matches to Replace</h3>
                    <p className="text-sm text-muted-foreground">
                      Found {preview.totalMatches} matches. Select which ones to replace.
                    </p>
                  </div>

                  {/* Navigation and Selection Controls */}
                  <div className="flex justify-between items-center p-4 bg-background rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => setActiveTab('options')}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Options</span>
                      </Button>
                      <Button
                        onClick={() => setActiveTab('preview')}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Preview</span>
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-muted-foreground">
                        {(options.selectedMatches || []).length} of {preview.matches.length} selected
                      </span>
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
                  </div>

                  {/* Matches List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {preview.matches.map((match, index) => (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg transition-colors ${(options.selectedMatches || []).includes(index)
                            ? 'border-success bg-success/10'
                            : 'border-border hover:border-primary'
                          }`}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={(options.selectedMatches || []).includes(index)}
                            onChange={(e) => handleMatchSelection(index, e.target.checked)}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-foreground">
                                Match #{index + 1}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Page {match.page} • Position {match.position}
                              </span>
                            </div>
                              <div className="text-sm text-foreground bg-background p-2 rounded font-mono">
                              {match.context}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Found: <span className="font-semibold text-primary">"{match.text}"</span>
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
                        className={`px-8 py-3 ${isProcessing || !options.replaceText.trim()
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-success hover:bg-success/90'
                          } text-white`}
                      >
                        <Replace className="w-4 h-4 mr-2" />
                        Replace {(options.selectedMatches || []).length} Selected Match{(options.selectedMatches || []).length > 1 ? 'es' : ''}
                      </Button>

                      {!options.replaceText.trim() && (
                        <div className="text-sm text-destructive-foreground">
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
                    <Eye className="w-12 h-12 mx-auto mb-2 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Search Preview</h3>
                    <p className="text-sm text-muted-foreground">Found {preview.totalMatches} matches</p>
                  </div>

                  {/* Navigation and Action Buttons */}
                  <div className="flex justify-between items-center p-4 bg-background rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => setActiveTab('options')}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Options</span>
                      </Button>
                      <Button
                        onClick={() => setActiveTab('matches')}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <FileSearch className="w-4 h-4" />
                        <span>Select Matches</span>
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {options.replaceText.trim() ? (
                        <>
                          <Button
                            onClick={() => {
                              setOptions(prev => ({ ...prev, replaceAll: true }));
                              handleFindReplace();
                            }}
                            disabled={isProcessing || (preview && preview.totalMatches === 0)}
                            className="flex items-center space-x-2 bg-success hover:bg-success/90"
                          >
                            <Replace className="w-4 h-4" />
                            <span>Replace All</span>
                          </Button>
                          <Button
                            onClick={() => {
                              setOptions(prev => ({ ...prev, replaceAll: false }));
                              handleFindReplace();
                            }}
                            disabled={isProcessing || (preview && preview.totalMatches === 0)}
                            className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
                          >
                            <Replace className="w-4 h-4" />
                            <span>Replace First</span>
                          </Button>
                        </>
                      ) : (
                        <div className="text-sm text-destructive-foreground bg-destructive/10 px-3 py-2 rounded-lg">
                          Enter replacement text to proceed
                        </div>
                      )}
                      {preview && preview.totalMatches === 0 && (
                          <div className="text-sm text-destructive-foreground bg-destructive/10 px-3 py-2 rounded-lg">
                          No matches found to replace
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visual Legend */}
                  {options.replaceText.trim() && (
                    <div className="bg-primary/10 border border-primary rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <span className="bg-destructive/10 text-destructive line-through px-2 py-1 rounded text-xs">OLD</span>
                          <span className="text-muted-foreground">= Text to be replaced</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="bg-success/10 text-success px-2 py-1 rounded text-xs">NEW</span>
                          <span className="text-muted-foreground">= Replacement text</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Matches */}
                  {preview.matches.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-foreground border-b pb-2 flex items-center">
                        <FileSearch className="w-4 h-4 mr-2" />
                        Matches ({preview.matches.length})
                      </h4>

                      <div className="max-h-96 overflow-y-auto space-y-3">
                        {preview.matches.map((match, index) => (
                          <div key={index} className="border border-border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-foreground">Match {index + 1}</span>
                              <span className="text-xs text-muted-foreground">Page {match.page}</span>
                            </div>
                            <div className="text-sm text-foreground">
                              <span className="text-muted-foreground">
                                {match.context.substring(0, match.matchStart)}
                              </span>
                              {options.replaceText.trim() ? (
                                <>
                                  <span className="bg-destructive/10 text-destructive line-through px-1 rounded">
                                    {match.context.substring(match.matchStart, match.matchEnd)}
                                  </span>
                                  <span className="bg-success/10 text-success px-1 rounded ml-1">
                                    {options.replaceText}
                                  </span>
                                </>
                              ) : (
                                <span className="bg-highlight px-1 rounded">
                                  {match.context.substring(match.matchStart, match.matchEnd)}
                                </span>
                              )}
                              <span className="text-muted-foreground">
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
                        <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Matches Found</h3>
                      <p className="text-muted-foreground mb-4">Try adjusting your search criteria or check the spelling.</p>
                      <Button
                        onClick={() => setActiveTab('options')}
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Options</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Results Tab */}
              {activeTab === 'results' && result && (
                <div className="space-y-6">
                  {(() => {
                    const totalMatches = result?.findReplaceResults?.totalMatches ?? 0;
                    return (
                      <div className="text-center mb-4">
                        <CheckCircle className={`w-12 h-12 mx-auto mb-2 ${totalMatches === 0 ? 'text-muted-foreground' : 'text-success'}`} />
                        <h3 className="text-lg font-semibold text-foreground">
                          {totalMatches === 0 ? 'No Matches Found' : 'Find & Replace Results'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {totalMatches === 0 ? 'No changes were made' : 'Operation completed successfully'}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Statistics */}
                  {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-primary/10 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{stats.totalMatches}</div>
                        <div className="text-sm text-foreground">Total Matches</div>
                      </div>
                      <div className="bg-success/10 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-success">{stats.totalReplacements}</div>
                        <div className="text-sm text-foreground">Replacements</div>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{stats.pagesAffected}</div>
                        <div className="text-sm text-foreground">Pages Affected</div>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {result.findReplaceResults.searchText.length}
                        </div>
                        <div className="text-sm text-foreground">Search Length</div>
                      </div>
                    </div>
                  )}

                  {/* Download Button */}
                  {(() => {
                    const totalMatches = result?.findReplaceResults?.totalMatches ?? 0;
                    const disabled = totalMatches === 0;
                    return (
                      <div className="text-center">
                        <Button
                          onClick={handleDownload}
                          disabled={disabled}
                            className={`flex items-center space-x-2 mx-auto ${disabled ? 'bg-muted cursor-not-allowed' : 'bg-success hover:bg-success/90'}`}
                        >
                          <Download className="w-4 h-4" />
                          <span>{disabled ? 'No File to Download' : 'Download Processed PDF'}</span>
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Information and Help - Only show when no file is selected */}
        {!selectedFile && (
          <div className="space-y-6">
            {/* Help Information */}
              <div className="bg-background rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2" />
                How It Works
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>1. Upload:</strong> Select your PDF file</p>
                <p><strong>2. Configure:</strong> Set search and replace options</p>
                <p><strong>3. Preview:</strong> See matches before replacing</p>
                <p><strong>4. Process:</strong> Perform find & replace operation</p>
                <p><strong>5. Download:</strong> Get your processed PDF</p>
              </div>
            </div>

            {/* Features */}
            <div className="bg-background rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Features
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Regular expression support</p>
                <p>• Case-sensitive matching</p>
                <p>• Whole word matching</p>
                <p>• Preview before replacing</p>
                <p>• Batch operations</p>
              </div>
            </div>


          </div>
        )}

        {/* Results Section - Show when file is selected and operation is complete */}
        {selectedFile && result && (
          <div className="bg-background rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="w-6 h-6 text-success" />
              <h3 className="text-lg font-semibold text-success">Find & Replace Complete!</h3>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-foreground">File:</span>
                <span className="text-sm text-muted-foreground">{result.filename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-foreground">Pages:</span>
                <span className="text-sm text-muted-foreground">
                  {(() => {
                    // Try to get page count from backend result
                    if (result.totalPages && result.totalPages > 0) {
                      return `${result.totalPages}`;
                    }
                    
                    // Fallback: Calculate from matches if available
                    if (result.findReplaceResults?.pages && result.findReplaceResults.pages.length > 0) {
                      const maxPage = Math.max(...result.findReplaceResults.pages.map(p => p.page));
                      return `${maxPage}`;
                    }
                    
                    // Fallback: Calculate from matches array
                    if (result.findReplaceResults?.matches && result.findReplaceResults.matches.length > 0) {
                      const maxPage = Math.max(...result.findReplaceResults.matches.map(m => m.page));
                      return `${maxPage}`;
                    }
                    
                    return 'Unknown';
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                    <span className="text-sm font-medium text-foreground">Search:</span>
                <span className="text-sm text-muted-foreground font-mono">{result.findReplaceResults.searchText}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-foreground">Replace:</span>
                <span className="text-sm text-muted-foreground font-mono">{result.findReplaceResults.replaceText}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Processing find & replace...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindReplace;
