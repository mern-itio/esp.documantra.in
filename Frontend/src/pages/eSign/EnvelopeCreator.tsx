import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Upload,
  X,
  Plus,
  FileText,
  ArrowLeft,
  Save,
  Send,
  Eye,
  Check,
  Shield,
  Award,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type{ Document, Recipient } from '../../types';
import AdvancedAuthenticationSelector from  '../../components/ESign/advanced/AdvancedAuthenticationSelector';
import SignatureTypeSelector from '../../components/ESign/advanced/SignatureTypeSelector'; 
import {eSignApi, templateServiceApi} from '../../services/apiHelper';
import SigningEditorStep from '../../components/ESign/SigningEditorStep';
type FieldType = "signature" | "text" | "email" | "number";

type SignatureField = {
  id: string;
  _id?: string; // for backward compatibility
  docId: string;
  documentId?: string; // for backward compatibility
  recipientId?: string;
  slotId?: string; // NEW: for power-form slot association
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isPowerForm?: boolean;   // NEW: power-form field flag
  signerIndex?: number;    // NEW: which PF signer slot (1..N)
  fieldType?: string;
  locked?: boolean; // new: when true field is fixed (not movable)
  label?: string; // new: field label
  type: FieldType; // <--- required property
};
// --- add this type near the other types at the top of the file ---
type Party = {
  id: string;                 // e.g. "slot_1"
  name: string;               // display label, e.g. "Party A"
  slot: number;               // 1-based index
  role?: 'signer' | 'approver' | 'carbon_copy' | string;
  authMethod?: 'email' | 'sms' | 'access_code' | 'none' | string;
  required?: boolean;
};

const EnvelopeCreator: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Power Form State
  const [mode, setMode] = useState<'normal' | 'power'>('normal');
  const [powerForms, setPowerForms] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<string>("");
  const [powerFormData, setPowerFormData] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);

  // Parties & related state
  const [parties, setParties] = useState<Party[]>(
    [{ id: 'slot_1', name: 'Party A', slot: 1, role: 'signer', authMethod: 'email', required: true }]
  );
  const [numberOfParties, setNumberOfParties] = useState<number>(parties.length || 1);
  const [maxParties] = useState<number>(10);

  // Selected/first party ids (creator choices)
  const [selectedPartyId, setSelectedPartyId] = useState<string>(parties[0]?.id ?? 'slot_1');
  const [firstSigningPartyId, setFirstSigningPartyId] = useState<string>(parties[0]?.id ?? 'slot_1');


  const [currentStep, setCurrentStep] = useState(1);
  const [envelopeData, setEnvelopeData] = useState({
    subject: '',
    message: '',
    priority: 'normal' as const,
    expiresAt: '',
    reminderEnabled: true,
    reminderInterval: 3,
    requireAllSignatures: true,
    allowDecline: true,
    signingOrder: 'sequential' as const,
    signatureType: 'standard' as 'standard' | 'advanced' | 'qualified',
    complianceLevel: 'basic' as 'basic' | 'enhanced' | 'qualified'
  });
  
  const [documents, setDocuments] = useState<Document[]>([]);

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [envelopeId, setEnvelopeId] = useState<string | null>(null);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [sending, setSending] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);

  const steps = [
    { id: 1, name: 'Documents', description: 'Upload documents' },
    { id: 2, name: 'Recipients / Power Form', description: 'Choose workflow and configure' },
    { id: 3, name: 'Fields', description: 'Place signature fields' },
    { id: 4, name: 'Security', description: 'Configure authentication' },
    { id: 5, name: 'Settings', description: 'Configure envelope' },
    { id: 6, name: 'Review', description: 'Review and send' }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setFiles(event.target.files);
    if (!files) return;

    Array.from(files).forEach((file) => {
      const newDocument: Document = {
        id: `doc_${Date.now()}_${Math.random()}`,
        name: file.name,
        size: file.size,
        pages: Math.ceil(file.size / 100000), // Mock page calculation
        type: file.type,
        url: URL.createObjectURL(file),
        file:file
      };
      setDocuments(prev => [...prev, newDocument]);
    });
  };
// Setp 1: Save Document In DB with Empty Envelope

const uploadDocuments = async (currentStep:any) => {
  if (!files || files?.length === 0) return;
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append('files', file, file.name);
  });
  if (envelopeId) {
    formData.append('envelopeId', envelopeId);
  }
  try {
      const response = await eSignApi.post('/api/e-sign/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.status == 200) {
        setEnvelopeId(response.data.data.envelopeId);
        navigate(`/e-sign/create?step=${currentStep+1}&envelopeId=${response.data.data.envelopeId}`);
      }
  }catch (error) {
    console.error('Error uploading documents:', error);
  }

};
// Step 2: Insert Recipients Map them with Envelope
const insertRecipient = async () => {
  if (recipients?.length === 0) return;

  const recipientData = recipients.map(recipient => ({
    name: recipient.name,
    email: recipient.email,
    role: recipient.role,
    order: recipient.order,
    status: recipient.status,
    authentication: recipient.authentication
  }));
  try {
    const response = await eSignApi.post('/api/e-sign/add-recipients',
      {
        envelopeId,
        recipients: recipientData
      }
     );
    if (response.status === 200) {
        console.log('Recipients inserted successfully:', response.data.envelopeId);
        await getEnvelopeDetail(response.data.envelopeId);
        console.log('Current Step:', currentStep+1);
        await navigate(`/e-sign/create?step=${currentStep+1}&envelopeId=${response.data.envelopeId}`);
      }
  } catch (error) {
    console.error('Error inserting recipients:', error);
  }
}
// Get Power Form Template
const getPowerForm = async () => {
  try {
    const response = await templateServiceApi.get('/api/template/get-form');
    if (response.status === 200) {
      //setPowerFormTemplate(response.data.template);
      setMode('power');
      console.log('Power Forms:', response.data.form);
      setPowerForms(response.data.form);
    }
  } catch (error) {
    console.error('Error fetching power form template:', error);
  }
};
const getFormDetails = async (formId: string) => {
  const response = await templateServiceApi.get(`/api/template/get-form-details/${formId}`);
  if (response.status === 200) {
    console.log('Power Forms:', response.data);
    setPowerFormData(response.data);
}
}
const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const formId = e.target.value;
    setSelectedForm(formId);       // ✅ update selected
    getFormDetails(formId);        // ✅ fetch details
};
//Step 3: Save Signature fields 
const saveSignatureFields = async () => {
  if (!envelopeId || signatureFields.length === 0) return;
  console.log('Preparing to save signature fields:', signatureFields);
    const fieldsData = signatureFields.map(field => ({
      _id: field._id,
      documentId: field.docId ?? field.documentId, // backward compatibility
      recipientId: mode === "normal" ? field.recipientId || null : null,
      slotId:field?.slotId || null,
      page: field.page,
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      type: field.type || "signature",
      status: "pending",
      signerIndex: mode === "power" ? (field.signerIndex ?? null) : null,
      label: field.label ?? (field.type === "signature" ? "Signature" : undefined),
  }));

  try {
    const response = await eSignApi.post('/api/e-sign/save-signature-fields', {
      envelopeId,
      signatureFields: fieldsData
    });
    if (response.status === 200) {
      setSignatureFields(response.data.data.signatureFields);
      await navigate(`/e-sign/create?step=${currentStep+1}&envelopeId=${envelopeId}`);
    }
  } catch (error) {
    console.error('Error saving signature fields:', error);
  }
};
const getEnvelopeDetail = async (envelopeId: string) => {
  try {
    const response = await eSignApi.get(`/api/e-sign/envelope/${envelopeId}`);
    if (response.status === 200) {
      setDocuments(response.data.data.documents);
      console.log('Fetched documents:', response.data.data.documents);
      setRecipients(response.data.data.recipients);
      console.log('Fetched recipients:', response.data.data.recipients);
      setEnvelopeId(envelopeId);
    }
  } catch (error) {
    console.error('Error fetching envelope details:', error);
  }
};
const updateEnvelope = async () => {
  console.log('Updating envelope with data:', envelopeId);
  if (!envelopeId) return;
  
  console.log('Updating envelope data:', envelopeData);
  try {
    const response = await eSignApi.post('/api/e-sign/update-envelope', {
      envelopeId,
      envelopeData: envelopeData,
    });
    if (response.status === 200) {
      console.log('Signature type updated successfully:', response.data);
      await navigate(`/e-sign/create?step=${currentStep+1}&envelopeId=${response.data.envelopeId}`);
    }
  } catch (error) {
    console.error('Error updating signature type:', error);
  }
};
// Update your "Next" button handler:
const handleNext = async () => {
    if (nextLoading) return;
    setNextLoading(true);
    try {
      if (currentStep === 1) {
        await uploadDocuments(currentStep);
      }
      if (currentStep === 2 ) {
        if (mode === 'normal') {
          if (recipients.length === 0) {
            alert('Please add at least one recipient.');
            setNextLoading(false);
            return;
        }
          await insertRecipient();
        }else {
          // power form: ensure totalSigners is set
          if (parties.length === 0) {
              alert('Please add at least one party for the Power Form.');
              setNextLoading(false);
              return;
            }
            if (!selectedPartyId) {
              alert('Please choose which party you are.');
              setNextLoading(false);
              return;
            }
            if (!firstSigningPartyId) {
              alert('Please choose which party signs first.');
              setNextLoading(false);
              return;
            }
            // persist slots/config
            await getEnvelopeDetail(envelopeId || "");
            const savedId = await savePowerFormSlots();
            if (!savedId) {
              alert('Failed to save power form configuration. Try again.');
              setNextLoading(false);
              return;
            }
            // navigate to next step with returned envelope/template id
            navigate(`/e-sign/create?step=${currentStep+1}&envelopeId=${savedId}`);
        }
      }
      if (currentStep === 3) {
        if (signatureFields.length === 0) {
          alert('Please add at least one signature field.');
          return;
        }
        // Here you can save the signature fields to the server or state
        await saveSignatureFields();
      }
      if (currentStep === 4) {
        await updateEnvelope();
      }
      if (currentStep === 5) {
        await updateEnvelope();
      }
      if (currentStep === 6) {
        alert('Envelope created successfully, Ready to send!');
        await navigate(`/e-sign/create?step=${currentStep+1}&envelopeId=${envelopeId}`);
      }
      setCurrentStep(prev => Math.min(6, prev + 1));
    } catch (err) {
      console.error('handleNext error:', err);
      // optionally surface error to user
    } finally {
      // small delay to avoid flicker (optional)
      // await new Promise(r => setTimeout(r, 150));
      setNextLoading(false);
    }
  };

  const removeDocument = async (docId: string) => {
    // Heuristic: If the ID is a MongoDB ObjectId (24 hex chars), treat it as DB record
    const isDbRecord = /^[a-fA-F0-9]{24}$/.test(docId);
    if(isDbRecord && envelopeId) {
      try{
        await eSignApi.post(`/api/e-sign/envelope/remove-document/${docId}/${envelopeId}`);
        console.log(`Document ${docId} deleted from DB successfully.`);
      }catch (error) {
        console.error('Failed to delete document from DB:', error);
      }
    }
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  const addRecipient = () => {
    const newRecipient: Recipient = {
      id: `recipient_${Date.now()}`,
      name: '',
      email: '',
      role: 'signer',
      order: recipients?.length + 1,
      status: 'waiting',
      authentication: 'email'
    };
    setRecipients(prev => [...prev, newRecipient]);
  };

  const updateRecipient = (id: string, updates: Partial<Recipient>) => {
    setRecipients(prev => prev.map(recipient => 
      recipient.id === id ? { ...recipient, ...updates } : recipient
    ));
  };
  const handleEmailOnBlur = async(id: string, email: string)=>{
    if (!email || !envelopeId) return;
    try{
      const response = await eSignApi.get(`/api/e-sign/get-recipient/${email}`);
      if (response.status == 200) {
        const {recipient} = response.data;
        updateRecipient(id, {
          name: recipient.name,
          email: recipient.email
        })
        console.log('Fetched and updated');
      }
    }catch (err){
      console.log(`Handle email on Blur`);
    }
  }

  const removeRecipient = async (id: string) => {
    // Check if coming from db and delete from db too

  // Heuristic: If the ID is a MongoDB ObjectId (24 hex chars), treat it as DB record
  const isDbRecord = /^[a-fA-F0-9]{24}$/.test(id);

  if (isDbRecord) {
    try {
      await eSignApi.post(`/api/e-sign/envelope/remove-recipient/${id}/${envelopeId}`);// Adjust API path if needed
      console.log(`Recipient ${id} deleted from DB successfully.`);
    } catch (error) {
      console.error('Failed to delete recipient from DB:', error);
    }
  }
    setRecipients(prev => prev.filter(recipient => recipient.id !== id));
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return documents?.length > 0;
      case 2:
         if (mode === 'normal') {
        return recipients?.length > 0 && recipients.every(r => r.name && r.email);
      } else {
        // power mode'
        return true; // Fields are optional
      }
      case 3:
        return true; // Fields are optional
      case 4:
        return true; // Authentication is optional
      case 5:
        return envelopeData.subject.trim() !== '';
      default:
        return true;
    }
  };

  const handleCreateEnvelope = () => {
    if (!user) return;
    navigate('/e-sign/dashboard');
  };

  const handleSendEnvelope = async () => {
    if (!envelopeId) return;
    setSending(true);
      try {
        await eSignApi.post(`/api/e-sign/send-envelope/${envelopeId}`);
        alert('Envelope sent successfully!');
        navigate('/e-sign/dashboard');
      } catch (err) {
        console.error(err);
        alert('Failed to send envelope. Try again.');
      } finally {
        setSending(false);
      }
  };
  useEffect(() => {
    getSteps();
}, []);
const getSteps = async () => {
    const params = new URLSearchParams(location.search);
    const step = params.get('step');
    const envelopeId = params.get('envelopeId');
    if(step && envelopeId ) {
       const response = await eSignApi.get('/api/e-sign/get-envelopes');
        if(response)
          {
            switch (Number(step)) 
            {
              case 1:
                setCurrentStep(1);
                setEnvelopeId(envelopeId)
                if(envelopeId) await getEnvelopeDetail(envelopeId);
                break;
              case 2:
                setCurrentStep(2);
                setEnvelopeId(envelopeId)
                await getEnvelopeDetail(envelopeId);
                break;
              case 3:
                console.log('Current step', step);
                setCurrentStep(3);
                await getEnvelopeDetail(envelopeId);
                await getSignatureFields(envelopeId);
                break;
              case 4:
                setCurrentStep(4);
                setEnvelopeId(envelopeId)
                break;
              case 5:
                setCurrentStep(5);
                setEnvelopeId(envelopeId)
                break;
              case 6:
                setCurrentStep(6);
                setEnvelopeId(envelopeId);
                await getEnvelopeDetail(envelopeId);
                break;
              default:
                setCurrentStep(1);
            }
          }
    }
}
const syncPartiesToNumber = (count: number) => {
  if (!count || count < 1) count = 1;
  if (count > maxParties) count = maxParties;

  // Build new parties array deterministically
    const newParties: Party[] = [];
    for (let i = 1; i <= count; i++) {
      const letter = String.fromCharCode(64 + i); // 1 -> 'A'
      newParties.push({
        id: `slot_${i}`,
        name: `Party ${letter}`,
        slot: i,
        role: 'signer',
        authMethod: 'email',
        required: true
      });
    }

    // Commit updates in order
    setParties(newParties);
    setNumberOfParties(count);

    // Ensure selectedPartyId remains valid, otherwise pick slot_1 or last slot
    setSelectedPartyId(prevSelected => {
      const exists = newParties.find(p => p.id === prevSelected);
      return exists ? prevSelected : newParties[0]?.id ?? `slot_1`;
    });

    // Ensure firstSigningPartyId remains valid
    setFirstSigningPartyId(prevFirst => {
      const exists = newParties.find(p => p.id === prevFirst);
      return exists ? prevFirst : newParties[0]?.id ?? `slot_1`;
    });
    console.log(parties)
  };

const getSignatureFields = async (envelopeId: string) => {
  try {
    const response = await eSignApi.get(`/api/e-sign/envelope/get-signature-fields/${envelopeId}`);
    if (response.status === 200) {
      setSignatureFields(response.data.signatureFields);
      console.log('Fetched signature fields:', response.data.signatureFields);
    }
  } catch (error) {
    console.error('Error fetching signature fields:', error);
  }
};
// Step 2B: persist power-form slots / config (minimal)
const savePowerFormSlots = async (): Promise<string | null> => {
  // prepare slots payload
  const slotsPayload = parties.map(p => ({
    slotId: p.id,
    index: p.slot,
    label: p.name,
    role: p.role || 'signer',
    authMethod: p.authMethod || 'email',
    required: p.required ?? true
  }));
  setSlots(slotsPayload);
  try {
    // adjust endpoint as per your backend. This is example /api/powerforms or reuse envelopes endpoint.
    const payload = {
      envelopeId, // may be null for new
      slots: slotsPayload,
      creatorSlotId: selectedPartyId,
      firstSigningSlotId: firstSigningPartyId,
      numberOfParties,
      powerFormId: selectedForm || null,
    };
    const response = await eSignApi.post('/api/e-sign/envelope/connect/powerform', payload);
    if (response?.status === 200 || response?.status === 201) {
      // backend should return envelopeId or templateId
      const id = response.data?.envelope?._id;
      console.log('Power Form slots saved, envelopeId:', id);
      if (id) setEnvelopeId(id);
      return id;
    } else {
      console.error('savePowerFormSlots: unexpected response', response);
      return null;
    }
  } catch (err) {
    console.error('savePowerFormSlots error', err);
    return null;
  }
};

 const [isEditable, setIsEditable] = useState(false);
  const [date, setDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]
  );
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Documents</h3>
              <p className="text-gray-600 mb-6">Add the documents that need to be signed. Supported formats: PDF, DOC, DOCX.</p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Drop files here or click to upload</h4>
              <p className="text-gray-500">PDF, DOC, DOCX up to 10MB each</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {documents?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Uploaded Documents</h4>
                {documents?.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-500">
                          {(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.pages} pages
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose flow: Normal or Power Form</h3>
              <p className="text-gray-600 mb-6">Normal — add recipients and place recipient-specific signature fields. Power Form — define a reusable form with numbered signer slots.</p>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => setMode('normal')} className={`px-4 py-2 rounded-lg ${mode==='normal' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Normal (Recipients)</button>
              <button onClick={() => getPowerForm()} className={`px-4 py-2 rounded-lg ${mode==='power' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Power Form</button>
            </div>
            {mode === 'normal' ? (
              //Recipient UI
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Recipients</h3>
                  <p className="text-gray-600 mb-6">Add people who need to sign or receive copies of the documents.</p>
                </div>
                <button
                  onClick={addRecipient}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Recipient
                </button>
                {recipients?.length > 0 && (
                  <div className="space-y-4">
                    {recipients.map((recipient, index) => (
                      <div key={recipient.id} className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-gray-900">Recipient {index + 1}</h4>
                          <button
                            onClick={() => removeRecipient(recipient.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input
                              type="text"
                              value={recipient.name}
                              onChange={(e) => updateRecipient(recipient.id, { name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Full name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                              type="email"
                              value={recipient.email}
                              onChange={(e) => updateRecipient(recipient.id, { email: e.target.value })}
                              onBlur={(e) => handleEmailOnBlur(recipient.id, e.target.value )}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="email@example.com"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                            <select
                              value={recipient.role}
                              onChange={(e) => updateRecipient(recipient.id, { role: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="signer">Signer</option>
                              <option value="approver">Approver</option>
                              <option value="carbon_copy">Carbon Copy</option>
                              <option value="in_person_signer">In-Person Signer</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Authentication</label>
                            <select
                              value={recipient.authentication}
                              onChange={(e) => updateRecipient(recipient.id, { authentication: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="none">None</option>
                              <option value="email">Email Verification</option>
                              <option value="sms">SMS Verification</option>
                              <option value="access_code">Access Code</option>
                              <option value="phone">Phone Verification</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </>
              
            ) : (
              <div>
                  <h4 className="text-sm font-medium text-gray-900">Build Power Form</h4>
                  <p className="text-sm text-gray-500 mb-4">Set the number of signers (slots). You will drag power-form placeholders onto the document in the next step.</p>
                  {/* select field creation with powerForm list as options */}
                  <div className="w-full">
                      <label htmlFor="powerForm" className="block mb-2 text-sm font-medium text-gray-700">
                        Select Power Form
                      </label>
                      <select id="powerForm" value={selectedForm} onChange={handleChange}
                        className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
                          <option value="">-- Choose a Form --</option>
                          {powerForms.map((form) => (
                            <option key={form._id} value={form._id}>
                              {form.title}
                            </option>
                          ))}
                      </select>
                  </div>
                   {/* Show selected form details */}
                    {powerFormData && (
                      <div className="bg-gray-50  rounded-lg p-4 space-y-4 p-4 mt-4">
                        <div>
                          <h5 className="text-lg font-semibold text-gray-900">
                            {powerFormData.title}
                          </h5>
                          <p className="text-sm text-gray-600">{powerFormData.description}</p>
                        </div>

                        <div>
                          <h6 className="text-sm font-medium text-gray-800 mb-2">Fields</h6>
                          <ul className="space-y-2">
                            {powerFormData.fields.map((field: any) => (
                              <li
                                key={field._id}
                                className="flex items-center justify-between bg-white border rounded p-2 text-sm"
                              >
                                <span>{field.label || field.type}</span>
                                <span className="text-gray-500">{field.type}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {/* Step 1C: Number of parties control */}
                    <div className="mb-4 flex items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Number of parties</label>
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 rounded border"
                          onClick={() => syncPartiesToNumber(Math.max(1, numberOfParties - 1))}
                          type="button"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={maxParties}
                          value={numberOfParties}
                          onChange={(e) => {
                            const val = Number(e.target.value || 1);
                            syncPartiesToNumber(val);
                          }}
                          className="w-20 px-2 py-1 border rounded text-center"
                        />
                        <button
                          className="px-2 py-1 rounded border"
                          onClick={() => syncPartiesToNumber(Math.min(maxParties, numberOfParties + 1))}
                          type="button"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 ml-4">Min 1 — Max {maxParties}</p>
                    </div>
                    {/* ===== First signer selector ===== */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Which party signs first?</label>
                      <select
                        value={firstSigningPartyId}
                        onChange={(e) => setFirstSigningPartyId(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2"
                      >
                        {parties.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.slot ? `(${p.slot})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* ===== Which party are you (creator) ===== */}
                    <div className="mt-4">
                      <h6 className="text-sm font-medium text-gray-900 mb-2">Choose which party you are</h6>
                      <div className="space-y-2">
                        {parties.map((party) => (
                          <label key={party.id} className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="creatorParty"
                              checked={selectedPartyId === party.id}
                              onChange={() => setSelectedPartyId(party.id)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{party.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <SigningEditorStep 
            documents={documents} 
            recipients={recipients} 
            signatureFields = {signatureFields} 
            setSignatureFields={setSignatureFields}
            mode={mode} 
            powerFormData={powerFormData}
            slots={slots} 
          />
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Security & Authentication</h3>
              <p className="text-gray-600 mb-6">Configure signature types and advanced authentication methods for enhanced security.</p>
            </div>

            {/* Signature Type Selection */}
            <SignatureTypeSelector
              selectedType={envelopeData.signatureType}
              onTypeChange={(type) => setEnvelopeData(prev => ({ 
                ...prev, 
                signatureType: type,
                complianceLevel: type === 'qualified' ? 'qualified' : type === 'advanced' ? 'enhanced' : 'basic'
              }))}
              complianceRequirements={[]}
              documentType="contract"
            />

            {/* Advanced Authentication */}
            <div className="mt-8">
              <AdvancedAuthenticationSelector
                selectedMethods={recipients.map(r => r.authentication).filter(Boolean)}
                onMethodsChange={(methods) => {
                  // Update recipients with new authentication methods
                  setRecipients(prev => prev.map((recipient, index) => ({
                    ...recipient,
                    authentication: methods[index] as Recipient['authentication'] || 'email'
                  })));
                }}
                riskLevel="medium"
                complianceRequirements={[]}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Envelope Settings</h3>
              <p className="text-gray-600 mb-6">Configure how your envelope will be sent and managed.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <input
                  type="text"
                  value={envelopeData.subject}
                  onChange={(e) => setEnvelopeData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter envelope subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={envelopeData.message}
                  onChange={(e) => setEnvelopeData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a message for recipients (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={envelopeData.priority}
                    onChange={(e) => setEnvelopeData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Signing Order</label>
                  <select
                    value={envelopeData.signingOrder}
                    onChange={(e) => setEnvelopeData(prev => ({ ...prev, signingOrder: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sequential">Sequential (one at a time)</option>
                    <option value="parallel">Parallel (all at once)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    readOnly={!isEditable}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg 
                      ${isEditable ? "bg-white cursor-text" : "bg-gray-100 cursor-not-allowed"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditable(!isEditable)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    {isEditable ? "Lock" : "Edit"}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="reminderEnabled"
                    checked={envelopeData.reminderEnabled}
                    onChange={(e) => setEnvelopeData(prev => ({ ...prev, reminderEnabled: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="reminderEnabled" className="text-sm font-medium text-gray-700">
                    Enable automatic reminders
                  </label>
                </div>

                {envelopeData.reminderEnabled && (
                  <div className="ml-7">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reminder interval (days)</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={envelopeData.reminderInterval}
                      onChange={(e) => setEnvelopeData(prev => ({ ...prev, reminderInterval: parseInt(e.target.value) }))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="requireAllSignatures"
                    checked={envelopeData.requireAllSignatures}
                    onChange={(e) => setEnvelopeData(prev => ({ ...prev, requireAllSignatures: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="requireAllSignatures" className="text-sm font-medium text-gray-700">
                    Require all recipients to sign
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="allowDecline"
                    checked={envelopeData.allowDecline}
                    onChange={(e) => setEnvelopeData(prev => ({ ...prev, allowDecline: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="allowDecline" className="text-sm font-medium text-gray-700">
                    Allow recipients to decline signing
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Review & Send</h3>
              <p className="text-gray-600 mb-6">Review your envelope details before sending to recipients.</p>
            </div>

            <div className="space-y-6">
              {/* Envelope Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Envelope Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Subject</p>
                    <p className="text-gray-900">{envelopeData.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Priority</p>
                    <p className="text-gray-900 capitalize">{envelopeData.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Signature Type</p>
                    <div className="flex items-center gap-2">
                      {envelopeData.signatureType === 'qualified' && <Award className="w-4 h-4 text-purple-600" />}
                      {envelopeData.signatureType === 'advanced' && <Shield className="w-4 h-4 text-blue-600" />}
                      <p className="text-gray-900 capitalize">{envelopeData.signatureType}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Documents</p>
                    <p className="text-gray-900">{documents?.length} document{documents?.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {envelopeData.message && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">Message</p>
                    <p className="text-gray-900">{envelopeData.message}</p>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Documents</h4>
                <div className="space-y-3">
                  {documents?.map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-500">{doc.pages} pages • {(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipients */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Recipients</h4>
                <div className="space-y-3">
                  {recipients.map((recipient, index) => (
                    <div key={recipient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{recipient.name}</p>
                          <p className="text-sm text-gray-500">{recipient.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700 capitalize">{recipient.role.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-500 capitalize">{recipient.authentication.replace('_', ' ')} auth</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/e-sign/dashboard'))}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Envelope</h1>
              <p className="text-gray-600">Step {currentStep} of {steps?.length}: {steps[currentStep - 1].description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {currentStep === 6 && (
              <>
                <button
                  onClick={handleCreateEnvelope}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </button>
                { mode === 'normal' &&
                <button
                  onClick={handleSendEnvelope}
                  disabled={sending}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                    sending ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {sending ? (
                    <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                  {sending ? 'Sending...' : 'Send Envelope'}
                </button>
                }
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Progress Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-6">
          <div className="space-y-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  currentStep === step.id
                    ? 'bg-blue-50 border border-blue-200'
                    : currentStep > step.id
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step.id
                      ? 'bg-blue-600 text-white'
                      : currentStep > step.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <div>
                  <p
                    className={`font-medium ${
                      currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.name}
                  </p>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Summary</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Documents</span>
                <span className="font-medium text-gray-900">{documents?.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Recipients</span>
                <span className="font-medium text-gray-900">{recipients?.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Fields</span>

              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Signature Type</span>
                <span className="font-medium text-gray-900 capitalize">{envelopeData?.signatureType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {renderStepContent()}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center space-x-2">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`w-2 h-2 rounded-full ${
                      currentStep >= step.id ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {currentStep < 6 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceedToNext() || nextLoading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {nextLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>Next<ArrowLeft className="w-4 h-4 rotate-180" /></>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/e-sign/envelope/${envelopeId}`)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
              )}
            </div>
          </div>  
        </div>
      </div>
    </div>
  );
};

export default EnvelopeCreator;