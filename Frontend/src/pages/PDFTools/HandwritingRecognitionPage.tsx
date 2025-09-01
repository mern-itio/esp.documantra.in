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
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { pdfApi } from '../../services/apiHelper';

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
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<RecognitionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
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
      toast.error('Please upload at least one image');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
      formData.append('language', options.language);
      formData.append('accuracy', options.accuracy);
      formData.append('preprocess', options.preprocess.toString());
      formData.append('enhanceCursive', options.enhanceCursive.toString());

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
      console.error('Error processing images:', error);
      toast.error('Failed to process images. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Text copied to clipboard');
  };

  const handleDownloadResults = () => {
    const textContent = results.map(result => result.text).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'handwriting-recognition-results.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  return (
    <div className="mx-auto space-y-6">
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
              <h1 className="text-3xl font-bold text-gray-900">Handwriting Recognition</h1>
              <p className="mt-2 text-sm text-gray-600">
                Convert handwritten text to digital text
              </p>
            </div>
          </div>
        </div>
      </div>
      <div
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Upload className="w-5 h-5 mr-2 text-blue-600" />
          Upload Images
        </h3>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-blue-600 font-medium">Drop the images here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Drag & drop images here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG, BMP, TIFF (max 50MB each)
              </p>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">
              {files.length} file(s) selected:
            </p>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Left Column - Upload and Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload */}


          {/* Processing Options */}
          <div
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-600" />
              Processing Options
            </h3>

            <div className="space-y-4">
              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Languages className="w-4 h-4 mr-2" />
                  Language
                </label>
                <select
                  value={options.language}
                  onChange={(e) => setOptions({ ...options, language: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Accuracy Level
                </label>
                <select
                  value={options.accuracy}
                  onChange={(e) => setOptions({ ...options, accuracy: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="preprocess" className="ml-2 text-sm text-gray-700">
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
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="enhanceCursive" className="ml-2 text-sm text-gray-700">
                  Enhance cursive handwriting
                </label>
              </div>

              {/* Confidence Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confidence Threshold: {Math.round(options.confidence * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={options.confidence}
                  onChange={(e) => setOptions({ ...options, confidence: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>

          {/* Process Button */}
          <button
            onClick={handleProcess}
            disabled={isProcessing || files.length === 0}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Process Images
              </>
            )}
          </button>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-1">
          <div
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Recognition Results
              </h3>

              {results.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleDownloadResults}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download All
                  </button>
                </div>
              )}
            </div>

            {isProcessing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing your images...</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {!isProcessing && results.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Upload images and click "Process Images" to get started</p>
              </div>
            )}

            {!isProcessing && results.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>{results.length} text lines recognized</span>
                  <span className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                    Processing complete
                  </span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.map((result, index) => {
                    console.log(`Result ${index}:`, result); // Debug log for each result
                    return (
                      <div
                        key={index}
                        className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-gray-900 mb-1">{result.text}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Confidence: {Math.round(result.confidence)}%</span>
                            <span>Line {index + 1}</span>
                            {result.downloadUrl && <span className="text-green-600">✓ Download available</span>}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleCopyText(result.text)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Copy text"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {result.downloadUrl && (
                            <a
                              href={result.downloadUrl}
                              download={result.textFile || 'handwriting-result.txt'}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                              title="Download text file"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandwritingRecognitionPage;
