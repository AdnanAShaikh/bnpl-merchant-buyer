/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SidebarMerchant from "../../../components/SidebarMerchant";
import { useAppDispatch } from "../../../store/hooks";
import {
  fetchMerchantOrderById,
  confirmOrder,
  declineOrder,
} from "../../../store/slices/orderSlice";
import { toast } from "react-toastify";

export interface MerchantOrderDetail {
  id: number;
  orderRef: string;
  quantity: number;
  unitPrice: string;
  costAmount: string;
  profitRate: string;
  profitAmount: string;
  totalAmount: string;
  downPayment: string;
  numberOfInstallments: number;
  installmentAmount: string;
  installmentFrequency: string;
  currency: string;
  status: string;
  merchantConfirmed: boolean;
  merchantDeclined: boolean;
  declineReason?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  deliveryAddress?: string | null;
  createdAt: string;
  product?: {
    id: number;
    name: string;
    category: string;
    sku?: string | null;
    unit: string;
    images: string[];
    currency: string;
  };
  buyer?: {
    id: number;
    companyDetails?: { companyName: string; corporateTelephone?: string };
    user?: { name?: string; email?: string };
  };
  requestedPlan?: {
    id: number;
    planName: string;
    termType: string;
    termValue: number;
  };
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING_REVIEW: {
    label: "Pending Review",
    cls: "bg-amber-100 text-amber-700",
  },
  UNDER_REVIEW: { label: "Under Review", cls: "bg-blue-100 text-blue-700" },
  APPROVED: { label: "Approved", cls: "bg-teal-100 text-teal-700" },
  ACTIVE: { label: "Active", cls: "bg-emerald-100 text-emerald-700" },
  COMPLETED: { label: "Completed", cls: "bg-primary/10 text-primary" },
  REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-gray-100 text-gray-600" },
  DEFAULTED: { label: "Defaulted", cls: "bg-red-100 text-red-800" },
};

const money = (v: string | number, cur = "SAR") =>
  `${cur} ${Number(v).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const PayRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-700">{value}</span>
  </div>
);

const MerchantOrderViewScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [order, setOrder] = useState<MerchantOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // respond dialog
  const [respondMode, setRespondMode] = useState<"confirm" | "decline" | null>(
    null,
  );
  const [declineReason, setDeclineReason] = useState("");
  const [responding, setResponding] = useState(false);

  const load = async () => {
    setLoading(true);
    const result = await dispatch(fetchMerchantOrderById(Number(id)));
    if (fetchMerchantOrderById.fulfilled.match(result)) {
      setOrder(result.payload.order);
    } else {
      setError((result.payload as string) || "Failed to load order");
    }
    setLoading(false);
  };

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [dispatch, id]);

  const canRespond =
    order &&
    order.status === "APPROVED" &&
    !order.merchantConfirmed &&
    !order.merchantDeclined;

  const handleRespond = async () => {
    if (!order || !respondMode) return;
    if (respondMode === "decline" && !declineReason.trim()) {
      toast.error("Please provide a reason for declining.");
      return;
    }
    setResponding(true);
    const result =
      respondMode === "confirm"
        ? await dispatch(confirmOrder({ id: order.id }))
        : await dispatch(declineOrder({ id: order.id, declineReason }));
    setResponding(false);

    const thunk = respondMode === "confirm" ? confirmOrder : declineOrder;
    if (thunk.fulfilled.match(result)) {
      toast.success(
        respondMode === "confirm" ? "Order confirmed" : "Order declined",
      );
      setRespondMode(null);
      setDeclineReason("");
      load(); // refresh this order
    } else {
      toast.error((result.payload as string) || "Could not submit response");
    }
  };

  if (loading) {
    return (
      <SidebarMerchant>
        <div className="flex items-center justify-center h-64">
          <span className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-400">Loading order…</span>
        </div>
      </SidebarMerchant>
    );
  }

  if (error || !order) {
    return (
      <SidebarMerchant>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <p className="text-sm text-gray-400">{error || "Order not found."}</p>
          <button
            onClick={() => navigate("/merchant/orders")}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-[#243a5e] transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </SidebarMerchant>
    );
  }

  const meta = STATUS_META[order.status] ?? {
    label: order.status,
    cls: "bg-gray-100 text-gray-600",
  };
  const cur = order.currency;
  const img = order.product?.images?.[0];

  return (
    <SidebarMerchant>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/merchant/orders")}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary transition-colors"
        >
          <svg
            className="w-4 h-4"
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
        <h1 className="text-2xl font-bold text-primary">Order-{order.id}</h1>
        <span
          className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${meta.cls}`}
        >
          {meta.label}
        </span>
        <span className="text-sm text-gray-400 ml-auto">
          Received {dateFmt(order.createdAt)}
        </span>
      </div>

      {/* Action banner when a response is needed */}
      {canRespond && (
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-teal-800">
            Rufaad has approved this order. Confirm you can fulfil it, or
            decline.
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setRespondMode("decline");
                setDeclineReason("");
              }}
              className="px-4 py-2 rounded-xl border-2 border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-all"
            >
              Decline
            </button>
            <button
              onClick={() => setRespondMode("confirm")}
              className="px-4 py-2 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition-all"
            >
              Confirm Fulfillment
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Products + Payment */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Products */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-primary">Products</h2>
              <span className="text-xs text-gray-400">
                Ref {order.orderRef}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {img ? (
                  <img
                    src={img}
                    alt={order.product?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-8 h-8 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16v12H4z"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">
                  {order.product?.name ?? "—"}
                </p>
                {order.product?.sku && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    SKU: {order.product.sku}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {order.product?.category} · Quantity {order.quantity}
                </p>
              </div>
              <p className="text-sm font-bold text-primary">
                {money(order.unitPrice, cur)}
              </p>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-primary mb-4">
              Payment Details
            </h2>
            <PayRow label="Cost Amount" value={money(order.costAmount, cur)} />
            <PayRow
              label="Profit Rate"
              value={`${(Number(order.profitRate) * 100).toFixed(2)}%`}
            />
            <PayRow
              label="Profit Amount"
              value={money(order.profitAmount, cur)}
            />
            <PayRow
              label="Down Payment"
              value={money(order.downPayment, cur)}
            />
            <PayRow
              label="Installments"
              value={`${order.numberOfInstallments} × ${money(order.installmentAmount, cur)} / ${order.installmentFrequency}`}
            />
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100">
              <span className="text-sm font-bold text-primary">
                Total Amount
              </span>
              <span className="text-lg font-bold text-primary">
                {money(order.totalAmount, cur)}
              </span>
            </div>
          </div>

          {/* Decline reason, if declined */}
          {order.merchantDeclined && order.declineReason && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-red-700 mb-1">
                Your Decline Reason
              </h2>
              <p className="text-sm text-red-600">{order.declineReason}</p>
            </div>
          )}
        </div>

        {/* Right: Buyer, Delivery, Contact */}
        <div className="flex flex-col gap-6">
          {/* Buyer */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-primary mb-4">Buyer</h2>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Company</p>
                <p className="text-sm font-semibold text-gray-800">
                  {order.buyer?.companyDetails?.companyName ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Contact Person</p>
                <p className="text-sm text-gray-700">
                  {order.buyer?.user?.name ?? "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-primary mb-4">
              Delivery Address
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Recipient</p>
                <p className="text-sm text-gray-700">
                  {order.contactName ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Address</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {order.deliveryAddress || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-primary mb-4">
              Contact Information
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Email</p>
                {order.contactEmail ? (
                  <span className="text-sm text-primary bg-primary/5 rounded-lg px-3 py-1.5 w-fit inline-block">
                    {order.contactEmail}
                  </span>
                ) : (
                  <p className="text-sm text-gray-400">—</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                {order.contactPhone ? (
                  <span className="text-sm text-primary bg-primary/5 rounded-lg px-3 py-1.5 w-fit inline-block">
                    {order.contactPhone}
                  </span>
                ) : (
                  <p className="text-sm text-gray-400">—</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm / Decline dialog */}
      {respondMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !responding && setRespondMode(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${respondMode === "confirm" ? "bg-green-50" : "bg-red-50"}`}
              >
                {respondMode === "confirm" ? (
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              <h3 className="text-base font-bold text-primary mb-1">
                {respondMode === "confirm"
                  ? "Confirm fulfillment?"
                  : "Decline this order?"}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">
                Order{" "}
                <span className="font-semibold text-primary">#{order.id}</span>
                {respondMode === "confirm"
                  ? " — you're confirming you can supply these goods. This can't be undone."
                  : " — this tells Rufaad you can't supply these goods. This can't be undone."}
              </p>
              {respondMode === "decline" && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 font-medium">
                    Reason for declining <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. Item out of stock, cannot meet quantity…"
                    className="w-full text-sm text-gray-800 border-2 border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setRespondMode(null)}
                disabled={responding}
                className="px-5 py-2 border-2 border-gray-300 text-gray-600 font-semibold text-sm rounded-xl hover:border-primary hover:text-primary transition-all disabled:opacity-40"
              >
                Back
              </button>
              <button
                onClick={handleRespond}
                disabled={responding}
                className={`px-6 py-2 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-60 flex items-center gap-2 ${respondMode === "confirm" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
              >
                {responding ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : respondMode === "confirm" ? (
                  "Confirm"
                ) : (
                  "Decline"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarMerchant>
  );
};

export default MerchantOrderViewScreen;
