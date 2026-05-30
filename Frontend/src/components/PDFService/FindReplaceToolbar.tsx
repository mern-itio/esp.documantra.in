import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  Replace, 
  ChevronUp, 
  ChevronDown, 
  X, 
  Settings, 
  Regex, 
  CaseSensitive, 
  WholeWord,
  AlertCircle,
  Info
} from 'lucide-react';
import type { 
  FindReplaceOptions, 
  FindReplaceMatch, 
} from '../../types/findReplace';

interface FindReplaceToolbarProps {
  isVisible: boolean;
  onClose: () => void;
  onFind: (options: FindReplaceOptions) => void;
  onReplace: (options: FindReplaceOptions) => void;
  onReplaceAll: (options: FindReplaceOptions) => void;
  matches?: FindReplaceMatch[];
  currentMatchIndex?: number;
  totalMatches?: number;
  isProcessing?: boolean;
  error?: string;
}

const FindReplaceToolbar: React.FC<FindReplaceToolbarProps> = ({
  isVisible,
  onClose,
  onFind,
  onReplace,
  onReplaceAll,
  currentMatchIndex = 0,
  totalMatches = 0,
  isProcessing = false,
  error
}) => {
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [options, setOptions] = useState<FindReplaceOptions>({
    searchText: '',
    replaceText: '',
    useRegex: false,
    caseSensitive: false,
    wholeWord: false,
    replaceAll: false
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isReplaceMode, setIsReplaceMode] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when toolbar becomes visible
  useEffect(() => {
    if (isVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isVisible]);

  // Update options when search/replace text changes
  useEffect(() => {
    setOptions(prev => ({
      ...prev,
      searchText,
      replaceText
    }));
  }, [searchText, replaceText]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      // Close toolbar with Escape
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Find next with Enter or F3
      if ((e.key === 'Enter' || e.key === 'F3') && !e.shiftKey) {
        e.preventDefault();
        if (searchText.trim()) {
          onFind(options);
        }
        return;
      }

      // Find previous with Shift+F3
      if (e.key === 'F3' && e.shiftKey) {
        e.preventDefault();
        if (searchText.trim()) {
          onFind(options);
        }
        return;
      }

      // Toggle replace mode with Ctrl+H
      if (e.key === 'h' && e.ctrlKey) {
        e.preventDefault();
        setIsReplaceMode(!isReplaceMode);
        return;
      }

      // Replace with Ctrl+Shift+H
      if (e.key === 'H' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        if (searchText.trim() && replaceText !== undefined) {
          onReplaceAll(options);
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, searchText, replaceText, options, onClose, onFind, onReplace, onReplaceAll, isReplaceMode]);

  const handleFind = useCallback(() => {
    if (searchText.trim()) {
      onFind(options);
    }
  }, [searchText, options, onFind]);

  const handleReplace = useCallback(() => {
    if (searchText.trim() && replaceText !== undefined) {
      onReplace(options);
    }
  }, [searchText, replaceText, options, onReplace]);

  const handleReplaceAll = useCallback(() => {
    if (searchText.trim() && replaceText !== undefined) {
      onReplaceAll(options);
    }
  }, [searchText, replaceText, options, onReplaceAll]);

  const handleOptionChange = (key: keyof FindReplaceOptions, value: boolean) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePreviousMatch = () => {
    // This would be handled by the parent component
    // For now, just trigger find
    handleFind();
  };

  const handleNextMatch = () => {
    // This would be handled by the parent component
    // For now, just trigger find
    handleFind();
  };

  const clearSearch = () => {
    setSearchText('');
    setReplaceText('');
    setOptions(prev => ({
      ...prev,
      searchText: '',
      replaceText: ''
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-[#F7F3EE] rounded-lg shadow-xl border border-gray-200 p-4 min-w-96 max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {isReplaceMode ? 'Find & Replace' : 'Find'}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsReplaceMode(!isReplaceMode)}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${
              isReplaceMode ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
            }`}
            title="Toggle Replace Mode (Ctrl+H)"
          >
            <Replace className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${
              showAdvanced ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
            }`}
            title="Advanced Options"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-500"
            title="Close (Escape)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="space-y-3">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search text..."
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleFind();
              }
            }}
          />
          {searchText && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Replace Input */}
        {isReplaceMode && (
          <div className="relative">
            <input
              ref={replaceInputRef}
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replace with..."
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {replaceText && (
              <button
                onClick={() => setReplaceText('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-2 p-3 bg-[#F5F2EE] rounded-md">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.useRegex}
                  onChange={(e) => handleOptionChange('useRegex', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Regex className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Regex</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.caseSensitive}
                  onChange={(e) => handleOptionChange('caseSensitive', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <CaseSensitive className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Case</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.wholeWord}
                  onChange={(e) => handleOptionChange('wholeWord', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <WholeWord className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Word</span>
              </label>
            </div>
          </div>
        )}

        {/* Results Info */}
        {totalMatches > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {totalMatches} match{totalMatches !== 1 ? 'es' : ''} found
              {currentMatchIndex > 0 && ` (${currentMatchIndex} of ${totalMatches})`}
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={handlePreviousMatch}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title="Previous (Shift+F3)"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMatch}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title="Next (F3)"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleFind}
            disabled={!searchText.trim() || isProcessing}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Find</span>
          </button>

          {isReplaceMode && (
            <>
              <button
                onClick={handleReplace}
                disabled={!searchText.trim() || isProcessing}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Replace className="w-4 h-4" />
                <span>Replace</span>
              </button>

              <button
                onClick={handleReplaceAll}
                disabled={!searchText.trim() || isProcessing}
                className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Replace className="w-4 h-4" />
                <span>Replace All</span>
              </button>
            </>
          )}
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">Processing...</span>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center space-x-2">
            <Info className="w-3 h-3" />
            <span>Press Enter to find, Ctrl+H to toggle replace mode</span>
          </div>
          <div className="flex items-center space-x-2">
            <Info className="w-3 h-3" />
            <span>Use F3 for next match, Shift+F3 for previous</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindReplaceToolbar;
