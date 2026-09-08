/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import SidebarMerchant from "../../components/SidebarMerchant";
import DataTable from "../../components/DataTable";
import type { ColumnDef, RowAction } from "../../components/DataTable";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "react-toastify";
import {
  fetchMyOrders,
  confirmOrder,
  declineOrder,
  selectMyOrders,
  selectMyOrdersLoading,
  selectMyOrdersError,
} from "../../store/slices/orderSlice";

const NAVY = "#1a2a4a";

// ─── Types (mirrors backend Order + orderInclude) ─────────────────────────────
interface Order {
  id: number;
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
  createdAt: string;
  product?: { id: number; name: string; category: string; currency: string };
  buyer?: { companyDetails?: { companyName: string } };
  requestedPlan?: {
    id: number;
    planName: string;
    termType: string;
    termValue: number;
  };
}

// ─── Status display + meaning ─────────────────────────────────────────────────
const STATUS_META: Record<
  string,
  { label: string; cls: string; dot: string; desc: string }
> = {
  PENDING_REVIEW: {
    label: "Pending Review",
    cls: "bg-amber-400 text-gray-800",
    dot: "bg-amber-400",
    desc: "The buyer has requested financing. Tabashir is beginning its review.",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    cls: "bg-blue-500",
    dot: "bg-blue-500",
    desc: "Tabashir is assessing the request and finalising terms with the buyer.",
  },
  APPROVED: {
    label: "Approved",
    cls: "bg-teal-600",
    dot: "bg-teal-600",
    desc: "Tabashir has approved the order. Please confirm you can fulfil it.",
  },
  ACTIVE: {
    label: "Active",
    cls: "bg-emerald-600",
    dot: "bg-emerald-600",
    desc: "The order is active — goods should be dispatched to the buyer.",
  },
  COMPLETED: {
    label: "Completed",
    cls: "bg-primary",
    dot: "bg-primary",
    desc: "The order has been fully settled and closed.",
  },
  REJECTED: {
    label: "Rejected",
    cls: "bg-red-500",
    dot: "bg-red-500",
    desc: "Tabashir did not approve this financing request.",
  },
  CANCELLED: {
    label: "Cancelled",
    cls: "bg-gray-500",
    dot: "bg-gray-500",
    desc: "The request was cancelled before it became active.",
  },
  DEFAULTED: {
    label: "Defaulted",
    cls: "bg-red-700",
    dot: "bg-red-700",
    desc: "The buyer has defaulted on their installments.",
  },
};

const STATUS_FLOW = [
  "PENDING_REVIEW",
  "UNDER_REVIEW",
  "APPROVED",
  "ACTIVE",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
  "DEFAULTED",
];

// Merchant may respond (confirm/decline) only once, and only when Tabashir has approved.
const RESPONDABLE_STATUSES = ["APPROVED"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const money = (v: string | number, currency = "SAR") =>
  `${currency} ${Number(v).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

// Fulfillment response label from flags
const responseOf = (o: Order): { label: string; cls: string } => {
  if (o.merchantConfirmed) return { label: "Confirmed", cls: "bg-green-500" };
  if (o.merchantDeclined) return { label: "Declined", cls: "bg-red-500" };
  return { label: "Awaiting", cls: "bg-gray-300 text-gray-600" };
};

// ─── Status Info Modal ────────────────────────────────────────────────────────
const StatusInfoModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      style={{ animation: "fadeIn .15s ease-out" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        style={{ animation: "popIn .18s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-primary">
              Order Statuses Explained
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              What each stage means for you
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-4">
            {STATUS_FLOW.map((key) => {
              const meta = STATUS_META[key];
              return (
                <div key={key} className="flex gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${meta.dot} flex-shrink-0 mt-1`}
                  />
                  <div>
                    <p className="text-sm font-bold text-primary">
                      {meta.label}
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {meta.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary hover:bg-[#243a5e] text-white font-semibold text-sm rounded-xl transition-all"
          >
            Got it
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
const MerchantOrdersListingScreen = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const orders = useAppSelector(selectMyOrders);
  const loading = useAppSelector(selectMyOrdersLoading);
  const error = useAppSelector(selectMyOrdersError);

  const [infoOpen, setInfoOpen] = useState(false);

  // confirm/decline dialog state
  const [respondTarget, setRespondTarget] = useState<Order | null>(null);
  const [respondMode, setRespondMode] = useState<"confirm" | "decline">(
    "confirm",
  );
  const [declineReason, setDeclineReason] = useState("");
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  // ── Summary stats ──
  const stats = useMemo(() => {
    const active = orders.filter((o: Order) => o.status === "ACTIVE");
    const awaiting = orders.filter(
      (o: Order) =>
        o.status === "APPROVED" && !o.merchantConfirmed && !o.merchantDeclined,
    );
    const completed = orders.filter((o: Order) => o.status === "COMPLETED");
    const activeTotal = active.reduce(
      (s: number, o: Order) => s + Number(o.totalAmount),
      0,
    );
    return {
      activeTotal,
      activeCount: active.length,
      awaitingCount: awaiting.length,
      completedCount: completed.length,
    };
  }, [orders]);

  // ── Donut: orders grouped by status ──
  const donutData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o: Order) => {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    });
    const fillOf: Record<string, string> = {
      PENDING_REVIEW: "#f59e0b",
      UNDER_REVIEW: "#3b82f6",
      APPROVED: "#0d9488",
      ACTIVE: "#059669",
      COMPLETED: "#1a3a6a",
      REJECTED: "#ef4444",
      CANCELLED: "#6b7280",
      DEFAULTED: "#b91c1c",
    };
    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_META[status]?.label ?? status,
      value,
      fill: fillOf[status] ?? "#E5E7EB",
    }));
  }, [orders]);

  const totalOrders = orders.length;

  // ── Response handlers ──
  const openRespond = (order: Order, mode: "confirm" | "decline") => {
    setRespondTarget(order);
    setRespondMode(mode);
    setDeclineReason("");
  };

  const handleRespond = async () => {
    if (!respondTarget) return;

    if (respondMode === "decline" && !declineReason.trim()) {
      toast.error("Please provide a reason for declining.");
      return;
    }

    setResponding(true);
    const result =
      respondMode === "confirm"
        ? await dispatch(confirmOrder({ id: respondTarget.id }))
        : await dispatch(declineOrder({ id: respondTarget.id, declineReason }));
    setResponding(false);

    const thunk = respondMode === "confirm" ? confirmOrder : declineOrder;
    if (thunk.fulfilled.match(result)) {
      toast.success(
        respondMode === "confirm" ? "Order confirmed" : "Order declined",
      );
      setRespondTarget(null);
      dispatch(fetchMyOrders());
    } else {
      toast.error((result.payload as string) || "Could not submit response");
    }
  };

  // ── Columns ──
  const COLUMNS: ColumnDef<Order>[] = [
    {
      key: "id",
      label: "Order #",
      render: (v) => (
        <span className="font-semibold text-primary">#{String(v)}</span>
      ),
    },
    {
      key: "product",
      label: "Product",
      render: (_v, row) => row.product?.name ?? "—",
    },
    {
      key: "buyer",
      label: "Buyer",
      render: (_v, row) => row.buyer?.companyDetails?.companyName ?? "—",
    },
    { key: "quantity", label: "Qty" },
    {
      key: "totalAmount",
      label: "Order Value",
      render: (v, row) => money(v as string, row.currency),
    },
    {
      key: "status",
      label: "Rufaad Response",
      render: (value) => {
        const meta = STATUS_META[String(value)] ?? {
          label: String(value),
          cls: "bg-gray-400",
        };
        return (
          <span
            className={`inline-block text-xs font-bold px-3 py-1 rounded-md text-white ${meta.cls}`}
          >
            {meta.label}
          </span>
        );
      },
    },
    {
      key: "merchantConfirmed",
      label: "Your Response",
      render: (_v, row) => {
        const r = responseOf(row);
        return (
          <span
            className={`inline-block text-xs font-bold px-3 py-1 rounded-md text-white ${r.cls}`}
          >
            {r.label}
          </span>
        );
      },
    },
    { key: "createdAt", label: "Received", render: (v) => dateFmt(String(v)) },
  ];

  // ── Row actions ──
  const eyeIcon = (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
  const checkIcon = (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
  const xIcon = (
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );

  // Merchant can respond only when APPROVED and hasn't responded yet
  const canRespond = (o: Order) =>
    RESPONDABLE_STATUSES.includes(o.status) &&
    !o.merchantConfirmed &&
    !o.merchantDeclined;

  const ROW_ACTIONS: RowAction<Order>[] = [
    {
      label: "View Order",
      icon: eyeIcon,
      onClick: (order) => navigate(`/merchant/orders/${order.id}`),
    },
    {
      label: "Confirm Fulfillment",
      icon: checkIcon,
      onClick: (order) => openRespond(order, "confirm"),
      hidden: (order: Order) => !canRespond(order),
    },
    {
      label: "Decline Order",
      icon: xIcon,
      onClick: (order) => openRespond(order, "decline"),
      hidden: (order: Order) => !canRespond(order),
    },
  ];

  return (
    <SidebarMerchant>
      {/* Header with info button */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-primary">Orders</h1>
        <button
          onClick={() => setInfoOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary border border-gray-200 rounded-xl px-3.5 py-2 hover:border-primary transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Status Guide
        </button>
      </div>

      {/* Summary + donut */}
      <div className="flex gap-5 mb-6">
        <div className="grid grid-cols-2 gap-4 flex-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-1">Active Orders Value</p>
            <p className="text-lg font-bold text-primary">
              SAR{" "}
              {stats.activeTotal.toLocaleString("en-SA", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-1">Active Orders</p>
            <p className="text-2xl font-bold text-primary">
              {stats.activeCount}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-1">Awaiting Your Response</p>
            <p className="text-2xl font-bold text-primary">
              {stats.awaitingCount}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-1">Completed</p>
            <p className="text-2xl font-bold text-primary">
              {stats.completedCount}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 w-[380px] flex-shrink-0">
          <p className="text-sm font-semibold text-gray-600 mb-4">
            Orders by Status
          </p>
          {totalOrders === 0 ? (
            <div className="h-[160px] flex items-center justify-center">
              <p className="text-sm text-gray-400">No orders yet.</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-[160px] h-[160px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      strokeWidth={0}
                      labelLine={false}
                      label={({ cx, cy }: any) => (
                        <>
                          <text
                            x={cx}
                            y={cy - 6}
                            textAnchor="middle"
                            style={{
                              fontSize: 22,
                              fontWeight: 700,
                              fill: NAVY,
                            }}
                          >
                            {totalOrders}
                          </text>
                          <text
                            x={cx}
                            y={cy + 13}
                            textAnchor="middle"
                            style={{ fontSize: 11, fill: "#9CA3AF" }}
                          >
                            Orders
                          </text>
                        </>
                      )}
                    >
                      {donutData.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: any, n: any) => [
                        `${v} order${v === 1 ? "" : "s"}`,
                        n,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ background: d.fill }}
                    />
                    <span className="text-xs text-gray-500 flex-1">
                      {d.name}
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 flex items-center justify-center">
          <span className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-400">Loading orders…</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-sm font-semibold text-primary mb-1">
            Couldn't load orders
          </p>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => dispatch(fetchMyOrders())}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-[#243a5e] transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <DataTable<Order>
          title="All Orders"
          columns={COLUMNS}
          dataSource={orders}
          rowActions={ROW_ACTIONS}
          searchable
          searchKeys={["id", "status"]}
          showStatusFilter
          statusOptions={[
            "PENDING_REVIEW",
            "UNDER_REVIEW",
            "APPROVED",
            "ACTIVE",
            "COMPLETED",
            "REJECTED",
            "CANCELLED",
            "All Status",
          ]}
          defaultStatus="All Status"
          defaultPageSize={10}
        />
      )}

      <StatusInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />

      {/* Confirm / Decline dialog */}
      {respondTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          style={{ animation: "fadeIn .15s ease-out" }}
          onClick={() => !responding && setRespondTarget(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
            style={{ animation: "popIn .18s ease-out" }}
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
                <span className="font-semibold text-primary">
                  #{respondTarget.id}
                </span>
                {respondTarget.product?.name
                  ? ` for ${respondTarget.product.name}`
                  : ""}
                {respondMode === "confirm"
                  ? " — you're confirming you can supply these goods. This can't be undone."
                  : " — this tells Tabashir you can't supply these goods. This can't be undone."}
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
                onClick={() => setRespondTarget(null)}
                disabled={responding}
                className="px-5 py-2 border-2 border-gray-300 text-gray-600 font-semibold text-sm rounded-xl hover:border-primary hover:text-primary transition-all disabled:opacity-40"
              >
                Back
              </button>
              <button
                onClick={handleRespond}
                disabled={responding}
                className={`px-6 py-2 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-60 flex items-center gap-2
                  ${respondMode === "confirm" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
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

export default MerchantOrdersListingScreen;
