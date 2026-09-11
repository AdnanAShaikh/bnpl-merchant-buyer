/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import SidebarBuyer from "../../../components/SidebarBuyer";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchMarketplaceMerchants,
  selectMarketplaceMerchants,
  selectMarketplaceMerchantsLoading,
  selectMarketplaceMerchantsError,
  type MarketplaceMerchant,
} from "../../../store/slices/buyerSlice";

// ─── Merchant Card ────────────────────────────────────────────────────────────
const MerchantCard = ({
  merchant,
  onClick,
}: {
  merchant: MarketplaceMerchant & { companyImageUrl?: string | null };
  onClick: () => void;
}) => {
  const name = merchant.companyDetails?.companyName ?? "Unnamed Merchant";
  const contactName = merchant.user?.name ?? null;
  const productCount = merchant._count?.products ?? 0;

  return (
    <button
      onClick={onClick}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden text-left hover:border-primary/30 hover:shadow-md transition-all duration-200"
    >
      {/* Company image */}
      <div className="aspect-[4/3] bg-gray-50 overflow-hidden flex items-center justify-center">
        {merchant.companyImageUrl ? (
          <img
            src={merchant.companyImageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
          />
        ) : (
          // placeholder until companyImageUrl lands
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <svg
              className="w-10 h-10 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Title + meta */}
      {/* Title + meta */}
      <div className="p-4">
        <p className="text-sm font-bold text-primary truncate">{name}</p>
        {contactName && (
          <p className="text-xs text-gray-400 truncate">{contactName}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {productCount} {productCount === 1 ? "product" : "products"}
        </p>
      </div>
    </button>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
const BuyerMerchantsListingScreen = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const merchants = useAppSelector(selectMarketplaceMerchants);
  const loading = useAppSelector(selectMarketplaceMerchantsLoading);
  const error = useAppSelector(selectMarketplaceMerchantsError);

  const [query, setQuery] = useState("");

  useEffect(() => {
    dispatch(fetchMarketplaceMerchants());
  }, [dispatch]);

  // ── Front-end search on company name ──
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return merchants;
    return merchants.filter((m: MarketplaceMerchant) =>
      (m.companyDetails?.companyName ?? "").toLowerCase().includes(q),
    );
  }, [query, merchants]);

  return (
    <SidebarBuyer>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold text-primary">Merchants</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Browse merchants and explore their catalogues
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs">
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search merchants…"
            className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 flex items-center justify-center">
          <span className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-400">Loading merchants…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-sm font-semibold text-primary mb-1">
            Couldn't load merchants
          </p>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => dispatch(fetchMarketplaceMerchants())}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-[#243a5e] transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-sm font-semibold text-primary mb-1">
            {query
              ? "No merchants match your search"
              : "No merchants available yet"}
          </p>
          <p className="text-sm text-gray-400">
            {query
              ? "Try a different name."
              : "Check back soon as merchants join the marketplace."}
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((merchant: MarketplaceMerchant) => (
            <MerchantCard
              key={merchant.id}
              merchant={merchant}
              onClick={() => navigate(`/buyer/merchant/${merchant.id}`)}
            />
          ))}
        </div>
      )}
    </SidebarBuyer>
  );
};

export default BuyerMerchantsListingScreen;
