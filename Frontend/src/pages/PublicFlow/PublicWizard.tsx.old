import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PublicWizard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleNext = async () => {
    if (!file) return;

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append('files', file);
      formData.append('name', file.name);
      formData.append('subject', file.name);
      formData.append('envelopetype', 'Signature Request');

      const response = await axios.post(
        '/esign/api/e-sign/public/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const envelopeId =
        response?.data?.data?.envelopeId;

      navigate(
        `/public-sign/editor?envelopeId=${envelopeId}&step=2&public=true`
      );
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-3xl bg-white p-10 rounded-xl shadow-lg">

        <h1 className="text-3xl font-bold text-center mb-6">
          Sign Documents Online
        </h1>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">

          <input
            type="file"
            accept=".pdf"
            onChange={(e) =>
              setFile(e.target.files?.[0] || null)
            }
          />

          {file && (
            <div className="mt-4">
              Selected:
              <strong> {file.name}</strong>
            </div>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={!file || loading}
          className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          {loading ? 'Uploading...' : 'Next'}
        </button>

      </div>
    </div>
  );
};

export default PublicWizard;
