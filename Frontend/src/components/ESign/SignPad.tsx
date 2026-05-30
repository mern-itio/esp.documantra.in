import  { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { eSignApi } from "../../services/apiHelper";
import ActionButton from "./ActionButton"; // <-- adjust path as needed


interface ActiveField {
  _id: string;
  type: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  status: string;
}

interface SignPadProps {
  isSignPad: boolean;
  setIsSignPad: (open: boolean) => void;
  activeField: ActiveField | null;
  currentUserId: string;
  documentId: string;
  envelopeID?: string;
  defaultSign?: string | null;
  onSaveSign?: (fieldId: string, signatureUrl: string, fieldRemmaning:boolean) => void;
  onSignatureSaved?: (signatureUrl: string, fieldId: string) => void;
  selfValue?: string;
  cycleId?:string;
  mode?: "add" | "update";
}

export default function SignPad({
  isSignPad,
  setIsSignPad,
  // activeField,
  currentUserId,
  // documentId,
  envelopeID,
  defaultSign = null,
  // onSaveSign,
  onSignatureSaved,
  selfValue,
  // cycleId
  mode = "add"
}: SignPadProps) {
  const [penColor, setPenColor] = useState("blue");
  const [isTab, setIsTab] = useState<"draw" | "upload" | "typed">("draw");
  const [typedSignature, setTypedSignature] = useState("");
  const [fontSelect, setFontSelect] = useState("Fasthand");
  const [isSignImg, setIsSignImg] = useState<string>(defaultSign || "");
  const [initials, setInitials] = useState<string>("");
  const canvasRef = useRef<SignatureCanvas | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const fontOptions = [
    { value: "Fasthand" },
    { value: "Dancing Script" },
    { value: "Cedarville Cursive" },
    { value: "Delicious Handrawn" },
  ];

  const allColors = ["blue", "red", "black"];

  /**
   * Convert typed text to an image DataURL.
   * NOTE: browser must have the font available (webfont or system), otherwise it'll fallback.
   */
  const convertToImg = (font: string, text: string, color: string) => {
    if (!text) {
      setIsSignImg("");
      return;
    }
    // Create canvas with reasonable scaling for crispness
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const fontSize = 48; // larger for clarity
    ctx.font = `${fontSize}px ${font}, sans-serif`;
    const width = Math.ceil(ctx.measureText(text).width + 40);
    const height = fontSize + 40;
    canvas.width = width;
    canvas.height = height;
    // need to re-set font after size set (important)
    ctx.font = `${fontSize}px ${font}, sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    ctx.fillText(text, 20, 20);
    const dataUrl = canvas.toDataURL("image/png");
    setIsSignImg(dataUrl);
  };

  const handleSaveDraw = () => {
    if (canvasRef.current && !canvasRef.current.isEmpty()) {
      const dataUrl = canvasRef.current.toDataURL();
      setIsSignImg(dataUrl);
    }
  };

  const handleClear = () => {
    if (isTab === "draw" && canvasRef.current) canvasRef.current.clear();
    if (isTab === "typed") {
      setTypedSignature("");
      setIsSignImg("");
    } else {
      setIsSignImg("");
    }
  };

  const handleDownload = async () => {
    if (!isSignImg) return;
    try {
      setIsUploading(true);
      const link = document.createElement("a");
      link.href = isSignImg;
      link.download = "signature.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Download failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = async () => {
    if (!isSignImg) return;
    try {
      setIsCopying(true);
      const res = await fetch(isSignImg);
      const blob = await res.blob();
      // ClipboardItem might not be available in all browsers
      // but it's fine in modern ones; fallback to alert otherwise
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      alert("Signature copied to clipboard!");
    } catch (err) {
      console.error(err);
      alert("Failed to copy signature. Try downloading instead.");
    } finally {
      setIsCopying(false);
    }
  };

  // const issueCertificate = async (recipientId: any, envelopeId: any, selfVal: any) => {
  //   const payload = { recipientId, envelopeId, selfValue: selfVal };
  //   try {
  //     const res = await eSignApi.post("/api/e-sign/certificates/issue", payload);
  //     // adjust according to your backend response structure
  //     return res?.data?.certificateId;
  //   } catch (err) {
  //     console.error("issueCertificate error:", err);
  //     throw err;
  //   }
  // };

  // const handleSubmit = async () => {
  //   if (!isSignImg) {
  //     alert("Please provide a signature before submitting!");
  //     return;
  //   }
  //   setIsSubmitting(true);
  //   try {
  //     // Issue certificate first
  //     const certificateId = await issueCertificate(currentUserId, envelopeID, selfValue);
  //     if (!certificateId) {
  //       throw new Error("Certificate issuance failed");
  //     }

  //     const payload = {
  //       fieldId: activeField?._id,
  //       signatureImageBase64: isSignImg,
  //       envelopeId: envelopeID || "",
  //       documentId,
  //       recipientId: currentUserId,
  //       certificateId, 
  //       signerName: "John Doe", // adjust dynamically if you have a real name
  //       selfValue: selfValue || "",
  //       cycleId:cycleId || ""
  //     };

  //     const response = await eSignApi.post("/api/e-sign/public/add-signature", payload);

  //     if (response?.status === 200) {
  //       // alert("Signature submitted successfully!");
  //       onSaveSign?.(activeField?._id || "", isSignImg,response?.data?.fieldRemmaning);
  //       setIsSignPad(false);
  //     } else {
  //       console.error("submit response:", response);
  //       alert("Failed to submit signature. Please try again.");
  //     }
  //   } catch (err) {
  //     console.error("submit error:", err);
  //     alert("An error occurred while submitting the signature.");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };
  const handleSaveSignature = async () => {
    if (!isSignImg) {
      alert("Please provide a signature before submitting!");
      return;
    }
    setIsSubmitting(true);
    try{
      const payload = {
        recipientId: currentUserId,
        Signature: isSignImg,
        mode: mode,
        envelopeId: envelopeID,
        selfValue: selfValue || "",
        initials: initials.trim().toUpperCase() || undefined
      }
      const response = await eSignApi.post("/api/e-sign/public/save-signature",payload);
      if(response?.status === 200){
        alert("Signature saved successfully.");
        //onSignatureSaved modify to re-render updated signature to updated signature fields
        if(response.data.mode === "update" && response.data.signatureFields){
          for(const field of response.data.signatureFields){
            onSignatureSaved?.(isSignImg,field._id);
          }
        }else{
          onSignatureSaved?.(isSignImg,"");
        }
        onSignatureSaved?.(isSignImg,"");
        setIsSignPad(false);
      }
    } catch (err){
      console.log(err);
    } finally {
      setIsSubmitting(false);
    }
  }
  // Focus typed input when we enter typed tab while modal open.
  useEffect(() => {
    if (isSignPad && isTab === "typed") {
      const t = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
        if (typedSignature) convertToImg(fontSelect, typedSignature, penColor);
      }, 60);
      return () => clearTimeout(t);
    }
  }, [isTab, isSignPad, fontSelect, penColor]); // not depending on typedSignature to avoid focus stealing

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSignPad(false);
    };
    if (isSignPad) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSignPad, setIsSignPad]);

  // Upload handler with slight UX improvements (upload loader)
  const onFileChange = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should not exceed 5MB!");
      return;
    }
    const reader = new FileReader();
    setIsUploading(true);
    reader.onload = () => {
      setIsSignImg(reader.result as string);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
      alert("Failed to read file.");
    };
    reader.readAsDataURL(file);
  };

  if (!isSignPad) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 sm:px-6 backdrop-blur-sm">
      <div className="bg-[#F7F3EE] w-full max-w-[90vw] sm:max-w-[520px] lg:max-w-[600px] max-h-[82vh] overflow-y-auto rounded-xl p-5 sm:p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">
              {mode === "update" ? "Update Signature" : "Add Signature"}
            </h3>
            <p className="text-sm text-gray-500">
              Select draw, upload, or type. Your signature will be embedded into the document.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isSubmitting) return; // prevent closing while submitting
                setIsSignPad(false);
              }}
              aria-label="Close"
              className="text-gray-600 hover:text-gray-900 text-2xl"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {(["draw", "upload", "typed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setIsTab(tab)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                  isTab === tab
                    ? "bg-blue-600 text-white border-blue-700"
                    : "bg-[#F7F3EE] text-gray-700 border-gray-200"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="mt-4 flex flex-col items-center gap-3">
            {isTab === "draw" && (
              <>
                <SignatureCanvas
                    ref={(c) => { canvasRef.current = c; }}
                    penColor={penColor}
                    canvasProps={{ className: "border rounded-md w-full h-[170px]" }}
                    dotSize={1}
                    onEnd={handleSaveDraw}
                  />
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex gap-2">
                    {allColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setPenColor(color)}
                        className={`w-7 h-7 rounded-full border ${penColor === color ? "ring-2 ring-offset-1 ring-blue-300" : ""}`}
                        style={{ backgroundColor: color }}
                        aria-label={`pen-${color}`}
                      />
                    ))}
                  </div>
                  <button
                    className="ml-2 px-3 py-1 rounded border text-sm"
                    onClick={() => {
                      canvasRef.current?.clear();
                      setIsSignImg("");
                    }}
                    disabled={isSubmitting}
                  >
                    Clear
                  </button>
                </div>
              </>
            )}

            {isTab === "upload" && (
              <>
                <label
                  className="flex w-full max-w-[420px] flex-col items-center justify-center border-2 border-dashed rounded-md h-[120px] cursor-pointer p-3"
                >
                  <CloudUploadIcon fontSize="large" className="text-gray-500" />
                  <span className="text-sm text-gray-600 mt-1">Click to upload or drop an image (max 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => onFileChange(e.target.files?.[0])}
                  />
                </label>
                {isUploading && <div className="text-xs text-gray-500 mt-1">Processing file...</div>}
              </>
            )}

            {isTab === "typed" && (
              <div className="w-full">
                <input
                  ref={inputRef}
                  type="text"
                  value={typedSignature}
                  onChange={(e) => {
                    setTypedSignature(e.target.value);
                    convertToImg(fontSelect, e.target.value, penColor);
                  }}
                  placeholder="Type your signature here"
                  className="w-full border p-2 rounded"
                  disabled={isSubmitting}
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {fontOptions.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => {
                        setFontSelect(f.value);
                        convertToImg(f.value, typedSignature, penColor);
                      }}
                      className={`px-2 py-1 border rounded text-sm ${fontSelect === f.value ? "bg-blue-50" : ""}`}
                      style={{ fontFamily: `${f.value}, sans-serif` }}
                      disabled={isSubmitting}
                    >
                      {f.value}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  {allColors.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setPenColor(c);
                        convertToImg(fontSelect, typedSignature, c);
                      }}
                      className={`w-7 h-7 rounded-full border ${penColor === c ? "ring-2 ring-offset-1 ring-blue-300" : ""}`}
                      style={{ backgroundColor: c }}
                      aria-label={`color-${c}`}
                      disabled={isSubmitting}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Preview */}
            {isSignImg && (
              <div className="mt-4 flex flex-col items-center w-full">
                <div className="text-xs text-gray-500 mb-2">Preview</div>
                <img src={isSignImg} alt="signature-preview" className="h-28 object-contain border rounded p-1 bg-[#F7F3EE]" />
              </div>
            )}
            
            {/* Initials Input */}
            <div className="mt-4 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initials (Optional)
              </label>
              <input
                type="text"
                value={initials}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().slice(0, 3);
                  setInitials(value);
                }}
                placeholder="Enter your initials (max 3 characters)"
                className="w-full border p-2 rounded text-center tracking-widest"
                disabled={isSubmitting}
                maxLength={3}
                style={{ letterSpacing: "0.35em" }}
              />
              <p className="text-xs text-gray-500 mt-1">Your initials will be saved with your signature</p>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-5 flex flex-wrap gap-3 justify-center">
            {/* Clear / Download / Copy */}
            <button
              className="px-3 py-1 rounded border text-sm"
              onClick={handleClear}
              disabled={isSubmitting || isUploading}
            >
              Clear
            </button>

            <ActionButton onClick={handleDownload} loading={isUploading} disabled={!isSignImg || isSubmitting} variant="secondary">
              Download
            </ActionButton>

            <ActionButton onClick={handleCopy} loading={isCopying} disabled={!isSignImg || isSubmitting} variant="secondary">
              Copy
            </ActionButton>

            {/* Primary Sign button */}
            <ActionButton onClick={handleSaveSignature} loading={isSubmitting} disabled={!isSignImg} variant="primary">
              Save Signature
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
