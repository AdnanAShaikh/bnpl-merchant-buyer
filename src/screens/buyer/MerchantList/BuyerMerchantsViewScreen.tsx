/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import SidebarBuyer from "../../../components/SidebarBuyer";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchMarketplaceMerchantProducts,
  clearActiveMerchant,
  selectActiveMerchant,
  selectMerchantProducts,
  selectMerchantProductsLoading,
  selectMerchantProductsError,
} from "../../../store/slices/buyerSlice";
import type { Product } from "../../../store/slices/productSlice";

const NAVY = "#1a2a4a";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const money = (v: string | number | null | undefined, currency = "SAR") =>
  v == null
    ? "—"
    : `${currency} ${Number(v).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// company presence values where an online storefront exists
const hasOnlinePresence = (p?: string | null) => {
  const v = (p ?? "").toLowerCase();
  return v === "both" || v === "online";
};

// ─── Read-only field ──────────────────────────────────────────────────────────
const ReadField = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <div className="flex flex-col gap-1 w-full">
    <div className="border border-gray-100 rounded-xl px-4 pt-2.5 pb-2 bg-gray-50">
      <label className="text-xs text-gray-400 font-medium">{label}</label>
      <p className="text-sm text-gray-800 mt-0.5">
        {value === 0 ? "0" : value || "—"}
      </p>
    </div>
  </div>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div>
    <p className="text-xs font-bold text-[#1a2a4a] uppercase tracking-wide mb-2.5">
      {title}
    </p>
    {children}
  </div>
);

// ─── Tab 1: Details ───────────────────────────────────────────────────────────
const DetailsTab = ({ merchant }: { merchant: any }) => {
  const cd = merchant.companyDetails ?? {};
  const showUrl = hasOnlinePresence(cd.companyPresence) && cd.ecommerceUrl;

  return (
    <div className="flex flex-col gap-6">
      <Section title="Company">
        <div className="grid grid-cols-2 gap-3">
          <ReadField label="Company Name" value={cd.companyName} />
          <ReadField label="Company Type" value={cd.companyType} />
          <ReadField label="Email" value={merchant.user?.email} />
          <ReadField label="Telephone" value={cd.corporateTelephone} />
          <ReadField label="Presence" value={cd.companyPresence} />

          {/* Clickable storefront URL only when presence is online/both */}
          <div className="flex flex-col gap-1 w-full">
            <div className="border border-gray-100 rounded-xl px-4 pt-2.5 pb-2 bg-gray-50">
              <label className="text-xs text-gray-400 font-medium">
                Online Store
              </label>
              {showUrl ? (
                <a
                  href={
                    cd.ecommerceUrl.startsWith("http")
                      ? cd.ecommerceUrl
                      : `https://${cd.ecommerceUrl}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#1a2a4a] font-medium mt-0.5 block truncate hover:underline"
                >
                  {cd.ecommerceUrl}
                </a>
              ) : (
                <p className="text-sm text-gray-800 mt-0.5">—</p>
              )}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};

// ─── Product card ─────────────────────────────────────────────────────────────
const ProductCard = ({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden text-left hover:border-[#1a2a4a]/30 hover:shadow-md transition-all duration-200"
  >
    <div className="aspect-[4/3] bg-gray-50 overflow-hidden flex items-center justify-center">
      {product.images?.[0] ? (
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
        />
      ) : (
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
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      )}
    </div>
    <div className="p-4">
      <p className="text-sm font-bold text-[#1a2a4a] truncate">
        {product.name}
      </p>
      <p className="text-xs text-gray-400 mt-0.5 truncate">
        {product.category}
      </p>
      <p className="text-sm font-semibold text-[#1a2a4a] mt-2">
        {money(product.price, product.currency)}
      </p>
    </div>
  </button>
);

// ─── Tab 2: Products ──────────────────────────────────────────────────────────
const ProductsTab = ({
  products,
  onProductClick,
}: {
  products: Product[];
  onProductClick: (id: number) => void;
}) => {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-semibold text-[#1a2a4a] mb-1">
          No products yet
        </p>
        <p className="text-sm text-gray-400">
          This merchant hasn't listed any active products.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          onClick={() => onProductClick(p.id)}
        />
      ))}
    </div>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const BuyerMerchantsViewScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const merchant = useAppSelector(selectActiveMerchant);
  const products = useAppSelector(selectMerchantProducts);
  const loading = useAppSelector(selectMerchantProductsLoading);
  const error = useAppSelector(selectMerchantProductsError);

  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (id) dispatch(fetchMarketplaceMerchantProducts(Number(id)));
    return () => {
      dispatch(clearActiveMerchant());
    };
  }, [id, dispatch]);

  // ── Loading ──
  if (loading) {
    return (
      <SidebarBuyer>
        <div className="flex items-center justify-center h-64">
          <span className="w-6 h-6 border-2 border-gray-200 border-t-[#1a2a4a] rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-400">
            Loading merchant...
          </span>
        </div>
      </SidebarBuyer>
    );
  }

  // ── Error / not found ──
  if (error || !merchant) {
    return (
      <SidebarBuyer>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-sm font-semibold text-[#1a2a4a] mb-1">
            Couldn't load this merchant
          </p>
          <p className="text-sm text-gray-400 mb-4">
            {error || "Merchant not found or not available."}
          </p>
          <button
            onClick={() => navigate("/buyer/marketplace")}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#1a2a4a] text-white hover:bg-[#243a5e] transition-colors"
          >
            Back to Marketplace
          </button>
        </div>
      </SidebarBuyer>
    );
  }

  return (
    <SidebarBuyer>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div
          className="flex items-center gap-3 cursor-default text-gray-400 hover:text-[#1a2a4a] transition-colors"
          onClick={() => navigate("/buyer/merchants")}
        >
          <button>
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <p className="text-sm">Back To Merchants</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-100 px-2">
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            slotProps={{
              indicator: {
                style: { background: NAVY, height: 3, borderRadius: 2 },
              },
            }}
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontFamily: "inherit",
                fontSize: "14px",
                fontWeight: 500,
                color: "#6B7280",
                minHeight: 52,
                padding: "0 20px",
              },
              "& .Mui-selected": {
                color: `${NAVY} !important`,
                fontWeight: 600,
              },
            }}
          >
            <Tab label="Details" value={0} />
            <Tab label="Products" value={1} />
          </Tabs>
        </div>

        {/* Content */}
        <div className="p-7">
          {activeTab === 0 && <DetailsTab merchant={merchant} />}
          {activeTab === 1 && (
            <ProductsTab
              products={products}
              onProductClick={(pid) => navigate(`/buyer/product/${pid}`)}
            />
          )}
        </div>
      </div>
    </SidebarBuyer>
  );
};

export default BuyerMerchantsViewScreen;
