import React, { useState, useRef, useEffect } from 'react';
import { digitalSignatureService } from '../../services/digitalSignatureService';
import type {
  GenerateCertificateRequest,
  DigitalSignatureRequest,
  VerifySignatureRequest,
  CertificateFile,
  DigitalSignatureResponse,
  VerifySignatureResponse
} from '../../types/digitalSignature';
import {
  Download,
  Upload,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  PenTool,
  FileCheck,
  Info,
  File,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DigitalSignature: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'sign' | 'verify' | 'certificates'>('sign');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPrivateKey, setSelectedPrivateKey] = useState<string>('');
  const [selectedCertificate, setSelectedCertificate] = useState<string>('');

  // Certificate generation state
  const [certificateForm, setCertificateForm] = useState<GenerateCertificateRequest>({
    commonName: '',
    organization: '',
    country: 'US'
  });

  // Signature form state
  const [signatureForm, setSignatureForm] = useState({
    reason: 'Document approval',
    location: 'Digital signature',
    contactInfo: 'signer@example.com',
    timestamp: true
  });

  // Results state
  const [signatureResult, setSignatureResult] = useState<DigitalSignatureResponse | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerifySignatureResponse | null>(null);
  const [certificates, setCertificates] = useState<CertificateFile[]>([]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const privateKeyInputRef = useRef<HTMLInputElement>(null);
  // const certificateInputRef = useRef<HTMLInputElement>(null);

  // Load certificates on component mount
  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const response = await digitalSignatureService.listCertificates();
      setCertificates(response.certificates);
    } catch (error: any) {
      console.error('Failed to load certificates:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  // const handlePrivateKeySelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (file && file.name.includes('private-key')) {
  //     setSelectedPrivateKey(file.name);
  //     setError(null);
  //   } else {
  //     setError('Please select a valid private key file');
  //   }
  // };

  // const handleCertificateSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (file && file.name.includes('certificate')) {
  //     setSelectedCertificate(file.name);
  //     setError(null);
  //   } else {
  //     setError('Please select a valid certificate file');
  //   }
  // };

  const handleGenerateCertificate = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const validation = digitalSignatureService.validateCertificate(certificateForm);
      if (!validation.valid) {
        setError(validation.message);
        return;
      }

      const response = await digitalSignatureService.generateCertificate(certificateForm);
      setSuccess('Certificate generated successfully!');
      setCertificateForm({ commonName: '', organization: '', country: 'US' });
      await loadCertificates();

      // Auto-select the newly generated certificate
      setSelectedPrivateKey(response.privateKeyFile);
      setSelectedCertificate(response.certificateFile);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSignature = async () => {
    if (!selectedFile || !selectedPrivateKey || !selectedCertificate) {
      setError('Please select a PDF file, private key, and certificate');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const request: DigitalSignatureRequest = {
        file: selectedFile,
        privateKeyFile: selectedPrivateKey,
        certificateFile: selectedCertificate,
        ...signatureForm
      };

      const response = await digitalSignatureService.addDigitalSignature(request);
      setSignatureResult(response);
      setSuccess('Digital signature added successfully!');

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifySignature = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file to verify');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const request: VerifySignatureRequest = { file: selectedFile };
      const response = await digitalSignatureService.verifyDigitalSignature(request);
      setVerificationResult(response);
      setSuccess('Signature verification completed!');

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (signatureResult?.downloadUrl) {
      try {
        await digitalSignatureService.downloadFile(signatureResult.downloadUrl, signatureResult.filename);
      } catch (error: any) {
        setError(`Failed to download file: ${error.message}`);
      }
    }
  };

  const clearResults = () => {
    setSignatureResult(null);
    setVerificationResult(null);
    setSelectedFile(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'unsigned':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="mx-auto p-2 space-y-6">
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
              <h1 className="text-3xl font-bold text-gray-900">Digital Signature</h1>
              <p className="mt-2 text-sm text-gray-600">
                Add digital signatures with certificate validation, timestamp authority, and signature verification
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('sign')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${activeTab === 'sign'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            <PenTool className="w-5 h-5 inline mr-2" />
            Add Signature
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${activeTab === 'verify'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            <FileCheck className="w-5 h-5 inline mr-2" />
            Verify Signature
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${activeTab === 'certificates'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            <File className="w-5 h-5 inline mr-2" />
            Manage Certificates
          </button>
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
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Add Signature Tab */}
        {activeTab === 'sign' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Digital Signature</h2>
              <p className="text-gray-600">Sign your PDF documents with cryptographic security</p>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select PDF File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 
                flex flex-col items-center justify-center text-center 
                hover:border-blue-400 transition-colors h-44">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center space-y-2 text-gray-600 hover:text-blue-600"
                  >
                    <Upload className="w-12 h-12" />
                    <span className="text-lg font-medium">
                      {selectedFile ? selectedFile.name : 'Click to upload PDF'}
                    </span>
                    {selectedFile && (
                      <span className="text-sm text-gray-500">
                        Size: {digitalSignatureService.formatFileSize(selectedFile.size)}
                      </span>
                    )}
                  </button>
                </div>

              </div>

              {/* Certificate Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Private Key File
                  </label>
                  {certificates.filter(cert => cert.type === 'private-key').length > 0 ? (
                    <select
                      value={selectedPrivateKey}
                      onChange={(e) => setSelectedPrivateKey(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select private key</option>
                      {certificates
                        .filter(cert => cert.type === 'private-key')
                        .map((cert) => (
                          <option key={cert.filename} value={cert.filename}>
                            {cert.filename}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
                      No private key files available. Please add a private key file first from manage certificate.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate File
                  </label>
                  {certificates.filter(cert => cert.type === 'certificate').length > 0 ? (
                    <select
                      value={selectedCertificate}
                      onChange={(e) => setSelectedCertificate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select certificate</option>
                      {certificates
                        .filter(cert => cert.type === 'certificate')
                        .map((cert) => (
                          <option key={cert.filename} value={cert.filename}>
                            {cert.commonName || cert.filename}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
                      No certificate files available. Please add a certificate file first from manage certificate.
                    </div>
                  )}
                </div>
              </div>

              {/* Signature Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Signing
                  </label>
                  <input
                    type="text"
                    value={signatureForm.reason}
                    onChange={(e) => setSignatureForm({ ...signatureForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Document approval"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={signatureForm.location}
                    onChange={(e) => setSignatureForm({ ...signatureForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Digital signature"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Information
                  </label>
                  <input
                    type="email"
                    value={signatureForm.contactInfo}
                    onChange={(e) => setSignatureForm({ ...signatureForm, contactInfo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="signer@example.com"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="timestamp"
                    checked={signatureForm.timestamp}
                    onChange={(e) => setSignatureForm({ ...signatureForm, timestamp: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="timestamp" className="ml-2 text-sm text-gray-700">
                    Include timestamp authority
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleAddSignature}
                  disabled={isProcessing || !selectedFile || !selectedPrivateKey || !selectedCertificate}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'Processing...' : 'Add Digital Signature'}
                </button>
                <button
                  onClick={clearResults}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Results */}
            {signatureResult && (
              <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-800">Signature Added Successfully!</h3>
                  <button
                    onClick={handleDownload}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Signed PDF
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">File:</span> {signatureResult.filename}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Signer:</span> {signatureResult.signatureInfo.signer}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Organization:</span> {signatureResult.signatureInfo.organization}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Algorithm:</span> {signatureResult.signatureInfo.algorithm}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Reason:</span> {signatureResult.signatureInfo.reason}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span> {signatureResult.signatureInfo.location}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Verify Signature Tab */}
        {activeTab === 'verify' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Digital Signature</h2>
              <p className="text-gray-600">Verify the authenticity and integrity of signed PDFs</p>
            </div>

            {/* File Upload for Verification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select PDF File to Verify
              </label>
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
                  className="flex flex-col items-center space-y-2 text-gray-600 hover:text-blue-600"
                >
                  <Upload className="w-12 h-12" />
                  <span className="text-lg font-medium">
                    {selectedFile ? selectedFile.name : 'Click to upload PDF for verification'}
                  </span>
                </button>
              </div>
            </div>

            {/* Verify Button */}
            <div className="flex justify-center">
              <button
                onClick={handleVerifySignature}
                disabled={isProcessing || !selectedFile}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Verifying...' : 'Verify Signature'}
              </button>
            </div>

            {/* Verification Results */}
            {verificationResult && (
              <div className="mt-8 space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Results</h3>

                  {/* Show message for no signatures */}
                  {!verificationResult.hasSignatures && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                        <p className="text-yellow-800">{verificationResult.message}</p>
                      </div>
                    </div>
                  )}

                  {/* Show summary only if signatures exist */}
                  {verificationResult.hasSignatures && (
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                      <span>Total Signatures: {verificationResult.totalSignatures || 0}</span>
                      <span>Verified: {verificationResult.summary?.verified || 0}</span>
                      <span>Errors: {verificationResult.summary?.errors || 0}</span>
                    </div>
                  )}
                </div>

                {/* Only show verification results if they exist */}
                {verificationResult.verificationResults && verificationResult.verificationResults.length > 0 && (
                  verificationResult.verificationResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${result.status === 'verified'
                        ? 'bg-green-50 border-green-200'
                        : result.status === 'unsigned'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-red-50 border-red-200'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium text-gray-900">{result.fieldName}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${result.status === 'verified'
                          ? 'bg-green-100 text-green-800'
                          : result.status === 'unsigned'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {result.status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 mb-2">{result.message}</p>

                      {result.details && (
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div><span className="font-medium">Reason:</span> {result.details.reason}</div>
                          <div><span className="font-medium">Location:</span> {result.details.location}</div>
                          <div><span className="font-medium">Name:</span> {result.details.name}</div>
                          <div><span className="font-medium">Date:</span> {result.details.date}</div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Manage Certificates Tab */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Certificates</h2>
              <p className="text-gray-600">Generate and manage digital certificates for signing</p>
            </div>

            {/* Generate New Certificate */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate New Certificate</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Common Name *
                  </label>
                  <input
                    type="text"
                    value={certificateForm.commonName}
                    onChange={(e) => setCertificateForm({ ...certificateForm, commonName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization *
                  </label>
                  <input
                    type="text"
                    value={certificateForm.organization}
                    onChange={(e) => setCertificateForm({ ...certificateForm, organization: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={certificateForm.country}
                    onChange={(e) => setCertificateForm({ ...certificateForm, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., US"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleGenerateCertificate}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'Generating...' : 'Generate Certificate'}
                </button>
              </div>
            </div>

            {/* Existing Certificates */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Certificates</h3>
              {certificates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <File className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No certificates found. Generate your first certificate above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${cert.type === 'certificate' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {cert.type === 'certificate' ? (
                            <File className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Shield className="w-5 h-5 text-gray-600" />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">
                              {cert.type === 'certificate' ? (cert.commonName || cert.filename) : cert.filename}
                            </div>
                            {cert.type === 'certificate' && (
                              <div className="text-sm text-gray-600">
                                {cert.organization} • {cert.country}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              Size: {digitalSignatureService.formatFileSize(cert.size)} •
                              Modified: {new Date(cert.lastModified).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${cert.type === 'certificate' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {cert.type === 'certificate' ? 'Certificate' : 'Private Key'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalSignature;
