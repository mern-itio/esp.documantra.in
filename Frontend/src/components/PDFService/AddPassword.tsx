import React, { useState, useRef } from 'react';
import { addPasswordService } from '../../services/addPasswordService';
import type { AddPasswordRequest } from '../../types/addPassword';
import { Button } from '../DocumentService/ui/button';
import { Input } from '../DocumentService/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../DocumentService/ui/card';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock, Shield, FileText, AlertCircle } from 'lucide-react';
import SuccessBox from '../common/SuccessBox';
const AddPassword: React.FC = () => {
   const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [permissions, setPermissions] = useState<'all' | 'print' | 'copy' | 'modify' | 'annotate'>('all');
  const [encryptionLevel, setEncryptionLevel] = useState<'AES-256' | 'AES-128'>('AES-256');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addPasswordResult, setAddPasswordResult] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
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

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a valid PDF file');
      }
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
      setAddPasswordResult(response);
      // setTotalPages(response.totalPages || 1);
    } catch (err: any) {
      console.error('Password protection error:', err);
      setError(`Failed to add password protection: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };


  const resetForm = () => {
    setSelectedFile(null);
    setOwnerPassword('');
    setUserPassword('');
    setPermissions('all');
    setEncryptionLevel('AES-256');
    setError(null);
    setAddPasswordResult(null);
    // setTotalPages(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetToStart = () => {
    setSelectedFile(null);
    setOwnerPassword('');
    setUserPassword('');
    setPermissions('all');
    setEncryptionLevel('AES-256');
    setError(null);
    setAddPasswordResult(null);
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

  // Success message UI
  if (addPasswordResult && addPasswordResult.success) {
    return (
      <div className="mx-auto space-y-6">
        <div className="bg-background shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-6">
              <Link
                to={`/pdf-tools${location.search}`}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Add Password Protection</h1>
                <p className="mt-2 text-sm text-foreground">
                  Secure your PDFs with owner and user passwords
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <SuccessBox
            title="Password Protection Added Successfully!"
            subtitle="Your PDF has been secured with password protection"
            message="The document is now protected and ready for download."
            fileInfo={{
              filename: addPasswordResult.filename,
              size: addPasswordResult.file?.size || selectedFile?.size || 0
            }}
            actions={{
              primary: {
                label: 'Download Protected PDF',
                onClick: () => addPasswordService.downloadFile(addPasswordResult.downloadUrl || '', addPasswordResult.filename)
              },
              secondary: {
                label: 'Back to Configuration',
                onClick: () => setAddPasswordResult(null)
              },
              tertiary: {
                label: 'Start New',
                onClick: resetToStart
              }
            }}
          />
        </div>
      </div>
    );
  }

  const isLandingRoute = location.pathname === '/protect-pdf';
  const headingTitle = isLandingRoute ? 'Protect PDF file' : 'Add Password Protection';
  const headingSubtitle = isLandingRoute
    ? 'Encrypt your PDF with a password to keep sensitive data confidential.'
    : 'Secure your PDFs with owner and user passwords';

  return (
    <div className="min-h-screen bg-background mx-auto space-y-6">
      {/* Header */}
      <div className=" shadow-sm border-b p-2">
        <div className="flex items-center space-x-4">
          <Link to={`/pdf-tools${location.search}`} className="text-muted-foreground hover:text-muted-foreground">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{headingTitle}</h1>
            <p className="text-muted-foreground">{headingSubtitle}</p>
          </div>
        </div>
      </div>

      {isLandingRoute && (
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <h2 className="text-2xl font-semibold text-muted">{headingTitle}</h2>
          <p className="text-muted mt-2">{headingSubtitle}</p>
        </div>
      )}


      {/* Upload Section - Only upload field initially (match Merge PDF style) */}
      {!selectedFile && (
        <div className="max-w-4xl mx-auto mt-2 md:mt-2">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive ? 'border-primary bg-primary' : 'border-muted hover:border-muted-foreground'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-2">
              Drag and drop your PDF here, or{' '}
              <button
                type="button"
                className="text-primary hover:text-foreground font-medium"
              >
                browse files
              </button>
            </p>
            <p className="text-sm text-muted-foreground">Maximum file size: 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Configuration Panel - Show after file selection */}
      {selectedFile && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Password Settings and Encryption Level - Side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Owner password provides full access to the PDF
                  </p>
                </div>

                {/* User Password */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    User Password <span className="text-destructive">*</span>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    User password is required to open the PDF
                  </p>
                </div>
              </CardContent>
            </Card>

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
                        <div className="font-medium text-muted-foreground">{option.label}</div>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                        <p className="text-xs text-muted-foreground">{option.security}</p>
                      </div>
                    </label>
                  ))}
                </div>
                
                {/* Action Buttons inside Encryption Level card */}
                <div className="mt-6 space-y-3">
                  <Button
                    onClick={handleAddPassword}
                    disabled={!selectedFile || isProcessing}
                    className="w-full bg-primary hover:bg-primary/70 text-primary-foreground"
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="max-w-4xl mx-auto">
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-destructive mt-2">{error}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No extra info initially; only the upload field is shown */}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Processing PDF...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddPassword;

