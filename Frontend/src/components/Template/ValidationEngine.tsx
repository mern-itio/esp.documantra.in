import React, { useState } from 'react';
import { CheckCircle, XCircle, Settings, Plus, Trash2 } from 'lucide-react';

interface ValidationRule {
  id: string;
  field: string;
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'number' | 'date' | 'custom';
  value?: string | number;
  message: string;
  enabled: boolean;
}

interface ValidationResult {
  field: string;
  valid: boolean;
  message?: string;
}

interface ValidationEngineProps {
  rules: ValidationRule[];
  onRulesChange: (rules: ValidationRule[]) => void;
  onValidate: (data: any) => ValidationResult[];
}

export const ValidationEngine: React.FC<ValidationEngineProps> = ({
  rules,
  onRulesChange,
  onValidate
}) => {
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<ValidationRule>>({
    type: 'required',
    enabled: true
  });
  const [testData, setTestData] = useState<Record<string, any>>({});
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);

  const validationTypes = [
    { type: 'required', label: 'Required Field', hasValue: false },
    { type: 'minLength', label: 'Minimum Length', hasValue: true },
    { type: 'maxLength', label: 'Maximum Length', hasValue: true },
    { type: 'pattern', label: 'Pattern/Regex', hasValue: true },
    { type: 'email', label: 'Email Format', hasValue: false },
    { type: 'number', label: 'Number Format', hasValue: false },
    { type: 'date', label: 'Date Format', hasValue: false },
    { type: 'custom', label: 'Custom Validation', hasValue: true }
  ];

  const addRule = () => {
    if (newRule.field && newRule.type && newRule.message) {
      const rule: ValidationRule = {
        id: `rule_${Date.now()}`,
        field: newRule.field,
        type: newRule.type as ValidationRule['type'],
        value: newRule.value,
        message: newRule.message,
        enabled: newRule.enabled || true
      };
      onRulesChange([...rules, rule]);
      setNewRule({ type: 'required', enabled: true });
      setIsAddingRule(false);
    }
  };

  const updateRule = (id: string, updates: Partial<ValidationRule>) => {
    onRulesChange(rules.map(rule => rule.id === id ? { ...rule, ...updates } : rule));
  };

  const deleteRule = (id: string) => {
    onRulesChange(rules.filter(rule => rule.id !== id));
  };

  const runValidation = () => {
    const results = onValidate(testData);
    setValidationResults(results);
  };

  const getValidationIcon = (result: ValidationResult) => {
    if (result.valid) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Validation Engine</h2>
        <button
          onClick={() => setIsAddingRule(true)}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </button>
      </div>

      {/* Validation Rules */}
      <div className="space-y-4 mb-8">
        <h3 className="text-md font-medium text-gray-900">Validation Rules</h3>
        {rules.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No validation rules</p>
            <p className="text-sm">Add rules to validate form data</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {rule.field} - {validationTypes.find(t => t.type === rule.type)?.label}
                    </div>
                    <div className="text-sm text-gray-600">{rule.message}</div>
                    {rule.value && (
                      <div className="text-xs text-gray-500">Value: {rule.value}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Enabled</span>
                  </label>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Rule Form */}
      {isAddingRule && (
        <div className="border-t border-gray-200 pt-6 mb-8">
          <h3 className="text-md font-medium text-gray-900 mb-4">Add Validation Rule</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
              <input
                type="text"
                value={newRule.field || ''}
                onChange={(e) => setNewRule({ ...newRule, field: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="employee_name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validation Type</label>
              <select
                value={newRule.type}
                onChange={(e) => setNewRule({ ...newRule, type: e.target.value as ValidationRule['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {validationTypes.map(type => (
                  <option key={type.type} value={type.type}>{type.label}</option>
                ))}
              </select>
            </div>
            {validationTypes.find(t => t.type === newRule.type)?.hasValue && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <input
                  type="text"
                  value={newRule.value || ''}
                  onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={newRule.type === 'pattern' ? '^[a-zA-Z]+$' : '5'}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Error Message</label>
              <input
                type="text"
                value={newRule.message || ''}
                onChange={(e) => setNewRule({ ...newRule, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="This field is required"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-4">
            <button
              onClick={addRule}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              Add Rule
            </button>
            <button
              onClick={() => setIsAddingRule(false)}
              className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Validation Testing */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">Test Validation</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Data (JSON)</label>
            <textarea
              value={JSON.stringify(testData, null, 2)}
              onChange={(e) => {
                try {
                  setTestData(JSON.parse(e.target.value));
                } catch (error) {
                  // Invalid JSON, ignore
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={6}
              placeholder='{"employee_name": "John Doe", "email": "john@example.com"}'
            />
            <button
              onClick={runValidation}
              className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
            >
              Run Validation
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Validation Results</label>
            <div className="border border-gray-300 rounded-md p-3 h-40 overflow-y-auto">
              {validationResults.length === 0 ? (
                <p className="text-gray-500 text-sm">No validation results yet</p>
              ) : (
                <div className="space-y-2">
                  {validationResults.map((result, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      {getValidationIcon(result)}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{result.field}</div>
                        {result.message && (
                          <div className={`text-xs ${result.valid ? 'text-green-600' : 'text-red-600'}`}>
                            {result.message}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};