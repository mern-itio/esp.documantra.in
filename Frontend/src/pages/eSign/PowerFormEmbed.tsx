import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { templateServiceApi } from "../../services/apiHelper";
// import { FormPreview } from "../../components/Template/FormPreview";

// interface FormField {
//   id: string;
//   type: string;
//   label: string;
//   placeholder?: string;
//   required: boolean;
//   options?: string[];
//   validation?: any;
// }

export const PowerFormEmbed: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const { envelopeId } = useParams<{ envelopeId: string }>();
  // const [fields, setFields] = useState<FormField[]>([]);
  const [formTitle, setFormTitle] = useState("Untitled Form");

  useEffect(() => {
    if (!formId) return;
    const fetchForm = async () => {
      try {
        const response = await templateServiceApi.get(
          `/api/template/get-form-details/${formId}`
        );
        // setFields(response.data.fields || []);
        setFormTitle(response.data.title || "Untitled Form");
      } catch (err) {
        console.error(err);
      }
    };
    fetchForm();
  }, [formId]);

  const embedCode = `<iframe src="${window.location.origin}/e-sign/power-form/${formId}/${envelopeId}" width="600" height="800" frameborder="0"></iframe>`;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Embed Form: {formTitle}</h1>

      {/* <div className="mb-6">
        <p className="mb-2">Preview:</p>
        <div className="border rounded-lg p-4 bg-white">
          <FormPreview fields={fields} />
        </div>
      </div> */}

      <div>
        <p className="mb-2">Embed Code:</p>
        <textarea
          readOnly
          value={embedCode}
          className="w-full border rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          onFocus={(e) => e.target.select()}
        />
        <p className="text-gray-500 text-sm mt-1">
          Copy and paste this code to embed the form anywhere.
        </p>
      </div>
    </div>
  );
};
