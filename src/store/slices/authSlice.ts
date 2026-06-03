/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// ─── Shared Base Types ────────────────────────────────────────────────────────
interface UserInfo {
  id:         number;
  email:      string;
  role:       string;
  isDisabled: boolean;
  createdAt:  string;
  name?:      string;
}

// ─── Profile ──────────────────────────────────────────────────────────────────
interface ProfilePayload {
  name:     string;
  email:    string;
  password: string;
}

// ─── Company Details ──────────────────────────────────────────────────────────
interface BuyerCompanyPayload {
  companyName:             string;
  companyType:             string;
  companyRegistrationNo:   string;
  corporateTelephone:      string;
  operationLicenseNo?:     string;
  operationLicenseExpiry?: string;
  sagiaNumber?:            string;
}

interface MerchantCompanyPayload extends BuyerCompanyPayload {
  companyPresence:   string;
  ecommerceUrl?:     string;
  annualTurnover:    number;
  numberOfEmployees: number;
}

// ─── Power of Attorney ────────────────────────────────────────────────────────
interface BuyerAttorneyPayload {
  title:            string;
  firstName:        string;
  lastName:         string;
  mobileNumber:     string;
  homeAddress:      string;
  city:             string;
  district:         string;
  postalCode:       string;
  nationalIdNumber: string;
}

interface MerchantAttorneyPayload extends BuyerAttorneyPayload {
  nationality:  string;
  dateOfBirth:  string;
  placeOfBirth: string;
}

// ─── GNPL Config (Merchant only) ──────────────────────────────────────────────
interface GNPLPayload {
  invoicingEmail:  string;
  invoicingMobile: string;
  payoutPlan:      string;
}

// ─── Register Payloads ────────────────────────────────────────────────────────
export interface RegisterBuyerPayload {
  profileData:  ProfilePayload;
  companyData:  BuyerCompanyPayload;
  attorneyData: BuyerAttorneyPayload;
}

export interface RegisterMerchantPayload {
  profileData:  ProfilePayload;
  companyData:  MerchantCompanyPayload;
  attorneyData: MerchantAttorneyPayload;
  gnplData:     GNPLPayload;
}

// ─── Login / OTP Payloads ─────────────────────────────────────────────────────
export interface LoginPayload {
  email:    string;
  password: string;
  role:     "BUYER" | "MERCHANT";
}

export interface VerifyOtpPayload {
  email: string;
  code:  string;
  role:  string;
}

// ─── API Response Types ───────────────────────────────────────────────────────
interface RegisterResponse {
  message: string;
  user: UserInfo & { buyer?: { id: number }, merchant?: {id: number} };
}

// Login step 1 — server just confirms OTP was sent, no user yet
interface LoginResponse {
  message: string;
}

// OTP step 2 — server confirms identity, sets cookie, returns user
interface VerifyOtpResponse {
  message: string;
  user:    UserInfo;
}

type EmailOtpPayload = {
  email: string;
  code?: string;
  purpose?: string;
  role?: string;
};

type EmailOtpResponse = {
  message: string;
  sent?: boolean;
  verified?: boolean;
};


// ─── State ────────────────────────────────────────────────────────────────────
interface AuthState {
  user:            UserInfo | null;
  isAuthenticated: boolean;

  // separate loading/error per action so UI can react granularly
  registerLoading: boolean;
  registerError:   string | null;

  loginLoading:    boolean;
  loginError:      string | null;

  otpLoading:      boolean;
  otpError:        string | null;

  emailOtpLoading: boolean;
  emailOtpError: string | null;
}

const initialState: AuthState = {
  user:            null,
  isAuthenticated: false,

  registerLoading: false,
  registerError:   null,

  loginLoading:    false,
  loginError:      null,

  otpLoading:      false,
  otpError:        null,

  emailOtpLoading: false,
  emailOtpError: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

// ── Register Buyer ──
export const registerBuyer = createAsyncThunk<RegisterResponse, RegisterBuyerPayload, { rejectValue: string }>(
  "auth/registerBuyer",
  async (payload, { rejectWithValue }) => {
    try {
      const res  = await fetch("/api/buyer/register", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Buyer registration failed");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ── Register Merchant ──
export const registerMerchant = createAsyncThunk<RegisterResponse, RegisterMerchantPayload, { rejectValue: string }>(
  "auth/registerMerchant",
  async (payload, { rejectWithValue }) => {
    try {
      const res  = await fetch("/api/merchant/register", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Merchant registration failed");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ── Login (step 1 — triggers OTP send, no user set yet) ──
export const loginUser = createAsyncThunk<LoginResponse, LoginPayload, { rejectValue: string }>(
  "auth/loginUser",
  async (payload, { rejectWithValue }) => {
    try {
      const res  = await fetch("/api/auth/login", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ── Verify OTP (step 2 — sets cookie on server, returns user) ──
export const verifyOtpForLogin = createAsyncThunk<VerifyOtpResponse, VerifyOtpPayload, { rejectValue: string }>(
  "auth/verifyOtp",
  async (payload, { rejectWithValue }) => {
    try {
      const res  = await fetch("/api/auth/login/verify-otp", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP verification failed");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ── Logout ──
export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await fetch("/api/auth/logout/bnpl", {
        method:      "POST",
        credentials: "include",
      });
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

export const emailOtpSendAndVerify = createAsyncThunk<
  EmailOtpResponse,
  EmailOtpPayload,
  { rejectValue: string }
>(
  "auth/emailOtpSendAndVerify",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "OTP request failed"
        );
      }

      return data;

    } catch (err: any) {
      return rejectWithValue(
        err.message || "Something went wrong"
      );
    }
  }
);



export const forgotPassword =
  createAsyncThunk<
    { message: string },
    { password: string },
    { rejectValue: string }
  >(
    "auth/forgotPassword",

    async (
      payload,
      { rejectWithValue }
    ) => {

      try {

        const res = await fetch(
          "/api/auth/forgot-password",
          {
            method: "POST",

            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(payload),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message ||
            "Password reset failed"
          );
        }

        return data;

      } catch (err: any) {

        return rejectWithValue(
          err.message ||
          "Something went wrong"
        );

      }
    }
  );

  
// ─── Slice ────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearRegisterError: (state) => { state.registerError = null; },
    clearLoginError:    (state) => { state.loginError    = null; },
    clearOtpError:      (state) => { state.otpError      = null; },
    setAuthUser: (state, action) => {
        state.user            = action.payload;
        state.isAuthenticated = true;
      },
    clearEmailOtpError: (state) => {
        state.emailOtpError = null;
      },
    },
  extraReducers: (builder) => {
    // ── Register Buyer ──
    builder
      .addCase(registerBuyer.pending,   (state) => { state.registerLoading = true;  state.registerError = null; })
      .addCase(registerBuyer.fulfilled, (state) => { state.registerLoading = false; })
      .addCase(registerBuyer.rejected,  (state, action) => { state.registerLoading = false; state.registerError = action.payload ?? "Something went wrong"; });

    // ── Register Merchant ──
    builder
      .addCase(registerMerchant.pending,   (state) => { state.registerLoading = true;  state.registerError = null; })
      .addCase(registerMerchant.fulfilled, (state) => { state.registerLoading = false; })
      .addCase(registerMerchant.rejected,  (state, action) => { state.registerLoading = false; state.registerError = action.payload ?? "Something went wrong"; });

    // ── Login (step 1) ──
    builder
      .addCase(loginUser.pending,   (state) => { state.loginLoading = true;  state.loginError = null; })
      .addCase(loginUser.fulfilled, (state) => { state.loginLoading = false; /* no user yet — waiting for OTP */ })
      .addCase(loginUser.rejected,  (state, action) => { state.loginLoading = false; state.loginError = action.payload ?? "Something went wrong"; });

    // ── Verify OTP (step 2) ──
    builder
      .addCase(verifyOtpForLogin.pending,   (state) => { state.otpLoading = true;  state.otpError = null; })
      .addCase(verifyOtpForLogin.fulfilled, (state, action) => {
        state.otpLoading      = false;
        state.user            = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(verifyOtpForLogin.rejected,  (state, action) => { state.otpLoading = false; state.otpError = action.payload ?? "Something went wrong"; });

    // ── Logout ──
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user            = null;
        state.isAuthenticated = false;
      });

      // ── Email OTP Send / Verify ──
    builder
      .addCase(emailOtpSendAndVerify.pending, (state) => {
        state.emailOtpLoading = true;
        state.emailOtpError   = null;
      })

      .addCase(emailOtpSendAndVerify.fulfilled, (state) => {
        state.emailOtpLoading = false;
      })

      .addCase(emailOtpSendAndVerify.rejected, (state, action) => {
        state.emailOtpLoading = false;
        state.emailOtpError   =
          action.payload ?? "Something went wrong";
      });



  },
});

export const { setAuthUser, clearRegisterError, clearLoginError, clearOtpError, clearEmailOtpError, } = authSlice.actions;
export default authSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectAuthUser            = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated     = (state: { auth: AuthState }) => state.auth.isAuthenticated;

export const selectRegisterLoading     = (state: { auth: AuthState }) => state.auth.registerLoading;
export const selectRegisterError       = (state: { auth: AuthState }) => state.auth.registerError;

export const selectLoginLoading        = (state: { auth: AuthState }) => state.auth.loginLoading;
export const selectLoginError          = (state: { auth: AuthState }) => state.auth.loginError;

export const selectOtpLoading          = (state: { auth: AuthState }) => state.auth.otpLoading;
export const selectOtpError            = (state: { auth: AuthState }) => state.auth.otpError;

export const selectEmailOtpLoading      = (state: { auth: AuthState }) => state.auth.emailOtpLoading;
export const selectEmailOtpError      = (state: { auth: AuthState }) => state.auth.emailOtpError;
