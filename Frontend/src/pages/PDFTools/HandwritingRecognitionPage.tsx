import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  Settings,
  Download,
  Copy,
  CheckCircle,
  Languages,
  Target,
  Zap,
  ArrowLeft,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useLocation } from 'react-router-dom';
import { pdfApi } from '../../services/apiHelper';
import { Button } from '../../components/DocumentService/ui/button';
import { Card } from '../../components/DocumentService/ui/card';

interface RecognitionResult {
  text: string;
  confidence: number;
  downloadUrl?: string;
  textFile?: string;
}

interface ProcessingOptions {
  language: string;
  accuracy: 'low' | 'medium' | 'high';
  preprocess: boolean;
  confidence: number;
  enhanceCursive: boolean;
}

const HandwritingRecognitionPage: React.FC = () => {
   const location = useLocation();
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<RecognitionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ProcessingOptions>({
    language: 'eng',
    accuracy: 'high',
    preprocess: true,
    confidence: 0.7,
    enhanceCursive: false
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    setResults([]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.bmp', '.tiff']
    },
    multiple: true
  });

  const handleProcess = async () => {
    if (files.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults([]);
    setProgress({ current: 0, total: files.length, percentage: 0 });

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
      formData.append('language', options.language);
      formData.append('accuracy', options.accuracy);
      formData.append('preprocess', options.preprocess.toString());
      formData.append('enhanceCursive', options.enhanceCursive.toString());

      // Start progress simulation during API call
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev.percentage < 90) {
            const increment = Math.random() * 15 + 5; // Random increment between 5-20%
            return {
              ...prev,
              percentage: Math.min(prev.percentage + increment, 90)
            };
          }
          return prev;
        });
      }, 1000);

      const response = await pdfApi.post(
        "/pdf-handwriting-recognition/recognize",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status !== 200) {
        throw new Error('Failed to process images');
      }

      const data = response.data;
      console.log('Backend response:', data); // Debug log

      if (data.success) {
        // Clear interval and set to 100% when done
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        setProgress({ 
          current: files.length, 
          total: files.length, 
          percentage: 100 
        });

        const processedResults = data.results.flatMap((result: any) => {
          // If recognizedText is empty, use fullText instead
          if (result.recognizedText && result.recognizedText.length > 0) {
            return result.recognizedText
              .filter((item: any) => item.text.trim().length > 0)
              .map((item: any) => ({
                text: item.text,
                confidence: item.confidence,
                downloadUrl: `${pdfApi.defaults.baseURL}${result.downloadUrl}`,
                textFile: result.textFile
              }));
          } else {
            // Use fullText when recognizedText is empty
            const textLines = result.fullText.split('\n').filter((line: string) => line.trim().length > 0);
            return textLines.map((line: string) => ({
              text: line,
              confidence: result.confidence || 0,
              downloadUrl: `${pdfApi.defaults.baseURL}${result.downloadUrl}`,
              textFile: result.textFile
            }));
          }
        });

        console.log('Processed results:', processedResults); // Debug log
        setResults(processedResults);
        toast.success(`Successfully processed ${data.results.length} images`);
      } else {
        throw new Error(data.error || 'Processing failed');
      }
    } catch (error) {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      console.error('Error processing images:', error);
      setError(error instanceof Error ? error.message : 'Failed to process images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Text copied to clipboard');
  };


  const supportedLanguages = [
    { code: 'eng', name: 'English' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'spa', name: 'Spanish' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
    { code: 'rus', name: 'Russian' },
    { code: 'chi_sim', name: 'Chinese Simplified' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'kor', name: 'Korean' },
    { code: 'ara', name: 'Arabic' },
    { code: 'heb', name: 'Hebrew' }
  ];

  // Show only result when processing is successful - hide everything else
  if (results.length > 0 && !isProcessing) {
    return (
      <div className="mx-auto min-h-full w-full space-y-6 bg-background text-foreground">
        <div className="bg-background shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-6">
              <Link
                to={`/pdf-tools${location.search}`}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Handwriting Recognition</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Convert handwritten text to digital text
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Show only the result - everything else is hidden */}
        <div className="max-w-7xl mx-auto p-6">
          <Card className="p-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-2">Recognition Complete!</h3>
              <p className="text-muted-foreground">Your handwritten text has been successfully converted to digital text</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-foreground">{results.length}</p>
                <p className="text-sm text-muted-foreground">Text Lines Recognized</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{files.length}</p>
                <p className="text-sm text-muted-foreground">Images Processed</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(results.reduce((acc, result) => acc + result.confidence, 0) / results.length)}%
                </p>
                <p className="text-sm text-muted-foreground">Average Confidence</p>
              </div>
            </div>

            {/* Recognition Results */}
            <div className="space-y-4 mb-6">
              <h4 className="font-medium text-foreground">Recognized Text:</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className="p-4 bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-900 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-emerald-900 dark:text-emerald-200">Line {index + 1}</span>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleCopyText(result.text)}
                          size="sm"
                          variant="outline"
                          className="text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/40"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        {result.downloadUrl && (
                          <Button
                            onClick={() => window.open(result.downloadUrl, '_blank')}
                            size="sm"
                            variant="outline"
                            className="text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/40"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-emerald-900 dark:text-emerald-200 mb-2">{result.text}</p>
                    <div className="text-sm text-emerald-700 dark:text-emerald-300">
                      <span className="text-emerald-600 dark:text-emerald-400">Confidence:</span> {Math.round(result.confidence)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setResults([])}
                variant="outline"
              >
                Back to Configuration
              </Button>
              <Button
                onClick={() => {
                  setFiles([]);
                  setResults([]);
                  setError(null);
                  setProgress({ current: 0, total: 0, percentage: 0 });
                }}
                variant="outline"
              >
                Start New Recognition
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-full w-full space-y-6 bg-background text-foreground">
      <div className="bg-background shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to={`/pdf-tools${location.search}`}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Handwriting Recognition</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Convert handwritten text to digital text
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {/* File Upload - Only show when no files selected */}
        {files.length === 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-primary" />
              Upload Images
            </h3>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                  ? 'border-primary bg-primary/15 dark:bg-primary/25'
                  : 'border-border hover:border-primary/60 hover:bg-muted/40 dark:hover:bg-muted/25'
                }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              {isDragActive ? (
                <p className="text-primary font-medium">Drop the images here...</p>
              ) : (
                <div>
                  <p className="text-muted-foreground mb-2">
                    Drag & drop images here, or click to select
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports JPG, PNG, BMP, TIFF (max 2MB each)
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Selected Files Info - Show after file selection */}
        {files.length > 0 && (
          <Card className="p-6">
            <div className="bg-primary/10 border border-primary/30 dark:bg-primary/15 dark:border-primary/40 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Selected Images ({files.length})</h3>
               
              </div>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                      className="text-destructive hover:text-destructive/90 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Processing Options */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-primary" />
            Processing Options
          </h3>

          <div className="space-y-4">
            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center">
                <Languages className="w-4 h-4 mr-2" />
                Language
              </label>
              <select
                value={options.language}
                onChange={(e) => setOptions({ ...options, language: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {supportedLanguages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Accuracy Level */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Accuracy Level
              </label>
              <select
                value={options.accuracy}
                onChange={(e) => setOptions({ ...options, accuracy: e.target.value as any })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="low">Low (Fast)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Slow)</option>
              </select>
            </div>

            {/* Preprocessing */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="preprocess"
                checked={options.preprocess}
                onChange={(e) => setOptions({ ...options, preprocess: e.target.checked })}
                className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
              />
              <label htmlFor="preprocess" className="ml-2 text-sm text-foreground">
                Enable image preprocessing
              </label>
            </div>

            {/* Cursive Enhancement */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enhanceCursive"
                checked={options.enhanceCursive}
                onChange={(e) => setOptions({ ...options, enhanceCursive: e.target.checked })}
                className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
              />
              <label htmlFor="enhanceCursive" className="ml-2 text-sm text-foreground">
                Enhance cursive handwriting
              </label>
            </div>

            {/* Confidence Threshold */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confidence Threshold: {Math.round(options.confidence * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={options.confidence}
                onChange={(e) => setOptions({ ...options, confidence: parseFloat(e.target.value) })}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Process Button - Integrated with settings */}
          {!isProcessing && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="bg-gradient-to-r from-primary/10 to-emerald-500/10 dark:from-primary/15 dark:to-emerald-500/15 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">Ready to Process</h4>
                  <span className="text-sm text-primary font-medium">
                    {files.length} image{files.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Your images will be processed for handwriting recognition with the settings above.
                </p>
                <Button
                  onClick={handleProcess}
                  disabled={files.length === 0}
                  size="lg"
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  {files.length > 0 ? 'Process Images' : 'Select Images First'}
                </Button>
              </div>
              {files.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                  Upload images above to get started
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Progress Bar - Only show when processing */}
        {isProcessing && (
          <Card className="p-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/15 rounded-full mb-3">
                <Zap className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Processing Your Images</h3>
              <p className="text-sm text-muted-foreground">Converting handwritten text to digital text...</p>
            </div>
            <div className="space-y-3">
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Processing {progress.total} image{progress.total !== 1 ? 's' : ''}</span>
                <span>{Math.round(progress.percentage)}% complete</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {progress.percentage < 100 
                  ? 'Recognizing handwritten text...' 
                  : 'Finalizing results...'}
              </p>
            </div>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="p-6 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/35">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 text-red-600">⚠️</div>
              <div>
                <h3 className="font-medium text-red-900 dark:text-red-200">Error</h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HandwritingRecognitionPage;
