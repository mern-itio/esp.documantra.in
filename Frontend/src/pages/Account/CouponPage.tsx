import { useState, useMemo } from "react";
import { ArrowLeft, Search, Ticket } from "lucide-react";
import { coupons, type Coupon, type CouponStatus } from "../../data/coupons";
import CouponCard from "./coupon/CouponCard";
import CouponModal from "./coupon/CouponModal";
import { Link } from "react-router-dom";

const tabs: { label: string; value: CouponStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Claimed", value: "claimed" },
  { label: "Expired", value: "expired" },
];

export default function CouponPage() {
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [activeTab, setActiveTab] = useState<CouponStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      const matchesTab = activeTab === "all" || c.status === activeTab;
      const matchesSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.category.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, search]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container  mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Link to="/account/rewards"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold leading-tight">Coupons</h1>
              <p className="text-xs text-muted-foreground">Your available discount codes & vouchers</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search coupons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all"
            />
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((coupon, i) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                onClick={() => setSelectedCoupon(coupon)}
                index={i}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Ticket className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-0.5">No coupons found</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              {search ? "Try adjusting your search terms" : "Check back later for new coupons"}
            </p>
          </div>
        )}
      </div>

      {selectedCoupon && (
        <CouponModal coupon={selectedCoupon} onClose={() => setSelectedCoupon(null)} />
      )}
    </div>
  );
}
