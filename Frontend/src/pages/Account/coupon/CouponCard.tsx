import { Clock, Tag, ChevronRight, Scissors } from "lucide-react";
import type { Coupon } from "../../../data/coupons";

interface CouponCardProps {
  coupon: Coupon;
  onClick: () => void;
  index: number;
}

const statusStyles = {
  active: "bg-[#2FA36B]/10 text-success",
  claimed: "bg-[#6B7280]/10 text-muted-foreground",
  expired: "bg-[#E5484D]/10 text-destructive",
};

export default function CouponCard({ coupon, onClick, index }: CouponCardProps) {
  const isInteractive = coupon.status === "active";

  return (
    <button
      onClick={isInteractive ? onClick : undefined}
      disabled={!isInteractive}
      className={`group relative w-full text-left border border-gray-200 rounded-xl bg-card transition-all duration-300 animate-fade-in overflow-hidden ${
        isInteractive
          ? "hover:-translate-y-0.5 hover:shadow-md hover:border-border cursor-pointer"
          : "opacity-55 cursor-default"
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Top section */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyles[coupon.status]}`}>
              {coupon.status.charAt(0).toUpperCase() + coupon.status.slice(1)}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
              <Tag className="w-3 h-3" />
              {coupon.category}
            </span>
          </div>
          <span className="text-[11px] text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(coupon.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-card-foreground mb-0.5">
          {coupon.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2">
          {coupon.description}
        </p>
      </div>

      {/* Perforation divider */}
      <div className="relative flex items-center mx-0">
        <div className="absolute -left-2.5 w-5 h-5 rounded-full bg-white" />
        <div className="flex-1 border-t border-dashed border-gray-200 mx-4" />
        <div className="absolute -right-2.5 w-5 h-5 rounded-full bg-white" />
      </div>

      {/* Bottom section — value strip */}
      <div className="p-4 pt-3 flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-foreground tracking-tight leading-none mb-0.5">
            {coupon.rewardValue}
          </p>
          {isInteractive && (
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <Scissors className="w-3 h-3" />
              Scratch to reveal code
            </span>
          )}
          {coupon.status === "claimed" && (
            <span className="text-[11px] text-muted-foreground">Already redeemed</span>
          )}
          {coupon.status === "expired" && (
            <span className="text-[11px] text-muted-foreground">No longer valid</span>
          )}
        </div>
        {isInteractive && (
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#F1F3F5] flex items-center justify-center transition-colors group-hover:bg-accent/10">
            <ChevronRight className="w-3.5 h-3.5 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
        )}
      </div>
    </button>
  );
}
