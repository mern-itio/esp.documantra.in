import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { eSignApi } from '../../services/apiHelper';


interface FormPreviewProps {
  envelopeId?: String
}

export const PowerFormPreview: React.FC<FormPreviewProps> = ({ envelopeId }) => {
  const isEmbedded = window.self !== window.top;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    try{
     const response =  await eSignApi.post('/api/e-sign/public/envelope/signer-initiate',{
      envelopeId:envelopeId,
      data:{
        name,
        email
      }
     });
     if(response){
        // after successful POST in PowerFormPreview.handleSubmit
        if (response?.status === 201 && response.data?.signerInitiate) {
            const selfSignerId = response.data.signerInitiate._id || response.data.signerInitiate.id;
            // build the self-signer URL
            const url = `/e-sign/signer/${envelopeId}/${selfSignerId}/${response?.data?.cycleId}?self=1`;
            // open in a new tab
            window.open(url, '_blank');
            return;
        }
     }
    } catch (err){
      console.log(`Error: ${err}`);
    }
    alert('Form submitted! Check console for data.');
  };


  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        {!isEmbedded && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Preview</h2>
            <p className="text-gray-600">This is how your form will appear to users</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              <Send className="w-5 h-5 mr-2" />
              Start Signature
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};