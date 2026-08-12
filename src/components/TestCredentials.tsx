import { useState } from "react";

// ─── Test Credentials Dropdown ────────────────────────────────────────────────
export const TestCredentials = () => {
  const [open, setOpen] = useState(false);

  const credentials = [
    { role: "Buyer", email: "testBuyer@gmail.com", password: "Buyer@1234" },
    { role: "Merchant", email: "testMerchant@gmail.com", password: "Merchant@1234" },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
        Test Credentials
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4 space-y-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Test Accounts</p>

          {credentials.map((cred) => (
            <div key={cred.role} className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-bold text-primary">{cred.role}</p>
              <p className="text-xs text-gray-500">
                <span className="text-gray-400">Email:</span>{" "}
                <span className="font-mono font-medium text-gray-700">{cred.email}</span>
              </p>
              <p className="text-xs text-gray-500">
                <span className="text-gray-400">Pass:</span>{" "}
                <span className="font-mono font-medium text-gray-700">{cred.password}</span>
              </p>
            </div>
          ))}

          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-bold text-blue-800">Default OTP</p>
            <p className="text-lg font-mono font-bold text-blue-600 tracking-widest">300200</p>
          </div>
        </div>
      )}
    </div>
  );
};