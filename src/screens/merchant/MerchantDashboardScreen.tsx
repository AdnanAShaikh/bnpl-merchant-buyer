/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import SidebarMerchant from "../../components/SidebarMerchant";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

// ─── Demo Data ────────────────────────────────────────────────────────────────
const STATS = {
  totalSales:       8212.50,
  totalReceivable:  6855.00,
  paymentsOverdue:  0.00,
  avgOrderValue:    1026.56,
  orderCount:       8,
  fulfillmentRate:  0,
  uniqueBuyers:     0,
  returningBuyers:  1,
  returnRates:      0,
  creditApproval:   0,
};

type ChartTab = "Total Orders" | "Returns" | "Outstanding";

// Monthly chart data — two spikes (Oct 2025 and Jan 2026)
const MONTHS = [
  "Apr 2025","May 2025","Jun 2025","Jul 2025","Aug 2025","Sep 2025",
  "Oct 2025","Nov 2025","Dec 2025","Jan 2026","Feb 2026","Mar 2026","Apr 2026",
];
const TOTAL_ORDERS_DATA = [20, 40, 100, 50, 30, 80, 3950, 500, 200, 980, 300, 40, 20];
const RETURNS_DATA      = [10, 20,  30, 15, 10, 20,  100, 80,  60,  90,  40, 15, 10];
const OUTSTANDING_DATA  = [50, 80, 120, 70, 40, 90, 2100, 400, 150, 700, 250, 60, 30];

const makeChartData = (values: number[]) =>
  MONTHS.map((m, i) => ({ month: m, value: values[i] }));

const CHART_MAP: Record<ChartTab, typeof TOTAL_ORDERS_DATA> = {
  "Total Orders": TOTAL_ORDERS_DATA,
  "Returns":      RETURNS_DATA,
  "Outstanding":  OUTSTANDING_DATA,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  "SAR " + n.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtK = (v: number) => {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

// Top stat tiles
const StatTiles = () => (
  <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 flex gap-8">
    {[
      { label: "Total sales",       value: fmt(STATS.totalSales)      },
      { label: "Total receivable",  value: fmt(STATS.totalReceivable) },
      { label: "Payments overdue",  value: fmt(STATS.paymentsOverdue) },
      { label: "Avg order value",   value: fmt(STATS.avgOrderValue)   },
    ].map((s, i) => (
      <React.Fragment key={s.label}>
        {i > 0 && <div className="w-px bg-gray-100 self-stretch" />}
        <div className="flex flex-col gap-1 min-w-[140px]">
          <p className="text-sm text-gray-500">{s.label}</p>
          <p className="text-xl font-bold text-[#1a2a4a]">{s.value}</p>
        </div>
      </React.Fragment>
    ))}
  </div>
);

// Chart tab pill toggle
const ChartTabToggle = ({
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
              : "bg-white text-[#1a2a4a] hover:bg-gray-50"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
};

// Custom dot — small filled circle on each data point
const CustomDot = (props: any) => {
  const { cx, cy } = props;
  return <circle cx={cx} cy={cy} r={3} fill="#1a3a6a" stroke="#fff" strokeWidth={1.5} />;
};

// Orders area chart
const OrdersChartCard = () => {
  const [tab, setTab] = useState<ChartTab>("Total Orders");
  const data = makeChartData(CHART_MAP[tab]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex-1">
      <div className="mb-5">
        <ChartTabToggle active={tab} onChange={setTab} />
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="merchantGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#1a3a6a" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#1a3a6a" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
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
            tickFormatter={fmtK}
          />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12 }}
             formatter={(value) => [
              typeof value === "number" ? `SAR ${value.toFixed(2)}` : value,
              tab,
            ]}   
            />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#1a3a6a"
            strokeWidth={2}
            fill="url(#merchantGrad)"
            dot={<CustomDot />}
            activeDot={{ r: 5, fill: "#1a3a6a" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Right panel — order count + metrics
const RightPanel = () => (
  <div className="w-[340px] flex-shrink-0 flex flex-col gap-4">

    {/* Order count card */}
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm text-gray-500 mb-1">Order count</p>
          <p className="text-3xl font-bold text-[#1a2a4a]">{STATS.orderCount}</p>
        </div>
        <button className="bg-[#1a2a4a] hover:bg-[#243a64] active:scale-[0.97] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200">
          View Orders
        </button>
      </div>
      <p className="text-sm text-gray-500 mt-1">
        <span className="font-bold text-[#1a2a4a]">{STATS.fulfillmentRate}%</span>{" "}
        fulfillment rate
      </p>
    </div>

    {/* Buyer & rate metrics card */}
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="grid grid-cols-2 gap-x-6 gap-y-6">
        {[
          { label: "Unique buyers",   value: STATS.uniqueBuyers    },
          { label: "Returning buyers",value: STATS.returningBuyers },
          { label: "Return rates",    value: STATS.returnRates     },
          { label: "Credit approval", value: STATS.creditApproval  },
        ].map((m) => (
          <div key={m.label}>
            <p className="text-sm text-gray-500 mb-1">{m.label}</p>
            <p className="text-2xl font-bold text-[#1a2a4a]">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const MerchantDashboardScreen = () => (
  <SidebarMerchant>
    <div className="flex flex-col gap-4">
      {/* Stat tiles */}
      <StatTiles />

      {/* Chart + right panel */}
      <div className="flex gap-4 items-start">
        <OrdersChartCard />
        <RightPanel />
      </div>
    </div>
  </SidebarMerchant>
);

export default MerchantDashboardScreen;