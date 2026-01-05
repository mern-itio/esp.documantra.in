import React, { useState, useRef } from 'react';
import { Sparkles, X, AlertTriangle, CheckCircle, Loader2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiAssistantApiService } from '../../services/aiAssistantService';

interface FormField {
  _id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormAICoPilotProps {
  formFields: FormField[];
  onFieldsAdded: (fields: FormField[]) => void;
}

export const FormAICoPilot: React.FC<FormAICoPilotProps> = ({
  formFields,
  onFieldsAdded
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [constraints, setConstraints] = useState<any>(null);
  const [showConstraints, setShowConstraints] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleParseCommand = async () => {
    if (!command.trim()) {
      toast.error('Please enter a command');
      return;
    }

    setIsProcessing(true);
    try {
      const context = {
        existingFields: formFields,
        fieldTypes: ['text', 'email', 'phone', 'date', 'checkbox', 'radio', 'select', 'textarea']
      };

      // Use a simplified version of the parse command for forms
      // Since forms don't have pages/coordinates, we'll parse field types and labels
      const response = await aiAssistantApiService.parseFieldCommand(command, context);

      if (response.success && response.data) {
        const { fields } = response.data;

        if (fields && fields.length > 0) {
          const newFields: FormField[] = fields.map((field: any, index: number) => ({
            _id: `field_${Date.now()}_${index}`,
            type: field.type || 'text',
            label: field.label || `${field.type} Field`,
            placeholder: field.placeholder || `Enter ${field.type}...`,
            required: field.required || false,
            options: field.type === 'radio' || field.type === 'select' ? ['Option 1', 'Option 2'] : undefined
          }));

          onFieldsAdded(newFields);
          toast.success(`Added ${newFields.length} field(s)`);
          setCommand('');
        }
      } else {
        toast.error(response.error || 'Failed to parse command');
      }
    } catch (error: any) {
      console.error('Error parsing command:', error);
      toast.error(error.response?.data?.message || 'Failed to parse command');
    } finally {
      setIsProcessing(false);
    }
  };

  const checkConstraints = async () => {
    try {
      const violations: Array<{ type: string; severity: string; message: string; fieldId?: string }> = [];
      const warnings: Array<{ type: string; severity: string; message: string }> = [];

      // Check for duplicate field labels
      const labels = formFields.map(f => f.label.toLowerCase());
      const duplicates = labels.filter((label, index) => labels.indexOf(label) !== index);
      if (duplicates.length > 0) {
        warnings.push({
          type: 'duplicate_labels',
          severity: 'warning',
          message: `Found ${duplicates.length} duplicate field label(s)`
        });
      }

      // Check for required fields without labels
      formFields.forEach(field => {
        if (field.required && !field.label.trim()) {
          violations.push({
            type: 'required_without_label',
            severity: 'error',
            message: `Required field missing label`,
            fieldId: field._id
          });
        }
      });

      setConstraints({
        success: true,
        violations,
        warnings,
        summary: {
          totalViolations: violations.length,
          totalWarnings: warnings.length,
          canProceed: violations.length === 0
        }
      });

      if (violations.length > 0 || warnings.length > 0) {
        setShowConstraints(true);
      }
    } catch (error) {
      console.error('Error checking constraints:', error);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 group"
        title="AI Co-Pilot"
      >
        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline font-medium">AI Co-Pilot</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">AI Co-Pilot</h3>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            setShowConstraints(false);
          }}
          className="hover:bg-white/20 rounded p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Natural Language Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Natural Language Command
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isProcessing) {
                  handleParseCommand();
                }
              }}
              placeholder="e.g., Add email and phone fields"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isProcessing}
            />
            <button
              onClick={handleParseCommand}
              disabled={isProcessing || !command.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Try: "Add email field", "Add date picker", "Add checkbox for terms"
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              checkConstraints();
              setShowConstraints(true);
            }}
            className="flex-1 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 text-sm font-medium flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Check Issues
          </button>
        </div>

        {/* Constraints/Warnings */}
        {showConstraints && constraints && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-900">Issues Found</h4>
              <button
                onClick={() => setShowConstraints(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {constraints.violations.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-600 mb-1">Errors ({constraints.violations.length})</p>
                <div className="space-y-1">
                  {constraints.violations.map((v: any, idx: number) => (
                    <div key={idx} className="text-xs text-red-700 flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{v.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {constraints.warnings.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-600 mb-1">Warnings ({constraints.warnings.length})</p>
                <div className="space-y-1">
                  {constraints.warnings.map((w: any, idx: number) => (
                    <div key={idx} className="text-xs text-amber-700 flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{w.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {constraints.violations.length === 0 && constraints.warnings.length === 0 && (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">All checks passed!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

