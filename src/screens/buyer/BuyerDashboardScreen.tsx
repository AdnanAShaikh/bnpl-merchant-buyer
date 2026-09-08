import { useState } from "react";
import SidebarBuyer from "../../components/SidebarBuyer";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useAppSelector } from "../../store/hooks";
import { selectAuthUser } from "../../store/slices/authSlice";

// ─── Demo Data ────────────────────────────────────────────────────────────────
const CREDIT_UTILISED = 132541;
const CREDIT_TOTAL = 150000;
const CREDIT_AVAILABLE = CREDIT_TOTAL - CREDIT_UTILISED;
const TOTAL_ORDERS = 46;
const MONTHLY_AVG = 3464.96;

const REPAYMENTS = {
  totalPaid: 24813.38,
  outstanding: 50799.63,
  totalPaymentsMade: 34,
  remainingPayments: 32,
  inTransit: 72750.0,
  disputed: 0.0,
  returned: 0.0,
  completed: 86638.0,
  paidPct: 0,
};

const DONUT_DATA = [
  { name: "Credit Paid", value: REPAYMENTS.paidPct || 1, color: "#1a3a6a" },
  {
    name: "Outstanding",
    value: 100 - (REPAYMENTS.paidPct || 1),
    color: "#E5E7EB",
  },
];

const UPCOMING_PAYMENTS = [
  { orderId: "#2", amount: "SAR 5512.5", due: "Due on 21-10-2024" },
  { orderId: "#2", amount: "SAR 5512.5", due: "Due on 28-10-2024" },
  { orderId: "#4", amount: "SAR 2143", due: "Due on 29-10-2024" },
];

// Line chart data — bell-curve-like spike at Jun 2025
const MONTHS = [
  "Apr 2025",
  "May 2025",
  "Jun 2025",
  "Jul 2025",
  "Aug 2025",
  "Sep 2025",
  "Oct 2025",
  "Nov 2025",
  "Dec 2025",
  "Jan 2026",
  "Feb 2026",
  "Mar 2026",
  "Apr 2026",
];

const SERIES_BY_TAB: Record<ChartTab, number[]> = {
  "Total Orders": [
    0.01, 0.15, 1, 0.3, 0.05, 0.02, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01,
  ],
  Returns: [0, 0.02, 0.08, 0.05, 0.01, 0, 0.01, 0, 0.02, 0.01, 0, 0.01, 0.01],
  Outstanding: [
    0.2, 0.35, 0.9, 0.75, 0.6, 0.45, 0.5, 0.4, 0.55, 0.7, 0.65, 0.8, 0.85,
  ],
};

const CHART_DATA_BY_TAB: Record<ChartTab, { month: string; value: number }[]> =
  {
    "Total Orders": MONTHS.map((m, i) => ({
      month: m,
      value: SERIES_BY_TAB["Total Orders"][i],
    })),
    Returns: MONTHS.map((m, i) => ({
      month: m,
      value: SERIES_BY_TAB["Returns"][i],
    })),
    Outstanding: MONTHS.map((m, i) => ({
      month: m,
      value: SERIES_BY_TAB["Outstanding"][i],
    })),
  };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  "SAR " +
  n.toLocaleString("en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ─── Sub-components ───────────────────────────────────────────────────────────

// Credit limit card
const CreditLimitCard = () => {
  const pct = Math.round((CREDIT_UTILISED / CREDIT_TOTAL) * 100);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-gray-500">Available Credit Limit</p>
        <button className="text-gray-300 hover:text-gray-500 transition-colors">
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
        </button>
      </div>
      <p className="text-2xl font-bold text-primary mb-4">
        {fmt(CREDIT_AVAILABLE)}
      </p>

      {/* Progress bar */}
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full bg-[#e8a020] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Credit Limit Utilised / Total Credit Limit
        </p>
        <p className="text-xs font-semibold text-gray-600">
          SAR{" "}
          {CREDIT_UTILISED.toLocaleString("en-SA", {
            minimumFractionDigits: 2,
          })}{" "}
          / SAR{" "}
          {CREDIT_TOTAL.toLocaleString("en-SA", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
};

// Stat tile
const StatTile = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex-1">
    <p className="text-sm text-gray-500 mb-2">{label}</p>
    <p className="text-xl font-bold text-primary">{value}</p>
  </div>
);

// Chart tab toggle
type ChartTab = "Total Orders" | "Returns" | "Outstanding";
const ChartTabs = ({
  active,
  onChange,
}: {
  active: ChartTab;
  onChange: (v: ChartTab) => void;
}) => {
  const tabs: ChartTab[] = ["Total Orders", "Returns", "Outstanding"];
  return (
    <div className="flex border border-gray-200 rounded-full overflow-hidden w-fit">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-5 py-2 text-sm font-semibold transition-all duration-200 ${
            active === t
              ? "bg-[#e8a020] text-white"
              : "bg-white text-gray-500 hover:text-primary"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
};

// Orders area chart card
const OrdersChartCard = () => {
  const [tab, setTab] = useState<ChartTab>("Total Orders");
  const data = CHART_DATA_BY_TAB[tab];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="mb-4">
        <ChartTabs active={tab} onChange={setTab} />
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1a3a6a" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#1a3a6a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#F3F4F6"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #E5E7EB",
              fontSize: 12,
            }}
            formatter={(value) => [
              typeof value === "number" ? value.toFixed(2) : value,
              tab,
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#1a3a6a"
            strokeWidth={2}
            fill="url(#areaGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Custom donut label
const DonutCenter = ({ cx, cy }: { cx: number; cy: number }) => (
  <>
    <text
      x={cx}
      y={cy - 6}
      textAnchor="middle"
      style={{ fontSize: 15, fontWeight: 700, fill: "#1a2a4a" }}
    >
      {REPAYMENTS.paidPct}%
    </text>
    <text
      x={cx}
      y={cy + 10}
      textAnchor="middle"
      style={{ fontSize: 10, fill: "#9CA3AF" }}
    >
      Credit Paid
    </text>
  </>
);

// Repayments summary card
const RepaymentsSummaryCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5">
    <p className="text-sm font-semibold text-gray-600 mb-4">
      Repayments Summary
    </p>

    {/* Donut + right stats */}
    <div className="flex items-center gap-5 mb-5">
      <div className="w-[120px] h-[120px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={DONUT_DATA}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={54}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
              label={({ cx, cy }) => <DonutCenter cx={cx} cy={cy} />}
              labelLine={false}
            >
              {DONUT_DATA.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        <div>
          <div className="w-5 h-1 bg-[#1a3a6a] rounded mb-1" />
          <p className="text-xs text-gray-400">Total Paid Amount</p>
          <p className="text-base font-bold text-primary">
            {fmt(REPAYMENTS.totalPaid)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Outstanding Amount</p>
          <p className="text-base font-bold text-primary">
            {fmt(REPAYMENTS.outstanding)}
          </p>
        </div>
      </div>
    </div>

    {/* Payments made / remaining */}
    <div className="flex justify-between py-3 border-t border-b border-gray-100 mb-4">
      <p className="text-sm text-gray-500">
        <span className="font-bold text-primary text-base mr-1">
          {REPAYMENTS.totalPaymentsMade}
        </span>
        Total Payments Made
      </p>
      <p className="text-sm text-gray-500">
        <span className="font-bold text-primary text-base mr-1">
          {REPAYMENTS.remainingPayments}
        </span>
        Remaining Payments
      </p>
    </div>

    {/* 2x2 status grid */}
    <div className="grid grid-cols-2 gap-4">
      {[
        { label: "In-Transit", value: REPAYMENTS.inTransit },
        { label: "Disputed", value: REPAYMENTS.disputed },
        { label: "Returned", value: REPAYMENTS.returned },
        { label: "Completed", value: REPAYMENTS.completed },
      ].map((item) => (
        <div key={item.label}>
          <p className="text-xs font-semibold text-gray-400 mb-1">
            {item.label}
          </p>
          <p className="text-base font-bold text-primary">{fmt(item.value)}</p>
        </div>
      ))}
    </div>
  </div>
);

// Upcoming payments card
const UpcomingPaymentsCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5">
    <p className="text-sm font-semibold text-gray-600 mb-4">
      Upcoming Payments
    </p>

    {/* Table header */}
    <div className="grid grid-cols-[1fr_2fr_auto] gap-3 bg-gray-50 rounded-xl px-4 py-2.5 mb-2">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
        Order ID
      </p>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
        Next Payment
      </p>
      <p />
    </div>

    {/* Rows */}
    <div className="flex flex-col gap-1">
      {UPCOMING_PAYMENTS.map((p, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_2fr_auto] gap-3 items-center px-4 py-3 border-b border-gray-50 last:border-0"
        >
          <p className="text-sm font-semibold text-blue-600">{p.orderId}</p>
          <div>
            <p className="text-sm font-bold text-primary">{p.amount}</p>
            <p className="text-xs text-gray-400">{p.due}</p>
          </div>
          <button className="bg-primary hover:bg-[#243a64] active:scale-[0.97] text-white text-xs font-bold px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap">
            Pay Now
          </button>
        </div>
      ))}
    </div>

    <p className="text-center text-xs text-gray-300 pt-3">
      No upcoming payment
    </p>
  </div>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const BuyerDashboardScreen = () => {
  const user = useAppSelector(selectAuthUser);

  console.log(user);
  return (
    <SidebarBuyer>
      <div className="flex gap-5">
        {/* ── Left column ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Credit limit */}
          <CreditLimitCard />

          {/* Stat tiles */}
          <div className="flex gap-4">
            <StatTile label="Total Orders" value={String(TOTAL_ORDERS)} />
            <StatTile
              label="Monthly Avg Order Value"
              value={fmt(MONTHLY_AVG)}
            />
          </div>

          {/* Area chart */}
          <OrdersChartCard />
        </div>

        {/* ── Right column ── */}
        <div className="w-[380px] flex-shrink-0 flex flex-col gap-4">
          <RepaymentsSummaryCard />
          <UpcomingPaymentsCard />
        </div>
      </div>
    </SidebarBuyer>
  );
};

export default BuyerDashboardScreen;
