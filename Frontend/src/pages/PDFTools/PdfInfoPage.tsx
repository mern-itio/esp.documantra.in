import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  ArrowLeft,
  Loader2,
  Info,
  Shield,
  BarChart3,
  Calendar,
  User,
  File,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Settings,
  Database
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { pdfApi } from '../../services/apiHelper';

interface Metadata {
  title: string;
  author: string;
  subject: string;
  creator: string;
  producer: string;
  creationDate: string | null;
  modificationDate: string | null;
  keywords: string[];
}

interface Statistics {
  pageCount: number;
  fieldCount: number;
  fieldTypes: {
    text: number;
    checkbox: number;
    radio: number;
    dropdown: number;
    signature: number;
    unknown: number;
  };
  fileSize: string;
  fileSizeBytes: number;
  pages: Array<{
    pageNumber: number;
    width: number;
    height: number;
    orientation: string;
  }>;
}

interface SecurityInfo {
  isEncrypted: boolean;
  isPasswordProtected: boolean;
  permissions: {
    print: boolean;
    copy: boolean;
    modify: boolean;
    annotate: boolean;
    fillForms: boolean;
    extractText: boolean;
  };
  encryptionLevel: string;
  securityMethod: string;
}

interface PdfInfo {
  metadata: Metadata;
  statistics: Statistics;
  security: SecurityInfo;
  pages: Array<{
    pageNumber: number;
    width: number;
    height: number;
    orientation: string;
  }>;
}

const PdfInfoPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'metadata' | 'statistics' | 'security'>('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setPdfInfo(null);
      toast.success('PDF file selected for analysis');
    } else {
      toast.error('Please select a valid PDF file');
    }
  };

  const handleAnalyzePdf = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      const response = await pdfApi.post('/pdf-info/get-info', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200 && response.data.success) {
        setPdfInfo(response.data.result);
        toast.success('PDF analysis completed successfully');
      } else {
        toast.error('Failed to analyze PDF: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error analyzing PDF:', error);
      toast.error('Failed to analyze PDF: ' + ((error as Error).message || 'Network error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getSecurityIcon = (isSecure: boolean) => {
    return isSecure ? <Lock className="w-5 h-5 text-red-500" /> : <Unlock className="w-5 h-5 text-green-500" />;
  };

  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getFieldTypeColor = (type: string) => {
    const colors = {
      text: 'bg-blue-100 text-blue-800',
      checkbox: 'bg-green-100 text-green-800',
      radio: 'bg-purple-100 text-purple-800',
      dropdown: 'bg-orange-100 text-orange-800',
      signature: 'bg-red-100 text-red-800',
      unknown: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.unknown;
  };

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
              <h1 className="text-3xl font-bold text-gray-900">PDF Information</h1>
              <p className="mt-2 text-sm text-gray-600">
                View detailed document information, metadata, statistics, and security details
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload PDF Document</h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500 font-medium">
                    Click to upload
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
              </div>
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            {selectedFile && (
              <div className="mt-4">
                <button
                  onClick={handleAnalyzePdf}
                  disabled={isProcessing}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Analyze PDF
                </button>
              </div>
            )}
          </div>

          {/* Results */}
          {pdfInfo && (
            <div className="bg-white rounded-lg shadow">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <Info className="w-4 h-4 inline mr-2" />
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('metadata')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'metadata'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" />
                    Metadata
                  </button>
                  <button
                    onClick={() => setActiveTab('statistics')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'statistics'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    Statistics
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'security'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <Shield className="w-4 h-4 inline mr-2" />
                    Security
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Info */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-blue-900 mb-3">Document Information</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-700">Title:</span>
                            <span className="text-blue-900 font-medium">{pdfInfo.metadata.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Author:</span>
                            <span className="text-blue-900 font-medium">{pdfInfo.metadata.author}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Pages:</span>
                            <span className="text-blue-900 font-medium">{pdfInfo.statistics.pageCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">File Size:</span>
                            <span className="text-blue-900 font-medium">{pdfInfo.statistics.fileSize}</span>
                          </div>
                        </div>
                      </div>

                      {/* Security Status */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-green-900 mb-3">Security Status</h3>
                        <div className="flex items-center space-x-2 mb-2">
                          {getSecurityIcon(pdfInfo.security.isEncrypted)}
                          <span className="text-green-900 font-medium">
                            {pdfInfo.security.isEncrypted ? 'Protected' : 'Unprotected'}
                          </span>
                        </div>
                        <div className="text-sm text-green-700">
                          <div>Encryption: {pdfInfo.security.encryptionLevel}</div>
                          <div>Method: {pdfInfo.security.securityMethod}</div>
                        </div>
                      </div>
                    </div>

                    {/* Field Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Form Fields Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(pdfInfo.statistics.fieldTypes).map(([type, count]) => (
                          count > 0 && (
                            <div key={type} className="flex items-center justify-between bg-white rounded p-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${getFieldTypeColor(type)}`}>
                                {type}
                              </span>
                              <span className="font-medium">{count}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata Tab */}
                {activeTab === 'metadata' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Document Properties</h3>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <File className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">Title</div>
                              <div className="text-sm text-gray-600">{pdfInfo.metadata.title}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <User className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">Author</div>
                              <div className="text-sm text-gray-600">{pdfInfo.metadata.author}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Info className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">Subject</div>
                              <div className="text-sm text-gray-600">{pdfInfo.metadata.subject}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Creation Details</h3>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Settings className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">Creator</div>
                              <div className="text-sm text-gray-600">{pdfInfo.metadata.creator}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Database className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">Producer</div>
                              <div className="text-sm text-gray-600">{pdfInfo.metadata.producer}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Dates</h3>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">Creation Date</div>
                              <div className="text-sm text-gray-600">{formatDate(pdfInfo.metadata.creationDate)}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">Modification Date</div>
                              <div className="text-sm text-gray-600">{formatDate(pdfInfo.metadata.modificationDate)}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {pdfInfo.metadata.keywords.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Keywords</h3>
                          <div className="flex flex-wrap gap-2">
                            {pdfInfo.metadata.keywords.map((keyword, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Statistics Tab */}
                {activeTab === 'statistics' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{pdfInfo.statistics.pageCount}</div>
                        <div className="text-sm text-blue-700">Pages</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{pdfInfo.statistics.fieldCount}</div>
                        <div className="text-sm text-green-700">Form Fields</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{pdfInfo.statistics.fileSize}</div>
                        <div className="text-sm text-purple-700">File Size</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Field Types Breakdown</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(pdfInfo.statistics.fieldTypes).map(([type, count]) => (
                          <div key={type} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${getFieldTypeColor(type)}`}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </span>
                              <span className="text-lg font-bold">{count}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${pdfInfo.statistics.fieldCount > 0 ? (count / pdfInfo.statistics.fieldCount) * 100 : 0}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Page Dimensions</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Width</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Height</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orientation</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {pdfInfo.pages.map((page) => (
                              <tr key={page.pageNumber}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {page.pageNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {page.width} pt
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {page.height} pt
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`text-xs px-2 py-1 rounded-full ${page.orientation === 'portrait'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-orange-100 text-orange-800'
                                    }`}>
                                    {page.orientation}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-red-50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-red-900 mb-3">Security Status</h3>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            {getSecurityIcon(pdfInfo.security.isEncrypted)}
                            <div>
                              <div className="text-sm font-medium text-red-900">
                                {pdfInfo.security.isEncrypted ? 'Encrypted' : 'Not Encrypted'}
                              </div>
                              <div className="text-sm text-red-700">
                                {pdfInfo.security.encryptionLevel}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {pdfInfo.security.isPasswordProtected ? (
                              <Lock className="w-5 h-5 text-red-500" />
                            ) : (
                              <Unlock className="w-5 h-5 text-green-500" />
                            )}
                            <div>
                              <div className="text-sm font-medium text-red-900">
                                {pdfInfo.security.isPasswordProtected ? 'Password Protected' : 'No Password'}
                              </div>
                              <div className="text-sm text-red-700">
                                {pdfInfo.security.securityMethod}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-blue-900 mb-3">Document Permissions</h3>
                        <div className="space-y-2">
                          {Object.entries(pdfInfo.security.permissions).map(([permission, allowed]) => (
                            <div key={permission} className="flex items-center justify-between">
                              <span className="text-sm text-blue-700 capitalize">
                                {permission.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              {getPermissionIcon(allowed)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium mb-1">Security Note:</p>
                          <p>
                            This analysis provides basic security information. For comprehensive security assessment,
                            consider using specialized PDF security tools that can detect advanced encryption methods
                            and hidden security features.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Features */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                Metadata viewer
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <BarChart3 className="w-4 h-4 mr-2 text-green-600" />
                Document statistics
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Shield className="w-4 h-4 mr-2 text-purple-600" />
                Security information
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Eye className="w-4 h-4 mr-2 text-orange-600" />
                Page analysis
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Database className="w-4 h-4 mr-2 text-indigo-600" />
                Field analysis
              </div>
            </div>
          </div>

          {/* Supported Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Information Extracted</h2>

            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <strong>Metadata:</strong> Title, Author, Subject, Creator, Producer, Dates, Keywords
              </div>
              <div className="text-sm text-gray-600">
                <strong>Statistics:</strong> Page count, Field count, File size, Page dimensions
              </div>
              <div className="text-sm text-gray-600">
                <strong>Security:</strong> Encryption status, Password protection, Permissions
              </div>
              <div className="text-sm text-gray-600">
                <strong>Fields:</strong> Text, Checkbox, Radio, Dropdown, Signature counts
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How it works:</p>
                <p>Upload a PDF document to extract comprehensive information including metadata, document statistics, security details, and form field analysis. This helps you understand the document structure and properties.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfInfoPage;
