import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, Clock, User, Shield, ArrowRight, ArrowLeft, Download, Eye, FileSignature as Signature, Calendar, Type, Check, X, AlertCircle, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import SignatureCanvas from 'react-signature-canvas';

const SigningPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { envelopes, signingSessions, updateEnvelope, addAuditEntry } = useApp();
  const signatureRef = useRef<SignatureCanvas>(null);
  
  const [currentStep, setCurrentStep] = useState('review');
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [completedFields, setCompletedFields] = useState<Record<string, any>>({});
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock signing session - in real app this would be fetched by token
  const session = signingSessions.find(s => s.token === token);
  const envelope = session ? envelopes.find(e => e.id === session.envelopeId) : null;
  const recipient = envelope?.recipients.find(r => r.id === session?.recipientId);
  const recipientFields = envelope?.fields.filter(f => f.recipientId === session?.recipientId) || [];

  useEffect(() => {
    if (session && envelope) {
      addAuditEntry(envelope.id, {
        envelopeId: envelope.id,
        action: 'signing_session_started',
        actor: recipient?.email || 'unknown',
        details: 'Recipient started signing session',
        ipAddress: session.ipAddress
      });
    }
  }, [session, envelope]);

  if (!session || !envelope || !recipient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Signing Link</h2>
          <p className="text-gray-600 mb-6">This signing link is invalid, expired, or has already been used.</p>
        </div>
      </div>
    );
  }

  const currentField = recipientFields[currentFieldIndex];
  const progress = (Object.keys(completedFields).length / recipientFields.length) * 100;

  const handleFieldComplete = (fieldId: string, value: any) => {
    setCompletedFields(prev => ({ ...prev, [fieldId]: value }));
    
    if (currentFieldIndex < recipientFields.length - 1) {
      setCurrentFieldIndex(prev => prev + 1);
    } else {
      setCurrentStep('review');
    }
  };

  const handleSignatureComplete = () => {
    if (!currentField) return;

    let signatureValue;
    if (signatureMode === 'draw' && signatureRef.current) {
      signatureValue = signatureRef.current.toDataURL();
    } else if (signatureMode === 'type' && typedSignature.trim()) {
      signatureValue = typedSignature.trim();
    } else {
      return;
    }

    handleFieldComplete(currentField.id, signatureValue);
    setTypedSignature('');
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const handleSubmitSigning = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update envelope with completed fields
    const updatedFields = envelope.fields.map(field => {
      if (completedFields[field.id]) {
        return { ...field, completed: true, value: completedFields[field.id] };
      }
      return field;
    });

    const updatedRecipients = envelope.recipients.map(r => {
      if (r.id === recipient.id) {
        return { ...r, status: 'completed' as const, signedAt: new Date().toISOString() };
      }
      return r;
    });

    const allCompleted = updatedRecipients.every(r => r.status === 'completed');
    
    updateEnvelope({
      ...envelope,
      fields: updatedFields,
      recipients: updatedRecipients,
      status: allCompleted ? 'completed' : 'pending',
      completedAt: allCompleted ? new Date().toISOString() : undefined
    });

    addAuditEntry(envelope.id, {
      envelopeId: envelope.id,
      action: 'document_signed',
      actor: recipient.email,
      details: `Document signed by ${recipient.name}`,
      ipAddress: session.ipAddress
    });

    setCurrentStep('completed');
    setIsSubmitting(false);
  };

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Document</h2>
        <p className="text-gray-600">Please review the document before signing</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Document Information</h3>
          <span className="text-sm text-gray-500">{envelope.documents.length} document(s)</span>
        </div>
        
        {envelope.documents.map((doc) => (
          <div key={doc.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <FileText className="w-8 h-8 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{doc.name}</p>
              <p className="text-sm text-gray-500">{doc.pages} pages • {(doc.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Signing Requirements</h3>
        <div className="space-y-3">
          {recipientFields.map((field, index) => (
            <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900 capitalize">{field.type.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-500">Page {field.page}</p>
                </div>
              </div>
              {field.required && (
                <span className="text-xs text-red-600 font-medium">Required</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setCurrentStep('signing')}
          className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Signing
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderSigningStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Signing</h2>
        <p className="text-gray-600">
          Field {currentFieldIndex + 1} of {recipientFields.length}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {currentField && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 capitalize">
              {currentField.type.replace('_', ' ')} Required
            </h3>
            <p className="text-gray-600">Page {currentField.page}</p>
          </div>

          {currentField.type === 'signature' && (
            <div className="space-y-6">
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setSignatureMode('draw')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    signatureMode === 'draw'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Signature className="w-4 h-4" />
                  Draw
                </button>
                <button
                  onClick={() => setSignatureMode('type')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    signatureMode === 'type'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  Type
                </button>
              </div>

              {signatureMode === 'draw' ? (
                <div className="border-2 border-gray-300 rounded-lg p-4">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      width: 500,
                      height: 200,
                      className: 'signature-canvas w-full'
                    }}
                  />
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => signatureRef.current?.clear()}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleSignatureComplete}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Accept Signature
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Type your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-2xl font-script text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontFamily: 'cursive' }}
                  />
                  <div className="flex justify-center">
                    <button
                      onClick={handleSignatureComplete}
                      disabled={!typedSignature.trim()}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Accept Signature
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentField.type === 'date' && (
            <div className="space-y-4">
              <input
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleFieldComplete(currentField.id, e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {currentField.type === 'text' && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder={currentField.placeholder || 'Enter text'}
                onChange={(e) => handleFieldComplete(currentField.id, e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {currentField.type === 'initial' && (
            <div className="space-y-4">
              <div className="border-2 border-gray-300 rounded-lg p-4">
                <SignatureCanvas
                  canvasProps={{
                    width: 200,
                    height: 100,
                    className: 'signature-canvas mx-auto'
                  }}
                />
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => handleFieldComplete(currentField.id, 'initial_data')}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Accept Initial
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => {
            if (currentFieldIndex > 0) {
              setCurrentFieldIndex(prev => prev - 1);
            } else {
              setCurrentStep('review');
            }
          }}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
        
        {Object.keys(completedFields).length === recipientFields.length && (
          <button
            onClick={() => setCurrentStep('review-final')}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Review & Submit
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  const renderFinalReview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Final Review</h2>
        <p className="text-gray-600">Review your signatures before submitting</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Completed Fields</h3>
        <div className="space-y-4">
          {recipientFields.map((field, index) => (
            <div key={field.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900 capitalize">{field.type.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-500">Page {field.page}</p>
                </div>
              </div>
              <span className="text-sm text-green-600 font-medium">Completed</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Legal Notice</h4>
            <p className="text-sm text-blue-700 mt-1">
              By clicking "Submit Signature", you agree that your electronic signature is legally binding and has the same effect as a handwritten signature.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('signing')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Signing
        </button>
        
        <button
          onClick={handleSubmitSigning}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Submit Signature
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderCompletedStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Signing Complete!</h2>
        <p className="text-gray-600">
          Thank you for signing. You will receive a copy of the completed document via email.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h3>
        <div className="space-y-3 text-left">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">Your signature has been recorded</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-gray-700">A copy will be sent to your email</span>
          </div>
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-gray-700">Waiting for other signers to complete</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => window.close()}
        className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Close Window
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">DraftnSign</h1>
              <p className="text-sm text-gray-600">Secure Document Signing</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{recipient.name}</p>
              <p className="text-xs text-gray-500">{recipient.email}</p>
            </div>
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-6">
          {currentStep === 'review' && renderReviewStep()}
          {currentStep === 'signing' && renderSigningStep()}
          {currentStep === 'review-final' && renderFinalReview()}
          {currentStep === 'completed' && renderCompletedStep()}
        </div>
      </div>
    </div>
  );
};

export default SigningPage;