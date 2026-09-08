/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
// import StepConnector from "@mui/material/StepConnector";
// import { stepConnectorClasses } from "@mui/material/StepConnector";
import type { StepIconProps } from "@mui/material/StepIcon";
import { Input } from "../components/Input";
import { FileInput } from "../components/FileInput";
import { StepIconRoot } from "../components/StepIconRoot";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  emailOtpSendAndVerify,
  registerMerchant,
  selectEmailOtpLoading,
} from "../store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { SelectField } from "../components/SelectField";
import { toast } from "react-toastify";
import { ERROR_MESSAGES } from "../constants/ERROR_MESSAGES";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import { apiFetch } from "../utils/apiFetch";

type MerchantRegisterDraft = {
  activeStep: number;

  isEmailVerified: boolean;

  profileData: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  };

  companyData: {
    companyType: string;
    companyName: string;
    companyPresence: string;
    ecommerceUrl: string;
    corporateTelephone: string;
    companyRegistrationNo: string;
    annualTurnover: string;
    numberOfEmployees: string;
    operationLicenseNo: string;
    operationLicenseExpiry: string;
    sagiaNumber: string;
  };

  attorneyData: {
    title: string;
    firstName: string;
    lastName: string;
    nationality: string;
    mobileNumber: string;
    dateOfBirth: string;
    placeOfBirth: string;
    homeAddress: string;
    city: string;
    district: string;
    postalCode: string;
    nationalIdNumber: string;
  };

  gnplData: {
    invoicingEmail: string;
    invoicingCountryCode: string;
    invoicingMobile: string;
    payoutPlan: string;
  };
};

interface OtpDialogProps {
  open: boolean;
  email: string;
  loading: boolean;
  onVerify: (code: string) => void;
  onResend: () => void;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const NAVY = "#1a2a4a";
const RED = "#DC2626";

const STEPS = [
  "Profile Setup",
  "Company Details",
  "Power of Attorney",
  "Supporting Documents",
  "Setup GNPL Programme",
  "Review and Confirm",
];

const COMPANY_TYPES = [
  {
    value: "SINGLE_SHAREHOLDER",
    en: "Single Shareholder Company",
    ar: "شركة الشخص الواحد",
  },
  {
    value: "SIMPLIFIED_JOINT_STOCK",
    en: "Simplified Joint Stock Company",
    ar: "شركة المساهمة المبسطة",
  },
  { value: "JOINT_STOCK", en: "Joint Stock Company", ar: "شركة المساهمة" },
  {
    value: "LIMITED_LIABILITY",
    en: "Limited Liability Company",
    ar: "الشركة ذات المسؤولية المحدودة",
  },
  {
    value: "LIMITED_PARTNERSHIP",
    en: "Limited Partnership",
    ar: "شركة التوصية البسيطة",
  },
  { value: "PROFESSIONAL", en: "Professional Company", ar: "شركة مهنية" },
  { value: "FOREIGN", en: "Foreign Company", ar: "شركة أجنبية" },
  {
    value: "GENERAL_PARTNERSHIP",
    en: "General Partnership",
    ar: "شركة التضامن",
  },
];

const COMPANY_PRESENCE = ["Online", "Physical", "Both"];

const TITLES = ["Mr", "Ms", "Mrs", "Dr", "Prof"];

const COUNTRIES = [
  "Saudi Arabia",
  "United Arab Emirates",
  "Kuwait",
  "Bahrain",
  "Qatar",
  "Oman",
  "Egypt",
  "Jordan",
  "Lebanon",
  "Iraq",
  "Yemen",
  "Syria",
  "Palestine",
  "India",
  "Pakistan",
  "Bangladesh",
  "Philippines",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Other",
];

const PAYOUT_PLANS = [
  { value: "WEEKLY", label: "Pay Weekly" },
  { value: "MONTHLY", label: "Pay Monthly" },
];

const COUNTRY_CODES = [
  { code: "+966", country: "SA" },
  { code: "+971", country: "AE" },
  { code: "+965", country: "KW" },
  { code: "+973", country: "BH" },
  { code: "+974", country: "QA" },
  { code: "+968", country: "OM" },
  { code: "+20", country: "EG" },
  { code: "+962", country: "JO" },
  { code: "+91", country: "IN" },
  { code: "+92", country: "PK" },
  { code: "+44", country: "UK" },
  { code: "+1", country: "US" },
];

const stepTitles = [
  "Let's get started by creating your Merchant profile.",
  "Tell us about your company.",
  "Provide Power of Attorney details.",
  "Upload your supporting documents.",
  "Enter Detail of your Invoices",
  "Review and confirm your registration.",
];

const OTP_LENGTH = 6;
const RESEND_SECONDS = 90;

const STORAGE_KEY = "merchant-registration-draft";

const OtpDialog = ({
  open,
  email,
  loading,
  onVerify,
  onResend,
  onClose,
}: OtpDialogProps) => {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState<string>("");
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setDigits(Array(OTP_LENGTH).fill(""));
      setOtpError("");
      setCountdown(RESEND_SECONDS);
      setCanResend(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, open]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setOtpError("");
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0)
      inputRefs.current[index - 1]?.focus();
    else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1)
      inputRefs.current[index + 1]?.focus();
    else if (e.key === "Enter") {
      const code = digits.join("");
      if (code.length === OTP_LENGTH) onVerify(code);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    if (pasted.length === OTP_LENGTH) onVerify(pasted);
  };

  const handleSubmit = () => {
    const code = digits.join("");
    if (code.length < OTP_LENGTH) {
      setOtpError("Please enter all 6 digits.");
      return;
    }
    onVerify(code);
  };

  const handleResend = () => {
    setDigits(Array(OTP_LENGTH).fill(""));
    setOtpError("");
    setCountdown(RESEND_SECONDS);
    setCanResend(false);
    onResend();
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  const filled = digits.filter(Boolean).length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
          },
        },
        paper: {
          sx: {
            borderRadius: "20px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
            padding: "8px",
            overflow: "visible",
          },
        },
      }}
    >
      <DialogContent sx={{ p: "32px 36px 36px", position: "relative" }}>
        {/* Close */}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            color: "#9CA3AF",
            "&:hover": { color: "#374151", background: "#F3F4F6" },
          }}
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
        </IconButton>

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
            }}
          >
            <svg
              className="w-8 h-8 text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-primary text-center mb-1">
          Enter OTP
        </h2>
        <p className="text-sm text-gray-400 text-center mb-6">
          Enter 6-digit code sent to{" "}
          <span className="font-semibold text-secondary">{email}</span>
        </p>

        {/* Digit boxes */}
        <div
          className="flex items-center justify-center gap-2.5 mb-2"
          onPaste={handlePaste}
        >
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`
                w-11 h-12 text-center text-lg font-bold rounded-xl border-2 outline-none
                transition-all duration-150 bg-gray-50
                ${
                  digit
                    ? "border-secondary bg-white text-primary"
                    : otpError
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 text-gray-800 focus:border-secondary focus:bg-white"
                }
              `}
              style={{ caretColor: "transparent" }}
            />
          ))}
        </div>

        {otpError && (
          <p className="text-xs text-red-500 text-center mt-1 mb-3">
            {otpError}
          </p>
        )}

        {/* Resend */}
        <div className="flex justify-center mt-4 mb-6">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-sm font-semibold text-secondary hover:text-red-800 transition-colors"
            >
              Resend Code
            </button>
          ) : (
            <p className="text-sm text-gray-400">
              Resend{" "}
              <span className="font-semibold text-secondary">
                {formatTime(countdown)}
              </span>
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || filled < OTP_LENGTH}
          className="w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-secondary hover:bg-red-700 shadow-md shadow-red-200"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Verifying...
            </span>
          ) : (
            "Verify"
          )}
        </button>
      </DialogContent>
    </Dialog>
  );
};

function CustomStepIcon(props: StepIconProps) {
  const { active, completed, icon } = props;
  return (
    <StepIconRoot ownerState={{ active, completed }}>
      {completed ? (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        icon
      )}
    </StepIconRoot>
  );
}

// ─── Step 1 — Profile Setup ───────────────────────────────────────────────────
const ProfileSetup = ({ data, onChange, errors }: any) => {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Name"
        name="name"
        type="text"
        value={data.name || ""}
        error={errors.name}
        onChange={(v) => onChange("name", v)}
        required
      />
      <Input
        label="Email Address"
        name="email"
        type="email"
        placeholder="david@xyz.com"
        required
        value={data.email}
        onChange={(v) => onChange("email", v)}
        error={errors.email}
      />
      <Input
        label="Create Password"
        name="password"
        placeholder="Please enter"
        required
        value={data.password}
        onChange={(v) => onChange("password", v)}
        showToggle
        onToggle={() => setShowPass(!showPass)}
        show={showPass}
        error={errors.password}
      />
      <Input
        label="Confirm Password"
        name="confirmPassword"
        placeholder="Please enter"
        required
        value={data.confirmPassword}
        onChange={(v) => onChange("confirmPassword", v)}
        showToggle
        onToggle={() => setShowConfirm(!showConfirm)}
        show={showConfirm}
        error={errors.confirmPassword}
      />
    </div>
  );
};

// ─── Step 2 — Company Details ─────────────────────────────────────────────────
const CompanyDetails = ({ data, onChange, errors }: any) => (
  <div className="flex flex-col gap-4">
    {/* Company Type */}
    <SelectField
      label="Company Type"
      name="companyType"
      required
      value={data.companyType}
      onChange={(v) => onChange("companyType", v)}
      error={errors.companyType}
      options={COMPANY_TYPES.map((c) => ({
        value: c.value,
        label: `${c.en} — ${c.ar}`,
      }))}
    />

    {/* Company Name + Company Presence */}
    <div className="grid grid-cols-2 gap-4">
      <Input
        label="Company Name"
        name="companyName"
        required
        value={data.companyName}
        onChange={(v) => onChange("companyName", v)}
        error={errors.companyName}
      />
      <SelectField
        label="Company Presence"
        name="companyPresence"
        required
        value={data.companyPresence}
        onChange={(v) => onChange("companyPresence", v)}
        error={errors.companyPresence}
        options={COMPANY_PRESENCE.map((p) => ({ value: p, label: p }))}
      />
    </div>

    {/* E-Commerce URL — only show if Online or Both */}
    {(data.companyPresence === "Online" || data.companyPresence === "Both") && (
      <Input
        label="E-Commerce Website URL"
        name="ecommerceUrl"
        type="url"
        value={data.ecommerceUrl || ""}
        error={errors.ecommerceUrl}
        onChange={(v) => onChange("ecommerceUrl", v)}
      />
    )}

    {/* Corporate Telephone + Registration Number */}
    <div className="grid grid-cols-2 gap-4">
      <Input
        label="Corporate Telephone Number"
        name="corporateTelephone"
        type="tel"
        required
        value={data.corporateTelephone}
        onChange={(v) => onChange("corporateTelephone", v)}
        error={errors.corporateTelephone}
      />
      <Input
        label="Company Registration Number"
        name="companyRegistrationNo"
        required
        value={data.companyRegistrationNo}
        onChange={(v) => onChange("companyRegistrationNo", v)}
        error={errors.companyRegistrationNo}
      />
    </div>

    {/* Annual Turnover + Number of Employees */}
    <div className="grid grid-cols-2 gap-4">
      <Input
        label="Business Annual Turnover (SAR)"
        name="annualTurnover"
        type="number"
        required
        value={data.annualTurnover}
        onChange={(v) => onChange("annualTurnover", v)}
        error={errors.annualTurnover}
      />
      <Input
        label="Number of Employees"
        name="numberOfEmployees"
        type="number"
        required
        value={data.numberOfEmployees}
        onChange={(v) => onChange("numberOfEmployees", v)}
        error={errors.numberOfEmployees}
      />
    </div>

    {/* Operation License + Expiry */}
    <div className="grid grid-cols-2 gap-4">
      <Input
        label="Operation License Number"
        name="operationLicenseNo"
        value={data.operationLicenseNo || ""}
        onChange={(v) => onChange("operationLicenseNo", v)}
      />
      <Input
        label="Expiration Date"
        name="operationLicenseExpiry"
        type="date"
        value={data.operationLicenseExpiry || ""}
        onChange={(v) => onChange("operationLicenseExpiry", v)}
      />
    </div>

    {/* SAGIA Number */}
    <Input
      label="SAGIA Number"
      name="sagiaNumber"
      value={data.sagiaNumber || ""}
      onChange={(v) => onChange("sagiaNumber", v)}
    />
  </div>
);

// ─── Step 3 — Power of Attorney ───────────────────────────────────────────────
const PowerOfAttorney = ({ data, onChange, errors }: any) => (
  <div className="flex flex-col gap-4">
    {/* Title + First Name */}
    <div className="grid grid-cols-2 gap-4">
      <SelectField
        label="Title"
        name="title"
        required
        value={data.title}
        onChange={(v) => onChange("title", v)}
        error={errors.title}
        options={TITLES.map((t) => ({ value: t, label: t }))}
      />
      <Input
        label="First Name"
        name="firstName"
        required
        value={data.firstName}
        onChange={(v) => onChange("firstName", v)}
        error={errors.firstName}
      />
    </div>

    {/* Last Name + Nationality */}
    <div className="grid grid-cols-2 gap-4">
      <Input
        label="Last Name"
        name="lastName"
        required
        value={data.lastName}
        onChange={(v) => onChange("lastName", v)}
        error={errors.lastName}
      />
      <SelectField
        label="Nationality"
        name="nationality"
        required
        value={data.nationality}
        onChange={(v) => onChange("nationality", v)}
        error={errors.nationality}
        options={COUNTRIES.map((c) => ({ value: c, label: c }))}
      />
    </div>

    {/* Mobile Number + Date of Birth */}
    <div className="grid grid-cols-2 gap-4">
      <Input
        label="Mobile Number"
        name="mobileNumber"
        type="tel"
        required
        value={data.mobileNumber}
        onChange={(v) => onChange("mobileNumber", v)}
        error={errors.mobileNumber}
      />
      <Input
        label="Date of Birth"
        name="dateOfBirth"
        type="date"
        required
        value={data.dateOfBirth}
        onChange={(v) => onChange("dateOfBirth", v)}
        error={errors.dateOfBirth}
      />
    </div>

    {/* Place of Birth */}
    <SelectField
      label="Place of Birth"
      name="placeOfBirth"
      required
      value={data.placeOfBirth}
      onChange={(v) => onChange("placeOfBirth", v)}
      error={errors.placeOfBirth}
      options={COUNTRIES.map((c) => ({ value: c, label: c }))}
    />

    {/* Home Address */}
    <Input
      label="Home Address"
      name="homeAddress"
      required
      value={data.homeAddress}
      onChange={(v) => onChange("homeAddress", v)}
      error={errors.homeAddress}
    />

    {/* City + District */}
    <div className="grid grid-cols-2 gap-4">
      <Input
        label="City"
        name="city"
        required
        value={data.city}
        onChange={(v) => onChange("city", v)}
        error={errors.city}
      />
      <Input
        label="District"
        name="district"
        required
        value={data.district}
        onChange={(v) => onChange("district", v)}
        error={errors.district}
      />
    </div>

    {/* Postal Code + National ID */}
    <div className="grid grid-cols-2 gap-4">
      <Input
        label="Postal Code"
        name="postalCode"
        required
        value={data.postalCode}
        onChange={(v) => onChange("postalCode", v)}
        error={errors.postalCode}
      />
      <Input
        label="National Identity Number / Iqama Number"
        name="nationalIdNumber"
        required
        value={data.nationalIdNumber}
        onChange={(v) => onChange("nationalIdNumber", v)}
        error={errors.nationalIdNumber}
      />
    </div>
  </div>
);

const SupportingDocuments = ({
  docFiles,
  onFileChange,
}: {
  docFiles: Record<string, File | null>;
  onFileChange: (documentType: string, file: File | null) => void;
}) => (
  <div className="flex flex-col gap-5">
    <p className="text-sm text-gray-500 leading-relaxed">
      Please upload clear, readable copies of the following documents. Accepted
      formats: PDF, JPG, PNG (max 10MB each).
    </p>
    <div>
      <p className="text-sm font-semibold text-amber-800">File Upload Notice</p>

      <p className="text-sm text-amber-700 mt-1 leading-relaxed">
        Your form progress is saved automatically, but uploaded files will be
        lost if the page is refreshed. You may need to upload them again.
      </p>
    </div>
    {[
      {
        documentType: "commercial_registration",
        label: "Valid Commercial Registration",
        hint: "An official copy of the Commercial Register for commercial activity and type of company.",
        required: true,
      },
      {
        documentType: "power_of_attorney_representative",
        label: "Power of Attorney Representative ID",
        hint: undefined,
        required: true,
      },
      {
        documentType: "audited_financial_accounts",
        label: "Audited Financial Accounts",
        hint: "Period of last year.",
        required: true,
      },
      {
        documentType: "vat_returns",
        label: "VAT Returns",
        hint: "Period of last 4 quarters.",
        required: true,
      },
      {
        documentType: "bank_statements",
        label: "Bank Issued and Certified IBAN Letter",
        hint: "Period of last 6 months.",
        required: true,
      },
      {
        documentType: "power_of_attorney",
        label: "Power of Attorney Document",
        hint: undefined,
        required: true,
      },
      {
        documentType: "vat_registration_certificate",
        label: "VAT Registration Certificate",
        hint: undefined,
        required: true,
      },
    ].map((doc) => (
      <FileInput
        key={doc.documentType}
        label={doc.label}
        hint={doc.hint}
        required={doc.required}
        onFileSelected={(file) => onFileChange(doc.documentType, file)}
        selectedFile={docFiles[doc.documentType] ?? null}
      />
    ))}
  </div>
);

// ─── Step 5 — Supporting Documents ───────────────────────────────────────────
const GNPLDetails = ({ data, onChange, errors }: any) => (
  <div className="flex flex-col gap-4">
    {/* Invoicing Email */}
    <Input
      label="Email Address for Invoicing of Fee"
      name="invoicingEmail"
      type="email"
      required
      value={data.invoicingEmail}
      onChange={(v) => onChange("invoicingEmail", v)}
      error={errors.invoicingEmail}
    />

    {/* Mobile Number with country code */}
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 font-medium block mb-1">
        Mobile Number for Invoicing <span className="text-red-500">*</span>
      </label>
      <div className="flex items-center gap-2">
        {/* Country code dropdown */}

        <SelectField
          label="Country Code"
          name="countryCode"
          required
          value={data.countryCode}
          onChange={(v) => onChange("countryCode", v)}
          error={errors.countryCode}
          options={COUNTRY_CODES.map((c) => ({
            value: c.code,
            label: `${c.code} — ${c.country}`,
          }))}
        />

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

        {/* Phone input */}
        <Input
          label="Phone No."
          name="invoicingMobile"
          error={errors.invoicingMobile}
          required
          placeholder="5XXXXXXXX"
          value={data.invoicingMobile || ""}
          onChange={(v) => onChange("invoicingMobile", v)}
        />
      </div>
    </div>

    {/* Payout Plan */}
    <SelectField
      label="Pay-out Plan"
      name="payoutPlan"
      required
      value={data.payoutPlan}
      onChange={(v) => onChange("payoutPlan", v)}
      error={errors.payoutPlan}
      options={PAYOUT_PLANS}
    />
  </div>
);

// ─── Step 6 — Review and Confirm ─────────────────────────────────────────────
const ReviewConfirm = ({ allData }: { allData: any }) => {
  const sections = [
    {
      title: "Profile Setup",
      rows: [
        { label: "Name", value: allData.profile.name },
        { label: "Email", value: allData.profile.email },
      ],
    },
    {
      title: "Company Details",
      rows: [
        { label: "Company Type", value: allData.company.companyType },
        { label: "Company Name", value: allData.company.companyName },
        { label: "Company Presence", value: allData.company.companyPresence },
        { label: "E-Commerce URL", value: allData.company.ecommerceUrl || "—" },
        {
          label: "Corporate Telephone",
          value: allData.company.corporateTelephone,
        },
        {
          label: "Registration No.",
          value: allData.company.companyRegistrationNo,
        },
        {
          label: "Annual Turnover (SAR)",
          value: allData.company.annualTurnover,
        },
        { label: "No. of Employees", value: allData.company.numberOfEmployees },
        {
          label: "Operation License No.",
          value: allData.company.operationLicenseNo || "—",
        },
        {
          label: "License Expiry",
          value: allData.company.operationLicenseExpiry || "—",
        },
        { label: "SAGIA Number", value: allData.company.sagiaNumber || "—" },
      ],
    },
    {
      title: "Power of Attorney",
      rows: [
        { label: "Title", value: allData.attorney.title },
        { label: "First Name", value: allData.attorney.firstName },
        { label: "Last Name", value: allData.attorney.lastName },
        { label: "Nationality", value: allData.attorney.nationality },
        { label: "Mobile Number", value: allData.attorney.mobileNumber },
        { label: "Date of Birth", value: allData.attorney.dateOfBirth },
        { label: "Place of Birth", value: allData.attorney.placeOfBirth },
        { label: "Home Address", value: allData.attorney.homeAddress },
        { label: "City", value: allData.attorney.city },
        { label: "District", value: allData.attorney.district },
        { label: "Postal Code", value: allData.attorney.postalCode },
        {
          label: "National ID / Iqama",
          value: allData.attorney.nationalIdNumber,
        },
      ],
    },
    {
      title: "GNPL Details",
      rows: [
        { label: "Invoicing Email", value: allData.gnpl.invoicingEmail },
        {
          label: "Invoicing Mobile",
          value: `${allData.gnpl.invoicingCountryCode} ${allData.gnpl.invoicingMobile}`,
        },
        { label: "Payout Plan", value: allData.gnpl.payoutPlan },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-gray-500">
        Please review your information before submitting. You can go back to
        edit any section.
      </p>
      {sections.map((s) => (
        <div
          key={s.title}
          className="border border-gray-100 rounded-xl overflow-hidden"
        >
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-primary">{s.title}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {s.rows.map((r) => (
              <div key={r.label} className="flex justify-between px-4 py-2.5">
                <span className="text-xs text-gray-400">{r.label}</span>
                <span className="text-xs font-medium text-gray-700">
                  {r.value || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {/* <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
        <input type="checkbox" id="terms" className="mt-0.5 accent-red-600" />
        <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
          I confirm that all information provided is accurate and I agree to the{" "}
          <span className="text-red-600 font-medium">Terms & Conditions</span> and{" "}
          <span className="text-red-600 font-medium">Privacy Policy</span>.
        </label>
      </div> */}
    </div>
  );
};

// ─── Validation ───────────────────────────────────────────────────────────────
function validateStep(step: number, data: any): Record<string, string> {
  const errs: Record<string, string> = {};

  // ── Step 0: Profile Setup ──
  if (step === 0) {
    if (!data.name) errs.name = "Name is required";
    if (!data.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(data.email))
      errs.email = "Enter a valid email";
    if (!data.password) errs.password = "Password is required";
    else if (data.password.length < 8) errs.password = "Minimum 8 characters";
    if (!data.confirmPassword)
      errs.confirmPassword = "Please confirm your password";
    else if (data.password !== data.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
  }

  // ── Step 1: Company Details ──
  if (step === 1) {
    // Required
    if (!data.companyName) errs.companyName = "Company name is required";
    if (!data.companyRegistrationNo)
      errs.companyRegistrationNo = "Company registration number is required";
    if (!data.corporateTelephone)
      errs.corporateTelephone = "Corporate telephone is required";
    if (!data.companyType) errs.companyType = "Company type is required";
    if (!data.companyPresence)
      errs.companyPresence = "Company presence is required";
    if (!data.annualTurnover)
      errs.annualTurnover = "Annual turnover is required";
    if (!data.numberOfEmployees)
      errs.numberOfEmployees = "Number of employees is required";

    // Conditional — only required if presence is Online or Both
    if (
      (data.companyPresence === "Online" || data.companyPresence === "Both") &&
      !data.ecommerceUrl
    ) {
      errs.ecommerceUrl = "E-commerce URL is required for online presence";
    }

    // Optional: operationLicenseNo, operationLicenseExpiry, sagiaNumber — no validation
  }

  // ── Step 2: Power of Attorney ──
  if (step === 2) {
    // Required
    if (!data.title) errs.title = "Title is required";
    if (!data.firstName) errs.firstName = "First name is required";
    if (!data.lastName) errs.lastName = "Last name is required";
    if (!data.mobileNumber) errs.mobileNumber = "Mobile number is required";
    if (!data.dateOfBirth) errs.dateOfBirth = "DOB is required";
    if (!data.placeOfBirth) errs.placeOfBirth = "Place of Birth is required";
    if (!data.homeAddress) errs.homeAddress = "Home address is required";
    if (!data.city) errs.city = "City is required";
    if (!data.district) errs.district = "District is required";
    if (!data.postalCode) errs.postalCode = "Postal code is required";
    if (!data.nationalIdNumber)
      errs.nationalIdNumber = "National ID / Iqama number is required";

    // Merchant only optional fields — nationality, dateOfBirth, placeOfBirth
    // no validation needed
  }

  // ── Step 3: Supporting Documents — file uploads handled separately ──

  // ── Step 4: GNPL Details ──
  if (step === 4) {
    if (!data.invoicingEmail)
      errs.invoicingEmail = "Invoicing email is required";
    else if (!/\S+@\S+\.\S+/.test(data.invoicingEmail))
      errs.invoicingEmail = "Enter a valid email";
    if (!data.invoicingMobile)
      errs.invoicingMobile = "Invoicing mobile is required";
    if (!data.invoicingCountryCode)
      errs.invoicingCountryCode = "Country Code is required";
    if (!data.payoutPlan) errs.payoutPlan = "Payout plan is required";
  }

  return errs;
}

// ─── Main Component ───────────────────────────────────────────────────────────
const RegisterAsMerchantScreen = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const savedDraft: MerchantRegisterDraft | null = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [activeStep, setActiveStep] = useState(savedDraft?.activeStep ?? 0);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({});
  const isLoadingOTP = useAppSelector(selectEmailOtpLoading);

  const [profileData, setProfileData] = useState(
    savedDraft?.profileData ?? {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  );

  const [companyData, setCompanyData] = useState(
    savedDraft?.companyData ?? {
      companyType: "",
      companyName: "",
      companyPresence: "",
      ecommerceUrl: "",
      corporateTelephone: "",
      companyRegistrationNo: "",
      annualTurnover: "",
      numberOfEmployees: "",
      operationLicenseNo: "",
      operationLicenseExpiry: "",
      sagiaNumber: "",
    },
  );

  const [attorneyData, setAttorneyData] = useState(
    savedDraft?.attorneyData ?? {
      title: "",
      firstName: "",
      lastName: "",
      nationality: "",
      mobileNumber: "",
      dateOfBirth: "",
      placeOfBirth: "",
      homeAddress: "",
      city: "",
      district: "",
      postalCode: "",
      nationalIdNumber: "",
    },
  );

  const [gnplData, setGnplData] = useState(
    savedDraft?.gnplData ?? {
      invoicingEmail: "",
      invoicingCountryCode: "+966",
      invoicingMobile: "",
      payoutPlan: "",
    },
  );

  const [otpOpen, setOtpOpen] = useState(false); // ← controls dialog
  const [isEmailVerified, setIsEmailVerified] = useState(
    savedDraft?.isEmailVerified ?? false,
  );

  const stepData = [profileData, companyData, attorneyData, {}, gnplData];

  const patchProfile = (k: string, v: string) => {
    // if verified email changes → reset verification
    if (k === "email" && v !== profileData.email && isEmailVerified) {
      setIsEmailVerified(false);
      setOtpOpen(false);
    }

    setProfileData((p) => ({
      ...p,
      [k]: v,
    }));
  };

  const patchCompany = (k: string, v: string) =>
    setCompanyData((p) => ({ ...p, [k]: v }));
  const patchAttorney = (k: string, v: string) =>
    setAttorneyData((p) => ({ ...p, [k]: v }));
  const patchGNPL = (k: string, v: string) =>
    setGnplData((p) => ({ ...p, [k]: v }));
  const patchDocFile = (documentType: string, file: File | null) => {
    setDocFiles((prev) => ({ ...prev, [documentType]: file }));
  };

  useEffect(() => {
    const draft: MerchantRegisterDraft = {
      activeStep,

      isEmailVerified,

      profileData,

      companyData,

      attorneyData,

      gnplData,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [
    activeStep,
    isEmailVerified,
    profileData,
    companyData,
    attorneyData,
    gnplData,
  ]);

  const handleNext = async () => {
    const errs = validateStep(activeStep, stepData[activeStep]);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    if (activeStep === 0 && !isEmailVerified) {
      const result = await dispatch(
        emailOtpSendAndVerify({
          email: profileData?.email,
        }),
      );

      if (emailOtpSendAndVerify.fulfilled.match(result)) {
        setOtpOpen(true);
      } else {
        const raw = result.payload ?? "Failed to send OTP";

        const message = ERROR_MESSAGES[raw] ?? raw;

        toast.error(message);
      }

      return;
    }

    if (activeStep < STEPS.length - 1) {
      setActiveStep((s) => s + 1);
      return;
    }

    const result = await dispatch(
      registerMerchant({
        profileData: {
          name: profileData?.name,
          email: profileData.email,
          password: profileData.password,
        },
        companyData: {
          companyType: companyData.companyType,
          companyName: companyData.companyName,
          companyPresence: companyData?.companyPresence,
          ecommerceUrl: companyData?.ecommerceUrl || undefined,
          corporateTelephone: companyData.corporateTelephone,
          companyRegistrationNo: companyData.companyRegistrationNo,
          annualTurnover: Number(companyData?.annualTurnover),
          numberOfEmployees: Number(companyData?.numberOfEmployees),
          operationLicenseNo: companyData.operationLicenseNo || undefined,
          operationLicenseExpiry:
            companyData.operationLicenseExpiry || undefined,
          sagiaNumber: companyData.sagiaNumber || undefined,
        },
        attorneyData: {
          title: attorneyData.title,
          firstName: attorneyData.firstName,
          lastName: attorneyData.lastName,
          nationality: attorneyData?.nationality,
          mobileNumber: attorneyData.mobileNumber,
          dateOfBirth: attorneyData?.dateOfBirth,
          placeOfBirth: attorneyData?.placeOfBirth,
          homeAddress: attorneyData.homeAddress,
          city: attorneyData.city,
          district: attorneyData.district,
          postalCode: attorneyData.postalCode,
          nationalIdNumber: attorneyData.nationalIdNumber,
        },

        gnplData: {
          invoicingEmail: gnplData?.invoicingEmail,
          invoicingMobile:
            gnplData?.invoicingCountryCode + gnplData?.invoicingMobile,
          payoutPlan: gnplData?.payoutPlan,
        },
      }),
    );

    if (!registerMerchant.fulfilled.match(result)) {
      const raw = result.payload ?? "Registration failed. Please try again.";
      const message = ERROR_MESSAGES[raw] ?? raw;
      toast.error(message);
      return;
    }
    const merchantId = result.payload?.user?.merchant?.id;

    const filesToUpload = Object.entries(docFiles).filter(
      ([_, file]) => file !== null,
    );

    if (filesToUpload.length > 0) {
      try {
        const uploads = filesToUpload.map(([documentType, file]) => {
          const formData = new FormData();
          formData.append("file", file!);
          formData.append("documentType", documentType);
          formData.append("entityType", "merchant");
          formData.append("entityId", String(merchantId));
          return apiFetch("/api/document/upload", {
            method: "POST",
            body: formData,
          }).then(async (res) => {
            if (!res.ok) {
              const data = await res.json();
              throw new Error(
                `${documentType}: ${data.message || "Upload failed"}`,
              );
            }
            return res;
          });
        });

        await Promise.all(uploads);
      } catch (err: any) {
        // Buyer was created but some docs failed — still navigate, warn the user
        toast.warning(
          "Registered successfully but some documents failed to upload. You can re-upload them after logging in.",
        );
        navigate("/");
        localStorage.removeItem(STORAGE_KEY);

        return;
      }
    }

    toast.success("Successfully registered!", { autoClose: 1500 });
    localStorage.removeItem(STORAGE_KEY);

    navigate("/");
  };

  const handleBack = () => {
    setErrors({});
    setActiveStep((s) => Math.max(0, s - 1));
  };

  const handleVerifyOtp = async (code: string) => {
    const result = await dispatch(
      emailOtpSendAndVerify({ email: profileData?.email, code }),
    );

    if (emailOtpSendAndVerify.fulfilled.match(result)) {
      setOtpOpen(false);
      setIsEmailVerified(true);
      setActiveStep((s) => s + 1);
    } else {
      const raw = result.payload ?? "Invalid OTP. Please try again.";
      const message = ERROR_MESSAGES[raw] ?? raw;
      toast.error(message);
    }
  };

  // ── Resend: re-dispatch login (server invalidates old OTP and sends new one) ──
  const handleResend = async () => {
    const result = await dispatch(
      emailOtpSendAndVerify({
        email: profileData?.email,
      }),
    );

    if (emailOtpSendAndVerify.fulfilled.match(result)) {
      toast.info("A new code has been sent.", { autoClose: 2000 });
    } else {
      toast.error("Failed to resend code. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(135deg, #e8f0f7 0%, #d4e4f0 100%)",
      }}
    >
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-between sticky top-0 z-10">
        <div
          onClick={() => {
            navigate("/");
          }}
          className="flex cursor-pointer items-center gap-2.5"
        >
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-base">R</span>
          </div>
          <div>
            <p className="font-bold text-sm text-primary leading-tight tracking-wide">
              RUFAAD
            </p>
            <p className="text-[11px] text-gray-400 tracking-wider">
              Invest In Future.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="border border-primary text-primary text-sm font-medium px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors">
            Contact Support
          </button>
          <span className="text-sm text-gray-500 cursor-pointer">عربي</span>
        </div>
      </nav>

      <div className="flex-1 flex gap-6 p-6 max-w-6xl mx-auto w-full">
        <OtpDialog
          open={otpOpen}
          email={profileData?.email}
          loading={isLoadingOTP}
          onVerify={handleVerifyOtp}
          onResend={handleResend}
          onClose={() => setOtpOpen(false)}
        />

        {/* ── Left: Stepper sidebar ── */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sticky top-24">
            <Stepper
              activeStep={activeStep}
              orientation="vertical"
              // connector={<RedConnector />}
              sx={{
                "& .MuiStepLabel-label": {
                  fontFamily: "inherit",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#9CA3AF",
                },
                "& .MuiStepLabel-label.Mui-active": {
                  color: NAVY,
                  fontWeight: 600,
                },
                "& .MuiStepLabel-label.Mui-completed": {
                  color: RED,
                  fontWeight: 500,
                },
                "& .MuiStep-root": { padding: "6px 0" },
              }}
            >
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel
                    slots={{
                      stepIcon: CustomStepIcon,
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </div>
        </div>

        {/* ── Right: Form card ── */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            {/* Step title */}
            <h1 className="text-xl font-bold text-primary mb-6">
              {stepTitles[activeStep]}
            </h1>

            {/* Step content */}
            {activeStep === 0 && (
              <ProfileSetup
                data={profileData}
                onChange={patchProfile}
                errors={errors}
              />
            )}
            {activeStep === 1 && (
              <CompanyDetails
                data={companyData}
                onChange={patchCompany}
                errors={errors}
              />
            )}
            {activeStep === 2 && (
              <PowerOfAttorney
                data={attorneyData}
                onChange={patchAttorney}
                errors={errors}
              />
            )}
            {activeStep === 3 && (
              <SupportingDocuments
                docFiles={docFiles}
                onFileChange={patchDocFile}
              />
            )}
            {activeStep === 4 && (
              <GNPLDetails
                data={gnplData}
                onChange={patchGNPL}
                errors={errors}
              />
            )}
            {activeStep === 5 && (
              <ReviewConfirm
                allData={{
                  profile: profileData,
                  company: companyData,
                  attorney: attorneyData,
                  gnpl: gnplData,
                }}
              />
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              {activeStep === 0 ? (
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-gray-300 text-gray-600 font-semibold text-sm
                    hover:border-primary hover:text-primary transition-all"
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
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
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
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-8 py-2.5 rounded-full border-2 border-gray-300 text-gray-600 font-semibold text-sm
                    hover:border-primary hover:text-primary transition-all"
                >
                  Back
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-10 py-2.5 rounded-full bg-primary text-white font-semibold text-sm
                  hover:bg-[#243a64] active:scale-[0.98] transition-all shadow-md shadow-navy-200"
              >
                {isLoadingOTP
                  ? "Verifying Email..."
                  : activeStep === STEPS.length - 1
                    ? "Submit"
                    : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 pb-5">
        ©2025 Powered by Tabashir
      </p>
    </div>
  );
};

export default RegisterAsMerchantScreen;
