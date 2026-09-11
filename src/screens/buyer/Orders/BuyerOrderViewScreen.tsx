/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SidebarBuyer from "../../../components/SidebarBuyer";
import { useAppDispatch } from "../../../store/hooks";
import { fetchBuyerOrderById } from "../../../store/slices/orderSlice";

export interface OrderDetail {
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
  merchant?: {
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
    cls: "bg-amber-100 text-amber -700",
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

const BuyerOrderViewScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const result = await dispatch(fetchBuyerOrderById(Number(id)));
      if (!alive) return;
      if (fetchBuyerOrderById.fulfilled.match(result)) {
        setOrder(result.payload.order);
      } else {
        setError((result.payload as string) || "Failed to load order");
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [dispatch, id]);

  if (loading) {
    return (
      <SidebarBuyer>
        <div className="flex items-center justify-center h-64">
          <span className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-400">Loading order…</span>
        </div>
      </SidebarBuyer>
    );
  }

  if (error || !order) {
    return (
      <SidebarBuyer>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <p className="text-sm text-gray-400">{error || "Order not found."}</p>
          <button
            onClick={() => navigate("/buyer/orders")}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-[#243a5e] transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </SidebarBuyer>
    );
  }

  const meta = STATUS_META[order.status] ?? {
    label: order.status,
    cls: "bg-gray-100 text-gray-600",
  };
  const cur = order.currency;
  const img = order.product?.images?.[0];

  return (
    <SidebarBuyer>
      {/* Header: order id + status */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/buyer/orders")}
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
          Order date {dateFmt(order.createdAt)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column (2/3): Products + Payment ── */}
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

          {/* Payment Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-primary mb-4">
              Payment Details
            </h2>
            <div className="flex flex-col">
              <PayRow
                label="Cost Amount"
                value={money(order.costAmount, cur)}
              />
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
              {order.requestedPlan && (
                <p className="text-xs text-gray-400 mt-3">
                  Plan: {order.requestedPlan.planName} (
                  {order.requestedPlan.termValue} ×{" "}
                  {order.requestedPlan.termType})
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column (1/3): Merchant, Address, Contact ── */}
        <div className="flex flex-col gap-6">
          {/* Merchant */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-primary mb-4">Merchant</h2>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Company</p>
                <p className="text-sm font-semibold text-gray-800">
                  {order.merchant?.companyDetails?.companyName ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Contact Person</p>
                <p className="text-sm text-gray-700">
                  {order.merchant?.user?.name ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Telephone</p>
                <p className="text-sm text-gray-700">
                  {order.merchant?.companyDetails?.corporateTelephone ?? "—"}
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
    </SidebarBuyer>
  );
};

const PayRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-700">{value}</span>
  </div>
);

export default BuyerOrderViewScreen;
