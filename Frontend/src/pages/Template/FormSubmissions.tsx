import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { templateServiceApi } from "../../services/apiHelper";

interface Submission {
  _id: string;
  formId: string;
  data: Record<string, any>;
  createdAt: string;
}

export const FormSubmissions: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await templateServiceApi.get(`/api/template/form-submissions/${id}`);
      if (response.data) setSubmissions(response.data.submissions);
    } catch (err) {
      console.error("Error fetching submissions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [id]);

  return (
    <div className="p-8 bg-[#F5F2EE] min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Form Submissions</h1>

      {loading ? (
        <div className="text-gray-500">Loading submissions...</div>
      ) : submissions.length === 0 ? (
        <div className="text-gray-500 text-center mt-10">No submissions yet.</div>
      ) : (
        <div className="overflow-x-auto bg-[#F7F3EE] rounded-2xl shadow border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-[#F7F3EE] divide-y divide-gray-200">
              {submissions.map((submission, index) => (
                <tr key={submission._id} className="hover:bg-[#F5F2EE] transition">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(submission.data).map(([key, value]) => (
                        <div key={key} className="bg-[#F5F2EE] rounded-lg p-2 text-sm border border-gray-100 shadow-sm">
                          <span className="font-semibold text-gray-700">{key}:</span> <span className="text-gray-600">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {new Date(submission.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
