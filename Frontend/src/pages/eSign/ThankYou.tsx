import { useState } from "react";

export default function ThankYouPage() {
  const [showConfetti, _setShowConfetti] = useState(true);

  const PALETTE = ["#ffffff", "#260559", "#214191", "#ffcc00", "#00ffea"];

  const CONFETTI_COUNT = 80;
  const pieces = Array.from({ length: CONFETTI_COUNT }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 420;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const rot = Math.floor(Math.random() * 720) + "deg";
    const delay = (Math.random() * 0.25).toFixed(2) + "s";
    const duration = (0.9 + Math.random() * 1.4).toFixed(2) + "s";
    const width = Math.floor(6 + Math.random() * 10);
    const height = Math.floor(6 + Math.random() * 18);
    const color = PALETTE[i % PALETTE.length];
    const shape = Math.random() > 0.6 ? "circle" : "rect";
    return { id: i, tx, ty, rot, delay, duration, width, height, color, shape };
  });

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: "#260559" }}>
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 z-30">
          <div className="absolute left-1/2 top-40 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
            {pieces.map(p => (
              <div
                key={p.id}
                className={`absolute z-40 transform-gpu ${p.shape === "circle" ? "rounded-full" : "rounded-sm"} drop-shadow-lg`} 
                style={{
                  width: `${p.width}px`,
                  height: `${p.shape === "circle" ? p.width + "px" : p.height + "px"}`,
                  background: p.color,
                  left: 0,
                  top: 0,
                  ["--tx"]: `${p.tx}px`,
                  ["--ty"]: `${p.ty}px`,
                  ["--rot"]: p.rot,
                  animation: `burst-move ${p.duration} ${p.delay} cubic-bezier(.2,.8,.3,1) forwards infinite`,
                }as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      )}

      <div className="relative z-50 w-full max-w-xl mx-4 p-10 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center text-white">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 flex items-center justify-center animate-color-cycle">
            <span className="text-4xl font-bold">✔️</span>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-3">Thank you for signing!</h1>
        <p className="text-lg max-w-[28rem] mx-auto opacity-90 mb-6">Once all recipients have signed, you will receive the final signed document and the certificate at your email.</p>

        <a href="/" className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white text-[#260559] font-semibold shadow-lg hover:scale-[1.02] transition-transform">
          Explore
        </a>
      </div>
        <style>
        {`
        @keyframes burst-move {
            0% { opacity: 1; transform: translate3d(0,0,0) rotate(0deg) scale(1); }
            60% { opacity: 1; transform: translate3d(var(--tx), var(--ty), 0) rotate(var(--rot)) scale(1.05); }
            100% { opacity: 0; transform: translate3d(calc(var(--tx) * 1.2), calc(var(--ty) * 1.2 + 40px), 0) rotate(calc(var(--rot) + 180deg)) scale(0.9); }
        }

        @keyframes color-cycle {
            0% { color: #ffffff; }
            25% { color: #ffcc00; }
            50% { color: #00ffea; }
            75% { color: #214191; }
            100% { color: #ffffff; }
        }

        .animate-color-cycle {
            animation: color-cycle 2s linear infinite;
        }
        `}
        </style>

    </div>
  );
}
