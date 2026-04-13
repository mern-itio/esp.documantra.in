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

  const removeFile = () => {
    setSelectedFile(null);
    setResult(null);
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
      <div className="bg-background shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to={`/pdf-tools${location.search}`}
              className="p-2 hover:bg-background rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Spell Check</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Check spelling and grammar in PDF text with multilingual support
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-success/10 border border-success rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-success mr-2" />
            <p className="text-success">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-destructive/10 border border-destructive rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-destructive mr-2" />
            <p className="text-destructive">{error}</p>
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
              <div className="bg-success/10 border border-success rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{selectedFile.name}</h4>
                      <p className="text-sm text-foreground">
                        Size: {spellCheckService.formatFileSize(selectedFile.size)}
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
          </div>
          {!selectedFile && (
            <div className="bg-background rounded-xl shadow-lg p-6 border-l-4 border-primary">
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
                <Languages className="w-5 h-5 mr-2" />
                Multilingual Support
              </h3>
              <p className="text-sm text-muted-foreground">
                Our spell checker supports over 20 languages with native dictionaries and grammar rules
                for accurate text analysis across different languages and writing styles.
              </p>
            </div>
          )}
          {/* Configuration Options */}
          {selectedFile && (
            <div className="bg-background rounded-xl shadow-lg p-6">

              {/* Options Tab */}
              {activeTab === 'options' && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <SpellCheck2 className="w-12 h-12 mx-auto mb-2 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Spell Check Configuration</h3>
                    <p className="text-sm text-muted-foreground">Configure language and checking options</p>
                  </div>

                  {/* Language Selection */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-foreground border-b pb-2 flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      Language Settings
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                          Language
                        </label>
                        <select
                          value={options.language}
                          onChange={(e) => handleOptionChange('language', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                    <h4 className="text-md font-semibold text-foreground border-b pb-2 flex items-center">
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
                        <span className="text-sm text-foreground">Check Grammar</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.suggestions}
                          onChange={(e) => handleOptionChange('suggestions', e.target.checked)}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700">Show Suggestions</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.ignoreNumbers}
                          onChange={(e) => handleOptionChange('ignoreNumbers', e.target.checked)}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Ignore Numbers</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.ignoreUrls}
                          onChange={(e) => handleOptionChange('ignoreUrls', e.target.checked)}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Ignore URLs</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={options.ignoreEmails}
                          onChange={(e) => handleOptionChange('ignoreEmails', e.target.checked)}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Ignore Emails</span>
                      </label>
                    </div>
                  </div>

                  {/* Custom Dictionaries */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-foreground border-b pb-2 flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Custom Dictionaries
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dictionaries.map((dictionary) => (
                        <button
                          key={dictionary.id}
                          onClick={() => handleDictionarySelect(dictionary)}
                          className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${selectedDictionary?.id === dictionary.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary'
                            }`}
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            <div>
                              <div className="font-medium text-foreground">{dictionary.name}</div>
                              <p className="text-sm text-muted-foreground">{dictionary.description}</p>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
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
                      className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
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
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 text-success" />
                      <h3 className="text-lg font-semibold text-foreground">Spell Check Results</h3>
                    <p className="text-sm text-muted-foreground">Analysis of your PDF document</p>
                  </div>

                  {/* Statistics */}
                  {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-primary/10 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary">{stats.totalWords}</div>
                        <div className="text-sm text-foreground">Total Words</div>
                      </div>
                      <div className="bg-destructive/10 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-destructive">{stats.misspelledWords}</div>
                        <div className="text-sm text-foreground">Misspelled</div>
                      </div>
                      <div className="bg-warning/10 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-warning">{stats.grammarIssues}</div>
                        <div className="text-sm text-foreground">Grammar Issues</div>
                      </div>
                      <div className="bg-success/10 rounded-lg p-4 text-center">
                        <div className={`text-2xl font-bold ${spellCheckService.getAccuracyColor(stats.accuracy)}`}>
                          {stats.accuracy}%
                        </div>
                        <div className="text-sm text-foreground">Accuracy</div>
                      </div>
                    </div>
                  )}

                  {/* Misspelled Words */}
                  {result.spellCheckResults.misspelledWords.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-foreground border-b pb-2 flex items-center">
                        <XCircle className="w-4 h-4 mr-2 text-destructive" />
                        Misspelled Words ({result.spellCheckResults.misspelledWords.length})
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.spellCheckResults.misspelledWords.map((word, index) => (
                              <div key={index} className="border border-destructive/10 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-destructive">{word}</span>
                              <span className="text-xs text-destructive">Misspelled</span>
                            </div>
                            {result.spellCheckResults.suggestions[word] && result.spellCheckResults.suggestions[word].length > 0 && (
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Suggestions:</div>
                                <div className="flex flex-wrap gap-1">
                                  {result.spellCheckResults.suggestions[word].map((suggestion, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-success/10 text-success text-xs rounded">
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
                          <h4 className="text-md font-semibold text-foreground border-b pb-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2 text-warning" />
                        Grammar Issues ({result.spellCheckResults.grammarIssues.length})
                      </h4>

                      <div className="space-y-3">
                        {result.spellCheckResults.grammarIssues.map((issue, index) => (
                          <div key={index} className="border border-warning/10 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`px-2 py-1 text-xs rounded ${spellCheckService.getIssueTypeColor(issue.type)}`}>
                                {spellCheckService.getIssueTypeIcon(issue.type)} {issue.type}
                              </span>
                              <span className="text-xs text-muted-foreground">Position: {issue.position}</span>
                            </div>
                            <div className="text-sm text-foreground mb-1">{issue.sentence}</div>
                            <div className="text-sm text-primary">{issue.suggestion}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Issues Found */}
                  {result.spellCheckResults.misspelledWords.length === 0 && result.spellCheckResults.grammarIssues.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-success mb-2">Perfect!</h3>
                      <p className="text-muted-foreground">No spelling or grammar issues found in your document.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Text Tab */}
              {activeTab === 'text' && result && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <FileSearch className="w-12 h-12 mx-auto mb-2 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Extracted Text</h3>
                    <p className="text-sm text-muted-foreground">Text content extracted from your PDF</p>
                  </div>

                  <div className="bg-background rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-foreground whitespace-pre-wrap">
                      {spellCheckService.formatExtractedText(result.extractedText, 2000)}
                    </pre>
                  </div>
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
                <p><strong>1. Upload:</strong> Select your PDF file for spell checking</p>
                <p><strong>2. Configure:</strong> Choose language and checking options</p>
                <p><strong>3. Process:</strong> Extract text and check spelling/grammar</p>
                <p><strong>4. Review:</strong> View results and suggestions</p>
                <p><strong>5. Download:</strong> Get your analyzed PDF</p>
              </div>
            </div>

            {/* Features */}
            <div className="bg-background rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Features
              </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Multilingual spell checking support</p>
                <p>• Grammar and style checking</p>
                <p>• Custom dictionary support</p>
                <p>• Intelligent suggestions</p>
                <p>• Context-aware analysis</p>
              </div>
            </div>


          </div>
        )}

        {/* Results Section - Show when file is selected and spell check is complete */}
        {selectedFile && result && (
          <div className="bg-background rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="w-6 h-6 text-success" />
              <h3 className="text-lg font-semibold text-success">Spell Check Complete!</h3>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-foreground">File:</span>
                <span className="text-sm text-muted-foreground">{result.filename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-foreground">Pages:</span>
                <span className="text-sm text-muted-foreground">{result.totalPages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-foreground">Language:</span>
                <span className="text-sm text-muted-foreground flex items-center">
                  {getLanguageFlag(result.spellCheckResults.language)} {getLanguageName(result.spellCheckResults.language)}
                </span>
              </div>
              {stats && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-foreground">Accuracy:</span>
                  <span className={`text-sm font-medium ${spellCheckService.getAccuracyColor(stats.accuracy)}`}>
                    {stats.accuracy}% ({spellCheckService.getAccuracyLabel(stats.accuracy)})
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Checking spelling and grammar...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpellCheck;
