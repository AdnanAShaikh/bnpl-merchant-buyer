/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "../../utils/apiFetch";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface MerchantBuyer {
  id:              number;
  status:          string;
  companyName:     string | null;
  registrationNo?: string | null;
  totalSpend?:     number;   // requires controller aggregation
  orderCount?:     number;   // requires controller aggregation
}

interface MerchantBuyersResponse {
  message: string;
  count:   number;
  buyers:  MerchantBuyer[];
}

// ─── State ────────────────────────────────────────────────────────────────────
interface MerchantState {
  myBuyers:        MerchantBuyer[];
  myBuyersLoading: boolean;
  myBuyersError:   string | null;
}

const initialState: MerchantState = {
  myBuyers:        [],
  myBuyersLoading: false,
  myBuyersError:   null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

// ── Fetch My Buyers (merchant portal) ──
export const fetchMyBuyers = createAsyncThunk<MerchantBuyersResponse, void, { rejectValue: string }>(
  "merchant/fetchMyBuyers",
  async (_, { rejectWithValue }) => {
    try {
      const res  = await apiFetch("/api/buyer/merchant/buyers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch buyers");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const merchantSlice = createSlice({
  name: "merchant",
  initialState,
  reducers: {
    clearMyBuyersError: (state) => { state.myBuyersError = null; },
  },
  extraReducers: (builder) => {
    // ── Fetch My Buyers ──
    builder
      .addCase(fetchMyBuyers.pending,   (state) => { state.myBuyersLoading = true;  state.myBuyersError = null; })
      .addCase(fetchMyBuyers.fulfilled, (state, action) => { state.myBuyersLoading = false; state.myBuyers = action.payload.buyers; })
      .addCase(fetchMyBuyers.rejected,  (state, action) => { state.myBuyersLoading = false; state.myBuyersError = action.payload ?? "Something went wrong"; });
  },
});

export const { clearMyBuyersError } = merchantSlice.actions;
export default merchantSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectMyBuyers        = (state: { merchant: MerchantState }) => state.merchant.myBuyers;
export const selectMyBuyersLoading = (state: { merchant: MerchantState }) => state.merchant.myBuyersLoading;
export const selectMyBuyersError   = (state: { merchant: MerchantState }) => state.merchant.myBuyersError;