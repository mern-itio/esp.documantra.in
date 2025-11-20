import { useEffect, useState } from "react";
import { eSignApi } from "../../services/apiHelper";
import { Send } from "lucide-react";
import { useParams } from "react-router-dom";

const SignerCycle: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [cycles , setCycles] = useState<any[]>([]);
    const [openCycle, setOpenCycle] = useState<string | null>(null);
    const dataToPlainObject = (data?: Record<string, string> | Map<string, string>) : Record<string, string> => {
      if (!data) return {};
      // If it's a Map (has get and entries), convert
      if (typeof (data as Map<string, string>).get === "function" && typeof (data as Map<string, string>).entries === "function") {
        const out: Record<string, string> = {};
        for (const [k, v] of (data as Map<string, string>).entries()) {
          out[String(k)] = String(v ?? "");
        }
        return out;
      }
      // Otherwise assume plain object
      return data as Record<string, string>;
    };
    const findValueByKeys = (data: Record<string, string>, preferredKeys: string[]) : string | undefined => {
      if (!data) return undefined;
      const map: Record<string, string> = {};
      Object.keys(data).forEach(k => { map[k.toLowerCase()] = data[k]; });
      for (const k of preferredKeys) {
        const v = map[k.toLowerCase()];
        if (v !== undefined && v !== "") return v;
      }
      return undefined;
    };
    const isEmail = (v: unknown) => typeof v === "string" && /\S+@\S+\.\S+/.test(v);
    const isPhone = (v: unknown) => typeof v === "string" && v.replace(/\D/g, "").length >= 7;
    const looksLikeName = (v: unknown) => typeof v === "string" && /^[A-Za-z ,.'-]{2,}$/.test(v) && !isEmail(v) && !isPhone(v);
    const getDisplayName = (dataIn?: Record<string, string> | Map<string, string>) : string => {
    const data = dataToPlainObject(dataIn);
      if (!data || Object.keys(data).length === 0) return "N/A";

    const explicit = findValueByKeys(data, ["name", "fullname", "displayname", "firstName", "fullName"]);
      if (explicit) return explicit;

      for (const k of Object.keys(data)) {
        const v = data[k];
        if (looksLikeName(v)) return v;
      }

      for (const k of Object.keys(data)) {
        const v = data[k];
        if (typeof v === "string" && v.trim()) return v;
      }

      return "N/A";
    };
    const getDisplayEmail = (dataIn?: Record<string, string> | Map<string, string>) : string => {
    const data = dataToPlainObject(dataIn);
      if (!data || Object.keys(data).length === 0) return "N/A";

      const explicit = findValueByKeys(data, ["email", "e-mail", "workemail"]);
      if (explicit && isEmail(explicit)) return explicit;

      for (const k of Object.keys(data)) {
        const v = data[k];
        if (isEmail(v)) return v;
      }

      return "N/A";
    };
    const getDisplayPhone = (dataIn?: Record<string, string> | Map<string, string>) : string => {
    const data = dataToPlainObject(dataIn);
      if (!data || Object.keys(data).length === 0) return "N/A";

      const explicit = findValueByKeys(data, ["phone", "mobile", "contact", "telephone", "phoneNumber"]);
      if (explicit && isPhone(explicit)) return explicit;

      for (const k of Object.keys(data)) {
        const v = data[k];
        if (isPhone(v)) return v;
      }

      return "N/A";
    };
    const handleAddSignature = (signerId: any, cycleId: any) => {
        const url = `/e-sign/signer/${id}/${signerId}/${cycleId}?self=1`;
        window.open(url, "_blank", "noopener,noreferrer");
    };
      useEffect(() => {
          // setSigners
          const response = eSignApi.get(`/api/e-sign/envelope/signers/${id}`);
          response.then((res) => {
            if(res.status == 200){
               setCycles(res.data.cycles || []);
            }
          }).catch((err) => {
            console.log(err);
          })
      },[]);

      return (
    <div className="space-y-4">
      {cycles.map((cycle: any, cycleIndex: number) => {
        const isOpen = openCycle === cycle._id;

        return (
          <div key={cycle._id} className="border border-gray-200 rounded-xl shadow-sm bg-gray-50">
            {/* Cycle Header */}
            <button
              className="w-full flex justify-between items-center px-4 py-3 text-left focus:outline-none hover:bg-gray-100 rounded-t-xl"
              onClick={() => setOpenCycle(isOpen ? null : cycle._id)}
            >
              <span className="font-semibold text-gray-800 text-md">
                Cycle {cycleIndex + 1} ({(cycle.signers || []).length} Signers)
              </span>
              <span className={`transform transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}>
                ▼
              </span>
            </button>

            {/* Signers Content */}
            {isOpen && (
              <div className="space-y-4 p-4 border-t border-gray-200">
                {(cycle.signers || []).map((signer: any, index: number) => {
                  const signerId = signer._id ?? signer.signerId;
                  const cycleId = signer.cycleId ?? cycle._id;

                  // use helper functions you added
                  const name = getDisplayName(signer.data);
                  const email = getDisplayEmail(signer.data);
                  const phone = getDisplayPhone(signer.data);

                  return (
                    <div key={signerId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-lg font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-1">
                            <h4 className="text-lg font-semibold text-gray-900">{name}</h4>
                            <p className="text-sm text-gray-600">{email}</p>
                            {phone !== "N/A" && <p className="text-sm text-gray-600">{phone}</p>}
                            <p className="text-sm text-gray-600 capitalize">{signer.role || "signer"}</p>
                            <p className="text-sm text-gray-600 capitalize">{signer.status}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {signer.status !== "completed" &&
                            signer.status !== "submitted" &&
                            signer.role === "creator" && (
                              <button
                                onClick={() => handleAddSignature(String(signerId), String(cycleId))}
                                className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Send className="w-4 h-4" />
                                Add Signature
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SignerCycle;