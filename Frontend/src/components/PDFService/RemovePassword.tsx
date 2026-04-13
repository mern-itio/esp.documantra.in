import React, { useState, useRef } from 'react';
import { removePasswordService } from '../../services/removePasswordService';
import type { RemovePasswordRequest, PasswordProtectionCheck } from '../../types/removePassword';
import { Button } from '../DocumentService/ui/button';
import { Input } from '../DocumentService/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../DocumentService/ui/card';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Unlock, Shield, Download, FileText, CheckCircle, AlertCircle, Info, Eye, EyeOff, Lock } from 'lucide-react';

const RemovePassword: React.FC = () => {
   const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingProtection, setIsCheckingProtection] = useState(false);
  const [protectionCheck, setProtectionCheck] = useState<PasswordProtectionCheck | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

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
        setResult(null);
        setProtectionCheck(null);
        checkPasswordProtection(file);
      } else {
        setError('Please select a valid PDF file');
      }
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
 
  const isLandingRoute = location.pathname === '/unlock-pdf';
  const headingTitle = isLandingRoute ? 'Unlock PDF file' : 'Remove Password Protection';
  const headingSubtitle = isLandingRoute
    ? 'Remove the password from your PDF to access content freely.'
    : 'Unlock your password-protected PDFs with ease';

  return (
    <div className="min-h-screen bg-background mx-auto space-y-6">
      {/* Header */}
      <div className="bg-card shadow-sm border-b p-2">
        <div className="flex items-center space-x-4">
          <Link to={`/pdf-tools${location.search}`} className="text-muted-foreground hover:text-foreground">
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
          <h2 className="text-2xl font-semibold text-foreground">{headingTitle}</h2>
          <p className="text-muted-foreground mt-2">{headingSubtitle}</p>
        </div>
      )}

      {/* Upload Section - Only upload field initially (match Merge PDF style) */}
      {!selectedFile && (
        <div className="max-w-4xl mx-auto mt-2 md:mt-2">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive ? 'border-primary bg-primary/50' : 'border-foreground/300 hover:border-foreground/50'}`}
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
                className="text-primary hover:text-primary/80 font-medium"
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

      {selectedFile && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">

          {/* Protection Check Result */}
          {isCheckingProtection && (
            <Card className="border-primary bg-primary/50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-primary">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm">Checking password protection...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {protectionCheck && (
            <Card className={`border-2 ${protectionCheck.isProtected ? 'border-destructive bg-destructive/50' : 'border-success bg-success/50'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center space-x-2 ${protectionCheck.isProtected ? 'text-destructive' : 'text-success'}`}>
                  {protectionCheck.isProtected ? (
                    <Lock className="h-5 w-5" />
                  ) : (
                    <Unlock className="h-5 w-5" />
                  )}
                  <span>Protection Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className={`${protectionCheck.isProtected ? 'text-destructive' : 'text-success'}`}>
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
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    PDF Password <span className="text-destructive">*</span>
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
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
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
                className="w-full bg-destructive hover:bg-destructive/80 text-destructive-foreground"
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
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Password Protection Removed</span>
                </CardTitle>
                <CardDescription>
                  Your PDF has been successfully unlocked
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Filename:</span>
                    <p className="text-muted-foreground">{result.filename}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Pages:</span>
                    <p className="text-muted-foreground">{result.totalPages}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Status:</span>
                    <p className="text-muted-foreground">Unprotected</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Tool Used:</span>
                    <p className="text-muted-foreground">{result.protectionInfo?.tool || 'qpdf'}</p>
                  </div>
                </div>

                <Button
                  onClick={handleDownload}
                  className="w-full bg-success hover:bg-success/80 text-foreground"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Unprotected PDF
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-destructive mt-2">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Help Information */}
          <Card className="border-primary bg-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-primary">
                <Info className="h-5 w-5" />
                <span>How Password Removal Works</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-primary text-sm space-y-2">
              <p><strong>Upload:</strong> Select your password-protected PDF file.</p>
              <p><strong>Check:</strong> We'll automatically verify if the file is password protected.</p>
              <p><strong>Enter Password:</strong> Provide the password that was used to protect the PDF.</p>
              <p><strong>Process:</strong> We'll remove the password protection and create an unlocked version.</p>
              <p><strong>Download:</strong> Get your unprotected PDF ready for use.</p>
            </CardContent>
          </Card>

          {/* Security Note */}
          <Card className="border-highlight bg-highlight/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-highlight">
                <Shield className="h-5 w-5" />
                <span>Security Note</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-highlight text-sm">
              <p>Only remove password protection from PDFs you own or have permission to modify. The unlocked PDF will no longer be protected and can be accessed by anyone.</p>
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-destructive"></div>
            <span className="text-muted-foreground">Removing password protection...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemovePassword;

