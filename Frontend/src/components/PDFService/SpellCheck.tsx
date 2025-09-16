import React, { useState, useRef } from 'react';
import { spellCheckService } from '../../services/spellCheckService';
import type {
  SpellCheckRequest,
  SpellCheckResponse,
  // Language,
  CustomDictionary,
  SpellCheckOptions
} from '../../types/spellCheck';
import { Button } from '../DocumentService/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  CheckCircle, 
  AlertTriangle,
  FileText, 
  Settings, 
  RotateCcw, 
  Info, 
  Globe,
  BookOpen,
  Zap,
  Languages,
  FileSearch,
  BarChart3,
  AlertCircle,
  CheckSquare,
  XCircle,
  SpellCheck2
} from 'lucide-react';

const SpellCheck: React.FC = () => {
   const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<SpellCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'options' | 'results' | 'text'>('options');
  const [options, setOptions] = useState<SpellCheckOptions>({
    language: 'en',
    checkGrammar: true,
    suggestions: true,
    ignoreNumbers: true,
    ignoreUrls: true,
    ignoreEmails: true
  });
  const [selectedDictionary, setSelectedDictionary] = useState<CustomDictionary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const languages = spellCheckService.getSupportedLanguages();
  const dictionaries = spellCheckService.getCustomDictionaries();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      setSuccess(null);
    } else if (file) {
      setError('Please select a valid PDF file');
    }
  };

  const handleOptionChange = (key: keyof SpellCheckOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDictionarySelect = (dictionary: CustomDictionary) => {
    setSelectedDictionary(dictionary);
    setOptions(prev => ({
      ...prev,
      customDictionary: dictionary.words.join(',')
    }));
  };

  const handleSpellCheck = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }

    const request: SpellCheckRequest = {
      file: selectedFile,
      ...options
    };

    const validation = spellCheckService.validateRequest(request);
    if (!validation.valid) {
      setError(validation.message || 'Validation failed');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await spellCheckService.spellCheck(request);
      setResult(response);
      setSuccess('Spell check completed successfully!');
      setActiveTab('results');
    } catch (err: any) {
      console.error('Spell check error:', err);
      setError(`Failed to perform spell check: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // const handleDownload = async () => {
  //   if (result?.downloadUrl) {
  //     try {
  //       await spellCheckService.downloadFile(result.downloadUrl, result.filename);
  //     } catch (err: any) {
  //       console.error('Download error:', err);
  //       setError(`Failed to download file: ${err.message}`);
  //     }
  //   }
  // };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setSuccess(null);
    setActiveTab('options');
    setSelectedDictionary(null);
    setOptions({
      language: 'en',
      checkGrammar: true,
      suggestions: true,
      ignoreNumbers: true,
      ignoreUrls: true,
      ignoreEmails: true
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getLanguageFlag = (code: string) => {
    const language = languages.find(lang => lang.code === code);
    return language?.flag || '🌐';
  };

  const getLanguageName = (code: string) => {
    const language = languages.find(lang => lang.code === code);
    return language?.name || 'Unknown';
  };

  const stats = result ? spellCheckService.calculateStats(result.spellCheckResults) : null;

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
              <h1 className="text-3xl font-bold text-gray-900">Spell Check</h1>
              <p className="mt-2 text-sm text-gray-600">
                Check spelling and grammar in PDF text with multilingual support
              </p>
            </div>
          </div>
        </div>
      </div>

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
                    Size: {spellCheckService.formatFileSize(selectedFile.size)}
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
                  {result && (
                    <>
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
                      <button
                        onClick={() => setActiveTab('text')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
                          activeTab === 'text'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <FileSearch className="w-4 h-4" />
                        <span>Text</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Options Tab */}
              {activeTab === 'options' && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <SpellCheck2 className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Spell Check Configuration</h3>
                    <p className="text-sm text-gray-600">Configure language and checking options</p>
                  </div>

                  {/* Language Selection */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 border-b pb-2 flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      Language Settings
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Language
                        </label>
                        <select
                          value={options.language}
                          onChange={(e) => handleOptionChange('language', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {languages.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.flag} {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Checking Options */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 border-b pb-2 flex items-center">
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Checking Options
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.checkGrammar}
                          onChange={(e) => handleOptionChange('checkGrammar', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Check Grammar</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.suggestions}
                          onChange={(e) => handleOptionChange('suggestions', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Show Suggestions</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.ignoreNumbers}
                          onChange={(e) => handleOptionChange('ignoreNumbers', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Ignore Numbers</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.ignoreUrls}
                          onChange={(e) => handleOptionChange('ignoreUrls', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Ignore URLs</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.ignoreEmails}
                          onChange={(e) => handleOptionChange('ignoreEmails', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Ignore Emails</span>
                      </label>
                    </div>
                  </div>

                  {/* Custom Dictionaries */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800 border-b pb-2 flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Custom Dictionaries
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dictionaries.map((dictionary) => (
                        <button
                          key={dictionary.id}
                          onClick={() => handleDictionarySelect(dictionary)}
                          className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                            selectedDictionary?.id === dictionary.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900">{dictionary.name}</div>
                              <p className="text-sm text-gray-600">{dictionary.description}</p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {dictionary.words.length} words
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center space-x-4 mt-6">
                    <Button
                      onClick={handleSpellCheck}
                      disabled={isProcessing || !selectedFile}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <SpellCheck2 className="w-4 h-4" />
                      <span>{isProcessing ? 'Checking...' : 'Check Spelling'}</span>
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

              {/* Results Tab */}
              {activeTab === 'results' && result && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Spell Check Results</h3>
                    <p className="text-sm text-gray-600">Analysis of your PDF document</p>
                  </div>

                  {/* Statistics */}
                  {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalWords}</div>
                        <div className="text-sm text-blue-800">Total Words</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.misspelledWords}</div>
                        <div className="text-sm text-red-800">Misspelled</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{stats.grammarIssues}</div>
                        <div className="text-sm text-yellow-800">Grammar Issues</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className={`text-2xl font-bold ${spellCheckService.getAccuracyColor(stats.accuracy)}`}>
                          {stats.accuracy}%
                        </div>
                        <div className="text-sm text-green-800">Accuracy</div>
                      </div>
                    </div>
                  )}

                  {/* Misspelled Words */}
                  {result.spellCheckResults.misspelledWords.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-800 border-b pb-2 flex items-center">
                        <XCircle className="w-4 h-4 mr-2 text-red-500" />
                        Misspelled Words ({result.spellCheckResults.misspelledWords.length})
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.spellCheckResults.misspelledWords.map((word, index) => (
                          <div key={index} className="border border-red-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-red-800">{word}</span>
                              <span className="text-xs text-red-600">Misspelled</span>
                            </div>
                            {result.spellCheckResults.suggestions[word] && result.spellCheckResults.suggestions[word].length > 0 && (
                              <div className="space-y-1">
                                <div className="text-xs text-gray-600">Suggestions:</div>
                                <div className="flex flex-wrap gap-1">
                                  {result.spellCheckResults.suggestions[word].map((suggestion, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                      {suggestion}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grammar Issues */}
                  {result.spellCheckResults.grammarIssues.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-800 border-b pb-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                        Grammar Issues ({result.spellCheckResults.grammarIssues.length})
                      </h4>
                      
                      <div className="space-y-3">
                        {result.spellCheckResults.grammarIssues.map((issue, index) => (
                          <div key={index} className="border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`px-2 py-1 text-xs rounded ${spellCheckService.getIssueTypeColor(issue.type)}`}>
                                {spellCheckService.getIssueTypeIcon(issue.type)} {issue.type}
                              </span>
                              <span className="text-xs text-gray-500">Position: {issue.position}</span>
                            </div>
                            <div className="text-sm text-gray-700 mb-1">{issue.sentence}</div>
                            <div className="text-sm text-blue-600">{issue.suggestion}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Issues Found */}
                  {result.spellCheckResults.misspelledWords.length === 0 && result.spellCheckResults.grammarIssues.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-green-800 mb-2">Perfect!</h3>
                      <p className="text-gray-600">No spelling or grammar issues found in your document.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Text Tab */}
              {activeTab === 'text' && result && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <FileSearch className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Extracted Text</h3>
                    <p className="text-sm text-gray-600">Text content extracted from your PDF</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {spellCheckService.formatExtractedText(result.extractedText, 2000)}
                    </pre>
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
                <h3 className="text-lg font-semibold text-green-800">Spell Check Complete!</h3>
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
                  <span className="text-sm font-medium text-gray-700">Language:</span>
                  <span className="text-sm text-gray-600 flex items-center">
                    {getLanguageFlag(result.spellCheckResults.language)} {getLanguageName(result.spellCheckResults.language)}
                  </span>
                </div>
                {stats && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Accuracy:</span>
                    <span className={`text-sm font-medium ${spellCheckService.getAccuracyColor(stats.accuracy)}`}>
                      {stats.accuracy}% ({spellCheckService.getAccuracyLabel(stats.accuracy)})
                    </span>
                  </div>
                )}
              </div>

              {/* <Button
                onClick={handleDownload}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button> */}
            </div>
          )}

          {/* Help Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              How It Works
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>1. Upload:</strong> Select your PDF file for spell checking</p>
              <p><strong>2. Configure:</strong> Choose language and checking options</p>
              <p><strong>3. Process:</strong> Extract text and check spelling/grammar</p>
              <p><strong>4. Review:</strong> View results and suggestions</p>
              <p><strong>5. Download:</strong> Get your analyzed PDF</p>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Features
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Multilingual spell checking support</p>
              <p>• Grammar and style checking</p>
              <p>• Custom dictionary support</p>
              <p>• Intelligent suggestions</p>
              <p>• Context-aware analysis</p>
            </div>
          </div>

          {/* Language Support */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-400">
            <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
              <Languages className="w-5 h-5 mr-2" />
              Multilingual Support
            </h3>
            <p className="text-sm text-blue-700">
              Our spell checker supports over 20 languages with native dictionaries and grammar rules 
              for accurate text analysis across different languages and writing styles.
            </p>
          </div>
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Checking spelling and grammar...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpellCheck;
