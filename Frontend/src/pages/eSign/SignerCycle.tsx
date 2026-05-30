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
  ArrowLeft,
  Download
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

const SignerCycle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cycles, setCycles] = useState<any[]>([]);
  const [openCycle, setOpenCycle] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredSigner, setHoveredSigner] = useState<string | null>(null);
  const [downloadingCycleId, setDownloadingCycleId] = useState<string | null>(null);


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
        bgColor: "bg-[#F5F2EE]",
        textColor: "text-gray-700",
        borderColor: "border-gray-200",
        dotColor: "bg-[#F5F2EE]0",
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
  const handleDownloadCompletion = async (cycleId: string) => {
  try {
     setDownloadingCycleId(cycleId);
    const response = await eSignApi.get(
      `/api/e-sign/cycles/${cycleId}/download-completion`,
      {
        responseType: "blob", // 🔥 critical
      }
    );

    const blob = new Blob([response.data], { type: "application/zip" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `cycle-${cycleId}-completion.zip`;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed", err);
  }finally {
    setDownloadingCycleId(null);
  }
};


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#3E2B66] animate-spin" />
          <p className="text-gray-600 animate-pulse">Loading signer cycles...</p>
        </div>
      </div>
    );
  }

  if (cycles.length === 0) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <button
          onClick={() => navigate("/e-sign/aggrement")}
          className="flex items-center gap-2 text-gray-600 hover:text-[#3E2B66] mb-6 transition-all duration-300 group px-4 py-2 rounded-lg hover:bg-[#F0FDF4]"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
       
        </button>
        <div className="flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
          <div className="p-6 bg-gradient-to-br from-purple-100 to-emerald-100 rounded-full mb-6 animate-pulse">
            <Users className="w-16 h-16 text-[#3E2B66]" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-[#260559] to-[#3E2B66] bg-clip-text text-transparent">No Signer Cycles</h3>
          <p className="text-gray-600 text-center max-w-md">
            There are no signer cycles available for this envelope.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-gray-50 via-white to-purple-50/30 min-h-screen">
      {/* Header with Back Button */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => navigate("/e-sign/aggrement")}
              className="flex items-center gap-2 text-gray-600 hover:text-[#3E2B66] transition-all duration-300 group px-4 py-2 rounded-lg hover:bg-[#F0FDF4] hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
         
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#260559] to-[#3E2B66] bg-clip-text text-transparent">Signer Cycle</h1>
              <p className="text-sm text-gray-600 mt-1">Manage and track signer progress</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="px-4 py-2 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
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
          const canDownloadCompletion =
          cycle?.completionCertificate?.path &&
          cycle?.signedFilePath;
          return (
            <div key={cycle._id} className="overflow-hidden">
              {/* Cycle Header - Interactive */}
              <button
                className={`w-full flex justify-between items-center px-6 py-5 text-left transition-all duration-300 rounded-xl shadow-md ${isOpen
                    ? "bg-gradient-to-r from-purple-50 via-emerald-50 to-blue-50 border-l-4 border-[#3E2B66] shadow-lg scale-[1.01]"
                    : "bg-[#F7F3EE] hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-emerald-50/50 border-l-4 border-transparent hover:border-purple-300 hover:shadow-lg hover:scale-[1.01]"
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
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className={`font-bold text-xl transition-all duration-300 ${isOpen 
                          ? "text-[#3E2B66] scale-105" 
                          : "text-gray-900"
                        }`}>
                        Cycle {cycleIndex + 1}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-100 to-emerald-100 text-[#3E2B66] border border-[#BBF7D0] shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                        <Users className="w-3.5 h-3.5" />
                        {signers.length} {signers.length === 1 ? "Signer" : "Signers"}
                      </span>
                      {completedCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {completedCount} Completed
                        </span>
                      )}
                      {canDownloadCompletion && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadCompletion(cycle._id);
                          }}
                          disabled={downloadingCycleId === cycle._id}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                            transition-all shadow-md
                            ${downloadingCycleId === cycle._id
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:scale-105 hover:shadow-lg"
                            }`}
                        >
                          {downloadingCycleId === cycle._id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Downloading…
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Download Completion Files
                            </>
                          )}
                        </button>

                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                      <span className="font-medium">{completedCount} of {signers.length} signers completed</span>
                      {signers.length > 0 && (
                        <span className="text-gray-400">•</span>
                      )}
                      <span className="capitalize text-[#3E2B66] font-semibold">{signers.length > 0 ? signers[0]?.role || "Signer" : "No signers"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-[#3E2B66] transition-all duration-300 rotate-180" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 transition-all duration-300 hover:text-[#3E2B66]" />
                  )}
                </div>
              </button>

              {/* Signers Content - Smooth Expand/Collapse */}
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
                }`}>
                <div className="px-6 py-4 bg-gradient-to-br from-purple-50/30 via-emerald-50/20 to-blue-50/30 border-l-4 border-purple-300 rounded-b-xl">
                  <div className="space-y-2">
                    {signers.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 animate-fade-in">
                        <div className="p-4 bg-gradient-to-br from-purple-100 to-emerald-100 rounded-full w-fit mx-auto mb-4">
                          <User className="w-16 h-16 text-[#3E2B66]" />
                        </div>
                        <p className="text-lg font-semibold text-gray-700">No signers in this cycle</p>
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
                            className={`px-5 py-4 rounded-xl transition-all duration-300 ${isHovered
                                ? "bg-gradient-to-br from-white to-purple-50/50 shadow-xl border-2 border-[#3E2B66] transform scale-[1.02]"
                                : "bg-[#F7F3EE] shadow-md border border-gray-200 hover:shadow-lg hover:border-purple-300 hover:bg-gradient-to-br hover:from-white hover:to-purple-50/30"
                              }`}
                            onMouseEnter={() => setHoveredSigner(signerId)}
                            onMouseLeave={() => setHoveredSigner(null)}
                          >
                            <div className="flex items-start justify-between gap-6">
                              <div className="flex items-start gap-4 flex-1 min-w-0">
                                {/* Avatar with Status */}
                                <div className="relative flex-shrink-0">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm transition-all duration-300 ${isHovered
                                      ? "bg-gradient-to-br from-[#260559] to-[#3E2B66] shadow-xl scale-110 ring-4 ring-purple-200"
                                      : "bg-gradient-to-br from-[#3E2B66] to-[#4d3577] shadow-lg hover:scale-105"
                                    }`}>
                                    {index + 1}
                                  </div>
                                  <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 ${statusConfig.dotColor} rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-all duration-300 ${isHovered ? "scale-125 ring-2 ring-white" : ""
                                    }`}>
                                    <StatusIcon className="w-3 h-3 text-white" />
                                  </div>
                                </div>

                                {/* Signer Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                                    <h4 className={`text-xl font-bold truncate transition-all duration-300 ${isHovered 
                                        ? "text-[#3E2B66] scale-105" 
                                        : "text-gray-900"
                                      }`}>
                                      {name}
                                    </h4>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-300 ${isHovered ? "scale-110 shadow-md" : ""
                                      } ${statusConfig.badgeClass}`}>
                                      <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`}></span>
                                      {statusConfig.label}
                                    </span>
                                  </div>

                                  <div className="space-y-2.5">
                                    {email !== "N/A" && (
                                      <div className="flex items-center gap-3 text-sm text-gray-700 group/item">
                                        <Mail className={`w-4 h-4 transition-all duration-300 ${isHovered 
                                            ? "text-[#3E2B66] scale-110" 
                                            : "text-gray-400"
                                          }`} />
                                        <span className="truncate hover:text-[#3E2B66] transition-colors font-medium">{email}</span>
                                      </div>
                                    )}
                                    {phone !== "N/A" && (
                                      <div className="flex items-center gap-3 text-sm text-gray-700 group/item">
                                        <Phone className={`w-4 h-4 transition-all duration-300 ${isHovered 
                                            ? "text-[#3E2B66] scale-110" 
                                            : "text-gray-400"
                                          }`} />
                                        <span className="hover:text-[#3E2B66] transition-colors font-medium">{phone}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-3 text-sm">
                                      <User className={`w-4 h-4 transition-all duration-300 ${isHovered 
                                          ? "text-[#3E2B66] scale-110" 
                                          : "text-gray-400"
                                        }`} />
                                      <span className={`font-semibold capitalize transition-colors ${isHovered 
                                          ? "text-[#3E2B66]" 
                                          : "text-gray-700"
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
                                      className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg ${isHovered
                                          ? "from-[#3E2B66] to-[#4d3577] shadow-xl transform scale-110"
                                          : "hover:from-[#3E2B66] hover:to-[#4d3577] hover:shadow-xl hover:scale-105"
                                        }`}
                                    >
                                      <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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