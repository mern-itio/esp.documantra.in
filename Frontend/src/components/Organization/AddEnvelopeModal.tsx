import React, { useEffect, useState } from 'react';
import { X, FileText, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import {  organizationApi } from '../../services/apiHelper';

interface Envelope {
  id: string;
  name: string;
  status: string;
}

interface AddEnvelopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: {
    _id: string;
    folderName?: string;
    name?: string;
  } | null;
  onAdded: () => void;
}
export const AddEnvelopeModal: React.FC<AddEnvelopeModalProps> = ({
  isOpen,
  onClose,
  folder,
  onAdded,
}) => {
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [selectedEnvelopes, setSelectedEnvelopes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
          console.log(folder);
      fetchOrganizationEnvelopes();
      setSelectedEnvelopes([]);
      setSearchQuery('');

    }
  }, [isOpen]);

  const handleEnvelopeSelect = (envelopeId: string) => {
    console.log(envelopeId);
    setSelectedEnvelopes(prev =>
      prev.includes(envelopeId)
        ? prev.filter(id => id !== envelopeId)
        : [...prev, envelopeId]
    );
  };

  const handleAdd = async () => {
    if (selectedEnvelopes.length === 0 || !folder) return;

    setIsLoading(true);
    try {
      await organizationApi.post(`/api/organization/insert-envelopes/${folder?._id}`,{
        envelopeIds:selectedEnvelopes
      });

      toast.success(`${selectedEnvelopes.length} enve lope(s) added to folder successfully!`);
      onAdded();
      onClose();     
    } catch (error:any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to add envelopes';

      toast.error(errorMessage)
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEnvelopes = envelopes.filter(envelope =>
    envelope.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    envelope.status.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const fetchOrganizationEnvelopes = async () =>{
    try{
      const response = await organizationApi.get(`/fetch-non-folder-envelopes/${folder?._id}`);
        setEnvelopes(response.data.data);
    }catch (err){
      console.log(err);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#260559] to-[#3E2B66] rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add Envelopes</h2>
              <p className="text-sm text-gray-600">{folder?.folderName || folder?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3E2B66] focus:border-transparent"
                placeholder="Search envelopes..."
              />
            </div>

            {/* Envelopes List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredEnvelopes.map((envelope) => (
                <div key={envelope.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedEnvelopes.includes(envelope.id)}
                        onChange={() => handleEnvelopeSelect(envelope.id)}
                        className="w-4 h-4 text-[#3E2B66] border-gray-300 rounded focus:ring-[#3E2B66]"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{envelope.name}</p>
                        <p className="text-sm text-gray-500">Status: {envelope.status}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedEnvelopes.length > 0 && (
              <button
                onClick={handleAdd}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg font-semibold hover:from-[#3E2B66] hover:to-[#260559] transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : `Add ${selectedEnvelopes.length} envelope${selectedEnvelopes.length > 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};