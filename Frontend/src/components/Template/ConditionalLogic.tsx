import React, { useState } from 'react';
import { Plus, Trash2, GitBranch, Eye, EyeOff } from 'lucide-react';

interface Condition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

interface ConditionalRule {
  id: string;
  name: string;
  conditions: Condition[];
  actions: {
    type: 'show' | 'hide' | 'require' | 'set_value' | 'calculate';
    target: string;
    value?: string;
  }[];
  enabled: boolean;
}

interface ConditionalLogicProps {
  rules: ConditionalRule[];
  onRulesChange: (rules: ConditionalRule[]) => void;
  availableFields: string[];
}

export const ConditionalLogic: React.FC<ConditionalLogicProps> = ({
  rules,
  onRulesChange,
  availableFields
}) => {
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<ConditionalRule>>({
    name: '',
    conditions: [],
    actions: [],
    enabled: true
  });

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' }
  ];

  const actionTypes = [
    { value: 'show', label: 'Show Field' },
    { value: 'hide', label: 'Hide Field' },
    { value: 'require', label: 'Make Required' },
    { value: 'set_value', label: 'Set Value' },
    { value: 'calculate', label: 'Calculate Value' }
  ];

  const addCondition = () => {
    const condition: Condition = {
      id: `condition_${Date.now()}`,
      field: availableFields[0] || '',
      operator: 'equals',
      value: ''
    };
    setNewRule({
      ...newRule,
      conditions: [...(newRule.conditions || []), condition]
    });
  };

  const updateCondition = (conditionId: string, updates: Partial<Condition>) => {
    setNewRule({
      ...newRule,
      conditions: (newRule.conditions || []).map(c => 
        c.id === conditionId ? { ...c, ...updates } : c
      )
    });
  };

  const removeCondition = (conditionId: string) => {
    setNewRule({
      ...newRule,
      conditions: (newRule.conditions || []).filter(c => c.id !== conditionId)
    });
  };

  const addAction = () => {
    const action = {
      type: 'show' as const,
      target: availableFields[0] || ''
    };
    setNewRule({
      ...newRule,
      actions: [...(newRule.actions || []), action]
    });
  };

  const updateAction = (actionIndex: number, updates: any) => {
    const actions = [...(newRule.actions || [])];
    actions[actionIndex] = { ...actions[actionIndex], ...updates };
    setNewRule({ ...newRule, actions });
  };

  const removeAction = (actionIndex: number) => {
    setNewRule({
      ...newRule,
      actions: (newRule.actions || []).filter((_, index) => index !== actionIndex)
    });
  };

  const saveRule = () => {
    if (newRule.name && newRule.conditions && newRule.actions) {
      const rule: ConditionalRule = {
        id: `rule_${Date.now()}`,
        name: newRule.name,
        conditions: newRule.conditions,
        actions: newRule.actions,
        enabled: newRule.enabled || true
      };
      onRulesChange([...rules, rule]);
      setNewRule({ name: '', conditions: [], actions: [], enabled: true });
      setIsAddingRule(false);
    }
  };

  const toggleRule = (ruleId: string) => {
    onRulesChange(rules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const deleteRule = (ruleId: string) => {
    onRulesChange(rules.filter(rule => rule.id !== ruleId));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Conditional Logic</h2>
        <button
          onClick={() => setIsAddingRule(true)}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-4 mb-8">
        {rules.map((rule) => (
          <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <GitBranch className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-gray-900">{rule.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {rule.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  {rule.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-2">
              <strong>Conditions:</strong> {rule.conditions.length} condition(s)
            </div>
            <div className="text-sm text-gray-600">
              <strong>Actions:</strong> {rule.actions.length} action(s)
            </div>
          </div>
        ))}
      </div>

      {/* Add Rule Form */}
      {isAddingRule && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">Create Conditional Rule</h3>
          
          {/* Rule Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
            <input
              type="text"
              value={newRule.name || ''}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Show salary field when employment type is full-time"
            />
          </div>

          {/* Conditions */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Conditions</h4>
              <button
                onClick={addCondition}
                className="flex items-center px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Condition
              </button>
            </div>
            
            <div className="space-y-3">
              {(newRule.conditions || []).map((condition, index) => (
                <div key={condition.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  {index > 0 && (
                    <select
                      value={condition.logicalOperator || 'AND'}
                      onChange={(e) => updateCondition(condition.id, { logicalOperator: e.target.value as 'AND' | 'OR' })}
                      className="px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  )}
                  
                  <select
                    value={condition.field}
                    onChange={(e) => updateCondition(condition.id, { field: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {availableFields.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                  
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(condition.id, { operator: e.target.value as Condition['operator'] })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {operators.map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>
                  
                  {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Value"
                    />
                  )}
                  
                  <button
                    onClick={() => removeCondition(condition.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Actions</h4>
              <button
                onClick={addAction}
                className="flex items-center px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-md"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Action
              </button>
            </div>
            
            <div className="space-y-3">
              {(newRule.actions || []).map((action, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <select
                    value={action.type}
                    onChange={(e) => updateAction(index, { type: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {actionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  
                  <select
                    value={action.target}
                    onChange={(e) => updateAction(index, { target: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {availableFields.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                  
                  {['set_value', 'calculate'].includes(action.type) && (
                    <input
                      type="text"
                      value={action.value || ''}
                      onChange={(e) => updateAction(index, { value: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={action.type === 'calculate' ? 'Formula' : 'Value'}
                    />
                  )}
                  
                  <button
                    onClick={() => removeAction(index)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Save/Cancel */}
          <div className="flex items-center space-x-3">
            <button
              onClick={saveRule}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              Save Rule
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
    </div>
  );
};