import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CheckCircle,
  Copy,
  Download,
  FileText,
  Gift,
  Check,
  Link as LinkIcon,
  Users,
  ShieldCheck, //added
} from "lucide-react";
import { authApi, eSignApi } from "../../services/apiHelper";
import confetti from "canvas-confetti";

export default function SignerStatusPage() {
  const { envelopeId, recipientId } = useParams<{
    envelopeId: string;
    recipientId: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [envelope, setEnvelope] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const demoShowBothSignerCards = true;
  const [scratchRevealed, setScratchRevealed] = useState(false);
  const [copyHint, setCopyHint] = useState<"" | "copied" | "failed">("");
  const [userType, setUserType] = useState<"checking" | "existing" | "new">("checking");
  const [showScratchModal, setShowScratchModal] = useState(false);
  const [scratchDone, setScratchDone] = useState(false);
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scratchDrawingRef = useRef(false);
  const scratchBurstFiredRef = useRef(false);
  const scratchMeasureTickRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await eSignApi.get(
          `/api/e-sign/public/envelope/${String(envelopeId ?? "")}`
        );
        if (!mounted) return;
        setEnvelope(res?.data?.data ?? null);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load signing status.");
        setEnvelope(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [envelopeId]);

  // Real logic (DB-backed): determine whether the recipient email already exists in our system.
  // - Fetch recipient email from the envelope recipients list.
  // - Call auth-service: GET /api/find-user/:email
  //   - 200 => existing user
  //   - 404 => new user
  useEffect(() => {
    let mounted = true;

    const normId = (x: any) => {
      if (x == null) return "";
      if (typeof x === "string") return x;
      if (typeof x === "object" && x.$oid) return String(x.$oid);
      if (typeof x === "object" && x._id) return String(x._id);
      return String(x);
    };

    const run = async () => {
      try {
        if (!envelope || !recipientId) return;
        setUserType("checking");

        const recipients = envelope?.recipients || [];
        const recipient = recipients.find((r: any) => normId(r?.id ?? r?._id) === normId(recipientId));
        const email = (recipient?.email || recipient?.recipientEmail || "").toString().trim().toLowerCase();

        if (!email) {
          if (mounted) setUserType("new");
          return;
        }

        await authApi.get(`/api/find-user/${encodeURIComponent(email)}`);
        if (mounted) setUserType("existing");
      } catch (err: any) {
        // 404 => user not found => new signer
        const status = err?.response?.status;
        if (mounted) setUserType(status === 404 ? "new" : "new");
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [envelope, recipientId]);

  const isCompletedStatus = (status: any) => {
    const s = (status || "").toString().toLowerCase();
    return s === "completed" || s === "signed";
  };

  const isDeclinedStatus = (status: any) => {
    const s = (status || "").toString().toLowerCase();
    return s === "declined" || s === "rejected";
  };

  const isCcRole = (r: any) => {
    const role = (r?.role ?? "").toString().toLowerCase().trim();
    return role === "carbon_copy" || role === "cc";
  };

  const dummyAvatarDataUri = (seed: string, tone: "live" | "id") => {
    const bg = tone === "live" ? "#E8F7F0" : "#EFEAFA";
    const ring = tone === "live" ? "#10B981" : "#260559";
    const fg = tone === "live" ? "#0F766E" : "#260559";
    const initials = (seed || "U")
      .toString()
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => (p[0] || "").toUpperCase())
      .join("")
      .slice(0, 2) || "U";

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${bg}"/>
            <stop offset="1" stop-color="#ffffff"/>
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="124" height="124" rx="18" fill="url(#g)" stroke="${ring}" stroke-opacity="0.25" stroke-width="2"/>
        <circle cx="64" cy="52" r="20" fill="${ring}" fill-opacity="0.15"/>
        <path d="M30 108c6-20 22-30 34-30s28 10 34 30" fill="${ring}" fill-opacity="0.12"/>
        <text x="64" y="60" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI" font-size="18" font-weight="700" fill="${fg}">
          ${initials}
        </text>
      </svg>
    `.trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const looksLikeVideoAuth = (r: any) => {
    const raw = (
      r?.authType ||
      r?.authMethod ||
      r?.authenticationType ||
      r?.authenticationMethod ||
      r?.verificationType ||
      ""
    )
      .toString()
      .toLowerCase();

    const authBlob = (r?.authentication || r?.auth || "").toString().toLowerCase();

    return (
      raw.includes("video") ||
      raw.includes("liveness") ||
      raw.includes("kyc") ||
      raw.includes("didit") ||
      authBlob.includes("video") ||
      authBlob.includes("liveness") ||
      authBlob.includes("didit")
    );
  };

  const signers = useMemo(() => {
    const recipients = envelope?.recipients || [];
    return recipients.filter((r: any) => !isCcRole(r));
  }, [envelope]);

  const currentSigner = useMemo(() => {
    const normId = (x: any) => {
      if (x == null) return "";
      if (typeof x === "string") return x;
      if (typeof x === "object" && x.$oid) return String(x.$oid);
      if (typeof x === "object" && x._id) return String(x._id);
      return String(x);
    };
    return signers.find((r: any) => normId(r?.id ?? r?._id) === normId(recipientId));
  }, [signers, recipientId]);

  const currentSignerDeclined = useMemo(
    () => !!currentSigner && isDeclinedStatus(currentSigner.status),
    [currentSigner]
  );

  const anySignerDeclined = useMemo(
    () => signers.some((r: any) => isDeclinedStatus(r.status)),
    [signers]
  );

  const allSignersCompleted = useMemo(() => {
    if (signers.length === 0) return false;
    return signers.every((r: any) => isCompletedStatus(r.status));
  }, [signers]);

  const completionPct = useMemo(() => {
    if (signers.length === 0) return 0;
    const completed = signers.filter((r: any) => isCompletedStatus(r.status)).length;
    return Math.round((completed / signers.length) * 100);
  }, [signers]);

  const documentName = useMemo(() => {
    const docs = envelope?.documents || [];
    const first = docs?.[0];
    return (
      first?.name ||
      first?.fileName ||
      envelope?.subject ||
      envelope?.title ||
      "Signed document"
    );
  }, [envelope]);

  const esignBase = ((import.meta as any).env?.VITE_ESIGN_SERVICE_URL || "")
    .toString()
    .trim()
    .replace(/\/+$/, "");

  const handleDownloadAll = () => {
    if (!envelopeId || !esignBase) return;
    const url = `${esignBase}/api/e-sign/signatures/download-all/${envelopeId}`;
    window.open(url, "_blank");
  };

  // Dummy placeholders for future APIs (separate buttons like the screenshot)
  // const handleDownloadDocument = () => {
  //   if (!envelopeId || !esignBase) return;
  //   const url = `${esignBase}/api/e-sign/signatures/download/${envelopeId}`; // placeholder
  //   window.open(url, "_blank");
  // };

  // const handleDownloadAuditCertificate = () => {
  //   if (!envelopeId || !esignBase) return;
  //   const url = `${esignBase}/api/e-sign/audit-trail/download/${envelopeId}`; // placeholder
  //   window.open(url, "_blank");
  // };

  const title = currentSignerDeclined
    ? "You have declined this document"
    : allSignersCompleted
      ? "All signatures completed"
      : anySignerDeclined
        ? "Signing closed"
        : "Signing completed";
  const subtitle = currentSignerDeclined
    ? "You have rejected this document for signing. Contact sales to regain access."
    : allSignersCompleted
      ? "Download the signed document and audit certificate."
      : anySignerDeclined
        ? "A signer has declined this envelope, so signing is no longer active."
        : "You’ve completed signing. You’ll receive the certificate by email once all signers finish.";

  const referralUrl = useMemo(() => {
    const rid = String(recipientId ?? "").trim();
    const base = (() => {
      try {
        return window.location.origin;
      } catch {
        return "";
      }
    })();
    // Dummy referral link format (update later)
    return `${base}/signup?ref=${encodeURIComponent(rid || "signer")}`;
  }, [recipientId]);

  const copyText = async (raw: string) => {
    const text = String(raw ?? "").trim();
    if (!text) {
      setCopyHint("failed");
      window.setTimeout(() => setCopyHint(""), 1200);
      return;
    }

    const tryModern = async (): Promise<boolean> => {
      if (!navigator.clipboard || !window.isSecureContext) return false;
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    };

    const tryExecCommand = (): boolean => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "0";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, text.length);
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    };

    const ok = (await tryModern()) || tryExecCommand();
    setCopyHint(ok ? "copied" : "failed");
    window.setTimeout(() => setCopyHint(""), ok ? 1200 : 2200);
  };

  const lastThreeDocs = useMemo(() => {
    // Dummy list for now. If envelope has docs, use those as a base.
    const docs = (envelope?.documents || []).slice(0, 3).map((d: any, i: number) => ({
      name: d?.name || d?.fileName || `Document ${i + 1}`,
      signedOn: d?.signedOn || d?.updatedAt || "Recently",
      status: "Signed",
    }));
    if (docs.length) return docs;
    return [
      { name: "NDA - Acme Corp.pdf", signedOn: "2 days ago", status: "Signed" },
      { name: "Offer Letter.pdf", signedOn: "1 week ago", status: "Signed" },
      { name: "Service Agreement.pdf", signedOn: "3 weeks ago", status: "Signed" },
    ];
  }, [envelope]);

  const coupon = useMemo(() => {
    // Dummy reward until API exists
    return {
      code: "SIGN25",
      title: "25% off",
      subtitle: "On your first plan",
    };
  }, []);

  const openScratch = () => {
    setScratchDone(false);
    scratchBurstFiredRef.current = false;
    setShowScratchModal(true);
  };

  const closeScratch = () => {
    setShowScratchModal(false);
  };

  const scratchAt = (clientX: number, clientY: number) => {
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null;
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    // Big brush so reward reveals in ~2–3 strokes
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
  };

  const measureScratch = () => {
    const canvas = scratchCanvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext("2d", { willReadFrequently: true } as any) as CanvasRenderingContext2D | null;
    if (!ctx) return 0;
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    let cleared = 0;
    const total = width * height;
    // sample every 8th pixel for speed
    for (let i = 3; i < data.length; i += 32) {
      if (data[i] === 0) cleared++;
    }
    const sampleTotal = Math.ceil(total / 8);
    return Math.max(0, Math.min(1, cleared / sampleTotal));
  };

  useEffect(() => {
    if (!showScratchModal) return;
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;

    const setup = () => {
      const parent = canvas.parentElement as HTMLElement | null;
      if (!parent) return;
      const w = Math.max(1, Math.floor(parent.clientWidth));
      const h = Math.max(1, Math.floor(parent.clientHeight));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null;
      if (!ctx) return;

      // Scratch layer: draw the full "blue gift card" UI on the canvas.
      ctx.globalCompositeOperation = "source-over";
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#2b57d9");
      bg.addColorStop(0.55, "#2450d1");
      bg.addColorStop(1, "#1d44c2");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // soft highlights / pattern
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(w * 0.18, h * 0.18, Math.min(w, h) * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w * 0.84, h * 0.26, Math.min(w, h) * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.1;
      for (let i = -h; i < w; i += 22) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + h, h);
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // title
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "700 22px ui-sans-serif, system-ui, -apple-system, Segoe UI";
      ctx.textAlign = "center";
      ctx.fillText("Scratch & Win", w / 2, 34);

      // gift (emoji-based; replace with asset later if desired)
      ctx.font = "64px ui-sans-serif, system-ui, -apple-system, Segoe UI, Apple Color Emoji, Segoe UI Emoji";
      ctx.fillText("🎁", w / 2, h * 0.56);

      // scratch strip visual
      const stripH = Math.max(44, Math.floor(h * 0.18));
      const stripY = h - stripH - 14;
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.strokeStyle = "rgba(255,255,255,0.30)";
      ctx.lineWidth = 2;
      const r = 14;
      ctx.beginPath();
      ctx.moveTo(16 + r, stripY);
      ctx.lineTo(w - 16 - r, stripY);
      ctx.quadraticCurveTo(w - 16, stripY, w - 16, stripY + r);
      ctx.lineTo(w - 16, stripY + stripH - r);
      ctx.quadraticCurveTo(w - 16, stripY + stripH, w - 16 - r, stripY + stripH);
      ctx.lineTo(16 + r, stripY + stripH);
      ctx.quadraticCurveTo(16, stripY + stripH, 16, stripY + stripH - r);
      ctx.lineTo(16, stripY + r);
      ctx.quadraticCurveTo(16, stripY, 16 + r, stripY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "700 12px ui-sans-serif, system-ui, -apple-system, Segoe UI";
      ctx.fillText("SCRATCH HERE", w / 2, stripY + Math.floor(stripH / 2) + 5);
    };

    setup();
    const onResize = () => setup();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [showScratchModal]);

  useEffect(() => {
    if (!showScratchModal) return;
    if (!scratchDone) return;
    if (scratchBurstFiredRef.current) return;
    scratchBurstFiredRef.current = true;
    try {
      confetti({
        particleCount: 110,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#260559", "#10B981", "#F59E0B", "#111827", "#ffffff"],
      });
      setTimeout(() => {
        confetti({
          particleCount: 70,
          spread: 90,
          origin: { y: 0.65 },
          colors: ["#260559", "#10B981", "#F59E0B"],
        });
      }, 250);
    } catch {
      // ignore
    }
  }, [showScratchModal, scratchDone]);

  if (!loading && !error && currentSignerDeclined) {
    return (
      <div className="min-h-screen mt-18 bg-gradient-to-b from-rose-50 via-white to-white px-4 py-12">
        <div className="mx-auto w-full max-w-3xl">
          <div className="overflow-hidden rounded-3xl border border-rose-200 bg-white shadow-sm">
            <div className="border-b border-rose-100 bg-rose-50/70 px-8 py-7">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">
                You have rejected this document
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Your signing access is closed for this envelope. Contact support if this was a mistake or if you need access restored.
              </p>
            </div>

            <div className="px-8 py-7">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                <div>
                  <span className="font-medium text-gray-900">Document:</span>{" "}
                  {documentName || "—"}
                </div>
                <div className="mt-1">
                  <span className="font-medium text-gray-900">Envelope ID:</span>{" "}
                  {String(envelopeId ?? "—")}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <a
                  href="/help-support"
                  className="inline-flex items-center justify-center rounded-xl border border-[#260559] px-4 py-2.5 text-sm font-semibold text-[#260559] transition-colors hover:bg-[#260559] hover:text-white"
                >
                  Help & Support
                </a>
                <a
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-[#260559] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#260559]/90"
                >
                  Go to Login
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 mt-14 px-4 py-10">
      <div className="mx-auto w-full max-w-7xl">
        {loading && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-gray-600">
            Loading…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* LEFT COLUMN */}
              <div className="lg:col-span-8 space-y-6">
                {/* Top success banner (screenshot-like) */}
                <div className="rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white px-6 py-10 shadow-sm">
                  <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-emerald-200">
                      {currentSignerDeclined ? (
                        <ShieldCheck className="h-8 w-8 text-rose-600" />
                      ) : (
                        <CheckCircle className="h-8 w-8 text-emerald-600" />
                      )}
                    </div>
                    <h1 className="text-2xl thankyou-heading font-semibold text-gray-900">{title}</h1>
                    <p className="mt-2 thankyou-para max-w-2xl text-gray-600">{subtitle}</p>
                  </div>
                </div>

                {/* Progress strip (like screenshot) */}
                <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-1.5 w-full max-w-[260px] rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-[#260559] transition-all duration-500"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      {currentSignerDeclined
                        ? "signing-declined"
                        : allSignersCompleted
                          ? "signers-have-signed"
                          : anySignerDeclined
                            ? "signing-closed"
                            : "signing-in-progress"}
                    </div>
                    <div className="h-1.5 w-full max-w-[260px] rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-[#260559] transition-all duration-500"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Document card with separate buttons */}
                <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
                  <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900">Document Name:</div>
                      <div className="mt-1 break-words text-sm text-gray-700">
                        {documentName}
                      </div>

                      <div className="mt-4 text-sm font-semibold text-gray-900">Signees Involved:</div>
                      <div className="mt-1 text-sm text-gray-700">
                        {(signers || [])
                          .slice(0, 4)
                          .map((r: any) => r?.name || r?.email || "Signer")
                          .join("  &  ") || "—"}
                        {signers.length > 4 ? `  (+${signers.length - 4} more)` : ""}
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-2 text-sm text-gray-700">
                        <div className="flex gap-2">
                          <span className="w-28 text-gray-500">Envelope ID</span>
                          <span className="break-all">{String(envelopeId ?? "—")}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="w-28 text-gray-500">Recipient ID</span>
                          <span className="break-all">{String(recipientId ?? "—")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 w-full md:w-auto">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        {/* <button
                          type="button"
                          onClick={handleDownloadDocument}
                          disabled={!allSignersCompleted}
                          className={
                            allSignersCompleted
                              ? "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#111] px-6 py-3 text-sm font-semibold text-white hover:bg-black sm:w-44"
                              : "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-200 px-6 py-3 text-sm font-semibold text-gray-500 cursor-not-allowed sm:w-44"
                          }
                        >
                          <FileSignature className="h-4 w-4" />
                          Document
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadAuditCertificate}
                          disabled={!allSignersCompleted}
                          className={
                            allSignersCompleted
                              ? "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-200 sm:w-52"
                              : "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-200 px-6 py-3 text-sm font-semibold text-gray-500 cursor-not-allowed sm:w-52"
                          }
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Audit Certificate
                        </button> */}
                      </div>

                      <div className="mt-3 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={handleDownloadAll}
                          disabled={!allSignersCompleted}
                          className={
                            allSignersCompleted
                              ? "inline-flex items-center justify-center gap-2 rounded-xl bg-[#260559] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#260559]/90"
                              : "hidden"
                          }
                        >
                          <Download className="h-4 w-4" />
                          Download all
                        </button>
                      </div>

                      {!allSignersCompleted && (
                        <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
                          <FileText className="mt-0.5 h-4 w-4" />
                          Downloads will be available once all signers complete signing.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Signees list */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                    <Users className="h-5 w-5 text-[#260559]" />
                    Signees
                  </div>

                  <div className="mt-4 space-y-3">
                    {(signers.length ? signers : [
                      { name: "Signer One", email: "signer.one@example.com", status: "completed" },
                      { name: "Signer Two", email: "signer.two@example.com", status: "pending" },
                    ]).map((r: any, idx: number) => {
                      const statusLabel = isCompletedStatus(r.status) ? "Signed" : "Pending";
                      const statusClass = isCompletedStatus(r.status)
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
                      const displayName = r?.name || r?.email || `Signer ${idx + 1}`;
                      const sub = r?.email && r?.name ? r.email : "";

                      const showVideoAudit = looksLikeVideoAuth(r);
                      const signedAtText =
                        r?.signedAt ||
                        r?.completedAt ||
                        r?.updatedAt ||
                        (isCompletedStatus(r.status) ? "Signed recently" : "");

                      // Dummy audit data for UI development (replace with API later)
                      const audit = r?.auditTrail || r?.livenessAudit || {};
                      const liveMatch = Number(audit?.liveMatchPercent ?? (showVideoAudit ? 100 - idx * 17 : 0));
                      const spokenText =
                        audit?.spokenStatement ||
                        `“In full awareness and without any pressure, I, ${displayName}, am signing this document.”`;
                      const livePicSrc =
                        audit?.livePicUrl ||
                        audit?.livePic ||
                        dummyAvatarDataUri(displayName, "live");
                      const idPicSrc =
                        audit?.idPicUrl ||
                        audit?.idPic ||
                        dummyAvatarDataUri(displayName, "id");

                      const videoAuditCard = (
                        <div key={`video-${String(r?._id ?? r?.id ?? idx)}`} className="relative">
                          {/* left rail */}
                          <div className="absolute left-0 top-0 bottom-0 flex w-10 items-start justify-center">
                            <div className="mt-2 flex flex-col items-center">
                              <div className="h-9 w-9 rounded-full bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center shadow-sm">
                                {idx + 1}
                              </div>
                              <div className="mt-3 w-1 flex-1 rounded-full bg-emerald-600/30" />
                            </div>
                          </div>

                          <div className="ml-10 rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm">
                            <div className="flex items-center justify-center">
                              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                              </div>
                            </div>

                            <div className="mt-5 flex items-center justify-center gap-6">
                              <div className="text-center">
                                <img
                                  src={livePicSrc}
                                  alt="Live Pic"
                                  className="h-16 w-16 rounded-md object-cover ring-1 ring-gray-200"
                                />
                                <div className="mt-1 text-[11px] text-emerald-700 font-semibold leading-tight">
                                  Live Pic • {Math.max(0, Math.min(100, liveMatch))}%<br />match
                                </div>
                              </div>
                              <div className="text-center">
                                <img
                                  src={idPicSrc}
                                  alt="ID Verified Pic"
                                  className="h-16 w-16 rounded-md object-cover ring-1 ring-gray-200"
                                />
                                <div className="mt-1 text-[11px] text-[#260559] font-semibold leading-tight">
                                  ID Verified <br /> Pic
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 text-center">
                              <div className="text-lg font-semibold text-gray-900">{displayName}</div>
                              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                                  ✓ Liveness
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-400 px-3 py-1 text-xs font-semibold text-gray-900">
                                  ✓ Video Evidence
                                </span>
                                <span className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold ${statusClass}`}>
                                  {statusLabel}
                                </span>
                              </div>
                            </div>

                            {signedAtText && (
                              <div className="mt-4 text-center text-sm text-gray-600">
                                Signed on <span className="font-medium">{String(signedAtText)}</span>
                              </div>
                            )}

                            <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                              <span className="font-semibold">Spoken:</span>{" "}
                              <span className="italic">{spokenText}</span>
                            </div>

                            <div className="mt-5 flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  // Placeholder (API later)
                                  window.open("about:blank", "_blank");
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-black/90"
                              >
                                <Download className="h-4 w-4" />
                                Download Video
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                                  🎥
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );

                      const standardCard = (
                        <div
                          key={`standard-${String(r?._id ?? r?.id ?? idx)}`}
                          className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900">{displayName}</div>
                              {sub && <div className="mt-0.5 text-sm text-gray-600">{sub}</div>}
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </div>
                        </div>
                      );

                      // Demo: show BOTH card styles so UI can be reviewed.
                      // Later we can switch back to conditional rendering only.
                      if (demoShowBothSignerCards && idx === 0) {
                        return (
                          <div key={`both-${String(r?._id ?? r?.id ?? idx)}`} className="space-y-3">
                            <div className="text-xs font-semibold text-gray-500">
                              Preview: Liveness/Video audit card
                            </div>
                            {videoAuditCard}
                            <div className="pt-2 text-xs font-semibold text-gray-500">
                              Preview: Standard signer card
                            </div>
                            {standardCard}
                          </div>
                        );
                      }

                      if (showVideoAudit) return videoAuditCard;

                      return standardCard;
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="lg:col-span-4">
                <div className="space-y-6 lg:sticky lg:top-18">
                  {userType === "existing" ? (
                    <div className="rounded-3xl border border-[#260559]/15 bg-gradient-to-b from-[#260559]/10 to-white p-6 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white ring-1 ring-[#260559]/15">
                            <LinkIcon className="h-5 w-5 text-[#260559]" />
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900">Invite & earn</div>
                            <div className="mt-1 text-sm text-gray-600">
                              Share your referral link. When friends join, you both get benefits.
                            </div>
                          </div>
                        </div>
                        {/* <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#260559] ring-1 ring-[#260559]/15">
                        Existing user
                      </span> */}
                      </div>

                      <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-gray-200">
                        <div className="text-xs font-semibold text-gray-500">Your referral link</div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="min-w-0 flex-1 truncate rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700 ring-1 ring-gray-200">
                            {referralUrl}
                          </div>
                          <button
                            type="button"
                            onClick={() => copyText(referralUrl)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#260559] text-white hover:bg-[#260559]/90"
                            aria-label="Copy referral link"
                          >
                            {copyHint === "copied" ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {copyHint === "failed" && (
                          <div className="mt-2 text-xs text-red-700">Copy failed</div>
                        )}
                      </div>

                      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-gray-200">
                        <Gift className="h-5 w-5 text-emerald-600" />
                        <div className="text-sm text-gray-700">
                          Tip: Invite 3 friends to unlock <span className="font-semibold">premium signing</span>.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-6 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {/* <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white ring-1 ring-amber-200">
                            <Ticket className="h-5 w-5 text-amber-700" />
                          </div> */}
                          <div>
                            <div className="text-lg font-semibold text-gray-900">✨ Your Reward is Waiting!</div>
                            <div className="mt-1 text-xs text-gray-600">
                            You're just one step away, sign up now and unlock your surprise gift!
                            </div>
                          </div>
                        </div>
                        {/* <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                        New signer
                      </span> */}
                      </div>

                      <button
                        type="button"
                        onClick={openScratch}
                        className="mt-5 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 text-left shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* <div className="text-sm font-semibold text-gray-900">Your coupon</div>
                        <div className="text-xs font-semibold text-gray-500">
                          {scratchRevealed ? "Revealed" : "Scratch"}
                        </div> */}
                        </div>
                        <div className="mt-3">
                          {scratchRevealed ? (
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-xs font-semibold text-gray-500">COUPON</div>
                                <div className="mt-1 text-2xl font-extrabold tracking-tight text-[#260559]">
                                  SIGN25
                                </div>
                                <div className="mt-1 text-sm text-gray-600">25% off on your first plan</div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  copyText("SIGN25");
                                }}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#260559] text-white hover:bg-[#260559]/90"
                                aria-label="Copy coupon"
                              >
                                {copyHint === "copied" ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                        ) : (
                          <div className="relative flex flex-col items-center">
                            <div className="text-sm text-gray-600">
                              Tap to scratch and reveal.
                            </div>

                            {/* Preview scratch card (reference-style) */}
                            <div className="mt-3 h-52 w-52 overflow-hidden rounded-2xl border border-blue-500/60 bg-gradient-to-b from-[#2b57d9] via-[#2450d1] to-[#1d44c2] shadow-sm">
                              <div className="relative h-full w-full">
                                {/* subtle pattern */}
                                <div className="absolute inset-0 opacity-[0.16]" style={{
                                  backgroundImage:
                                    "radial-gradient(circle at 10% 20%, rgba(255,255,255,.35) 0, rgba(255,255,255,0) 32%), radial-gradient(circle at 90% 30%, rgba(255,255,255,.22) 0, rgba(255,255,255,0) 28%)",
                                }} />

                                <div className="relative flex h-full flex-col items-center justify-between px-4 py-4">
                                  <div className="text-center">
                                    <div className="text-lg font-semibold tracking-wide text-white">
                                      Scratch &amp; Win
                                    </div>
                                  </div>

                                  <div className="flex flex-1 items-center justify-center">
                                    <div className="relative">
                                      <div className="absolute -inset-4 rounded-full bg-white/10 blur-md" />
                                      <Gift className="relative h-20 w-20 text-[#ffd84d]" />
                                    </div>
                                  </div>

                                 
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        </div>
                      </button>

                      <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-gray-200">
                        <div className="text-sm font-semibold text-gray-900">Your recent signed docs</div>
                        <div className="mt-3 space-y-2">
                          {lastThreeDocs.map((d: { name: string; signedOn: string; status: string }) => (
                            <div key={d.name} className="rounded-xl bg-gray-50 px-3 py-3 ring-1 ring-gray-200">
                              <div className="text-sm font-semibold text-gray-900">{d.name}</div>
                              <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
                                <span>Signed: {d.signedOn}</span>
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-200">
                                  {d.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-xs text-gray-600">
                            Create an account to access your signing history.
                          </div>
                          <button
                            type="button"
                            onClick={() => window.location.assign("/login")}
                            className="inline-flex items-center justify-center rounded-full bg-[#260559] px-4 py-2 text-xs font-semibold text-white hover:bg-[#260559]/90"
                          >
                           Signup
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scratch coupon modal */}
            {showScratchModal && (
              <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] px-4 py-10">
                <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_rgba(0,0,0,0.22)] ring-1 ring-gray-200">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <div className="text-sm font-semibold text-gray-900">Scratch reward</div>
                    <button
                      type="button"
                      onClick={closeScratch}
                      className="rounded-xl p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-5">
                    <div
                      className={
                        !scratchDone
                          ? "relative h-72 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                          : "relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-gray-500">COUPON</div>
                          <div className="mt-1 text-3xl font-extrabold tracking-tight text-[#260559]">
                            {coupon.code}
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            <span className="font-semibold">{coupon.title}</span>{" "}
                            {coupon.subtitle}
                          </div>
                          
                        </div>
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                      </div>

                      {/* Scratch layer that contains the gift UI; it gets cleared as user scratches */}
                      {!scratchDone && (
                        <div className="absolute inset-0 overflow-hidden rounded-2xl">
                          <canvas
                            ref={scratchCanvasRef}
                            className="h-full w-full touch-none"
                            onPointerDown={(e) => {
                              scratchDrawingRef.current = true;
                              (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
                              scratchAt(e.clientX, e.clientY);
                            }}
                            onPointerMove={(e) => {
                              if (!scratchDrawingRef.current) return;
                              scratchAt(e.clientX, e.clientY);
                              scratchMeasureTickRef.current++;
                              if (scratchMeasureTickRef.current % 6 === 0) {
                                const pct = measureScratch();
                                if (pct >= 0.20) {
                                  setScratchDone(true);
                                  setScratchRevealed(true);
                                }
                              }
                            }}
                            onPointerUp={() => {
                              scratchDrawingRef.current = false;
                              const pct = measureScratch();
                              if (pct >= 0.20) {
                                setScratchDone(true);
                                setScratchRevealed(true);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-end">                    
                      <button
                        type="button"
                        onClick={() => copyText(coupon.code)}
                        disabled={!scratchDone}
                        className={
                          scratchDone
                            ? "inline-flex items-center justify-center gap-2 rounded-xl bg-[#260559] px-3 py-2 text-xs font-semibold text-white hover:bg-[#260559]/90"
                            : "inline-flex items-center justify-center gap-2 rounded-xl bg-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 cursor-not-allowed"
                        }
                      >
                        {copyHint === "copied" ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>

                  
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

