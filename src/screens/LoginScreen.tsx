/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useRef, useEffect } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/Input";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loginUser, verifyOtpForLogin, selectLoginLoading, selectOtpLoading, emailOtpSendAndVerify, selectEmailOtpLoading } from "../store/slices/authSlice";
import { toast } from "react-toastify";
import { TestCredentials } from "../components/TestCredentials";

// ─── Types ────────────────────────────────────────────────────────────────────
type AuthTab = 0 | 1; // 0 = Login, 1 = Sign Up
type Role = "buyer" | "merchant";

// ─── Error messages ───────────────────────────────────────────────────────────
const ERROR_MESSAGES: Record<string, string> = {
  "Invalid email or password":                                "The email or password you entered is incorrect.",
  "Access denied. Invalid role for this account.":           "This account is not registered for the selected role.",
  "Your account has been disabled. Please contact support.": "Your account is disabled. Please contact support.",
  "Email, password, and role are required":                  "Please fill in all required fields.",
  "Server error":                                            "Something went wrong on our end. Please try again later.",
  "Invalid or expired OTP":                                  "The code you entered is invalid or has expired.",
  "Email and OTP code are required":                         "Please enter the verification code.",
};

// ─── OTP Dialog ───────────────────────────────────────────────────────────────
const OTP_LENGTH     = 6;
const RESEND_SECONDS = 90;

interface OtpDialogProps {
  open:     boolean;
  email:    string;
  loading:  boolean;
  onVerify: (code: string) => void;
  onResend: () => void;
  onClose:  () => void;
}


type ForgotPasswordDialogProps = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
};

const OtpDialog = ({ open, email, loading, onVerify, onResend, onClose }: OtpDialogProps) => {
  const [digits,    setDigits]    = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpError,  setOtpError]  = useState<string>("");
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
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, open]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next  = [...digits];
    next[index] = digit;
    setDigits(next);
    setOtpError("");
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits]; next[index] = ""; setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft"  && index > 0)              inputRefs.current[index - 1]?.focus();
    else if   (e.key === "ArrowRight" && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    else if   (e.key === "Enter") { const code = digits.join(""); if (code.length === OTP_LENGTH) onVerify(code); }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    if (pasted.length === OTP_LENGTH) onVerify(pasted);
  };

  const handleSubmit = () => {
    const code = digits.join("");
    if (code.length < OTP_LENGTH) { setOtpError("Please enter all 6 digits."); return; }
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
        backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" } },
        paper:    { sx: { borderRadius: "20px", boxShadow: "0 25px 60px rgba(0,0,0,0.4)", padding: "8px", overflow: "visible" } },
      }}
    >
      <DialogContent sx={{ p: "32px 36px 36px", position: "relative" }}>

        {/* Close */}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: "absolute", top: 12, right: 12, color: "#9CA3AF", "&:hover": { color: "#374151", background: "#F3F4F6" } }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </IconButton>

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)" }}>
            <svg className="w-8 h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-primary text-center mb-1">Enter OTP</h2>
        <p className="text-sm text-gray-400 text-center mb-6">
          Enter 6-digit code sent to{" "}
          <span className="font-semibold text-secondary">{email}</span>
        </p>

        {/* Digit boxes */}
        <div className="flex items-center justify-center gap-2.5 mb-2" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`
                w-11 h-12 text-center text-lg font-bold rounded-xl border-2 outline-none
                transition-all duration-150 bg-gray-50
                ${digit
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

        {otpError && <p className="text-xs text-red-500 text-center mt-1 mb-3">{otpError}</p>}

        {/* Resend */}
        <div className="flex justify-center mt-4 mb-6">
          {canResend ? (
            <button onClick={handleResend} className="text-sm font-semibold text-secondary hover:text-red-800 transition-colors">
              Resend Code
            </button>
          ) : (
            <p className="text-sm text-gray-400">
              Resend <span className="font-semibold text-secondary">{formatTime(countdown)}</span>
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
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Verifying...
            </span>
          ) : "Verify"}
        </button>

      </DialogContent>
    </Dialog>
  );
};


const ForgotPasswordDialog = ({
  open,
  loading = false,
  onClose,
  onSubmit,
}: ForgotPasswordDialogProps) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setEmail("");
      setError("");
    }
  }, [open]);

  const handleSubmit = () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email");
      return;
    }

    setError("");
    onSubmit(email);
  };

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

        {/* Close button */}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            color: "#9CA3AF",
            "&:hover": {
              color: "#374151",
              background: "#F3F4F6",
            },
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
              background:
                "linear-gradient(135deg, #e8f0fe 0%, #dbeafe 100%)",
            }}
          >
            <svg
              className="w-12 h-12 text-[#1a3a6a]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8m-18 8h18a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-primary text-center mb-1">
          Forgot Password
        </h2>

        <p className="text-sm text-gray-400 text-center mb-6">
          Enter your email address to receive an OTP code.
        </p>

        {/* Email Input */}
        <div className="mb-6">
          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            value={email}
            onChange={(v) => {
              setEmail(v);
              setError("");
            }}
            error={error}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background:
              "linear-gradient(90deg, #1a2a4a 0%, #2a4a7a 100%)",
            boxShadow: "0 4px 16px rgba(26,42,74,0.35)",
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-12 h-12 animate-spin"
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
              Sending OTP...
            </span>
          ) : (
            "Send OTP"
          )}
        </button>

      </DialogContent>
    </Dialog>
  );
};

// ─── Role Selector Card ───────────────────────────────────────────────────────
const RoleCard = ({
  value, label, selected, onSelect,
}: {
  value: Role; label: string; selected: boolean; onSelect: (v: Role) => void;
}) => (
  <div
    onClick={() => onSelect(value)}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none
      ${selected ? "border-secondary bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
  >
    <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
      ${selected ? "border-secondary bg-secondary" : "border-gray-300 bg-white"}`}
    >
      {selected && <div className="w-2 h-2 rounded-full bg-white" />}
    </div>
    <span className={`text-sm font-medium transition-colors duration-200 ${selected ? "text-red-800" : "text-gray-500"}`}>
      {label}
    </span>
  </div>
);

// ─── Login Form ───────────────────────────────────────────────────────────────
const LoginForm = () => {
  const navigate      = useNavigate();
  const dispatch      = useAppDispatch();
  const loginLoading  = useAppSelector(selectLoginLoading);
  const otpLoading    = useAppSelector(selectOtpLoading);
  const forgotPasswordLoading    = useAppSelector(selectEmailOtpLoading);

  const [role,        setRole]        = useState<Role>("buyer");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPassword,setShowPassword]= useState(false);
  const [errors,      setErrors]      = useState<{ email?: string; password?: string }>({});
  const [otpOpen,     setOtpOpen]     = useState(false);
  

  const [otpPurpose, setOtpPurpose] = useState<"LOGIN" | "FORGOT_PASSWORD">("LOGIN");
  const [isForgotPasswordModalOpen,    setIsForgotPasswordModalOpen]    = useState(false);   // ← controls dialog
  const [forgotEmail, setForgotEmail] = useState('')


  // --------------------------------- //
  //      Forgot Password Handlers     //
  // --------------------------------- //
  const onSubmitForgotPasswordDialog = async (email: string) => {
    const result = await dispatch(emailOtpSendAndVerify({ email, role: role === "buyer" ? "BUYER" : "MERCHANT", purpose: "RESET_PASSWORD", }));

    if (emailOtpSendAndVerify.fulfilled.match(result)) {
      setIsForgotPasswordModalOpen(false)
      setOtpOpen(true);
      setForgotEmail(email)
      setOtpPurpose('FORGOT_PASSWORD')

    } else {
      const raw     = result.payload ?? "Invalid OTP. Please try again.";
      const message = ERROR_MESSAGES[raw] ?? raw;
      toast.error(message);
    }
  };

  const handleVerifyForgotPasswordOtp = async (code: string) => {

    const result = await dispatch(
      emailOtpSendAndVerify({
        email: forgotEmail,
        code,
        purpose:"RESET_PASSWORD",
        role: role === "buyer" ? "BUYER" : "MERCHANT",
      })
    );

    if (emailOtpSendAndVerify.fulfilled.match(result)) {
      setOtpOpen(false);
      navigate("/forgot-password");

    } else {

      const raw = result.payload ?? "Invalid OTP";
      const message = ERROR_MESSAGES[raw] ?? raw;

      toast.error(message);
    }
  };

  const handleResendForOtpChangePassword = async () => {
    const result = await dispatch(emailOtpSendAndVerify({ email: forgotEmail, purpose: "RESET_PASSWORD",       role: role === "buyer" ? "BUYER" : "MERCHANT" }));
    if (emailOtpSendAndVerify.fulfilled.match(result)) {
      toast.info("A new code has been sent.", { autoClose: 2000 });
    } else {
      toast.error("Failed to resend code. Please try again.");
    }
  };


  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email)                            errs.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email    = "Enter a valid email";
    if (!password)                         errs.password = "Password is required";
    return errs;
  };

  // ── Step 1: send credentials → trigger OTP ──
  const handleLogin = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    const result = await dispatch(loginUser({
      email,
      password,
      role: role === "buyer" ? "BUYER" : "MERCHANT",
    }));

    if (loginUser.fulfilled.match(result)) {
      setOtpOpen(true);
    } else {
      const raw     = result.payload ?? "Login failed. Please try again.";
      const message = ERROR_MESSAGES[raw] ?? raw;
      toast.error(message);
    }
  };

  // ── Step 2: verify OTP ──
  const handleVerifyOtpForLogin = async (code: string) => {
    const result = await dispatch(verifyOtpForLogin({
      email,
      code,
      role: role === "buyer" ? "BUYER" : "MERCHANT",
    }));

    if (verifyOtpForLogin.fulfilled.match(result)) {
      setOtpOpen(false);
      toast.success("Welcome back!", { autoClose: 1000 });
          if (role === "buyer") {
            navigate("/buyer/dashboard");
          } else {
            navigate("/merchant/dashboard");
          }    
    } else {
      const raw     = result.payload ?? "Invalid OTP. Please try again.";
      const message = ERROR_MESSAGES[raw] ?? raw;
      toast.error(message);
    }
  };

  // ── Resend: re-trigger login which invalidates old OTP and sends new one ──
  const handleResendForLogin = async () => {
    const result = await dispatch(loginUser({
      email,
      password,
      role: role === "buyer" ? "BUYER" : "MERCHANT",
    }));
    if (loginUser.fulfilled.match(result)) {
      toast.info("A new code has been sent.", { autoClose: 2000 });
    } else {
      toast.error("Failed to resend code. Please try again.");
    }
  };

  return (
    <>
      <OtpDialog
        open={otpOpen}
        email={email}
        loading={otpLoading}
        onVerify={
          otpPurpose === "LOGIN"
            ? handleVerifyOtpForLogin
            : handleVerifyForgotPasswordOtp
        }        
        onResend={
          otpPurpose === "LOGIN"
            ? handleResendForLogin
            : handleResendForOtpChangePassword
        }        
      onClose={() => setOtpOpen(false)}
      />

      <ForgotPasswordDialog
        open={isForgotPasswordModalOpen}
        loading={forgotPasswordLoading}
        onSubmit={onSubmitForgotPasswordDialog}
        onClose={() => setIsForgotPasswordModalOpen(false)}
        />

      <div className="flex flex-col gap-5">
      <TestCredentials />

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3">
          <RoleCard value="buyer"    label="I'm a buyer"    selected={role === "buyer"}    onSelect={setRole} />
          <RoleCard value="merchant" label="I'm a merchant" selected={role === "merchant"} onSelect={setRole} />
        </div>

        {/* Email */}
        <Input
          label="Email Address"
          name="email"
          type="email"
          required
          value={email}
          onChange={(v) => { setEmail(v); setErrors((p) => ({ ...p, email: undefined })); }}
          error={errors.email}
        />

        {/* Password */}
        <Input
          label="Password"
          name="password"
          required
          value={password}
          onChange={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: undefined })); }}
          error={errors.password}
          showToggle
          show={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
        />

        {/* Forgot password */}
        <div className="flex justify-end -mt-2">
          <button
            onClick={()=>{setIsForgotPasswordModalOpen(true)}}
            type="button"
            className="cursor-pointer text-sm text-secondary font-medium hover:text-red-800 transition-colors"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={loginLoading}
          className="w-full bg-secondary hover:bg-red-700 active:scale-[0.98] text-white font-semibold text-sm py-3 rounded-xl transition-all duration-200 shadow-md shadow-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loginLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Sending code...
            </span>
          ) : "Login"}
        </button>

      </div>
    </>
  );
};

// ─── Sign Up Form ─────────────────────────────────────────────────────────────
const DOCS_NOTE =
  "Please ensure you have a copy of your Company Registration Certificate, Trade License Certificate, IBAN letter certified by your bank, Power of Attorney in original format, and ID card in electronic form.";

const RegistrationCard = ({ title, onRegister }: { title: string; onRegister: () => void }) => (
  <div className="border border-gray-200 rounded-2xl p-5">
    <p className="text-sm text-gray-500 leading-relaxed mb-4">{DOCS_NOTE}</p>
    <button
      type="button"
      onClick={onRegister}
      className="w-full border-2 border-secondary text-secondary font-semibold text-sm py-2.5 rounded-xl hover:bg-red-50 active:scale-[0.98] transition-all duration-200"
    >
      {title}
    </button>
  </div>
);

const SignUpForm = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-5">
      <TestCredentials />

      <RegistrationCard
        title="Register as Merchant"
        onRegister={() => navigate("/register/merchant")}
      />
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-500" />
        <span className="text-sm text-gray-500">OR</span>
        <div className="flex-1 h-px bg-gray-500" />
      </div>
      <RegistrationCard
        title="Register as Buyer"
        onRegister={() => navigate("/register/buyer")}
      />
    </div>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => (
  <nav className="bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-between sticky top-0 z-10">
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-base">R</span>
      </div>
      <div>
        <p className="font-bold text-sm text-primary leading-tight tracking-wide">RUFAAD</p>
        <p className="text-[11px] text-gray-400 tracking-wider">Invest In Future</p>
      </div>
    </div>
    <button className="border border-primary text-primary text-sm font-medium px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors">
      Contact Support
    </button>
  </nav>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const LoginScreen = () => {
  const [tab, setTab] = useState<AuthTab>(0);
 
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg, #1a2a4a 0%, #2c4a7c 60%, #1a3a6a 100%)" }}
    >
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[500px] bg-white rounded-2xl border border-gray-100 overflow-hidden">

          <div className="p-2 pb-0">
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v as AuthTab)}
              variant="fullWidth"
              slotProps={{ indicator: { style: { display: "none" } } }}
              sx={{
                background: "#F3F4F6",
                borderRadius: "12px",
                minHeight: 44,
                "& .MuiTab-root": {
                  textTransform: "none", fontWeight: 600, fontSize: "14px",
                  borderRadius: "10px", minHeight: 44, color: "#6B7280",
                  transition: "all .2s", fontFamily: "inherit",
                },
                "& .Mui-selected": {
                  background: "var(--color-secondary)", color: "#ffffff !important",
                  borderRadius: "10px", boxShadow: "0 2px 10px rgba(220,38,38,0.35)",
                },
              }}
            >
              <Tab label="LOGIN"   value={0} />
              <Tab label="SIGN UP" value={1} />
            </Tabs>
          </div>

          <div className="px-7 py-6 min-h-[500px]">
            {tab === 0 ? <LoginForm /> : <SignUpForm />}
          </div>

        </div>
      </div>

      <p className="text-center text-xs text-white/50 pb-5">©2025 Powered by Rufaad</p>
    </div>
  );
};

export default LoginScreen;