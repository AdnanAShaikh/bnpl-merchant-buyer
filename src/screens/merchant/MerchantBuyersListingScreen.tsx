/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from "react";
import DataTable from "../../components/DataTable";
import type { ColumnDef, RowAction } from "../../components/DataTable";
import SidebarMerchant from "../../components/SidebarMerchant";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  fetchMyBuyers,
  selectMyBuyers,
  selectMyBuyersLoading,
  selectMyBuyersError,
  type MerchantBuyer,
} from "../../store/slices/merchantSlice";

const NAVY = "#1a2a4a";

// ─── Status display ───────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; cls: string; fill: string }> = {
  DRAFT:            { label: "Draft",            cls: "bg-gray-400",   fill: "#9ca3af" },
  PENDING_APPROVAL: { label: "Pending Approval", cls: "bg-blue-500",   fill: "#3b82f6" },
  APPROVED:         { label: "Approved",         cls: "bg-teal-600",   fill: "#0d9488" },
  REJECTED:         { label: "Rejected",         cls: "bg-red-500",    fill: "#ef4444" },
  SUSPENDED:        { label: "Suspended",        cls: "bg-gray-500",   fill: "#6b7280" },
};

const money = (v: number | undefined, currency = "SAR") =>
  v == null ? "—" : `${currency} ${Number(v).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Summary card with donut ──────────────────────────────────────────────────
const BuyerSummaryCard = ({ buyers }: { buyers: MerchantBuyer[] }) => {
  const total = buyers.length;

  const donutData = useMemo(() => {
    const counts: Record<string, number> = {};
    buyers.forEach((b) => { counts[b.status] = (counts[b.status] ?? 0) + 1; });
    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_META[status]?.label ?? status,
      value,
      fill: STATUS_META[status]?.fill ?? "#E5E7EB",
    }));
  }, [buyers]);

  const approvedCount = buyers.filter((b) => b.status === "APPROVED").length;
  const totalOrders   = buyers.reduce((s, b) => s + (b.orderCount ?? 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 flex items-center gap-6">
      {/* Left: summary stats */}
      <div className="flex flex-col gap-4 min-w-[180px]">
        <p className="text-sm font-semibold text-primary">Buyer Summary</p>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Total Buyers</p>
          <p className="text-xl font-bold text-primary">{total}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Approved</p>
          <p className="text-xl font-bold text-primary">{approvedCount}</p>
        </div>
        {totalOrders > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Total Orders</p>
            <p className="text-xl font-bold text-primary">{totalOrders}</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-gray-100" />

      {/* Right: donut */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-600 mb-3">Buyers by Status</p>
        {total === 0 ? (
          <div className="h-[160px] flex items-center justify-center">
            <p className="text-sm text-gray-400">No buyers yet.</p>
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
                        <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: NAVY }}>
                          {total}
                        </text>
                        <text x={cx} y={cy + 13} textAnchor="middle" style={{ fontSize: 11, fill: "#9CA3AF" }}>
                          Buyers
                        </text>
                      </>
                    )}
                  >
                    {donutData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any) => [`${v} buyer${v === 1 ? "" : "s"}`, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-col gap-2 flex-1">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: d.fill }} />
                  <span className="text-xs text-gray-500 flex-1">{d.name}</span>
                  <span className="text-xs font-bold text-primary">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
const MerchantBuyersListingScreen = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const buyers  = useAppSelector(selectMyBuyers);
  const loading = useAppSelector(selectMyBuyersLoading);
  const error   = useAppSelector(selectMyBuyersError);

  useEffect(() => {
    dispatch(fetchMyBuyers());
  }, [dispatch]);

  // ── Columns (trimmed to what the endpoint returns) ──
  const COLUMNS: ColumnDef<MerchantBuyer>[] = [
    { key: "id", label: "Buyer ID", render: (v) => <span className="font-semibold text-primary">#{String(v)}</span> },
    { key: "companyName", label: "Company", render: (v) => v ?? "—" },
    // These two only render meaningfully if your controller aggregates them:
    { key: "orderCount", label: "Orders", render: (v) => v ?? "—" },
    { key: "totalSpend", label: "Total Financed", render: (v) => money(v as number) },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const meta = STATUS_META[String(value)] ?? { label: String(value), cls: "bg-gray-400" };
        return <span className={`inline-block text-xs font-bold px-3 py-1 rounded-md text-white ${meta.cls}`}>{meta.label}</span>;
      },
    },
  ];

  const eyeIcon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const ROW_ACTIONS: RowAction<MerchantBuyer>[] = [
    { label: "View Buyer", icon: eyeIcon, onClick: (buyer) => navigate(`/merchant/buyers/${buyer.id}`) },
  ];

  return (
    <SidebarMerchant>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-primary">Buyers</h1>
      </div>

      <div className="mb-5">
        <BuyerSummaryCard buyers={buyers} />
      </div>

      {/* States */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 flex items-center justify-center">
          <span className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-400">Loading buyers…</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-sm font-semibold text-primary mb-1">Couldn't load buyers</p>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => dispatch(fetchMyBuyers())}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-[#243a5e] transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <DataTable<MerchantBuyer>
          title="All Buyers"
          columns={COLUMNS}
          dataSource={buyers}
          rowActions={ROW_ACTIONS}
          searchable
          searchKeys={["id", "companyName", "status"]}
          showStatusFilter
          statusOptions={["PENDING_APPROVAL", "APPROVED", "REJECTED", "SUSPENDED", "All Status"]}
          defaultStatus="All Status"
          defaultPageSize={10}
        />
      )}
    </SidebarMerchant>
  );
};

export default MerchantBuyersListingScreen;