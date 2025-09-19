import React, { useState, useEffect } from 'react';
import { Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline } from 'lucide-react';
import { Button } from '../DocumentService/ui/button';
import { Input } from '../DocumentService/ui/input';
import type { TextBlock } from '../../types/advancedPdfEditor';

interface TextEditorProps {
  currentPage: number;
  onAddEdit: (edit: any) => void;
  selectedElement: TextBlock | null;
  onElementSelect: (element: TextBlock | null) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  currentPage,
  onAddEdit,
  selectedElement,
  onElementSelect
}) => {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(12);
  const [fontFamily, setFontFamily] = useState('helv');
  const [color, setColor] = useState('#000000');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left');

  // Update form when selected element changes
  useEffect(() => {
    if (selectedElement) {
      setText(selectedElement.text);
      setFontSize(selectedElement.fontSize);
      setFontFamily(selectedElement.fontFamily);
      setColor(selectedElement.color);
      setIsBold((selectedElement.flags & 2) !== 0);
      setIsItalic((selectedElement.flags & 1) !== 0);
    } else {
      setText('');
      setFontSize(12);
      setFontFamily('helv');
      setColor('#000000');
      setIsBold(false);
      setIsItalic(false);
      setIsUnderline(false);
      setAlignment('left');
    }
  }, [selectedElement]);

  const handleTextChange = (newText: string) => {
    setText(newText);
    
    if (selectedElement) {
      // Update existing text element
      onAddEdit({
        type: 'replaceText',
        pageNumber: currentPage,
        position: {
          x: selectedElement.x,
          y: selectedElement.y,
          width: selectedElement.width,
          height: selectedElement.height
        },
        oldText: selectedElement.text,
        newText: newText,
        style: {
          fontSize,
          fontFamily,
          color,
          isBold,
          isItalic,
          isUnderline
        }
      });
    }
  };

  const handleStyleChange = (styleProperty: string, value: any) => {
    if (selectedElement) {
      onAddEdit({
        type: 'replaceText',
        pageNumber: currentPage,
        position: {
          x: selectedElement.x,
          y: selectedElement.y,
          width: selectedElement.width,
          height: selectedElement.height
        },
        oldText: selectedElement.text,
        newText: text,
        style: {
          fontSize,
          fontFamily,
          color,
          isBold,
          isItalic,
          isUnderline,
          [styleProperty]: value
        }
      });
    }
  };

  const handleAddNewText = () => {
    if (!text.trim()) return;

    onAddEdit({
      type: 'addText',
      pageNumber: currentPage,
      position: {
        x: 50, // Default position
        y: 50,
        width: text.length * fontSize * 0.6, // Estimate width
        height: fontSize * 1.2
      },
      text: text,
      style: {
        fontSize,
        fontFamily,
        color,
        isBold,
        isItalic,
        isUnderline
      }
    });

    // Clear form after adding
    setText('');
    onElementSelect(null);
  };

  const fontFamilies = [
    { value: 'helv', label: 'Helvetica' },
    { value: 'times', label: 'Times Roman' },
    { value: 'cour', label: 'Courier' },
    { value: 'symb', label: 'Symbol' },
    { value: 'zadb', label: 'ZapfDingbats' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Type className="w-4 h-4 text-gray-500" />
        <h4 className="font-medium text-gray-700">Text Editor</h4>
      </div>

      {/* Text Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Text Content
        </label>
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Enter text..."
          className="w-full p-2 border border-gray-300 rounded-md resize-none"
          rows={3}
        />
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Font Size
        </label>
        <Input
          type="number"
          value={fontSize}
          onChange={(e) => {
            const newSize = parseInt(e.target.value) || 12;
            setFontSize(newSize);
            handleStyleChange('fontSize', newSize);
          }}
          min="8"
          max="72"
          className="w-full"
        />
      </div>

      {/* Font Family */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Font Family
        </label>
        <select
          value={fontFamily}
          onChange={(e) => {
            setFontFamily(e.target.value);
            handleStyleChange('fontFamily', e.target.value);
          }}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          {fontFamilies.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Color
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              handleStyleChange('color', e.target.value);
            }}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          />
          <Input
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              handleStyleChange('color', e.target.value);
            }}
            className="flex-1"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Text Formatting */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Formatting
        </label>
        <div className="flex space-x-1">
          <Button
            variant={isBold ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsBold(!isBold);
              handleStyleChange('isBold', !isBold);
            }}
            className="p-2"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant={isItalic ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsItalic(!isItalic);
              handleStyleChange('isItalic', !isItalic);
            }}
            className="p-2"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant={isUnderline ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsUnderline(!isUnderline);
              handleStyleChange('isUnderline', !isUnderline);
            }}
            className="p-2"
          >
            <Underline className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Alignment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Alignment
        </label>
        <div className="flex space-x-1">
          <Button
            variant={alignment === 'left' ? "default" : "outline"}
            size="sm"
            onClick={() => setAlignment('left')}
            className="p-2"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant={alignment === 'center' ? "default" : "outline"}
            size="sm"
            onClick={() => setAlignment('center')}
            className="p-2"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant={alignment === 'right' ? "default" : "outline"}
            size="sm"
            onClick={() => setAlignment('right')}
            className="p-2"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {selectedElement ? (
          <div className="text-sm text-gray-600">
            <p>Editing: "{selectedElement.text.substring(0, 30)}..."</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onElementSelect(null)}
              className="w-full mt-2"
            >
              Cancel Edit
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleAddNewText}
            disabled={!text.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Add Text to Page
          </Button>
        )}
      </div>
    </div>
  );
};
