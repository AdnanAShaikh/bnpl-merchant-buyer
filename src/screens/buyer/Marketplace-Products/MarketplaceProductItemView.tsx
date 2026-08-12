// ─── MarketplaceItemView.tsx ──────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SidebarBuyer from "../../../components/SidebarBuyer";
import RequestFinancingModal from "../../../components/RequestFinancingModal";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchProductById,
  clearCurrentProduct,
  selectCurrentProduct,
  selectSingleLoading,
  selectSingleError,
} from "../../../store/slices/productSlice";
import {
  placeOrder,
  selectActionLoading as selectOrderActionLoading,
} from "../../../store/slices/orderSlice";
import { toast } from "react-toastify";
import { fetchMyBuyerProfile, selectBuyerProfile } from "../../../store/slices/authSlice";

// ─── Image Carousel ───────────────────────────────────────────────────────────
const ImageCarousel = ({ images }: { images: string[] }) => {
  const slides = images.length > 0 ? images : ["", "", "", ""];
  const [active, setActive] = useState(0);

  const go = (dir: -1 | 1) =>
    setActive((prev) => (prev + dir + slides.length) % slides.length);

  return (
    <div className="flex flex-col gap-3 sticky top-6">
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden border border-gray-200 flex items-center justify-center">
        {slides[active] ? (
          <img src={slides[active]} alt="Product" className="w-full h-full object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-gray-200 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}

        {slides.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-white transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-white transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-lg">
          {active + 1} / {slides.length}
        </div>
      </div>

      <div className="flex gap-2">
        {slides.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-150 flex-shrink-0
              ${i === active ? "border-primary shadow-sm" : "border-gray-200 hover:border-gray-300 opacity-60 hover:opacity-100"}`}
          >
            {src ? (
              <img src={src} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-150 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
const ItemViewSkeleton = () => (
  <div className="flex gap-8 animate-pulse">
    <div className="w-1/2 flex-shrink-0">
      <div className="aspect-square bg-gray-100 rounded-2xl" />
      <div className="flex gap-2 mt-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-16 h-16 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
    <div className="flex-1 space-y-4">
      <div className="h-5 w-32 bg-gray-100 rounded-lg" />
      <div className="h-8 w-3/4 bg-gray-100 rounded-lg" />
      <div className="h-10 w-40 bg-gray-100 rounded-lg" />
      <div className="h-12 w-full bg-gray-100 rounded-xl" />
      <div className="h-24 w-full bg-gray-100 rounded-xl" />
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const MarketplaceProductItemView = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const buyerProfile = useAppSelector(selectBuyerProfile);

  const item    = useAppSelector(selectCurrentProduct);
  const loading = useAppSelector(selectSingleLoading);
  const error   = useAppSelector(selectSingleError);

  const placing = useAppSelector(selectOrderActionLoading);

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchProductById(Number(id)));
    return () => { dispatch(clearCurrentProduct()); };
  }, [id, dispatch]);

  useEffect(() => {
    if (!buyerProfile) dispatch(fetchMyBuyerProfile());
  }, [buyerProfile, dispatch]);

  const formatPrice = (p: number) =>
    p.toLocaleString("en-SA", { minimumFractionDigits: 0 });

  const merchantName = item?.merchant?.companyDetails?.companyName ?? "—";

  const handleConfirm = async (payload: {
    quantity: number; requestedPlanId: number;
    contactName: string; contactEmail: string; contactPhone: string; deliveryAddress: string;
  }) => {
    if (!item) return;
    const resultAction = await dispatch(placeOrder({ productId: item.id, ...payload }));

    if (placeOrder.fulfilled.match(resultAction)) {
      setModalOpen(false);
      toast.success("Financing request submitted");
      navigate("/buyer/orders");
    } else {
      toast.error((resultAction.payload as string) || "Could not submit request");
    }
  };

  const buyerDetails = {
    name:      buyerProfile?.user?.name,
    email:     buyerProfile?.user?.email,
    address:   buyerProfile?.powerOfAttorney?.homeAddress,
    phone:     buyerProfile?.powerOfAttorney?.mobileNumber,
    telephone: buyerProfile?.companyDetails?.corporateTelephone,
  };

    const merchantDetails = {
      name:    item?.merchant?.companyDetails?.companyName,
      email:   item?.merchant?.user?.email,
      phone:   item?.merchant?.companyDetails?.corporateTelephone,
      address: item?.merchant?.powerOfAttorney?.homeAddress,
    };

    const plans = buyerProfile?.eligiblePlans ?? [];
  
  
  return (
    <SidebarBuyer>
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors mb-5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Marketplace
      </button>

      {loading && <ItemViewSkeleton />}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-primary mb-1">Couldn't load this product</p>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => id && dispatch(fetchProductById(Number(id)))}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-[#243a5e] transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && !item && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-semibold text-primary mb-1">Product not found</p>
          <p className="text-sm text-gray-400">This item may have been removed.</p>
        </div>
      )}

      {!loading && !error && item && (
        <div className="flex gap-8">
          <div className="w-1/2 flex-shrink-0">
            <ImageCarousel images={item.images ?? []} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-gray-100 text-gray-600 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                {item.category}
              </span>
              {item.inStock ? (
                <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                  In Stock
                </span>
              ) : (
                <span className="bg-red-50 text-red-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                  Out of Stock
                </span>
              )}
            </div>

            <p className="text-sm text-gray-400 font-medium mb-1">{merchantName}</p>

            <h1 className="text-2xl font-bold text-primary leading-tight mb-4">
              {item.name}
            </h1>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-primary">
                {formatPrice(Number(item.price))}
              </span>
              <span className="text-sm text-gray-400 font-medium">{item.currency}</span>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Min. order: {item.minOrder} {item.unit}
            </p>

            <button
              disabled={!item.inStock || placing || !buyerProfile}
              onClick={() => setModalOpen(true)}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98]
                disabled:opacity-40 disabled:cursor-not-allowed
                bg-primary text-white hover:bg-[#243a5e] shadow-sm mb-6"
            >
              {item.inStock ? "Request Financing" : "Currently Unavailable"}
            </button>

            <div className="border-t border-gray-100 mb-5" />

            {item.description && (
              <div className="mb-6">
                <h2 className="text-sm font-bold text-primary mb-2">Description</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}


    {modalOpen && (
        <RequestFinancingModal
          key={item?.id ?? "financing-modal"}   // fresh instance every open
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirm={handleConfirm}
          loading={placing}
          itemName={item?.name}
          unit={item?.unit ?? "unit"}
          unitPrice={Number(item?.price ?? 0)}
          currency={item?.currency ?? "SAR"}
          minOrder={item?.minOrder ?? 1}
          buyer={buyerDetails}
          merchant={merchantDetails}
          plans={plans}
        />
      )}

    </SidebarBuyer>
  );
};

export default MarketplaceProductItemView;