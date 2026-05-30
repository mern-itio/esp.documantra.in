// src/pages/template/TemplateDesigner.tsx
import React, { useEffect, useState } from 'react';
import {
  Save,
  Eye
} from 'lucide-react';
import { DesignCanvas } from '../../components/Template/DesignCanvas';
import { ElementLibrary } from '../../components/Template/ElementLibrary';
import { PropertiesPanel } from '../../components/Template/PropertiesPanel';
import type { CanvasElement } from '../../types/template';
import { templateServiceApi } from '../../services/apiHelper';

export const TemplateDesigner: React.FC = () => {
  // UI state
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(null);
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);

  // History for undo/redo
  const [past, setPast] = useState<CanvasElement[][]>([]);
  const [future, setFuture] = useState<CanvasElement[][]>([]);
console.log(past);
console.log(future);
  // Preview mode
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Optional: Template meta (for save)
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateTitle, setTemplateTitle] = useState<string>('Untitled Template');
  const [saving, setSaving] = useState<boolean>(false);
  setTemplateId("1");
  // Tools list (for UI)
  // const tools = [
  //   { id: 'select', name: 'Select', icon: Layers },
  //   { id: 'text', name: 'Text', icon: Type },
  //   { id: 'image', name: 'Image', icon: Image },
  //   { id: 'rectangle', name: 'Rectangle', icon: Square },
  //   { id: 'circle', name: 'Circle', icon: Circle },
  //   { id: 'signature', name: 'Signature Field', icon: FileText }
  // ];

  // ---------- History helpers ----------
  const pushHistory = (nextElements: CanvasElement[]) => {
    setPast(prev => [...prev, canvasElements]);
    setFuture([]);
    setCanvasElements(nextElements);
  };

  // const _undo = () => {
  //   if (past.length === 0) return;
  //   const previous = past[past.length - 1];
  //   setPast(past.slice(0, -1));
  //   setFuture(f => [canvasElements, ...f]);
  //   setCanvasElements(previous);
  //   setSelectedElement(null);
  // };

  // const _redo = () => {
  //   if (future.length === 0) return;
  //   const next = future[0];
  //   setPast(p => [...p, canvasElements]);
  //   setFuture(future.slice(1));
  //   setCanvasElements(next);
  //   setSelectedElement(null);
  // };

  // ---------- Element operations ----------
  const addElement = (element: CanvasElement) => {
    const next = [...canvasElements, element];
    pushHistory(next);
    setSelectedElement(element);
  };

  const onElementsChange = (elements: CanvasElement[]) => {
    pushHistory(elements);
  };

  const updateElement = (updated: CanvasElement) => {
    const next = canvasElements.map(el => (el.id === updated.id ? updated : el));
    pushHistory(next);
    setSelectedElement(updated);
  };

  const deleteSelected = () => {
    if (!selectedElement) return;
    const next = canvasElements.filter(el => el.id !== selectedElement.id);
    pushHistory(next);
    setSelectedElement(null);
  };

  const duplicateSelected = () => {
    if (!selectedElement) return;
    const dup: CanvasElement = {
      ...selectedElement,
      id: `${selectedElement.type}_${Date.now()}`,
      x: selectedElement.x + 20,
      y: selectedElement.y + 20
    };
    const next = [...canvasElements, dup];
    pushHistory(next);
    setSelectedElement(dup);
  };

  // Keep selectedElement reference in sync
  useEffect(() => {
    if (!selectedElement) return;
    const exists = canvasElements.find(el => el.id === selectedElement.id);
    if (!exists) setSelectedElement(null);
    else setSelectedElement(exists);
  }, [canvasElements]);

  // ---------- Save / API ----------
  const saveDraft = async () => {
    setSaving(true);
    try {
      const payload: {
        id?: string;
        title: string;
        elements: CanvasElement[];
        status: 'draft' | 'active' | 'published';
      } = { title: templateTitle, elements: canvasElements, status: 'draft' };
      if (templateId) payload.id = templateId;

      const response = await templateServiceApi.post('/api/template/save', payload);
      if (response.status === 200) alert('Template saved successfully.');
    } catch (err) {
      console.error('Save draft failed', err);
    } finally {
      setSaving(false);
    }
  };

  const saveTemplate = async () => {
    setSaving(true);
    // implement publish logic
    setSaving(false);
  };

  // Preview toggle handler
  const togglePreview = () => setPreviewMode(p => !p);

  // ---------- Render ----------
  return (
    <div className="h-screen flex bg-[#F5F2EE]">
      {/* Sidebar - Tools & Elements */}
      {!previewMode && (
        <div className="w-80 bg-[#F7F3EE] border-r border-gray-200 flex flex-col">
          <ElementLibrary onElementSelect={addElement} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-[#F7F3EE] border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {previewMode ? (
              <h1 className="text-xl font-semibold text-gray-900">{templateTitle}</h1>
            ) : (
              <input
                className="px-3 py-2 border border-gray-200 rounded-md"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                placeholder="Template title"
              />
            )}
          </div>

          <div className="flex items-center space-x-3">
            {!previewMode && (
              <>
                <button
                  onClick={saveDraft}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  disabled={saving}
                >
                  Save Draft
                </button>
                <button
                  onClick={saveTemplate}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </button>
              </>
            )}
            <button
              onClick={togglePreview}
              className={`flex items-center px-4 py-2 rounded-md font-medium ${
                previewMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-6 overflow-auto">
          <DesignCanvas
            elements={canvasElements}
            selectedElement={previewMode ? null : selectedElement}
            onElementSelect={previewMode ? () => {} : setSelectedElement}
            onElementsChange={previewMode ? () => {} : onElementsChange}
            readOnly={previewMode}
          />
        </div>
      </div>

      {/* Properties Panel */}
      {!previewMode && (
        <div className="w-80 bg-[#F7F3EE] border-l border-gray-200">
          <PropertiesPanel
            selectedElement={selectedElement}
            onElementUpdate={updateElement}
            onDelete={deleteSelected}
            onDuplicate={duplicateSelected}
          />
        </div>
      )}
    </div>
  );
};

export default TemplateDesigner;
