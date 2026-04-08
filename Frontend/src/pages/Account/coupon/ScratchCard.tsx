import { useRef, useEffect, useState, useCallback } from "react";

interface ScratchCardProps {
  width: number;
  height: number;
  onReveal: () => void;
  children: React.ReactNode;
}

export default function ScratchCard({ width, height, onReveal, children }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const revealedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Neutral overlay simulating a covered code strip
    ctx.fillStyle = "#c8c8cd";
    ctx.fillRect(0, 0, width, height);

    // Crosshatch pattern
    ctx.strokeStyle = "#b8b8bd";
    ctx.lineWidth = 0.5;
    for (let i = -height; i < width + height; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }

    // Masked code hint
    ctx.font = "500 13px 'Courier New', monospace";
    ctx.fillStyle = "#9a9aa0";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("▮▮▮▮ - ▮▮▮▮ - ▮▮▮▮", width / 2, height / 2);
  }, [width, height]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, [width, height]);

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealedRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();

    const imageData = ctx.getImageData(0, 0, width, height);
    let cleared = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) cleared++;
    }
    const pct = cleared / (width * height);
    if (pct > 0.4 && !revealedRef.current) {
      revealedRef.current = true;
      setRevealed(true);
      ctx.clearRect(0, 0, width, height);
      onReveal();
    }
  }, [width, height, onReveal]);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsScratching(true);
    const { x, y } = getPos(e);
    scratch(x, y);
  }, [getPos, scratch]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    scratch(x, y);
  }, [isScratching, getPos, scratch]);

  const handleEnd = useCallback(() => {
    setIsScratching(false);
  }, []);

  return (
    <div className="relative select-none" style={{ width, height }}>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
      {!revealed && (
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="absolute inset-0 cursor-grab active:cursor-grabbing rounded-md"
          style={{ width: "100%", height: "100%", touchAction: "none" }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      )}
    </div>
  );
}
