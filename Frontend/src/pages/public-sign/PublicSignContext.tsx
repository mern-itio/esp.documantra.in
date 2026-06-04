import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { PublicAction, PublicRecipient, SignerType } from './publicSignTypes';

type PublicSignContextValue = {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  action: PublicAction;
  setAction: (action: PublicAction) => void;
  signerType: SignerType | null;
  setSignerType: (type: SignerType) => void;
  recipients: PublicRecipient[];
  setRecipients: React.Dispatch<React.SetStateAction<PublicRecipient[]>>;
  resetWizard: () => void;
};

const PublicSignContext = createContext<PublicSignContextValue | null>(null);

export const PublicSignProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [action, setActionState] = useState<PublicAction>('sign');
  const [signerType, setSignerTypeState] = useState<SignerType | null>(null);
  const [recipients, setRecipients] = useState<PublicRecipient[]>([]);

  const setAction = useCallback((value: PublicAction) => {
    setActionState(value);
    try {
      localStorage.setItem('publicAction', value);
    } catch {
      /* ignore */
    }
  }, []);

  const setSignerType = useCallback((value: SignerType) => {
    setSignerTypeState(value);
    try {
      localStorage.setItem('signerType', value);
    } catch {
      /* ignore */
    }
  }, []);

  const resetWizard = useCallback(() => {
    setFiles([]);
    setActionState('sign');
    setSignerTypeState(null);
    setRecipients([]);
    try {
      localStorage.removeItem('publicAction');
      localStorage.removeItem('signerType');
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      files,
      setFiles,
      action,
      setAction,
      signerType,
      setSignerType,
      recipients,
      setRecipients,
      resetWizard,
    }),
    [files, action, signerType, recipients, setAction, setSignerType, resetWizard]
  );

  return (
    <PublicSignContext.Provider value={value}>{children}</PublicSignContext.Provider>
  );
};

export function usePublicSign() {
  const ctx = useContext(PublicSignContext);
  if (!ctx) {
    throw new Error('usePublicSign must be used within PublicSignProvider');
  }
  return ctx;
}
