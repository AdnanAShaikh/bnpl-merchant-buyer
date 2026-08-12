/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import { Input } from "./Input";
type Errors = Record<string, string>;

// ─── Types ────────────────────────────────────────────────────────────────────
interface PlanOption {
  id:         number;
  planName:   string;
  termType:   string;   // Daily | Weekly | Biweekly | Monthly
  termValue:  number;
  profitRate: string | number;  // decimal fraction e.g. "0.0500"
  currency?:  string;
}

interface BuyerDetails {
  name?:        string | null;
  email?:       string | null;
  address?:     string | null;
  phone?:       string | null;   // POA mobile
  telephone?:   string | null;   // corporate telephone
}

interface MerchantDetails {
  name?:     string | null;
  email?:    string | null;
  phone?:    string | null;
  address?:  string | null;
}

interface Props {
  open:       boolean;
  onClose:    () => void;
  onConfirm:  (payload: { quantity: number; requestedPlanId: number,   contactName: string;
                        contactEmail: string;
                        contactPhone: string;
                        deliveryAddress: string; 
                        }) => void;
  loading?:   boolean;

  itemName?:  string;
  unit?:      string;   // units, kg, tons...
  unitPrice:  number;   // already Number()-ed by caller
  currency?:  string;
  minOrder?:  number;

  buyer:      BuyerDetails;
  merchant:   MerchantDetails;
  plans:      PlanOption[];
}

// ─── Status meanings (final step) ─────────────────────────────────────────────
const STATUS_STEPS = [
  { color: "bg-amber-400",   label: "Pending Review",     desc: "Your financing request is submitted and awaiting Tabashir's review." },
  { color: "bg-blue-500",    label: "Approved",           desc: "Tabashir has approved your request and is arranging the purchase." },
  { color: "bg-purple-500",  label: "Merchant Confirmed", desc: "The merchant has confirmed they can fulfil your order." },
  { color: "bg-emerald-500", label: "Active",             desc: "Your financing is active — goods are dispatched and installments begin." },
];

const STEP_LABELS = ["Your Details", "Quantity", "Payment Plan", "Review", "Confirm"];

// ─── Small helpers ────────────────────────────────────────────────────────────
const termNoun = (t: string) => {
  const map: Record<string, string> = {
    Daily: "day", Weekly: "week", Biweekly: "2 weeks", Monthly: "month",
  };
  return map[t] ?? t.toLowerCase();
};

const fmt = (n: number) =>
  n.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Read-only field ──────────────────────────────────────────────────────────
const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="border border-gray-100 rounded-xl px-4 pt-2 pb-1.5 bg-gray-50">
    <label className="text-[11px] text-gray-400 font-medium">{label}</label>
    <p className="text-sm text-gray-800">{value || "—"}</p>
  </div>
);


// ─── Main ─────────────────────────────────────────────────────────────────────
const RequestFinancingModal: React.FC<Props> = ({
  open, onClose, onConfirm, loading = false,
  itemName, unit = "unit", unitPrice, currency = "SAR", minOrder = 1,
  buyer, merchant, plans,
}) => {
  const [step, setStep]         = useState(0);
  const [qty, setQty]           = useState(minOrder);
  const [planId, setPlanId]     = useState<number | null>(null);

  const [contact, setContact] = useState({
      name:    buyer.name    ?? "",
      email:   buyer.email   ?? "",
      phone:   buyer.phone   ?? "",
      address: buyer.address ?? "",
   });
  const [contactErrors, setContactErrors] = useState<Errors>({});

  const totalCost = useMemo(() => unitPrice * qty, [unitPrice, qty]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === planId) ?? null,
    [plans, planId]
  );

  // // if using the open-reset effect:
  // useEffect(() => {
  //   if (open) {
  //     setStep(0);
  //     setQty(minOrder);
  //     setPlanId(null);
  //     setContact({
  //       name:    buyer.name    ?? "",
  //       email:   buyer.email   ?? "",
  //       phone:   buyer.phone   ?? "",
  //       address: buyer.address ?? "",
  //     });
  //     setContactErrors({});   // ← add
  //   }
  // }, [open]);

  const validateContact = (c: {
      name: string; email: string; phone: string; address: string;
    }): Errors => {
      const errs: Errors = {};

      if (!c.name.trim())    errs.name    = "Full name is required";

      if (!c.email.trim())   errs.email   = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(c.email)) errs.email = "Enter a valid email";

      if (!c.address.trim()) errs.address = "Delivery address is required";

      if (!c.phone.trim())   errs.phone   = "Phone is required";

      return errs;
    };

    const patchContact = (k: keyof typeof contact, v: string) => {
      setContact((c) => ({ ...c, [k]: v }));
      setContactErrors((e) => (e[k] ? { ...e, [k]: "" } : e));
    };

  // Per-installment estimate (display only; server is source of truth)
  const installmentInfo = useMemo(() => {
    if (!selectedPlan) return null;
    const rate       = Number(selectedPlan.profitRate);
    const withProfit = totalCost * (1 + rate);
    const perTerm    = withProfit / selectedPlan.termValue;
    return { withProfit, perTerm };
  }, [selectedPlan, totalCost]);

  if (!open) return null;

  // ── Quantity handlers ──
  const clampQty = (v: number) => (v < minOrder ? minOrder : Math.floor(v));
  const setQtyClamped = (v: number) => setQty(clampQty(v));
  const bump = (delta: number) => setQty((q) => clampQty(q + delta));
  const bubbles = [minOrder * 10, minOrder * 50, minOrder * 100];

  // ── Step gating ──
  const canNext =
    step === 1 ? qty >= minOrder :
    step === 2 ? planId !== null :
    true;

  const isLast = step === 4;

  const next = () => {

    if (step === 0) {
        const errs = validateContact(contact);
        if (Object.keys(errs).length > 0) {
          setContactErrors(errs);
          return;
        }
        setContactErrors({});
        setStep(1);
        return;
    }

    if (isLast) {
      if (planId != null) 
        onConfirm ({ quantity: qty, requestedPlanId: planId,   contactName:     contact.name,
        contactEmail:    contact.email,
        contactPhone:    contact.phone,
        deliveryAddress: contact.address,
      });
    } else {
      setStep((s) => s + 1);
    }
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      style={{ animation: "fadeIn .15s ease-out" }}
      onClick={() => !loading && onClose()}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden"
        style={{ animation: "popIn .18s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + stepper */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-primary">Request Financing</h3>
              {itemName && <p className="text-xs text-gray-400 mt-0.5">{itemName}</p>}
            </div>
            <button
              onClick={() => !loading && onClose()}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-40"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1.5">
            {STEP_LABELS.map((lbl, i) => (
              <React.Fragment key={lbl}>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors
                      ${i < step ? "bg-emerald-500 text-white"
                        : i === step ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-400"}`}
                  >
                    {i < step ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium text-center leading-tight
                    ${i === step ? "text-primary" : "text-gray-400"}`}>
                    {lbl}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`h-0.5 flex-1 rounded-full -mt-4 ${i < step ? "bg-emerald-500" : "bg-gray-100"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── STEP 1: Buyer details ── */}
          {step === 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500 mb-1">
                Confirm your contact & delivery details for this order. Pre-filled from your profile — edit if needed.
              </p>
              <Input
                label="Full Name" name="contactName" required
                value={contact.name}
                onChange={(v: string) => patchContact("name", v)}
                error={contactErrors.name}
              />
              <Input
                label="Email Address" name="contactEmail" type="email" required
                value={contact.email}
                onChange={(v: string) => patchContact("email", v)}
                error={contactErrors.email}
              />
              <Input
                label="Delivery Address" name="deliveryAddress" required
                value={contact.address}
                onChange={(v: string) => patchContact("address", v)}
                error={contactErrors.address}
              />
              <Input
                label="Phone" name="contactPhone" type="tel" required
                value={contact.phone}
                onChange={(v: string) => patchContact("phone", v)}
                error={contactErrors.phone}
              />
            </div>
          )}

          {/* ── STEP 2: Quantity ── */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-500">
                How many {unit} would you like to order?
                <span className="text-gray-400"> (minimum {minOrder} {unit})</span>
              </p>

              {/* Stepper input */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => bump(-1)}
                  disabled={qty <= minOrder}
                  className="w-11 h-11 rounded-xl border-2 border-gray-200 text-gray-600 text-xl font-bold flex items-center justify-center hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  −
                </button>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    min={minOrder}
                    value={qty}
                    onChange={(e) => setQtyClamped(Number(e.target.value))}
                    className="w-full text-center text-lg font-bold text-primary border-2 border-gray-200 rounded-xl py-2.5 outline-none focus:border-primary transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">
                    {unit}
                  </span>
                </div>
                <button
                  onClick={() => bump(1)}
                  className="w-11 h-11 rounded-xl border-2 border-gray-200 text-gray-600 text-xl font-bold flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                >
                  +
                </button>
              </div>

              {/* Suggestion bubbles */}
              <div className="flex flex-wrap gap-2">
                {bubbles.map((b) => (
                  <button
                    key={b}
                    onClick={() => setQtyClamped(b)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all
                      ${qty === b
                        ? "border-primary bg-primary text-white"
                        : "border-gray-200 text-gray-500 hover:border-primary hover:text-primary"}`}
                  >
                    {b.toLocaleString()} {unit}
                  </button>
                ))}
              </div>

              {/* Live cost */}
              <div className="mt-2 rounded-xl bg-primary/3 border border-primary/10 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">Estimated goods cost</span>
                <span className="text-lg font-bold text-primary">
                  {fmt(totalCost)} <span className="text-xs text-gray-400 font-medium">{currency}</span>
                </span>
              </div>
              <p className="text-[11px] text-gray-400 -mt-1">
                {fmt(unitPrice)} {currency} × {qty} {unit}
              </p>
            </div>
          )}

          {/* ── STEP 3: Payment plan ── */}
          {step === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500">
                Choose a payment plan. Estimated on a goods cost of{" "}
                <span className="font-semibold text-primary">{fmt(totalCost)} {currency}</span>.
              </p>

              {plans.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-400">No payment plans available for your account.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {plans.map((plan) => {
                    const rate       = Number(plan.profitRate);
                    const withProfit = totalCost * (1 + rate);
                    const perTerm    = withProfit / plan.termValue;
                    const checked    = planId === plan.id;
                    return (
                      <label
                        key={plan.id}
                        className={`flex items-start gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition-all
                          ${checked ? "border-primary bg-primary/3" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <input
                          type="radio"
                          name="plan"
                          checked={checked}
                          onChange={() => setPlanId(plan.id)}
                          className="mt-1 w-4 h-4 accent-primary cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-primary">{plan.planName}</p>
                            <p className="text-xs text-gray-400">{(rate * 100).toFixed(1)}% profit</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {plan.termValue} payments · every {termNoun(plan.termType)}
                          </p>
                          <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-base font-bold text-primary">{fmt(perTerm)}</span>
                            <span className="text-xs text-gray-400">{currency} / {termNoun(plan.termType)}</span>
                          </div>
                          <p className="text-[11px] text-gray-400">
                            Total repayable {fmt(withProfit)} {currency}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: Review ── */}
          {step === 3 && selectedPlan && installmentInfo && (
            <div className="flex flex-col gap-5">
              {/* Buyer */}
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Your Details</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="Name"    value={contact.name} />
                  <Field label="Email"   value={contact.email} />
                  <Field label="Phone"   value={contact.phone} />
                  <Field label="Delivery Address" value={contact.address} />
                </div>
              </div>

              {/* Merchant */}
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Merchant</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="Name"    value={merchant.name} />
                </div>
              </div>

              {/* Financials */}
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Financing Summary</p>
                <div className="rounded-xl border border-primary/10 bg-primary/3 p-4 flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Quantity</span>
                    <span className="font-semibold text-primary">{qty} {unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Goods cost</span>
                    <span className="font-semibold text-primary">{fmt(totalCost)} {currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Plan</span>
                    <span className="font-semibold text-primary">{selectedPlan.planName}</span>
                  </div>
                  <div className="border-t border-primary/10 my-1" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Per installment</span>
                    <span className="font-bold text-primary">
                      {fmt(installmentInfo.perTerm)} {currency} / {termNoun(selectedPlan.termType)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total repayable</span>
                    <span className="font-bold text-primary">{fmt(installmentInfo.withProfit)} {currency}</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Figures are estimates. Final amounts are confirmed by Tabashir on approval.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 5: Confirm + status meanings ── */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-500">
                You're about to submit your financing request. Here's what happens next:
              </p>
              <div className="flex flex-col gap-3">
                {STATUS_STEPS.map((s, i) => (
                  <div key={s.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`w-3 h-3 rounded-full ${s.color} shrink-0 mt-1`} />
                      {i < STATUS_STEPS.length - 1 && <span className="w-0.5 flex-1 bg-gray-100 my-1" />}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm font-bold text-primary">{s.label}</p>
                      <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <button
            onClick={step === 0 ? onClose : back}
            disabled={loading}
            className="px-6 py-2 border-2 border-gray-300 text-gray-600 font-semibold text-sm rounded-xl hover:border-primary hover:text-primary transition-all disabled:opacity-40"
          >
            {step === 0 ? "Cancel" : "Back"}
          </button>
          <button
            onClick={next}
            disabled={!canNext || loading}
            className="px-8 py-2 bg-primary hover:bg-[#243a5e] text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-40 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : isLast ? "Confirm Request" : "Next"}
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

export default RequestFinancingModal;