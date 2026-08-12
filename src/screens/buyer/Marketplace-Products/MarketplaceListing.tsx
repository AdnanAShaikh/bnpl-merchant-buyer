// ─── MarketplaceBuyer.tsx ─────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import SidebarBuyer from "../../../components/SidebarBuyer";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchAllProducts,
  selectProducts,
  selectProductsLoading,
  selectProductsError,
  type Product,
} from "../../../store/slices/productSlice";

// ─── Dummy Data ───────────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Raw Materials", "Equipment", "Office Supplies", "Electronics", "Vehicles"];

// ─── Category Pill ────────────────────────────────────────────────────────────
const CategoryPill = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap
      ${active
        ? "bg-primary text-white shadow-md"
        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
  >
    {label}
  </button>
);

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ item }: { item: Product }) => {
  const navigate = useNavigate();
  const formatPrice = (p: number) =>
    p.toLocaleString("en-SA", { minimumFractionDigits: 0 });

  const merchantName = item.merchant?.companyDetails?.companyName ?? "—";

  return (
    <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200 flex flex-col">
      <div
        onClick={() => navigate(`/buyer/product/${item.id}`)}
        className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden cursor-pointer"
      >
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}

        {!item.inStock && (
          <div className="absolute top-3 left-3 bg-red-100 text-red-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
            Out of Stock
          </div>
        )}

        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-600 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-gray-100">
          {item.category}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-gray-400 font-medium mb-1">{merchantName}</p>
        <h3 className="text-sm font-bold text-primary leading-snug mb-3 line-clamp-2">
          {item.name}
        </h3>

        <div className="mt-auto">
          <p className="text-xs text-gray-400 mb-1">
            Min. order: {item.minOrder} {item.unit}
          </p>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-lg font-bold text-primary">
                {formatPrice(item.price)}
              </span>
              <span className="text-xs text-gray-400 ml-1">{item.currency}</span>
            </div>
          </div>
        </div>

        <button
          disabled={!item.inStock}
          className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed
            bg-primary text-white hover:bg-[#243a5e] shadow-sm"
        >
          {item.inStock ? "Request Financing" : "Unavailable"}
        </button>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const MarketplaceListing = () => {
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("All");
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectProducts);
  const loading  = useAppSelector(selectProductsLoading);
  const error    = useAppSelector(selectProductsError);


  useEffect(() => {
    dispatch(fetchAllProducts());
  }, [dispatch]);

  const filtered = products.filter((item) => {
    const merchantName = item.merchant?.companyDetails?.companyName ?? "";
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      merchantName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || item.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <SidebarBuyer>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-primary">Marketplace</h1>
        <p className="text-sm text-gray-400 mt-1">
          Browse verified merchants and request Murabaha financing
        </p>
      </div>

      {/* Search + count */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="text"
            placeholder="Search items or merchants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-primary transition-colors"
          />
        </div>
        <p className="text-sm text-gray-400 whitespace-nowrap">
          <span className="font-semibold text-primary">{filtered.length}</span> items
        </p>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <CategoryPill
            key={cat}
            label={cat}
            active={category === cat}
            onClick={() => setCategory(cat)}
          />
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-semibold text-red-600 mb-1">Failed to load products</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-4 gap-5">
          {filtered.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* 4×4 Grid */}
      {!loading && !error && filtered.length === 0 && (
        <div className="grid grid-cols-4 gap-5">
          {filtered.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}


      {/* Empty state */}
      {!error && !loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-primary mb-1">No items found</p>
          <p className="text-sm text-gray-400">Try adjusting your search or category filter</p>
        </div>
      )}

    </SidebarBuyer>
  );
};

export default MarketplaceListing;