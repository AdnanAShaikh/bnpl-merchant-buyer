import SidebarBuyer from "../../components/SidebarBuyer";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Transaction {
  id: number;
  type: string;
  description: string;
  amount: number; // negative = debit, positive = credit
}

// ─── Demo Data ────────────────────────────────────────────────────────────────
const AVAILABLE_BALANCE = 109.75;

const TRANSACTIONS: Transaction[] = [
  { id: 1,  type: "Pay to", description: "Payment against Account # 0100100000016801, Deal ID 14, Inst. # 8", amount: -47.00    },
  { id: 2,  type: "Pay to", description: "Payment against Account # 0100100000016801, Deal ID 14, Inst. # 7", amount: -47.00    },
  { id: 3,  type: "Pay to", description: "Payment against Account # 0100100000016801, Deal ID 11, Inst. # 3", amount: -554.00   },
  { id: 4,  type: "Pay to", description: "Payment against Account # 0100100000016801, Deal ID 4, Inst. # 1",  amount: -2143.00  },
  { id: 5,  type: "Pay to", description: "Payment against Account # 0100100000016801, Deal ID 4, Inst. # 2",  amount: -2143.00  },
  { id: 6,  type: "Pay to", description: "Bank collection reference 999",                                      amount: +5000.00  },
  { id: 7,  type: "Pay to", description: "Payment against Account # 0100100000016801, Deal ID 14, Inst. # 6", amount: -47.00    },
  { id: 8,  type: "Pay to", description: "Payment against Account # 0100100000016801, Deal ID 13, Inst. # 3", amount: -288.00   },
  { id: 9,  type: "Pay to", description: "28126671463705",                                                     amount: +363.00  },
  { id: 10, type: "Pay to", description: "Payment against Account # 0100100000016801, Deal ID 13, Inst. # 2", amount: -288.00   },
  { id: 11, type: "Pay to", description: "Payment against Account # 0100100000016801, Deal ID 13, Inst. # 1", amount: -288.00   },
  { id: 12, type: "Pay to", description: "Bank collection reference 1002",                                     amount: +1200.00 },
  { id: 13, type: "Pay to", description: "Payment against Account # 0100100000016801, Deal ID 7, Inst. # 4",  amount: -125.00  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtAmount = (n: number) => {
  const abs = Math.abs(n).toLocaleString("en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${n >= 0 ? "+" : "−"} SAR ${abs}`;
};

// ─── Screen ───────────────────────────────────────────────────────────────────
const BuyerWalletScreen = () => (
  <SidebarBuyer>
    <div className="max-w-[1060px] flex flex-col gap-4">

      {/* ── Wallet Balance Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 px-7 py-6">
        <p className="text-base font-bold text-primary mb-4">Wallet Account</p>
        <p className="text-xs text-gray-400 mb-1">Available Balance</p>
        <p className="text-3xl font-bold text-primary">
          SAR {AVAILABLE_BALANCE.toLocaleString("en-SA", { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* ── Recent Transactions Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 px-7 py-6">
        <p className="text-lg font-bold text-primary mb-5">Recent Transactions</p>

        <div className="divide-y divide-gray-100">
          {TRANSACTIONS.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center justify-between py-4 group hover:bg-gray-50 -mx-7 px-7 transition-colors duration-150"
            >
              {/* Left: type + description */}
              <div className="flex flex-col gap-0.5 min-w-0 pr-6">
                <p className="text-xs text-gray-400">{txn.type}</p>
                <p className="text-sm text-gray-700 font-medium truncate">{txn.description}</p>
              </div>

              {/* Right: amount */}
              <p
                className={`text-sm font-semibold flex-shrink-0 ${
                  txn.amount >= 0 ? "text-green-500" : "text-green-500"
                }`}
                // both debit & credit render in green per the screenshot
              >
                {fmtAmount(txn.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  </SidebarBuyer>
);

export default BuyerWalletScreen;