import React, { useState, useRef } from 'react';
import { addPasswordService } from '../../services/addPasswordService';
import type { AddPasswordRequest } from '../../types/addPassword';
import { Button } from '../DocumentService/ui/button';
import { Input } from '../DocumentService/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../DocumentService/ui/card';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Shield, Download, FileText, CheckCircle, AlertCircle, Info } from 'lucide-react';
const AddPassword: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [permissions, setPermissions] = useState<'all' | 'print' | 'copy' | 'modify' | 'annotate'>('all');
  const [encryptionLevel, setEncryptionLevel] = useState<'AES-256' | 'AES-128'>('AES-256');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  // const [totalPages, setTotalPages] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);



  const encryptionOptions = [
    {
      value: 'AES-256',
      label: 'AES-256',
      description: 'Highest security level',
      security: 'Maximum protection'
    }

  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      // Get file info for display
      const reader = new FileReader();
      reader.onload = () => {
        // You can add file validation here if needed
      };
      reader.readAsArrayBuffer(file);
    } else if (file) {
      setError('Please select a valid PDF file');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case 'ownerPassword':
        setOwnerPassword(value);
        break;
      case 'userPassword':
        setUserPassword(value);
        break;
      case 'permissions':
        setPermissions(value as any);
        break;
      case 'encryptionLevel':
        setEncryptionLevel(value as any);
        break;
    }
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!selectedFile) {
      setError('Please select a PDF file');
      return false;
    }
    if (!userPassword) {
      setError('User password is required for PDF encryption to work properly');
      return false;
    }
    if (userPassword.length < 6) {
      setError('User password must be at least 6 characters long');
      return false;
    }
    if (ownerPassword && ownerPassword.length < 6) {
      setError('Owner password must be at least 6 characters long');
      return false;
    }
    return true;
  };



  const handleAddPassword = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const request: AddPasswordRequest = {
        file: selectedFile!,
        ownerPassword: ownerPassword || undefined,
        userPassword: userPassword || undefined,
        permissions,
        encryptionLevel
      };

      const response = await addPasswordService.addPassword(request);
      setResult(response);
      // setTotalPages(response.totalPages || 1);
    } catch (err: any) {
      console.error('Password protection error:', err);
      setError(`Failed to add password protection: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (result?.downloadUrl) {
      try {
        await addPasswordService.downloadFile(result.downloadUrl, result.filename);
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
    setOwnerPassword('');
    setUserPassword('');
    setPermissions('all');
    setEncryptionLevel('AES-256');
    setResult(null);
    setError(null);
    // setTotalPages(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getPasswordStrength = (password: string) => {
    return addPasswordService.validatePassword(password);
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 1) return 'text-red-500';
    if (score <= 2) return 'text-orange-500';
    if (score <= 3) return 'text-yellow-500';
    if (score <= 4) return 'text-blue-500';
    return 'text-green-500';
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
            <h1 className="text-3xl font-bold text-gray-900">Add Password Protection</h1>
            <p className="text-gray-600">Secure your PDFs with owner and user passwords</p>
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
                <span>Upload PDF</span>
              </CardTitle>
              <CardDescription>
                Select the PDF file you want to protect with passwords
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
                    <span>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Password Settings - Show immediately after file selection */}
          {selectedFile && (
            <>
              {/* Password Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lock className="h-5 w-5" />
                    <span>Password Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Configure owner and user passwords for your PDF
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Owner Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Password (Optional)
                    </label>
                    <Input
                      type="password"
                      placeholder="Enter owner password"
                      value={ownerPassword}
                      onChange={(e) => handleInputChange('ownerPassword', e.target.value)}
                      className="w-full"
                    />
                    {ownerPassword && (
                      <div className="mt-1">
                        <span className={`text-xs ${getPasswordStrengthColor(getPasswordStrength(ownerPassword).score)}`}>
                          {getPasswordStrength(ownerPassword).message}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Owner password provides full access to the PDF
                    </p>
                  </div>

                  {/* User Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User Password <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="Enter user password (required)"
                      value={userPassword}
                      onChange={(e) => handleInputChange('userPassword', e.target.value)}
                      className="w-full"
                      required
                    />
                    {userPassword && (
                      <div className="mt-1">
                        <span className={`text-xs ${getPasswordStrengthColor(getPasswordStrength(userPassword).score)}`}>
                          {getPasswordStrength(userPassword).message}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      User password is required to open the PDF
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Permissions */}


              {/* Encryption Level */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Encryption Level</span>
                  </CardTitle>
                  <CardDescription>
                    Choose the security strength for your PDF
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {encryptionOptions.map((option) => (
                      <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="encryptionLevel"
                          value={option.value}
                          checked={encryptionLevel === option.value}
                          onChange={(e) => handleInputChange('encryptionLevel', e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <p className="text-sm text-gray-600">{option.description}</p>
                          <p className="text-xs text-gray-500">{option.security}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Button */}
              <Button
                onClick={handleAddPassword}
                disabled={!selectedFile || isProcessing}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Lock className="h-4 w-4 mr-2" />
                Add Password Protection
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
                  <span>Password Protection Added</span>
                </CardTitle>
                <CardDescription>
                  Your PDF has been successfully protected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Filename:</span>
                    <p className="text-gray-600">{result.filename}</p>
                  </div>
                  {/* <div>
                    <span className="font-medium text-gray-700">Pages:</span>
                    <p className="text-gray-600">{result.totalPages}</p>
                  </div> */}
                  <div>
                    <span className="font-medium text-gray-700">Owner Password:</span>
                    <p className="text-gray-600">{result.protectionInfo?.hasOwnerPassword ? 'Set' : 'Not set'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">User Password:</span>
                    <p className="text-gray-600">{result.protectionInfo?.hasUserPassword ? 'Set' : 'Not set'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Permissions:</span>
                    <p className="text-gray-600">{result.protectionInfo?.permissions || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Encryption:</span>
                    <p className="text-gray-600">{result.protectionInfo?.encryptionLevel || 'Not specified'}</p>
                  </div>
                </div>

                <Button
                  onClick={handleDownload}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Protected PDF
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
                <span>How Password Protection Works</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 text-sm space-y-2">
              <p><strong>Owner Password:</strong> Provides full access to modify permissions and passwords.</p>
              <p><strong>User Password:</strong> Required to open and view the PDF.</p>
              <p><strong>Permissions:</strong> Control what users can do with the PDF after entering the password.</p>
              <p><strong>Encryption:</strong> AES-256 provides maximum security, AES-128 offers good protection.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Processing PDF...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddPassword;
