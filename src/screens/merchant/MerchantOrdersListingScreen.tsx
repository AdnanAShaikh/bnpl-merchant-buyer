/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import DataTable from "../../components/DataTable";
import type { ColumnDef, RowAction } from "../../components/DataTable";
import Select from "@mui/material/Select";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";
import SidebarMerchant from "../../components/SidebarMerchant";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Order {
  id: number;
  orderId: number;
  invoiceId: number;
  merchants: string;
  totalOrderValue: number;
  outstandingAmount: number;
  nextPaymentDate: string;
  orderStatus: string;
  fulfillmentStatus: string;
}

// ─── Demo Data ────────────────────────────────────────────────────────────────
const ALL_ORDERS: Order[] = [
  { id: 1, orderId: 10127, invoiceId: 5, merchants: 'Test',       totalOrderValue: 12314, outstandingAmount: 0,     nextPaymentDate: '25-11-2026', orderStatus: "Pending Approval", fulfillmentStatus: "Delivered" },
  { id: 2, orderId: 10128, invoiceId: 6, merchants: 'Amazon',     totalOrderValue: 20000, outstandingAmount: 5000,  nextPaymentDate: '05-12-2026', orderStatus: "Approved",         fulfillmentStatus: "-" },
  { id: 3, orderId: 10129, invoiceId: 7, merchants: 'Flipkart',   totalOrderValue: 15000, outstandingAmount: 7500,  nextPaymentDate: '15-12-2026', orderStatus: "Approved",         fulfillmentStatus: "Delivered" },
  { id: 4, orderId: 10130, invoiceId: 8, merchants: 'Myntra',     totalOrderValue: 8000,  outstandingAmount: 4000,  nextPaymentDate: '20-11-2026', orderStatus: "Suspended",        fulfillmentStatus: "-" },
  { id: 5, orderId: 10131, invoiceId: 9, merchants: 'Ajio',       totalOrderValue: 50000, outstandingAmount: 25000, nextPaymentDate: '01-01-2027', orderStatus: "Approved",         fulfillmentStatus: "Delivered" },
  { id: 6, orderId: 10132, invoiceId: 10, merchants: 'Nykaa',     totalOrderValue: 12000, outstandingAmount: 0,     nextPaymentDate: '10-11-2026', orderStatus: "Rejected",         fulfillmentStatus: "-" },
  { id: 7, orderId: 10133, invoiceId: 11, merchants: 'Zara',      totalOrderValue: 30000, outstandingAmount: 15000, nextPaymentDate: '18-12-2026', orderStatus: "Approved",         fulfillmentStatus: "Delivered" },
  { id: 8, orderId: 10134, invoiceId: 12, merchants: 'H&M',       totalOrderValue: 7000,  outstandingAmount: 3500,  nextPaymentDate: '28-11-2026', orderStatus: "Pending Approval", fulfillmentStatus: "-" },
  { id: 9, orderId: 10135, invoiceId: 13, merchants: 'Reliance',  totalOrderValue: 9000,  outstandingAmount: 0,     nextPaymentDate: '22-11-2026', orderStatus: "Approved",         fulfillmentStatus: "Delivered" },
  { id: 10, orderId: 10136, invoiceId: 14, merchants: 'Croma',    totalOrderValue: 25000, outstandingAmount: 20000, nextPaymentDate: '30-12-2026', orderStatus: "Suspended",        fulfillmentStatus: "-" },
];

// ─── Summary Stats (derived from demo data) ───────────────────────────────────
const totalActiveAmount = ALL_ORDERS.filter((o) => o.orderStatus === "Approved")
  .reduce((s, o) => s + o.totalOrderValue, 0);
const noOfActive = ALL_ORDERS.filter((o) => o.orderStatus === "Approved").length;

const STATUS_BADGE: Record<string, string> = {
  "In-Process": "bg-[#1a2a4a]",
  "In-Transit": "bg-[#1a2a4a]",
  Disputed:     "bg-[#1a2a4a]",
  Returned:     "bg-[#1a2a4a]",
  Completed:    "bg-[#1a2a4a]",
  Pending:    "bg-[#1a2a4a]",
};

const FULFILLMENT_COUNTS = {
  "In-Process": 5,
  "In-Transit": 0,
  Disputed:     1,
  Returned:     0,
  Completed:    31,
  Pending:    0,
};

// Donut chart data
const PAID_PCT        = 60;
const DISPUTED_PCT    = 15;
const OUTSTANDING_PCT = 25;
const DONUT_DATA = [
  { name: "Paid Amount",        value: PAID_PCT,        fill: "#1a3a6a" },
  { name: "Disputed Amount",    value: DISPUTED_PCT,    fill: "#e8a020" },
  { name: "Outstanding Amount", value: OUTSTANDING_PCT, fill: "#E5E7EB" },
];

// ─── Order Summary Panel ──────────────────────────────────────────────────────
const OrderSummaryPanel = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-6 flex-1">
    {/* Left: totals */}
    <div className="flex flex-col justify-center min-w-[180px]">
      <p className="text-sm font-semibold text-gray-600 mb-3">Order Summary</p>
      <p className="text-xs text-gray-400 mb-1">Total Active Orders Amount</p>
      <p className="text-xl font-bold text-[#1a2a4a] mb-4">
        SAR {totalActiveAmount.toLocaleString("en-SA", { minimumFractionDigits: 2 })}
      </p>
      <p className="text-xs text-gray-400 mb-1">No of Active Orders</p>
      <p className="text-2xl font-bold text-[#1a2a4a]">{noOfActive}</p>
    </div>

    {/* Divider */}
    <div className="w-px bg-gray-100 self-stretch" />

    {/* Right: status grid */}
    <div className="grid grid-cols-2 gap-3 flex-1">
      {(Object.entries(FULFILLMENT_COUNTS) as [string, number][]).map(([label, count]) => (
        <div key={label} className="border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-[#1a2a4a]">{count}</p>
            <p className="text-xs text-gray-400 mt-0.5">Orders</p>
          </div>
          <span className={`text-xs font-bold text-white px-2.5 py-1 rounded-md ${STATUS_BADGE[label]}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// ─── Custom Donut Label ───────────────────────────────────────────────────────
const DonutLabel = ({ cx, cy }: { cx: number; cy: number }) => (
  <>
    <text x={cx} y={cy - 8} textAnchor="middle" className="fill-[#1a2a4a]" style={{ fontSize: 20, fontWeight: 700 }}>
      {PAID_PCT}%
    </text>
    <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 11, fill: "#9CA3AF" }}>
      Credit Paid
    </text>
  </>
);

// ─── Payment Summary Panel ────────────────────────────────────────────────────
const PaymentSummaryPanel = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 w-[380px] flex-shrink-0">
    <p className="text-sm font-semibold text-gray-600 mb-4">Order Payment Summary</p>
    <div className="flex items-center gap-4">
      {/* Donut */}
      <div className="w-[160px] h-[160px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={DONUT_DATA}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
              labelLine={false}
              label={({ cx, cy }) => <DonutLabel cx={cx} cy={cy} />}
              />
            <Tooltip formatter={(v: any) => `${v ?? 0}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend + stats */}
      <div className="flex flex-col gap-3 flex-1">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-1">
          {[
            { label: "Paid",        value: "60%" },
            { label: "Disputed",    value: "15%" },
            { label: "Outstanding", value: "25%" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-sm font-bold text-[#1a2a4a]">{s.value}</p>
            </div>
          ))}
        </div>
        {DONUT_DATA.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: d.fill }} />
            <span className="text-xs text-gray-500">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Column Definitions ───────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  Approved:          "bg-teal-600",
  Suspended:         "bg-gray-500",
  Rejected:          "bg-red-500",
  "Pending Approval":"bg-blue-500",
};

const COLUMNS: ColumnDef<Order>[] = [
  { key: "orderId",             label: "Order ID"           },
  { key: "invoiceId",          label: "Invoice ID"        },
  { key: "totalOrderValue",     label: "Total Order Value"  },
  { key: "outstandingAmount",   label: "Outstanding Amt"    },
  { key: 'nextPaymentDate', label: "Next Payment Date "},
  {
    key: "orderStatus",
    label: "Order Status",
    render: (value) => {
      const cls = STATUS_STYLES[String(value)] ?? "bg-gray-400";
      return (
        <span className={`inline-block text-xs font-bold px-3 py-1 rounded-md text-white ${cls}`}>
          {String(value)}
        </span>
      );
    },
  },
  {
    key: "fulfillmentStatus",
    label: "Fulfillment Status",
    render: (value) => (
      <span className={`inline-block text-xs font-bold px-3 py-1 rounded-md text-white ${value === "Delivered" ? "bg-green-500" : "bg-gray-300 text-gray-600"}`}>
        {String(value)}
      </span>
    ),
  },
];

// ─── Row Actions ──────────────────────────────────────────────────────────────
const ROW_ACTIONS: RowAction<Order>[] = [
  {
    label: "View Order",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    onClick: (order) => console.log("View order", order),
  },
  {
    label: "View Invoice",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    onClick: (order) => console.log("View order", order),
  },
  {
    label: "Notify A Dispute",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    onClick: (order) => console.log("View order", order),
  },
];

// ─── Currency options ─────────────────────────────────────────────────────────
const CURRENCIES = ["SAR", "USD", "EUR", "AED", "GBP"];
const NAVY = "#1a2a4a";

// ─── Screen ───────────────────────────────────────────────────────────────────
const MerchantOrdersListingScreen = () => {
  const [currency, setCurrency] = useState("SAR");

  return (
    <SidebarMerchant>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1a2a4a]">Orders</h1>
      </div>

    <div className='flex justify-between items-center'>
        {/* Currency selector */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-sm font-medium text-gray-600">Select Currency</span>
          <FormControl size="small">
            <Select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              sx={{
                minWidth: 160,
                borderRadius: "10px",
                fontFamily: "inherit",
                fontSize: "14px",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: NAVY },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: NAVY },
              }}
            >
              {CURRENCIES.map((c) => (
                <MenuItem key={c} value={c} sx={{ fontFamily: "inherit", fontSize: "14px" }}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div>
          <Button >
              Upload Invoice
          </Button>
        </div>
    </div>
      {/* Summary panels */}
      <div className="flex gap-5 mb-6">
        <OrderSummaryPanel />
        <PaymentSummaryPanel />
      </div>

      {/* Table */}
      <DataTable<Order>
        title="All Orders"
        columns={COLUMNS}
        dataSource={ALL_ORDERS}
        rowActions={ROW_ACTIONS}
        searchable
        searchKeys={["orderId", "invoiceId", "orderStatus", "fulfillmentStatus"]}
        showStatusFilter
        statusOptions={["Pending Approval", "Approved", "Rejected", "Suspended", "All Status"]}
        defaultStatus="All Status"
        defaultPageSize={10}
      />
    </SidebarMerchant>
  );
};

export default MerchantOrdersListingScreen;