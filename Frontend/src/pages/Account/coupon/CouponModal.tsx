import { useState, useCallback } from "react";
import { X, Copy, Check, ExternalLink, Clock, Scissors } from "lucide-react";
import ScratchCard from "./ScratchCard";
import Confetti from "./Confetti";
import type { Coupon } from "../../../data/coupons";

interface CouponModalProps {
  coupon: Coupon;
  onClose: () => void;
}

export default function CouponModal({ coupon, onClose }: CouponModalProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(coupon.rewardCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [coupon.rewardCode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px] animate-fade-in"
        style={{ animationDuration: "200ms" }}
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl animate-scale-in overflow-hidden border border-gray-200">
        <Confetti active={revealed} />
        {/* Voucher header */}
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="text-[11px] font-medium text-[#2CA58D] tracking-wide uppercase">{coupon.category}</span>
              <h2 className="text-base font-semibold text-card-foreground mt-0.5">{coupon.title}</h2>
              <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center transition-colors hover:bg-muted -mt-0.5"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>

          {/* Value highlight */}
          <div className="mt-4 flex items-center justify-between bg-gray-100 rounded-lg px-4 py-2.5">
            <span className="text-xl font-bold text-foreground tracking-tight">{coupon.rewardValue}</span>
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Expires {new Date(coupon.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Perforation */}
        <div className="relative flex items-center">
          <div className="absolute -left-2.5 w-5 h-5 rounded-full bg-white border border-gray-200" />
          <div className="flex-1 border-t border-dashed border-gray-200 mx-4" />
          <div className="absolute -right-2.5 w-5 h-5 rounded-full bg-white border border-gray-200" />
        </div>

        {/* Scratch / Code area */}
        <div className="p-5 pt-4">
          {!revealed && (
            <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Scissors className="w-3 h-3" />
              Scratch below to reveal your coupon code
            </div>
          )}

          <div className="rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
            <ScratchCard width={320} height={80} onReveal={handleReveal}>
              <div className="flex items-center justify-center h-full">
                <span
                  className={`font-mono text-lg font-semibold tracking-[0.2em] text-foreground transition-all duration-500 ${
                    revealed ? "animate-pop-in" : ""
                  }`}
                >
                  {coupon.rewardCode}
                </span>
              </div>
            </ScratchCard>
          </div>

          {/* Post-reveal */}
          {revealed && (
            <div className="mt-4 space-y-3 animate-fade-in">
              {/* Subtle success */}
              <div className="flex items-center gap-2 text-xs text-success">
                <Check className="w-3.5 h-3.5" />
                <span className="font-medium">Code revealed</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2.5 bg-secondary rounded-lg font-mono text-sm tracking-widest text-foreground text-center select-all">
                  {coupon.rewardCode}
                </div>
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 h-10 px-3.5 rounded-lg bg-[#260559] text-white text-xs font-medium flex items-center gap-1.5 transition-all hover:opacity-90 active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <button className="w-full h-10 rounded-lg bg-[#36a18b] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-[0.98]">
                <ExternalLink className="w-3.5 h-3.5" />
                Apply Coupon
              </button>

              {coupon.terms && (
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {coupon.terms}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
