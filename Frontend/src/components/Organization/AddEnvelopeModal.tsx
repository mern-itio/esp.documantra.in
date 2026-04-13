import React, { useEffect, useState } from 'react';
import { X, FileText, Search, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import {  organizationApi } from '../../services/apiHelper';
import { useNavigate } from 'react-router-dom';

interface Envelope {
  _id: string;
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
  const navigate = useNavigate();
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [selectedEnvelopes, setSelectedEnvelopes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedEnvelopes([]);
    setSearchQuery('');
    (async () => {
      try {
        const response = await organizationApi.get(
          `/api/organization/fetch-non-folder-envelopes/${folder?._id}`
        );
        setEnvelopes(response.data.data);
      } catch (err) {
        console.log(err);
      }
    })();
  }, [isOpen, folder?._id]);
  const handleCreateEnvelope = () => {
    navigate("/e-sign/create");
  };
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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Add Envelopes</h2>
              <p className="text-sm text-muted-foreground">{folder?.folderName || folder?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Search envelopes..."
              />
            </div>

            {/* Envelopes List */}
            {filteredEnvelopes.length > 0 ? (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredEnvelopes.map((envelope) => (
                  <div key={envelope.id || envelope._id} className="border border-border rounded-lg p-4 bg-muted/30 dark:bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedEnvelopes.includes(envelope?.id || envelope?._id)}
                          onChange={() => handleEnvelopeSelect(envelope?.id || envelope?._id)}
                          className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0 focus:ring-offset-background"
                        />
                        <div>
                          <p className="font-medium text-foreground">{envelope.name}</p>
                          <p className="text-sm text-muted-foreground">Status: {envelope.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No Envelope found. Please create envelope for organization.
                </p>
            <button
              onClick={handleCreateEnvelope}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span>
                Create Envelope
              </span>
            </button>
              </div>
            )}

            {selectedEnvelopes.length > 0 && (
              <button
                onClick={handleAdd}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all duration-300 disabled:opacity-50"
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