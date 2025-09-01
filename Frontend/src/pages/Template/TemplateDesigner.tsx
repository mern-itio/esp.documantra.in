// src/pages/template/TemplateDesigner.tsx
import React, { useEffect, useState } from 'react';
import {
  Layers,
  Type,
  Image,
  Square,
  Circle,
  FileText,
  Save,
  Eye,
  Undo,
  Redo,
  Settings,
  Palette
} from 'lucide-react';
import { DesignCanvas } from '../../components/Template/DesignCanvas';
import { ElementLibrary } from '../../components/Template/ElementLibrary';
import { PropertiesPanel } from '../../components/Template/PropertiesPanel';
import type { CanvasElement } from '../../types/template';
import { templateServiceApi } from '../../services/apiHelper'; // adjust path to your API helper

export const TemplateDesigner: React.FC = () => {
  // UI state
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(null);
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);

  // History for undo/redo
  const [past, setPast] = useState<CanvasElement[][]>([]);
  const [future, setFuture] = useState<CanvasElement[][]>([]);

  // Preview mode
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Optional: Template meta (for save)
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateTitle, setTemplateTitle] = useState<string>('Untitled Template');
  const [saving, setSaving] = useState<boolean>(false);

  // Tools list (for UI)
  const tools = [
    { id: 'select', name: 'Select', icon: Layers },
    { id: 'text', name: 'Text', icon: Type },
    { id: 'image', name: 'Image', icon: Image },
    { id: 'rectangle', name: 'Rectangle', icon: Square },
    { id: 'circle', name: 'Circle', icon: Circle },
    { id: 'signature', name: 'Signature Field', icon: FileText }
  ];

  // ---------- History helpers ----------
  const pushHistory = (nextElements: CanvasElement[]) => {
    // push current present into past, clear future
    setPast(prev => [...prev, canvasElements]);
    setFuture([]);
    setCanvasElements(nextElements);
  };

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    setPast(newPast);
    setFuture(f => [canvasElements, ...f]);
    setCanvasElements(previous);
    setSelectedElement(null);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast(p => [...p, canvasElements]);
    setFuture(newFuture);
    setCanvasElements(next);
    setSelectedElement(null);
  };

  // ---------- Element operations ----------
  // Called by ElementLibrary when user adds a new element
  const addElement = (element: CanvasElement) => {
    const next = [...canvasElements, element];
    pushHistory(next);
    setSelectedElement(element);
  };

  // Called by DesignCanvas when drag/resize produces a new set
  const onElementsChange = (elements: CanvasElement[]) => {
    // This is a direct change (we push to history to allow undo/redo)
    pushHistory(elements);
  };

  // Called by PropertiesPanel to update a single element
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

  // Keep selectedElement reference in sync when elements change (e.g. deleted)
  useEffect(() => {
    if (!selectedElement) return;
    const exists = canvasElements.find(el => el.id === selectedElement.id);
    if (!exists) {
      setSelectedElement(null);
    } else {
      // refresh selectedElement to newest object reference
      setSelectedElement(exists);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasElements]);

  // ---------- Save / API ----------
  const saveDraft = async () => {
    setSaving(true);
    // try {
    //   const payload = {
    //     title: templateTitle,
    //     elements: canvasElements,
    //     status: 'draft'
    //   };
    //   if (templateId) {
    //     // update
    //     // await templateServiceApi.updateTemplate(templateId, payload);
    //   } else {
    //     // const res = await templateServiceApi.createTemplate(payload);
    //     // assume res contains id
    //     if (res?.id) setTemplateId(res.id);
    //   }
    //   // Optionally show a toast in your app
    // } catch (err) {
    //   console.error('Save draft failed', err);
    // } finally {
    //   setSaving(false);
    // }
  };

  const saveTemplate = async () => {
    setSaving(true);
    // try {
    //   const payload = {
    //     title: templateTitle,
    //     elements: canvasElements,
    //     status: 'published'
    //   };
    //   if (templateId) {
    //     // await templateServiceApi.updateTemplate(templateId, payload);
    //   } else {
    //     // const res = await templateServiceApi.createTemplate(payload);
    //     if (res?.id) setTemplateId(res.id);
    //   }
    //   // Optionally show a success UI
    // } catch (err) {
    //   console.error('Save template failed', err);
    // } finally {
    //   setSaving(false);
    // }
  };

  // Preview toggle handler
  const togglePreview = () => setPreviewMode(p => !p);

  // ---------- Render ----------
  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - Tools & Elements */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Tools */}
        {/* <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Design Tools</h2>
          <div className="grid grid-cols-3 gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedTool === tool.id
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs font-medium block">{tool.name}</span>
                </button>
              );
            })}
          </div>
        </div> */}

        {/* Element Library */}
        <div className="flex-1 overflow-y-auto">
          <ElementLibrary onElementSelect={(element: CanvasElement) => addElement(element)} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Template Designer</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={undo}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                title="Redo"
              >
                <Redo className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-2"></div>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md" title="Settings">
                <Settings className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md" title="Palette">
                <Palette className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              className="px-3 py-2 border border-gray-200 rounded-md"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              placeholder="Template title"
            />
            <button
              onClick={saveDraft}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              disabled={saving}
            >
              Save Draft
            </button>
            <button
              onClick={togglePreview}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            <button
              onClick={saveTemplate}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-6 overflow-auto">
          {/* If previewMode is true, you may want to render DesignCanvas in read-only mode.
              Here we just pass the same component; your DesignCanvas supports read-only
              by simply not showing selection/handles when necessary (you can enhance to accept a prop). */}
          <DesignCanvas
            elements={canvasElements}
            selectedElement={selectedElement}
            onElementSelect={setSelectedElement}
            onElementsChange={onElementsChange}
          />
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 bg-white border-l border-gray-200">
        <PropertiesPanel
          selectedElement={selectedElement}
          onElementUpdate={updateElement}
          // optional handlers added to panel
          // make sure to update your PropertiesPanel signature to accept onDelete/onDuplicate
          // (I showed that patch earlier)
          // @ts-ignore - if your current PropertiesPanel hasn't been patched, adjust accordingly
          onDelete={deleteSelected}
          // @ts-ignore
          onDuplicate={duplicateSelected}
        />
      </div>
    </div>
  );
};

export default TemplateDesigner;
