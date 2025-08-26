import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { eSignApi } from "../../services/apiHelper";
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
  onSaveSign?: (fieldId: string, signatureUrl: string) => void; //
}

function SignPad({
  isSignPad,
  setIsSignPad,
  activeField,
  defaultSign = null,
  onSaveSign
}: SignPadProps) {
  const [penColor, setPenColor] = useState("blue");
  const [isTab, setIsTab] = useState<"draw" | "upload" | "typed">("draw");
  const [typedSignature, setTypedSignature] = useState("");
  const [fontSelect, setFontSelect] = useState("Fasthand");
  const [isSignImg, setIsSignImg] = useState(defaultSign || "");
  const canvasRef = useRef<SignatureCanvas>(null);

  const fontOptions = [
    { value: "Fasthand" },
    { value: "Dancing Script" },
    { value: "Cedarville Cursive" },
    { value: "Delicious Handrawn" },
  ];

  const allColors = ["blue", "red", "black"];

  // Convert typed text to signature image
  const convertToImg = (font: string, text: string, color: string) => {
    if (!text) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const fontSize = 40;
    ctx.font = `${fontSize}px ${font}`;
    const width = ctx.measureText(text).width + 20;
    const height = fontSize + 20;
    canvas.width = width;
    canvas.height = height;
    ctx.font = `${fontSize}px ${font}`;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    ctx.fillText(text, 10, 10);
    const dataUrl = canvas.toDataURL("image/png");
    setIsSignImg(dataUrl);
  };

  const handleSaveDraw = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      setIsSignImg(dataUrl);
    }
  };

  const handleClear = () => {
    if (isTab === "draw" && canvasRef.current) canvasRef.current.clear();
    if (isTab === "typed") setTypedSignature("");
    setIsSignImg("");
  };

  const handleDownload = () => {
    if (!isSignImg) return;
    const link = document.createElement("a");
    link.href = isSignImg;
    link.download = "signature.png";
    link.click();
  };

  const handleCopy = () => {
    if (!isSignImg) return;
    fetch(isSignImg)
      .then((res) => res.blob())
      .then((blob) => {
        const item = new ClipboardItem({ "image/png": blob });
        navigator.clipboard.write([item]);
        alert("Signature copied to clipboard!");
      })
      .catch(() => alert("Failed to copy signature."));
  };

  const handleSubmit = async () => {
    if (!isSignImg) {
      alert("Please provide a signature before submitting!");
      return;
    }

    const payload = {
      fieldId: activeField?._id,
      signature: isSignImg
    };
    const response = await eSignApi.post("/api/e-sign/public/add-signature", payload);
    if (response.status == 200) {
        alert("Signature submitted successfully!");
        console.log("Signature submitted:", response.data);
            // Forward the signed data to parent
            onSaveSign?.(activeField?._id || "", isSignImg);
            // Close the SignPad
            setIsSignPad(false);
    } else {
      alert("Failed to submit signature. Please try again.");
        return;
    }

    setIsSignPad(false);
  };

  return (
    <>
      {isSignPad && (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-black/30">
          <div
            className="bg-white rounded-xl p-6 w-[550px] max-h-[600px] overflow-y-auto"
            style={{ boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px" }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="font-bold text-lg">Signature</div>
              <div
                className="cursor-pointer text-2xl"
                onClick={() => setIsSignPad(false)}
              >
                &times;
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-4">
              {["draw", "upload", "typed"].map((tab) => (
                <button
                  key={tab}
                  className={`px-2 py-1 border rounded ${
                    isTab === tab ? "bg-blue-500 text-white" : ""
                  }`}
                  onClick={() => setIsTab(tab as "draw" | "upload" | "typed")}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Signature Area */}
            <div className="flex flex-col items-center gap-2">
              {isTab === "draw" && (
                <SignatureCanvas
                  ref={canvasRef}
                  penColor={penColor}
                  canvasProps={{ className: "border w-full h-[150px]" }}
                  dotSize={1}
                  onEnd={handleSaveDraw}
                />
              )}

              {isTab === "upload" && !isSignImg && (
                <label
                  className="flex flex-col items-center cursor-pointer border-2 border-gray-300 rounded p-4"
                  style={{ width: "400px", height: "100px" }}
                >
                  <CloudUploadIcon fontSize="large" />
                  <span className="mt-1">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return; // handle no file case
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        alert("File size should not exceed 5MB!");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        setIsSignImg(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              )}

            {isTab === "typed" && (
            <>
                <input
                type="text"
                value={typedSignature}
                onChange={(e) => {
                    setTypedSignature(e.target.value);
                    convertToImg(fontSelect, e.target.value, penColor);
                }}
                placeholder="Type your signature"
                className="border p-1 w-full"
                />
                <div className="flex gap-2">
                {fontOptions.map((f) => (
                    <button
                    key={f.value}
                    style={{
                        fontFamily: f.value,
                        backgroundColor: fontSelect === f.value ? "#d0e7ff" : "",
                    }}
                    className="px-2 py-1 border rounded"
                    onClick={() => {
                        setFontSelect(f.value);
                        convertToImg(f.value, typedSignature, penColor);
                    }}
                    >
                    {f.value}
                    </button>
                ))}
                </div>
            </>
            )}


              {/* Color Picker for Draw/Typed */}
              {(isTab === "draw" || isTab === "typed") && (
                <div className="flex gap-2 mt-2">
                  {allColors.map((color) => (
                    <button
                      key={color}
                      style={{ backgroundColor: color }}
                      className="w-6 h-6 rounded"
                      onClick={() => {
                        setPenColor(color);
                        if (isTab === "typed")
                          convertToImg(fontSelect, typedSignature, color);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            {isSignImg && isTab !== "draw" && (
              <div className="flex flex-col items-center mt-4">
                <img src={isSignImg} alt="signature-preview" className="h-32" />
              </div>
            )}
            {/* Common Buttons */}
            <div className="flex gap-2 mt-4 justify-center flex-wrap">
              <button className="px-2 py-1 border rounded" onClick={handleClear}>
                Clear
              </button>
              {isSignImg && (
                <>
                  <button className="px-2 py-1 border rounded" onClick={handleDownload}>
                    Download
                  </button>
                  <button className="px-2 py-1 border rounded" onClick={handleCopy}>
                    Copy
                  </button>
                  <button className="px-2 py-1 border rounded" onClick={handleSubmit}>
                    Sign
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SignPad;
