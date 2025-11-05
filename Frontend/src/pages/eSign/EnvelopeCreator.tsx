import React, { useState, useRef, useEffect } from 'react';
import { useSidebar } from '../../context/SidebarContext';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTutorial } from '../../context/TutorialContext';
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
import {eSignApi, subscriptionApi, templateServiceApi} from '../../services/apiHelper';
import SigningEditorStep from '../../components/ESign/SigningEditorStep';
import type { AxiosProgressEvent } from 'axios';
import { SubscriptionStorage } from '../../services/subscriptionService';
import { Card } from '../../components/DocumentService/ui/card';
type FieldType = "signature" | "text" | "email" | "number" | "id";

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
  fieldId?: string; // link back to power form field
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
    const { 
      showTutorial,
      tutorialStep,
      setShowTutorial,
      handleNextStep,
      handlePrevStep,
      handleCloseTutorial 
    } = useTutorial();
  
  const { setSidebarOpen } = useSidebar();
  const location = useLocation();
  
  const handleTutorialNext =async ()=>{
    if (tutorialStep === 2) {
        fileInputRef.current?.click();
        handleNextStep()
    }
    if( tutorialStep ===3){
      await handleNext();
      await handleNextStep();
    }
    
  }

  // Collapse sidebar on mount, restore on unmount
  useEffect(() => {
    setSidebarOpen(false);
    return () => setSidebarOpen(true);
  }, [setSidebarOpen]);
  const navigate = useNavigate();
  const { user } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Power Form State
  const [mode, setMode] = useState<'normal' | 'power'>('normal');
  const [powerForms, setPowerForms] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<string>("");
  const [powerFormData, setPowerFormData] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [isSufficientCredits, setIsSufficientCredits] = useState<boolean>(false);
  const [credit , setCredit] = useState<number>(0);

    // Show tutorial if first login


  const handlePrevious = async () => {
    if (currentStep === 1) return; // Don't go back if we're on first step
    
    try {
      // Update URL with previous step
      if (envelopeId) {
        navigate(`/e-sign/create?step=${currentStep - 1}&envelopeId=${envelopeId}`);
      }
      setCurrentStep(prev => Math.max(1, prev - 1));
    } catch (err) {
      console.error('handlePrevious error:', err);
    }
  };

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
    complianceLevel: 'basic' as 'basic' | 'enhanced' | 'qualified',
    totalCost:0
  });
  
  const [documents, setDocuments] = useState<Document[]>([]);

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [_files, setFiles] = useState<FileList | null>(null);
  const [envelopeId, setEnvelopeId] = useState<string | null>(null);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [sending, setSending] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [existingRecipients, setExistingRecipients] = useState<Recipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [addMode, setAddMode] = useState<'new' | 'existing'>('new');

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
  setFiles(files);
  if (!files) return;

  const validDocs: Document[] = [];
  const invalidFiles: File[] = [];

  Array.from(files).forEach((file) => {
    // Only accept PDF files
    if (file.type !== "application/pdf") {
      invalidFiles.push(file);
      return; // skip adding invalid file
    }

    const newDocument: Document = {
      id: `doc_${Date.now()}_${Math.random()}`,
      name: file.name,
      size: file.size,
      pages: Math.ceil(file.size / 100000), // Mock page calculation
      type: file.type,
      url: URL.createObjectURL(file),
      file: file,
    };
    validDocs.push(newDocument);
  });

  // Show alert if any invalid files
  if (invalidFiles.length > 0) {
    alert(
      `Only PDF files are allowed. The following files are invalid:\n\n${invalidFiles
        .map((f) => f.name)
        .join("\n")}`
    );
  }

  // Add only valid PDFs to document state
  if (validDocs.length > 0) {
    setDocuments((prev) => [...prev, ...validDocs]);
  }
};

// Setp 1: Save Document In DB with Empty Envelope

const uploadDocuments = async (currentStep: any) => {
  if (!documents || documents.length === 0) return;

  // Validate file types before upload
  const invalidFiles = documents.filter(
    (doc) => !doc.type || !doc.type.toLowerCase().includes('pdf')
  );

  if (invalidFiles.length > 0) {
    alert(
      `Only PDF files are allowed. The following files are invalid:\n\n${invalidFiles
        .map((f) => f.name)
        .join('\n')}`
    );
     return false; // failure
  }

  // mark as uploading
  setDocuments((prev) =>
    prev.map((doc) => ({ ...doc, isUploading: true, uploadProgress: 0 }))
  );

  let loopEnvelopeId = envelopeId; // local variable

  for (const doc of documents) {
    const formData = new FormData();
    if (doc.file) {
      formData.append('files', doc.file, doc.name);
    } else {
      console.warn('Skipping document with no file:', doc.name);
      continue;
    }

    if (loopEnvelopeId) formData.append('envelopeId', loopEnvelopeId);

    try {
      const response = await eSignApi.post('/api/e-sign/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total && progressEvent.loaded) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );

            setDocuments((prev) =>
              prev.map((d) =>
                d.id === doc.id ? { ...d, uploadProgress: percent } : d
              )
            );
          }
        },
      });

      if (response.status === 200) {
        loopEnvelopeId = response.data.data.envelopeId;
      }

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? { ...d, isUploading: false, uploadProgress: 100 }
            : d
        )
      );
    } catch (err) {
      console.error('Upload failed for', doc.name, err);
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? { ...d, isUploading: false, uploadProgress: 0 }
            : d
        )
      );
    }
  }

  if (loopEnvelopeId ) {
    setEnvelopeId(loopEnvelopeId);
    navigate(
      `/e-sign/create?step=${currentStep + 1}&envelopeId=${loopEnvelopeId}`
    );
    return true; // success
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
      fieldId: field.fieldId ?? null, // <-- add this line
  }));
  console.log('Transformed fields data for saving:', fieldsData);

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
      const envelope = response.data.data;
      setDocuments(envelope.documents);
      setRecipients(envelope.recipients);
      setEnvelopeId(envelopeId);
      return envelope;
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
      const success = await uploadDocuments(currentStep);
      if (!success) {
        setNextLoading(false);
        return; //stop here — no next step
      }
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

  // Fetch existing recipients when step 2 is reached
  useEffect(() => {
    if (currentStep === 2) {
      fetchExistingRecipients();
    }
    if(currentStep ===3){
      if (user?.isFirstLogin) {
        setShowTutorial(true);
      }
    }
    if(currentStep ===4){
      if (user?.isFirstLogin) {
        setShowTutorial(true);
      }
    }
  }, [currentStep]);

  // Fetch existing recipients
  const fetchExistingRecipients = async () => {
    setIsLoadingRecipients(true);
    try {
      const response = await eSignApi.get('/api/e-sign/get-all-recipients');
      if (response.status === 200) {
        setExistingRecipients(response.data.recipients);
      }
    } catch (error) {
      console.error('Error fetching existing recipients:', error);
    } finally {
      setIsLoadingRecipients(false);
    }
  };

  // Handle selecting an existing recipient
  const handleSelectRecipient = (recipientId: string) => {
    const selectedRecipient = existingRecipients.find(r => r.id === recipientId);
    if (selectedRecipient) {
      console.log(selectedRecipient); 
      const newRecipient: Recipient = {
        ...selectedRecipient,
        order: recipients.length + 1,
        status: 'waiting' as const,
        role:'signer'
      };
      setRecipients(prev => [...prev, newRecipient]);
      setSelectedRecipientId('');
    }
  };

  const addRecipient = () => {
    const newRecipient: Recipient = {
      id: `recipient_${Date.now()}`,
      name: '',
      email: '',
      role: 'signer',
      order: recipients?.length + 1,
      status: 'waiting'
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
        return envelopeData?.subject?.trim() !== '';
      default:
        return true;
    }
  };

  const handleCreateEnvelope = () => {
    if (!user) return;
    navigate('/e-sign/dashboard');
  };

  // (already declared above)
  const handleSendEnvelope = async () => {
    if (!envelopeId) return;
    setSending(true);
    try {
      // Send envelope
      await eSignApi.post(`/api/e-sign/send-envelope/${envelopeId}`);

      // Record credit usage for the envelope
      if (envelopeData?.totalCost > 0) {
        try {
          // Record usage for each recipient that has a cost
          const recipientsWithCost = recipients.filter(recipient => recipient.cost && recipient.cost > 0);

          if (recipientsWithCost.length > 0) {
            await Promise.all(recipientsWithCost.map(recipient => 
              subscriptionApi.post('/usage/consume', {
                action: 'esign:envelopeSend',
                credits: recipient.cost || 0,
                authId: recipient.authentication || null,
                toolId: 'esign',
                reason: `Envelope ${envelopeId} sent to ${recipient.email}`,
              })
            ));

            // Update remaining credits in localStorage
            const plan: any = SubscriptionStorage.getPlan();
            const newBalance = (plan.creditsBalance || 0) - envelopeData.totalCost;
            console.log(newBalance);
            SubscriptionStorage.updateCredits(newBalance);
            // Update state if needed
            setCredit(newBalance);
          }

        } catch (creditErr) {
          console.error('Failed to record credit usage:', creditErr);
          // Don't block the flow if credit recording fails
        }
      }

      alert('Envelope sent successfully!');
      setSidebarOpen(false); // Collapse sidebar
      navigate('/e-sign/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to send envelope. Try again.');
    } finally {
      setSending(false);
    }
  };
  // Read route param (supports /e-sign/edit/:envelopeId)
  const { envelopeId: routeEnvelopeId } = useParams<{ envelopeId?: string }>();

  useEffect(() => {
    getSteps();
    // Re-run when query string or route param changes
  }, [location.search, routeEnvelopeId]);
const calculateEnvelopeCost = (envelope: any) => {
  const subscription = JSON.parse(localStorage.getItem("userSubscriptionPlan") ?? "null");

  if (!subscription?.authCosts?.length || !envelope?.recipients?.length) return;

  const costMap = Object.fromEntries(
    subscription.authCosts.map((a: any) => [a.authId, a.credits])
  );

  const updatedRecipients = envelope.recipients.map((r: any) => ({
    ...r,
    cost: r.authentication ? (costMap[r.authentication] ?? 0) : 0,
  }));

  const totalCost = updatedRecipients.reduce(
    (sum: number, r: any) => sum + (r.cost || 0),
    0
  );

  setIsSufficientCredits(totalCost <= (subscription?.creditsBalance || 0));
  setCredit(subscription?.creditsBalance || 0);

  setEnvelopeData({
    ...envelope,
    recipients: updatedRecipients,
    totalCost,
  });
  setRecipients(updatedRecipients);

  console.log("Updated Recipients with Cost:", updatedRecipients);
  console.log("Total Cost:", totalCost);
};

const getSteps = async () => {
    const params = new URLSearchParams(location.search);
    const step = params.get('step');
    // prefer query param but fall back to route param (/e-sign/edit/:envelopeId)
    const envelopeIdParam = params.get('envelopeId') || routeEnvelopeId;

    // If both step and envelopeId (from query or route) are provided, follow the previous flow
    if (step && envelopeIdParam) {
      const response = await eSignApi.get('/api/e-sign/get-envelopes');
      if (response) {
        switch (Number(step)) {
          case 1:
            setCurrentStep(1);
            setEnvelopeId(envelopeIdParam);
            if (envelopeIdParam) await getEnvelopeDetail(envelopeIdParam);
            break;
          case 2:
            setCurrentStep(2);
            setEnvelopeId(envelopeIdParam);
            await getEnvelopeDetail(envelopeIdParam);
            break;
          case 3:
            console.log('Current step', step);
            setCurrentStep(3);
            await getEnvelopeDetail(envelopeIdParam);
            await getSignatureFields(envelopeIdParam);
            break;
          case 4:
            setCurrentStep(4);
            setEnvelopeId(envelopeIdParam);
            await getSignatureFields(envelopeIdParam);
            await getEnvelopeDetail(envelopeIdParam);
            break;
          case 5:
            setCurrentStep(5);
            setEnvelopeId(envelopeIdParam);
            break;
          case 6:
            setCurrentStep(6);
            setEnvelopeId(envelopeIdParam);
            const envelope = await getEnvelopeDetail(envelopeIdParam);
            if (envelope) calculateEnvelopeCost(envelope);
            break;
          default:
            setCurrentStep(1);
        }
      }
      return;
    }

    // If we only have a route param like /e-sign/edit/:envelopeId, load envelope for editing
    if (!step && routeEnvelopeId) {
      setEnvelopeId(routeEnvelopeId);
      await getEnvelopeDetail(routeEnvelopeId);
      // default to first step of the create/edit flow
      setCurrentStep(1);
      return;
    }

    // No envelopeId provided: ensure we're at default create state
    setCurrentStep(1);
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
            {/* Step-by-step Tutorial Modal */}
              {showTutorial && (
                <div className="fixed inset-0 z-50">
                  <div className="absolute inset-0 backdrop-blur-[2px]"></div>
                  <div className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 max-w-lg w-full absolute transition-all duration-500 ease-in-out min-h-[340px] flex flex-col justify-between ${
                    tutorialStep === 2 ? 'top-1/4 left-1/2 -translate-x-1/6 -translate-y-1/2' : 
                    'top-1/4 right-5 -translate-x-1/6 -translate-y-1/2'
                  }`}>
                    {tutorialStep === 2 && (
                      <>
                        <div className="relative">
                          {/* Arrow pointing to recipients section */}
                          <div className="absolute left-50 top-70 w-16 h-16">
                            <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-225 absolute"></div>
                          </div>
                          <h2 className="text-xl font-bold mb-4">Step 2: Upload Documents</h2>
                          <p className="text-gray-700 mb-4">By clicking here you can Upload a document for signing. Click next to procced </p>
                        </div>
                        <div className="flex-1" />
                        <div className="flex justify-between gap-2 mt-6">
                          <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleTutorialNext}>Next</button>
                        </div>
                      </>
                    )}
                    {tutorialStep === 3 && (
                      <>
                        <div className="relative">
                          {/* Arrow pointing to recipients section */}
                          <div className="absolute left-50 top-64 w-16 h-16">
                            <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-225 absolute"></div>
                          </div>
                          <h2 className="text-xl font-bold mb-4">Step 3: Save Documents</h2>
                          <p className="text-gray-700 mb-4">Choose document from the opened window and click next to upload the document for further proccess. Click next to move the tutorial ahead </p>
                        </div>
                        <div className="flex-1" />
                        <div className="flex justify-between gap-2 mt-6">
                          <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"disabled={!canProceedToNext() || nextLoading} onClick={handleTutorialNext}>Next</button>
                        </div>
                      </>
                    )}
                    <button
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                      onClick={handleCloseTutorial}
                      aria-label="Close tutorial"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Documents</h3>
              <p className="text-gray-600 mb-6">Add the documents that need to be signed. Supported formats: PDF, DOC, DOCX.</p>
            </div>

            {/* Dropzone now contains both CTA and uploaded-file list */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />

              {/* Hidden file input (unchanged) */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* CTA when no documents */}
              {(!documents || documents.length === 0) ? (
                <>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Drop files here or click to upload</h4>
                  <p className="text-gray-500">Only PDF up to 10MB each</p>
                </>
              ) : (
                /* Uploaded files shown inside the same dropzone box (UI-only) */
                <div className="mt-2 text-left">
                  <div className="text-center">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Ready to Upload Documents</h4>
                      <p className="text-sm text-gray-500">{documents.length} file{documents.length > 1 ? "s" : ""}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex flex-col p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-8 h-8 text-blue-600" />
                            <div>
                              {!doc.isUploading ? (
                                <>
                                  <p className="font-medium text-gray-900">{doc.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.pages} pages
                                  </p>
                                </>
                              ) : (
                                <p className="font-medium text-gray-900">{doc.name} — Uploading...</p>
                              )}
                            </div>
                          </div>

                          {!doc.isUploading && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDocument(doc.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>

                        {/* Progress bar per document */}
                        {doc.isUploading && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                              <div
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${doc.uploadProgress ?? 0}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{doc.uploadProgress ?? 0}%</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>


                  <p className="text-xs text-gray-500 mt-3">Tip: click the box to add more files or drag & drop to add.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            {/* Step-by-step Tutorial Modal */}
                    {showTutorial && (
                      <div className="fixed inset-0 z-50">
                        <div className="absolute inset-0 backdrop-blur-[2px]"></div>
                        <div className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 max-w-lg w-full absolute transition-all duration-500 ease-in-out min-h-[340px] flex flex-col justify-between ${
                          tutorialStep === 4 ? 'top-1/2 left-1/2 -translate-x-1/6 -translate-y-1/2' : 
                          tutorialStep === 5 ? 'top-87 left-10':
                          tutorialStep === 6 ? 'top-50 left-100' :
                          tutorialStep === 7 ? 'top-35 left-2/3' :
                          tutorialStep === 8 ? 'top-85 left-120' :
                          'top-1/4 right-5 -translate-x-1/6 -translate-y-1/2'
                        }`}>  
                          {tutorialStep === 4 && (
                            <>
                              <div className="relative">
                                {/* Arrow pointing to recipients section
                                <div className="absolute left-50 top-64 w-16 h-16">
                                  <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-225 absolute"></div>
                                </div> */}
                                <h2 className="text-xl font-bold mb-4">Step 4: Choose Workflow</h2>
                                <p className="text-gray-700 mb-4">There are two kinds of flow for creating an Envelope</p>
                                <ol>
                                  <li>Recipient Wise</li>
                                  <li>Power Form</li>
                                </ol>
                              </div>
                              <div className="flex-1" />
                              <div className="flex justify-between gap-2 mt-6">
                                <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>Next</button>
                              </div>
                            </>
                          )}
                          {tutorialStep === 5 && (
                            <>
                              <div className="relative">
                                {/* Arrow pointing to recipients section */}
                                <div className="absolute -top-16 right-8 w-16 h-16">
                                  <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-133 absolute"></div>
                                </div>
                                <h2 className="text-xl font-bold mb-4">Step 5: Recipient Wise</h2>
                                <p className="text-gray-700 mb-4">This option is for Recipient Wise flow.</p>
                              </div>
                              <div className="flex-1" />
                              <div className="flex justify-between gap-2 mt-6">
                                <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>Next</button>
                              </div>
                            </>
                          )}
                          {tutorialStep === 6 && (
                            <>
                              <div className="relative">
                                {/* Arrow pointing to recipients section */}
                                <div className="absolute left-40 top-70 w-16 h-16">
                                  <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-222 absolute"></div>
                                </div>
                                <h2 className="text-xl font-bold mb-4">Step 6: Add new recipient</h2>
                                <p className="text-gray-700 mb-4">By clicking this button you can add a new recipient</p>
                              </div>
                              <div className="flex-1" />
                              <div className="flex justify-between gap-2 mt-6">
                                <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>Next</button>
                              </div>
                            </>
                          )}
                          {tutorialStep === 7 && (
                            <>
                              <div className="relative">
                                {/* Arrow pointing to recipients section */}
                                <div className="absolute left-40 top-70 w-16 h-16">
                                  <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-222 absolute"></div>
                                </div>
                                <h2 className="text-xl font-bold mb-4">Step :7 Select existing recipient</h2>
                                <p className="text-gray-700 mb-4">By clicking this button you can select exsisting recipient</p>
                              </div>
                              <div className="flex-1" />
                              <div className="flex justify-between gap-2 mt-6">
                                <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>Next</button>
                              </div>
                            </>
                          )}
                          {tutorialStep === 8 && (
                            <>
                              <div className="relative">
                                {/* Arrow pointing to recipients section */}
                                <div className="absolute -top-16 right-8 w-16 h-16">
                                  <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-133 absolute"></div>
                                </div>
                                <h2 className="text-xl font-bold mb-4">Step :8 Power Form </h2>
                                <p className="text-gray-700 mb-4">By clicking this button you can select power form flow</p>
                              </div>
                              <div className="flex-1" />
                              <div className="flex justify-between gap-2 mt-6">
                                <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleCloseTutorial}>Next</button>
                              </div>
                            </>
                          )}
                          {tutorialStep === 9 && (
                            <>
                              <div className="relative">
                                {/* Arrow pointing to recipients section */}
                                <div className="absolute -top-16 right-8 w-16 h-16">
                                  <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-133 absolute"></div>
                                </div>
                                <h2 className="text-xl font-bold mb-4">Choose any one flow</h2>
                                <p className="text-gray-700 mb-4">By clicking this button you can select power form flow</p>
                              </div>
                            </>
                          )}

                          <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                            onClick={handleCloseTutorial}
                            aria-label="Close tutorial"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    )}
            {/* ======================== FLOW SELECTION ======================== */}
            <Card className="p-6 shadow-sm border border-gray-200 rounded-2xl bg-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Choose Flow
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">Normal</span> — Add recipients and place their signature fields. <br />
                <span className="font-medium">Power Form</span> — Define a reusable form with signer slots.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setMode('normal')}
                  className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-lg font-medium transition ${
                    mode === 'normal'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Normal (Recipients)
                </button>
                <button
                  onClick={() => getPowerForm()}
                  className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-lg font-medium transition ${
                    mode === 'power'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Power Form
                </button>
              </div>
            </Card>

            {/* ======================== NORMAL MODE ======================== */}
            {mode === 'normal' ? (
              <Card className="p-6 shadow-sm border border-gray-200 rounded-2xl bg-white space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Add Recipients</h3>
                  <p className="text-sm text-gray-600">
                    Add people who need to sign or receive the document.
                  </p>
                </div>

                {/* Add Mode Toggle */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setAddMode('new')}
                    className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg font-medium transition ${
                      addMode === 'new'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Add New
                  </button>
                  <button
                    onClick={() => setAddMode('existing')}
                    className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg font-medium transition ${
                      addMode === 'existing'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Select Existing
                  </button>
                </div>

                {/* Add Recipient or Select Existing */}
                {addMode === 'new' ? (
                  <button
                    onClick={addRecipient}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Recipient
                  </button>
                ) : (
                  <div className="w-full max-w-md">
                    {isLoadingRecipients ? (
                      <div className="text-gray-500 text-sm">Loading recipients...</div>
                    ) : (
                      <select
                        value={selectedRecipientId}
                        onChange={(e) => handleSelectRecipient(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a recipient</option>
                        {existingRecipients.map((recipient) => (
                          <option key={recipient.id} value={recipient.id}>
                            {recipient.name} ({recipient.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Recipient List */}
                {recipients?.length > 0 && (
                  <div className="space-y-4">
                    {recipients.map((recipient, index) => (
                      <div
                        key={recipient.id}
                        className="border border-gray-200 rounded-lg p-5 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-gray-900">
                            Recipient {index + 1}
                          </h4>
                          <button
                            onClick={() => removeRecipient(recipient.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Name
                            </label>
                            <input
                              type="text"
                              value={recipient.name}
                              onChange={(e) =>
                                updateRecipient(recipient.id, { name: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="Full name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={recipient.email}
                              onChange={(e) =>
                                updateRecipient(recipient.id, { email: e.target.value })
                              }
                              onBlur={(e) =>
                                handleEmailOnBlur(recipient.id, e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="email@example.com"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Role
                            </label>
                            <select
                              value={recipient.role}
                              onChange={(e) =>
                                updateRecipient(recipient.id, {
                                  role: e.target.value as any,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="signer">Signer</option>
                              <option value="approver">Approver</option>
                              <option value="carbon_copy">Carbon Copy</option>
                              <option value="in_person_signer">In-Person Signer</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ) : (
              /* ======================== POWER FORM MODE ======================== */
              <Card className="p-6 shadow-sm border border-gray-200 rounded-2xl bg-white space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Build Power Form</h4>
                  <p className="text-sm text-gray-600">
                    Set up your reusable form and signer slots.
                  </p>
                </div>

                {/* Power Form Selector */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Select Power Form
                  </label>
                  <select
                    id="powerForm"
                    value={selectedForm}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose a Form --</option>
                    {powerForms.map((form) => (
                      <option key={form._id} value={form._id}>
                        {form.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Power Form Preview */}
                {powerFormData && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                    <div>
                      <h5 className="text-base font-semibold text-gray-900">
                        {powerFormData.title}
                      </h5>
                      <p className="text-sm text-gray-600">{powerFormData.description}</p>
                    </div>
                    <div>
                      <h6 className="text-sm font-medium text-gray-800 mb-2">Fields</h6>
                      <ul className="space-y-1">
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

                {/* Parties Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">
                      Number of Parties
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 py-1 border rounded hover:bg-gray-100"
                        onClick={() =>
                          syncPartiesToNumber(Math.max(1, numberOfParties - 1))
                        }
                        type="button"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={maxParties}
                        value={numberOfParties}
                        onChange={(e) =>
                          syncPartiesToNumber(Number(e.target.value || 1))
                        }
                        className="w-20 px-2 py-1 border rounded text-center text-sm"
                      />
                      <button
                        className="px-2 py-1 border rounded hover:bg-gray-100"
                        onClick={() =>
                          syncPartiesToNumber(
                            Math.min(maxParties, numberOfParties + 1)
                          )
                        }
                        type="button"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 ml-2">
                      Min 1 — Max {maxParties}
                    </p>
                  </div>

                  {/* First Signing Party */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Which party signs first?
                    </label>
                    <select
                      value={firstSigningPartyId}
                      onChange={(e) => setFirstSigningPartyId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {parties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.slot ? `(${p.slot})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Creator Party */}
                  <div>
                    <h6 className="text-sm font-medium text-gray-900 mb-2">
                      Choose which party you are
                    </h6>
                    <div className="space-y-2">
                      {parties.map((party) => (
                        <label
                          key={party.id}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="creatorParty"
                            checked={selectedPartyId === party.id}
                            onChange={() => setSelectedPartyId(party.id)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{party.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
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
            {showTutorial}
              {showTutorial && (
                <div className="fixed inset-0 z-50">
                  <div className="absolute inset-0 backdrop-blur-[2px]"></div>
                  <div className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 max-w-lg w-full absolute transition-all duration-500 ease-in-out min-h-[340px] flex flex-col justify-between ${
                    tutorialStep === 4 ? 'top-1/2 left-1/2 -translate-x-1/6 -translate-y-1/2' : 
                    tutorialStep === 5 ? 'top-87 left-10':
                    tutorialStep === 6 ? 'top-50 left-100' :
                    tutorialStep === 7 ? 'top-35 left-2/3' :
                    tutorialStep === 8 ? 'top-85 left-120' :
                    'top-1/4 right-5 -translate-x-1/6 -translate-y-1/2'
                  }`}>  
                    {tutorialStep === 4 && (
                      <>
                        <div className="relative">
                          {/* Arrow pointing to recipients section
                          <div className="absolute left-50 top-64 w-16 h-16">
                            <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-225 absolute"></div>
                          </div> */}
                          <h2 className="text-xl font-bold mb-4">Step 4: Choose Workflow</h2>
                          <p className="text-gray-700 mb-4">There are two kinds of flow for creating an Envelope</p>
                          <ol>
                            <li>Recipient Wise</li>
                            <li>Power Form</li>
                          </ol>
                        </div>
                        <div className="flex-1" />
                        <div className="flex justify-between gap-2 mt-6">
                          <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>Next</button>
                        </div>
                      </>
                    )}
                    {tutorialStep === 5 && (
                      <>
                        <div className="relative">
                          {/* Arrow pointing to recipients section */}
                          <div className="absolute -top-16 right-8 w-16 h-16">
                            <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-133 absolute"></div>
                          </div>
                          <h2 className="text-xl font-bold mb-4">Step 5: Recipient Wise</h2>
                          <p className="text-gray-700 mb-4">This option is for Recipient Wise flow.</p>
                        </div>
                        <div className="flex-1" />
                        <div className="flex justify-between gap-2 mt-6">
                          <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>Next</button>
                        </div>
                      </>
                    )}
                    {tutorialStep === 6 && (
                      <>
                        <div className="relative">
                          {/* Arrow pointing to recipients section */}
                          <div className="absolute left-40 top-70 w-16 h-16">
                            <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-222 absolute"></div>
                          </div>
                          <h2 className="text-xl font-bold mb-4">Step 6: Add new recipient</h2>
                          <p className="text-gray-700 mb-4">By clicking this button you can add a new recipient</p>
                        </div>
                        <div className="flex-1" />
                        <div className="flex justify-between gap-2 mt-6">
                          <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>Next</button>
                        </div>
                      </>
                    )}
                    {tutorialStep === 7 && (
                      <>
                        <div className="relative">
                          {/* Arrow pointing to recipients section */}
                          <div className="absolute left-40 top-70 w-16 h-16">
                            <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-222 absolute"></div>
                          </div>
                          <h2 className="text-xl font-bold mb-4">Step :7 Select existing recipient</h2>
                          <p className="text-gray-700 mb-4">By clicking this button you can select exsisting recipient</p>
                        </div>
                        <div className="flex-1" />
                        <div className="flex justify-between gap-2 mt-6">
                          <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>Next</button>
                        </div>
                      </>
                    )}
                    {tutorialStep === 8 && (
                      <>
                        <div className="relative">
                          {/* Arrow pointing to recipients section */}
                          <div className="absolute -top-16 right-8 w-16 h-16">
                            <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-133 absolute"></div>
                          </div>
                          <h2 className="text-xl font-bold mb-4">Step :8 Power Form </h2>
                          <p className="text-gray-700 mb-4">By clicking this button you can select power form flow</p>
                        </div>
                        <div className="flex-1" />
                        <div className="flex justify-between gap-2 mt-6">
                          <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleCloseTutorial}>Next</button>
                        </div>
                      </>
                    )}
                    {tutorialStep === 9 && (
                      <>
                        <div className="relative">
                          {/* Arrow pointing to recipients section */}
                          <div className="absolute -top-16 right-8 w-16 h-16">
                            <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform rotate-133 absolute"></div>
                          </div>
                          <h2 className="text-xl font-bold mb-4">Choose any one flow</h2>
                          <p className="text-gray-700 mb-4">By clicking this button you can select power form flow</p>
                        </div>
                      </>
                    )}

                    <button
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                      onClick={handleCloseTutorial}
                      aria-label="Close tutorial"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              )}
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
                // When a method is selected, apply it to all recipients
                onMethodSelect={async (methodId) => {
                  // Compute new recipients with updated authentication
                  const newRecipients = recipients.map(recipient => ({
                    ...recipient,
                    authentication: methodId as Recipient['authentication'] || 'email'
                  }));

                  // Update local state immediately for responsive UI
                  setRecipients(newRecipients);
                  console.log('Updated recipients with auth method:', newRecipients);
                  // If we have an envelopeId, persist the recipient permissions/auth in DB
                  if (envelopeId) {
                    try {
                      // Build payload expected by backend insertRecipient
                      const recipientPayload = newRecipients.map(r => ({
                        name: r.name,
                        email: r.email,
                        role: r.role,
                        order: r.order,
                        authentication: r.authentication
                      }));

                      const resp = await eSignApi.post('/api/e-sign/add-recipients', {
                        envelopeId,
                        recipients: recipientPayload
                      });

                      if (resp.status === 200) {
                        // Refresh recipients from server to keep IDs and permissions in sync
                        await getEnvelopeDetail(envelopeId);
                      } else {
                        console.warn('Failed to persist recipient auth method', resp);
                      }
                    } catch (err) {
                      console.error('Error persisting recipient auth method:', err);
                    }
                  } else {
                    // No envelopeId yet — recipients will be persisted when envelope is created
                    console.log('Envelope not created yet; auth method will be persisted when recipients are saved.');
                  }
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
              {/* Credit Summary Box */}
                {envelopeData?.totalCost > 0 && (
                <div
                  className={`rounded-2xl p-6 shadow-md border transition-all duration-300 ${
                    isSufficientCredits
                      ? "bg-gradient-to-r from-green-50 to-green-100 border-green-300"
                      : "bg-gradient-to-r from-red-50 to-red-100 border-red-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isSufficientCredits ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                        }`}
                      >
                        {isSufficientCredits ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>

                      <div>
                        <h4
                          className={`text-lg font-semibold ${
                            isSufficientCredits ? "text-green-800" : "text-red-800"
                          }`}
                        >
                          Credit Overview
                        </h4>
                        <p
                          className={`text-sm ${
                            isSufficientCredits ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {isSufficientCredits
                            ? "You have enough credits to send this envelope."
                            : "You don’t have enough credits to proceed."}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">{envelopeData?.totalCost}</p>
                      <p className="text-sm text-gray-600 font-medium">Total Credits Required</p>
                    </div>
                  </div>

                  {/* Credit Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 text-sm">
                    <div className="bg-white rounded-lg p-3 shadow-sm border text-center">
                      <p className="text-gray-500">Available Credits</p>
                      <p className="font-semibold text-gray-800">{credit ?? 0}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border text-center">
                      <p className="text-gray-500">Envelope Cost</p>
                      <p className="font-semibold text-gray-800">{envelopeData?.totalCost}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border text-center">
                      <p className="text-gray-500">Remaining After Send</p>
                      <p
                        className={`font-semibold ${
                          isSufficientCredits ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {(credit ?? 0) - envelopeData?.totalCost}
                      </p>
                    </div>
                  </div>
                </div>

                )}
                {/* Envelope Summary */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
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
                      <p className="text-gray-900">
                        {documents?.length} document{documents?.length !== 1 ? 's' : ''}
                      </p>
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
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Documents</h4>
                  <div className="space-y-3">
                    {documents?.map((doc) => (
                      <div key={doc.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-500">
                            {doc.pages} pages • {(doc.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recipients */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Recipients</h4>
                  <div className="space-y-3">
                    {recipients.map((recipient, index) => (
                      <div
                        key={recipient.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition"
                      >
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
                          <p className="text-sm font-medium text-gray-700 capitalize">
                            {recipient.role.replace('_', ' ')}
                          </p>
                          {recipient.cost !== undefined && (
                            <p className="text-xs text-green-700 mt-1 font-medium">
                              Cost: {recipient.cost} credit{recipient.cost !== 1 ? 's' : ''}
                            </p>
                          )}
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
                {/* Save Draft Button */}
                <button
                  onClick={handleCreateEnvelope}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </button>

                {/* Send Envelope Button */}
                {mode === 'normal' && (
                  <div className="flex flex-col items-start">
                    <button
                      onClick={handleSendEnvelope}
                      disabled={sending || !isSufficientCredits}
                      className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                        !isSufficientCredits
                          ? 'bg-red-400 cursor-not-allowed text-white'
                          : sending
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {sending ? (
                        <>
                          <svg
                            className="animate-spin w-4 h-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"
                            />
                          </svg>
                          Sending...
                        </>
                      ) : !isSufficientCredits ? (
                        <>
                          <svg
                            className="w-4 h-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke="currentColor"
                              strokeWidth="2"
                              d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Insufficient Credits
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-white" />
                          Send Envelope
                        </>
                      )}
                    </button>
                  </div>
                )}
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
                onClick={() => handlePrevious()}
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