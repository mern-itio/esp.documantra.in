import { useState } from 'react';
import axios from 'axios';

type Recipient = {
  name: string;
  email: string;
};

export default function PublicWizard() {
  const [step, setStep] = useState(1);

  const [file, setFile] = useState<File | null>(null);
  const [envelopeId, setEnvelopeId] = useState('');

  const [, setAction] = useState('sign');
const [, setSignMode] = useState('');

  const [recipients, setRecipients] = useState<Recipient[]>([
    { name: '', email: '' }
  ]);

  const [loading, setLoading] = useState(false);

  const uploadDocument = async () => {
    if (!file) {
      alert('Please select PDF');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('files', file);
      formData.append('name', file.name);
      formData.append('subject', file.name);
      formData.append('envelopetype', 'Signature Request');

      const response = await axios.post(
        '/esign/api/e-sign/public/upload',
        formData
      );

      const id = response?.data?.data?.envelopeId;

      if (!id) {
        alert('Envelope creation failed');
        return;
      }

      setEnvelopeId(id);
      setStep(2);
    } catch (e) {
      console.error(e);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const addRecipient = () => {
    setRecipients([
      ...recipients,
      {
        name: '',
        email: ''
      }
    ]);
  };

  const updateRecipient = (
    index: number,
    field: 'name' | 'email',
    value: string
  ) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const createEnvelope = async () => {
    try {
      setLoading(true);

      await axios.post(
        '/esign/api/e-sign/public/add-recipients',
        {
          envelopeId,
          recipients: recipients.map((r, index) => ({
            name: r.name,
            email: r.email,
            role: 'signer',
            order: index + 1
          }))
        }
      );

      window.location.href =
        `/e-sign/create?step=3&envelopeId=${envelopeId}`;

    } catch (e) {
      console.error(e);
      alert('Failed to create envelope');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-10">

      {step === 1 && (
        <>
          <h1 className="text-4xl font-bold mb-8">
            Sign Documents Online
          </h1>

          <input
            type="file"
            accept=".pdf"
            onChange={(e) =>
              setFile(e.target.files?.[0] || null)
            }
          />

          <button
            onClick={uploadDocument}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded"
          >
            {loading ? 'Uploading...' : 'Next'}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-3xl font-bold mb-6">
            Select Action
          </h2>

          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => {
                setAction('sign');
                setStep(3);
              }}
              className="border p-6 rounded"
            >
              Sign
            </button>

            <button
              disabled
              className="border p-6 rounded opacity-50"
            >
              Sign + Notarize
            </button>

            <button
              disabled
              className="border p-6 rounded opacity-50"
            >
              Edit & Fill
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="text-3xl font-bold mb-6">
            Who Needs To Sign
          </h2>

          <div className="space-y-4">

            <button
              className="block border p-4 w-full text-left"
              onClick={() => {
                setSignMode('me');
                setRecipients([{ name: '', email: '' }]);
                setStep(4);
              }}
            >
              Me Only
            </button>

            <button
              className="block border p-4 w-full text-left"
              onClick={() => {
                setSignMode('me-others');
                setRecipients([
                  { name: '', email: '' },
                  { name: '', email: '' }
                ]);
                setStep(4);
              }}
            >
              Me + Others
            </button>

            <button
              className="block border p-4 w-full text-left"
              onClick={() => {
                setSignMode('others');
                setRecipients([{ name: '', email: '' }]);
                setStep(4);
              }}
            >
              Others Only
            </button>

          </div>
        </>
      )}

      {step === 4 && (
        <>
          <h2 className="text-3xl font-bold mb-6">
            Recipient Details
          </h2>

          {recipients.map((recipient, index) => (
            <div
              key={index}
              className="border p-4 rounded mb-4"
            >
              <input
                placeholder="Name"
                value={recipient.name}
                onChange={(e) =>
                  updateRecipient(
                    index,
                    'name',
                    e.target.value
                  )
                }
                className="border p-2 w-full mb-2"
              />

              <input
                placeholder="Email"
                value={recipient.email}
                onChange={(e) =>
                  updateRecipient(
                    index,
                    'email',
                    e.target.value
                  )
                }
                className="border p-2 w-full"
              />
            </div>
          ))}

          <button
            onClick={addRecipient}
            className="border px-4 py-2 rounded"
          >
            Add Recipient
          </button>

          <div className="mt-6">
            <button
              onClick={createEnvelope}
              className="bg-blue-600 text-white px-6 py-3 rounded"
            >
              {loading
                ? 'Creating...'
                : 'Open Editor'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
