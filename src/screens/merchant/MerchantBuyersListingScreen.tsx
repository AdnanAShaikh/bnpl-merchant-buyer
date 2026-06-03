/* eslint-disable @typescript-eslint/no-explicit-any */
import DataTable from "../../components/DataTable";
import type { ColumnDef, RowAction } from "../../components/DataTable";
import SidebarMerchant from "../../components/SidebarMerchant";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BuyerSummaryCardProps {
  totalActiveBuyers?: number;
  noOfActiveOrders?: number;
  inTransit?: number;
  returned?: number;
  disputed?: number;
  completed?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
const BuyerSummaryCard = ({
  totalActiveBuyers = 1,
  noOfActiveOrders  = 5,
  inTransit         = 5,
  returned          = 0,
  disputed          = 1,
  completed         = 1,
}: BuyerSummaryCardProps) => {
  const statusTiles = [
    { label: "In-Transit", count: inTransit },
    { label: "Returned",   count: returned  },
    { label: "Disputed",   count: disputed  },
    { label: "Completed",  count: completed },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 flex items-center gap-6">

      {/* ── Left: summary stats ── */}
      <div className="flex flex-col gap-4 min-w-[180px]">
        <p className="text-sm font-semibold text-[#1a2a4a]">Buyer Summary</p>

        <div>
          <p className="text-xs text-gray-400 mb-0.5">Total Active Buyers</p>
          <p className="text-xl font-bold text-[#1a2a4a]">{totalActiveBuyers}</p>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-0.5">No of Active Orders</p>
          <p className="text-xl font-bold text-[#1a2a4a]">{noOfActiveOrders}</p>
        </div>
      </div>

      {/* Vertical divider */}
      <div className="w-px self-stretch bg-gray-100" />

      {/* ── Right: 2x2 status grid ── */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {statusTiles.map(({ label, count }) => (
          <div
            key={label}
            className="border border-gray-100 rounded-xl px-5 py-3 flex items-center justify-between"
          >
            <div>
              <p className="text-xl font-bold text-[#1a2a4a]">{count}</p>
              <p className="text-xs text-gray-400 mt-0.5">Orders</p>
            </div>
            <span className="bg-[#1a2a4a] text-white text-xs font-bold px-3 py-1.5 rounded-lg">
              {label}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Buyer {
  id: number;
  buyerId: number;
  buyerName: string;
  buyerRegistrationNumber: number;
  totalSpend: number;
  orderCount: number;
  buyerStatus: string;
}

// ─── Demo Data ────────────────────────────────────────────────────────────────
const ALL_BUYERS: Buyer[] = [
  { id: 1,  buyerId: 10127, buyerName: 'Shaikh',  buyerRegistrationNumber: 2312423, totalSpend: 12314, orderCount: 2, buyerStatus: "Pending Approval" },
  { id: 2,  buyerId: 10128, buyerName: 'Khan',    buyerRegistrationNumber: 4521987, totalSpend: 20000, orderCount: 4, buyerStatus: "Approved" },
  { id: 3,  buyerId: 10129, buyerName: 'Patel',   buyerRegistrationNumber: 7894561, totalSpend: 15000, orderCount: 3, buyerStatus: "Approved" },
  { id: 4,  buyerId: 10130, buyerName: 'Sharma',  buyerRegistrationNumber: 9638527, totalSpend: 8000,  orderCount: 1, buyerStatus: "Suspended" },
  { id: 5,  buyerId: 10131, buyerName: 'Verma',   buyerRegistrationNumber: 1472583, totalSpend: 50000, orderCount: 6, buyerStatus: "Approved" },
  { id: 6,  buyerId: 10132, buyerName: 'Ansari',  buyerRegistrationNumber: 3692581, totalSpend: 12000, orderCount: 2, buyerStatus: "Rejected" },
  { id: 7,  buyerId: 10133, buyerName: 'Reddy',   buyerRegistrationNumber: 2587413, totalSpend: 30000, orderCount: 5, buyerStatus: "Approved" },
  { id: 8,  buyerId: 10134, buyerName: 'Iyer',    buyerRegistrationNumber: 9517538, totalSpend: 7000,  orderCount: 2, buyerStatus: "Pending Approval" },
  { id: 9,  buyerId: 10135, buyerName: 'Mehta',   buyerRegistrationNumber: 7531594, totalSpend: 9000,  orderCount: 1, buyerStatus: "Approved" },
  { id: 10, buyerId: 10136, buyerName: 'Gupta',   buyerRegistrationNumber: 8524569, totalSpend: 25000, orderCount: 4, buyerStatus: "Suspended" },
];

// ─── Column Definitions ───────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  Approved:          "bg-teal-600",
  Suspended:         "bg-gray-500",
  Rejected:          "bg-red-500",
  "Pending Approval":"bg-blue-500",
};

const COLUMNS: ColumnDef<Buyer>[] = [
  { key: "buyerId",             label: "Buyer ID"  },
  { key: "buyerName",          label: "Buyer Name" },
  { key: "buyerRegistrationNumber",     label: "Buyer Registration Number"  },
  { key: "totalSpend",   label: "Total Spend"    },
  { key: 'orderCount', label: "Order Count"},
  {
    key: "buyerStatus",
    label: "Buyer Status",
    render: (value) => {
      const cls = STATUS_STYLES[String(value)] ?? "bg-gray-400";
      return (
        <span className={`inline-block text-xs font-bold px-3 py-1 rounded-md text-white ${cls}`}>
          {String(value)}
        </span>
      );
    },
  },
];

// ─── Row Actions ──────────────────────────────────────────────────────────────
const ROW_ACTIONS: RowAction<Buyer>[] = [
  {
    label: "View Buyer",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    onClick: (order) => console.log("View order", order),
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
const MerchantBuyersListingScreen = () => {

  return (
    <SidebarMerchant>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1a2a4a]">Buyers</h1>
      </div>

    <div className='mb-5'>
         <BuyerSummaryCard />
    </div>

      {/* Table */}
      <DataTable<Buyer>
        title="All Buyers"
        columns={COLUMNS}
        dataSource={ALL_BUYERS}
        rowActions={ROW_ACTIONS}
        searchable
        searchKeys={["buyerId", "buyerName", "buyerRegistrationNumber", "totalSpend"]}
        showStatusFilter
        statusOptions={["Pending Approval", "Approved", "Rejected", "Suspended", "All Status"]}
        defaultStatus="All Status"
        defaultPageSize={10}
      />
    </SidebarMerchant>
  );
};

export default MerchantBuyersListingScreen;