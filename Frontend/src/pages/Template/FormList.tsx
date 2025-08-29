import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { templateServiceApi } from "../../services/apiHelper";

interface Form {
  _id: string;
  title: string;
  description?: string;
}

export const FormsList: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState("");
  const [newFormDesc, setNewFormDesc] = useState("");

  const navigate = useNavigate();

  const getFromList = async()=>{
    try{
        const response = await templateServiceApi.get('/api/template/get-form');
        if(response){
            setForms(response.data.form);
        }
    }catch (err){
        console.log(err);
    }

  }

  useEffect(() => {
    getFromList();
  }, []);

  const handleCreateForm = async () => {
    if (!newFormTitle.trim()) return;
    setLoading(true);
    try {
        const response = await templateServiceApi.post('/api/template/create-form',{
            title: newFormTitle,
            description: newFormDesc
        });
        console.log(response.data);
            setForms(prev => [...prev, response.data]); // append new form
            setNewFormTitle("");
            setNewFormDesc("");
            setShowModal(false);
    } catch (err) {
      console.error("Error creating form", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Forms</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700"
        >
          + New Form
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="text-center text-gray-500">No forms created yet.</div>
      ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map(form => (
                <div
                key={form._id}
                className="group relative p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300"
                >
                {/* Decorative top bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-2xl"></div>

                <h2 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition">
                    {form.title}
                </h2>

                {form.description && (
                    <p className="text-gray-500 mt-2 text-sm">{form.description}</p>
                )}
                    <div className="mt-5 flex space-x-2">
                    <button
                        onClick={() => navigate(`/template/form-builder/${form._id}`)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700 hover:shadow-md transition"
                    >
                        Add / Edit
                    </button>

                        <a
                        href={`/template/form-view/${form._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-gray-200 text-gray-800 text-sm font-medium shadow hover:bg-gray-300 hover:shadow-md transition"
                        >
                        View
                    </a>

                    <button
                        onClick={() => navigate(`/template/form-embed/${form._id}`)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-sm font-medium shadow hover:bg-purple-700 hover:shadow-md transition"
                    >
                        Embed
                    </button>
                    </div>
                </div>
            ))}
            </div>
          )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-xl font-semibold mb-4">Create New Form</h2>

            <input
              type="text"
              placeholder="Form title"
              value={newFormTitle}
              onChange={e => setNewFormTitle(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <textarea
              placeholder="Description (optional)"
              value={newFormDesc}
              onChange={e => setNewFormDesc(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateForm}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
