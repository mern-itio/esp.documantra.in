import React, { useState, useRef } from 'react';
import { removePasswordService } from '../../services/removePasswordService';
import type { RemovePasswordRequest, PasswordProtectionCheck } from '../../types/removePassword';
import { Button } from '../DocumentService/ui/button';
import { Input } from '../DocumentService/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../DocumentService/ui/card';
import { Link } from 'react-router-dom';
import { ArrowLeft, Unlock, Shield, Download, FileText, CheckCircle, AlertCircle, Info, Eye, EyeOff, Lock } from 'lucide-react';

const RemovePassword: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingProtection, setIsCheckingProtection] = useState(false);
  const [protectionCheck, setProtectionCheck] = useState<PasswordProtectionCheck | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      setProtectionCheck(null);
      // Automatically check if file is password protected
      checkPasswordProtection(file);
    } else if (file) {
      setError('Please select a valid PDF file');
    }
  };

  const checkPasswordProtection = async (file: File) => {
    setIsCheckingProtection(true);
    setError(null);
    
    try {
      const check = await removePasswordService.checkPasswordProtection(file);
      setProtectionCheck(check);
      
      if (!check.isProtected) {
        setError('This PDF is not password protected. No action needed.');
      }
    } catch (err: any) {
      console.error('Protection check error:', err);
      setError(`Failed to check password protection: ${err.message}`);
    } finally {
      setIsCheckingProtection(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'password') {
      setPassword(value);
    }
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!selectedFile) {
      setError('Please select a PDF file');
      return false;
    }
    if (!password) {
      setError('Password is required to remove protection');
      return false;
    }
    if (protectionCheck && !protectionCheck.isProtected) {
      setError('This PDF is not password protected');
      return false;
    }
    return true;
  };

  const handleRemovePassword = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const request: RemovePasswordRequest = {
        file: selectedFile!,
        password: password
      };

      const response = await removePasswordService.removePassword(request);
      setResult(response);
    } catch (err: any) {
      console.error('Password removal error:', err);
      setError(`Failed to remove password protection: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (result?.downloadUrl) {
      try {
        await removePasswordService.downloadFile(result.downloadUrl, result.filename);
      } catch (err: any) {
        console.error('Download error:', err);
        setError(`Failed to download file: ${err.message}`);
      }
    } else {
      setError('No download URL available');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPassword('');
    setShowPassword(false);
    setResult(null);
    setError(null);
    setProtectionCheck(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
 
  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-2">
        <div className="flex items-center space-x-4">
          <Link to="/pdf-tools" className="text-gray-600 hover:text-gray-800">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Remove Password Protection</h1>
            <p className="text-gray-600">Unlock your password-protected PDFs with ease</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Upload Protected PDF</span>
              </CardTitle>
              <CardDescription>
                Select the password-protected PDF file you want to unlock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{selectedFile.name} ({removePasswordService.formatFileSize(selectedFile.size)})</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Protection Check Result */}
          {isCheckingProtection && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Checking password protection...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {protectionCheck && (
            <Card className={`border-2 ${protectionCheck.isProtected ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center space-x-2 ${protectionCheck.isProtected ? 'text-orange-800' : 'text-green-800'}`}>
                  {protectionCheck.isProtected ? (
                    <Lock className="h-5 w-5" />
                  ) : (
                    <Unlock className="h-5 w-5" />
                  )}
                  <span>Protection Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className={`${protectionCheck.isProtected ? 'text-orange-800' : 'text-green-800'}`}>
                <div className="space-y-2">
                  <p className="font-medium">{protectionCheck.message}</p>
                  {protectionCheck.isProtected && protectionCheck.encryptionType && (
                    <p className="text-sm">Encryption: {protectionCheck.encryptionType}</p>
                  )}
                  {protectionCheck.isProtected && protectionCheck.permissions && (
                    <p className="text-sm">Permissions: {protectionCheck.permissions}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Password Input - Show only if file is protected */}
          {protectionCheck?.isProtected && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Unlock className="h-5 w-5" />
                  <span>Enter Password</span>
                </CardTitle>
                <CardDescription>
                  Provide the password to unlock your PDF
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PDF Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter the PDF password"
                      value={password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the password that was used to protect this PDF
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons - Show only if file is protected */}
          {protectionCheck?.isProtected && (
            <>
              <Button
                onClick={handleRemovePassword}
                disabled={!selectedFile || !password || isProcessing}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Unlock className="h-4 w-4 mr-2" />
                Remove Password Protection
              </Button>

              <Button
                onClick={resetForm}
                variant="outline"
                className="w-full"
              >
                Reset Form
              </Button>
            </>
          )}
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Password Protection Removed</span>
                </CardTitle>
                <CardDescription>
                  Your PDF has been successfully unlocked
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Filename:</span>
                    <p className="text-gray-600">{result.filename}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Pages:</span>
                    <p className="text-gray-600">{result.totalPages}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <p className="text-gray-600">Unprotected</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Tool Used:</span>
                    <p className="text-gray-600">{result.protectionInfo?.tool || 'qpdf'}</p>
                  </div>
                </div>

                <Button
                  onClick={handleDownload}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Unprotected PDF
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-600 mt-2">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Help Information */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <Info className="h-5 w-5" />
                <span>How Password Removal Works</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 text-sm space-y-2">
              <p><strong>Upload:</strong> Select your password-protected PDF file.</p>
              <p><strong>Check:</strong> We'll automatically verify if the file is password protected.</p>
              <p><strong>Enter Password:</strong> Provide the password that was used to protect the PDF.</p>
              <p><strong>Process:</strong> We'll remove the password protection and create an unlocked version.</p>
              <p><strong>Download:</strong> Get your unprotected PDF ready for use.</p>
            </CardContent>
          </Card>

          {/* Security Note */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-yellow-800">
                <Shield className="h-5 w-5" />
                <span>Security Note</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-yellow-800 text-sm">
              <p>Only remove password protection from PDFs you own or have permission to modify. The unlocked PDF will no longer be protected and can be accessed by anyone.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
            <span className="text-gray-700">Removing password protection...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemovePassword;
