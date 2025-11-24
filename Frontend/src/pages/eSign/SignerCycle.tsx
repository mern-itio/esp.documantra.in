import { useEffect, useState } from "react";
import { eSignApi } from "../../services/apiHelper";
import {
  Send,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  // FileSignature,
  Users,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

const SignerCycle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cycles, setCycles] = useState<any[]>([]);
  const [openCycle, setOpenCycle] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredSigner, setHoveredSigner] = useState<string | null>(null);

  const dataToPlainObject = (data?: Record<string, string> | Map<string, string>): Record<string, string> => {
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

  const findValueByKeys = (data: Record<string, string>, preferredKeys: string[]): string | undefined => {
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

  const getDisplayName = (dataIn?: Record<string, string> | Map<string, string>): string => {
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

  const getDisplayEmail = (dataIn?: Record<string, string> | Map<string, string>): string => {
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

  const getDisplayPhone = (dataIn?: Record<string, string> | Map<string, string>): string => {
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

  const getStatusConfig = (status: string) => {
    const statusLower = (status || "").toLowerCase();

    if (statusLower === "completed" || statusLower === "submitted" || statusLower === "signed") {
      return {
        label: statusLower === "submitted" ? "Submitted" : statusLower === "signed" ? "Signed" : "Completed",
        icon: CheckCircle2,
        bgColor: "bg-green-50",
        textColor: "text-green-700",
        borderColor: "border-green-200",
        dotColor: "bg-green-500",
        badgeClass: "bg-green-100 text-green-800 border-green-200"
      };
    } else if (statusLower === "pending" || statusLower === "waiting") {
      return {
        label: "Pending",
        icon: Clock,
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-700",
        borderColor: "border-yellow-200",
        dotColor: "bg-yellow-500",
        badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200"
      };
    } else if (statusLower === "declined" || statusLower === "rejected") {
      return {
        label: "Declined",
        icon: AlertCircle,
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        borderColor: "border-red-200",
        dotColor: "bg-red-500",
        badgeClass: "bg-red-100 text-red-800 border-red-200"
      };
    } else {
      return {
        label: status.charAt(0).toUpperCase() + status.slice(1),
        icon: Clock,
        bgColor: "bg-gray-50",
        textColor: "text-gray-700",
        borderColor: "border-gray-200",
        dotColor: "bg-gray-500",
        badgeClass: "bg-gray-100 text-gray-800 border-gray-200"
      };
    }
  };

  useEffect(() => {
    const fetchCycles = async () => {
      setLoading(true);
      try {
        const response = await eSignApi.get(`/api/e-sign/envelope/signers/${id}`);
        if (response.status === 200) {
          setCycles(response.data.cycles || []);
          // Auto-open first cycle if available
          if (response.data.cycles && response.data.cycles.length > 0) {
            setOpenCycle(response.data.cycles[0]._id);
          }
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCycles();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading signer cycles...</p>
        </div>
      </div>
    );
  }

  if (cycles.length === 0) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate("/e-sign/aggrement")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Users className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Signer Cycles</h3>
          <p className="text-gray-600 text-center max-w-md">
            There are no signer cycles available for this envelope.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white h-full">
      {/* Header with Back Button */}
      <div className="mb-8">

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
             <button
                onClick={() => navigate("/e-sign/aggrement")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </button>
            <div>
              <h1 className="text-2xl text-gray-900">Signer Cycle</h1>
              <p className="text-sm text-gray-500 mt-1">Manage and track signer progress</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold">
              {cycles.length} {cycles.length === 1 ? "Cycle" : "Cycles"}
            </span>
          </div>
        </div>
      </div>

      {/* Cycles List */}
      <div className="space-y-3">
        {cycles.map((cycle: any, cycleIndex: number) => {
          const isOpen = openCycle === cycle._id;
          const signers = cycle.signers || [];
          const completedCount = signers.filter((s: any) => {
            const status = (s.status || "").toLowerCase();
            return status === "completed" || status === "submitted" || status === "signed";
          }).length;

          return (
            <div key={cycle._id} className="overflow-hidden">
              {/* Cycle Header - Interactive */}
              <button
                className={`w-full flex justify-between items-center px-6 py-5 text-left transition-all duration-300 ${isOpen
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600"
                    : "bg-white hover:bg-gray-50 border-l-4 border-transparent hover:border-blue-300"
                  }`}
                onClick={() => setOpenCycle(isOpen ? null : cycle._id)}
                onMouseEnter={() => { }}
              >
                <div className="flex items-center gap-5 flex-1">
                  {/* <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm transition-all duration-300 ${isOpen
                      ? "bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg scale-105"
                      : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-md hover:scale-105"
                    }`}>
                    {cycleIndex + 1}
                  </div> */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`font-bold text-lg transition-colors ${isOpen ? "text-blue-900" : "text-gray-900"
                        }`}>
                        Cycle {cycleIndex + 1}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
                        <Users className="w-3.5 h-3.5" />
                        {signers.length} {signers.length === 1 ? "Signer" : "Signers"}
                      </span>
                      {completedCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {completedCount} Completed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{completedCount} of {signers.length} signers completed</span>
                      {signers.length > 0 && (
                        <span className="text-gray-400">•</span>
                      )}
                      <span className="capitalize">{signers.length > 0 ? signers[0]?.role || "Signer" : "No signers"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-blue-600 transition-transform" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 transition-transform" />
                  )}
                </div>
              </button>

              {/* Signers Content - Smooth Expand/Collapse */}
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
                }`}>
                <div className="px-6 py-4 bg-gray-50/50 border-l-4 border-blue-200">
                  <div className="space-y-2">
                    {signers.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No signers in this cycle</p>
                      </div>
                    ) : (
                      signers.map((signer: any, index: number) => {
                        const signerId = signer._id ?? signer.signerId;
                        const cycleId = signer.cycleId ?? cycle._id;
                        const name = getDisplayName(signer.data);
                        const email = getDisplayEmail(signer.data);
                        const phone = getDisplayPhone(signer.data);
                        const statusConfig = getStatusConfig(signer.status);
                        const StatusIcon = statusConfig.icon;
                        const role = signer.role || "signer";
                        const isHovered = hoveredSigner === signerId;

                        return (
                          <div
                            key={signerId}
                            className={`px-5 py-4 rounded-lg transition-all duration-300 ${isHovered
                                ? "bg-white shadow-lg border-2 border-blue-300 transform scale-[1.02]"
                                : "bg-white shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-200"
                              }`}
                            onMouseEnter={() => setHoveredSigner(signerId)}
                            onMouseLeave={() => setHoveredSigner(null)}
                          >
                            <div className="flex items-start justify-between gap-6">
                              <div className="flex items-start gap-4 flex-1 min-w-0">
                                {/* Avatar with Status */}
                                <div className="relative flex-shrink-0">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm transition-all duration-300 ${isHovered
                                      ? "bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg scale-105"
                                      : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-md"
                                    }`}>
                                    {index + 1}
                                  </div>
                                  <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 ${statusConfig.dotColor} rounded-full border-2 border-white flex items-center justify-center shadow-md transition-transform ${isHovered ? "scale-110" : ""
                                    }`}>
                                    <StatusIcon className="w-3 h-3 text-white" />
                                  </div>
                                </div>

                                {/* Signer Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                                    <h4 className={`text-xl font-bold text-gray-900 truncate transition-colors ${isHovered ? "text-blue-700" : ""
                                      }`}>
                                      {name}
                                    </h4>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${isHovered ? "scale-105" : ""
                                      } ${statusConfig.badgeClass}`}>
                                      <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`}></span>
                                      {statusConfig.label}
                                    </span>
                                  </div>

                                  <div className="space-y-2.5">
                                    {email !== "N/A" && (
                                      <div className="flex items-center gap-3 text-sm text-gray-700 group/item">
                                        <Mail className={`w-4 h-4 transition-colors ${isHovered ? "text-blue-600" : "text-gray-400"
                                          }`} />
                                        <span className="truncate hover:text-blue-600 transition-colors">{email}</span>
                                      </div>
                                    )}
                                    {phone !== "N/A" && (
                                      <div className="flex items-center gap-3 text-sm text-gray-700 group/item">
                                        <Phone className={`w-4 h-4 transition-colors ${isHovered ? "text-blue-600" : "text-gray-400"
                                          }`} />
                                        <span className="hover:text-blue-600 transition-colors">{phone}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-3 text-sm">
                                      <User className={`w-4 h-4 transition-colors ${isHovered ? "text-blue-600" : "text-gray-400"
                                        }`} />
                                      <span className={`font-semibold capitalize transition-colors ${isHovered ? "text-blue-700" : "text-gray-700"
                                        }`}>{role}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Action Button */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {signer.status !== "completed" &&
                                  signer.status !== "submitted" &&
                                  signer.status !== "signed" &&
                                  signer.role === "creator" && (
                                    <button
                                      onClick={() => handleAddSignature(String(signerId), String(cycleId))}
                                      className={`flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm transition-all duration-300 ${isHovered
                                          ? "bg-blue-700 shadow-lg transform scale-105"
                                          : "hover:bg-blue-700 shadow-md hover:shadow-lg"
                                        }`}
                                    >
                                      <Send className="w-4 h-4" />
                                      Add Signature
                                    </button>
                                  )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SignerCycle;