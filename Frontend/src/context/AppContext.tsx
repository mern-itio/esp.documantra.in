import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockEnvelopes, mockSigningSessions, mockUsers } from '../data/mockData';
import { Envelope, SigningSession, User, AuditEntry } from '../types';

interface AppContextType {
  user: User | null;
  envelopes: Envelope[];
  signingSessions: SigningSession[];
  currentEnvelope: Envelope | null;
  loading: boolean;
  error: string | null;
  setCurrentEnvelope: (envelope: Envelope | null) => void;
  updateEnvelope: (envelope: Envelope) => void;
  createEnvelope: (envelope: Omit<Envelope, 'id' | 'createdAt'>) => void;
  sendEnvelope: (envelopeId: string) => void;
  completeEnvelope: (envelopeId: string) => void;
  addAuditEntry: (envelopeId: string, entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<User>(mockUsers[0]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>(mockEnvelopes);
  const [signingSessions] = useState<SigningSession[]>(mockSigningSessions);
  const [currentEnvelope, setCurrentEnvelope] = useState<Envelope | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateEnvelope = (updatedEnvelope: Envelope) => {
    setEnvelopes(prev => 
      prev.map(env => env.id === updatedEnvelope.id ? updatedEnvelope : env)
    );
    if (currentEnvelope?.id === updatedEnvelope.id) {
      setCurrentEnvelope(updatedEnvelope);
    }
  };

  const createEnvelope = (envelopeData: Omit<Envelope, 'id' | 'createdAt'>) => {
    const newEnvelope: Envelope = {
      ...envelopeData,
      id: `env_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setEnvelopes(prev => [newEnvelope, ...prev]);
    setCurrentEnvelope(newEnvelope);
  };

  const sendEnvelope = (envelopeId: string) => {
    const envelope = envelopes.find(env => env.id === envelopeId);
    if (envelope) {
      const updatedEnvelope = {
        ...envelope,
        status: 'sent' as const,
        sentAt: new Date().toISOString(),
      };
      updateEnvelope(updatedEnvelope);
    }
  };

  const completeEnvelope = (envelopeId: string) => {
    const envelope = envelopes.find(env => env.id === envelopeId);
    if (envelope) {
      const updatedEnvelope = {
        ...envelope,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
      };
      updateEnvelope(updatedEnvelope);
    }
  };

  const addAuditEntry = (envelopeId: string, entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const envelope = envelopes.find(env => env.id === envelopeId);
    if (envelope) {
      const newEntry: AuditEntry = {
        ...entry,
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      const updatedEnvelope = {
        ...envelope,
        auditTrail: [...(envelope.auditTrail || []), newEntry],
      };
      updateEnvelope(updatedEnvelope);
    }
  };

  const value: AppContextType = {
    user,
    envelopes,
    signingSessions,
    currentEnvelope,
    loading,
    error,
    setCurrentEnvelope,
    updateEnvelope,
    createEnvelope,
    sendEnvelope,
    completeEnvelope,
    addAuditEntry,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};