/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "../../utils/apiFetch";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface MarketplaceMerchant {
  id:     number;
  status: string;
  companyDetails: {
    companyName:     string | null;
    companyPresence: string | null;
    ecommerceUrl:    string | null;
    companyImageUrl: string | null
  } | null;
  _count: {
    products: number;
  };
}

// reuse the Product entity from productSlice to avoid drift
import type { Product } from "./productSlice";

// merchant header returned alongside the catalogue
export interface MarketplaceMerchantHeader {
  id: number;
  user: { email: string | null } | null;
  companyDetails: {
    companyName:        string | null;
    companyPresence:    string | null;
    ecommerceUrl:       string | null;
    companyType:        string | null;
    corporateTelephone: string | null;
  } | null;
}

// ─── API Response Types ───────────────────────────────────────────────────────
interface MarketplaceMerchantsResponse {
  message:   string;
  count:     number;
  merchants: MarketplaceMerchant[];
}

interface MarketplaceMerchantProductsResponse {
  message:  string;
  merchant: MarketplaceMerchantHeader;
  count:    number;
  products: Product[];
}

// ─── State ────────────────────────────────────────────────────────────────────
interface BuyerState {
  // marketplace merchant grid
  merchants:        MarketplaceMerchant[];
  merchantsLoading: boolean;
  merchantsError:   string | null;

  // a single merchant's catalogue (when a card is opened)
  activeMerchant:         MarketplaceMerchantHeader | null;
  merchantProducts:       Product[];
  merchantProductsLoading: boolean;
  merchantProductsError:   string | null;
}

const initialState: BuyerState = {
  merchants:        [],
  merchantsLoading: false,
  merchantsError:   null,

  activeMerchant:          null,
  merchantProducts:        [],
  merchantProductsLoading: false,
  merchantProductsError:   null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

// ── Fetch Marketplace Merchants (grid) ──
export const fetchMarketplaceMerchants = createAsyncThunk<MarketplaceMerchantsResponse, void, { rejectValue: string }>(
  "buyer/fetchMarketplaceMerchants",
  async (_, { rejectWithValue }) => {
    try {
      const res  = await apiFetch("/api/merchant/marketplace");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch merchants");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ── Fetch One Merchant's Catalogue ──
export const fetchMarketplaceMerchantProducts = createAsyncThunk<MarketplaceMerchantProductsResponse, number, { rejectValue: string }>(
  "buyer/fetchMarketplaceMerchantProducts",
  async (merchantId, { rejectWithValue }) => {
    try {
      const res  = await apiFetch(`/api/merchant/marketplace/${merchantId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch merchant products");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const buyerSlice = createSlice({
  name: "buyer",
  initialState,
  reducers: {
    clearMerchantsError:        (state) => { state.merchantsError = null; },
    clearMerchantProductsError: (state) => { state.merchantProductsError = null; },
    // clear the opened catalogue when leaving a merchant page
    clearActiveMerchant: (state) => {
      state.activeMerchant   = null;
      state.merchantProducts = [];
    },
  },
  extraReducers: (builder) => {
    // ── Marketplace Merchants ──
    builder
      .addCase(fetchMarketplaceMerchants.pending,   (state) => { state.merchantsLoading = true;  state.merchantsError = null; })
      .addCase(fetchMarketplaceMerchants.fulfilled, (state, action) => { state.merchantsLoading = false; state.merchants = action.payload.merchants; })
      .addCase(fetchMarketplaceMerchants.rejected,  (state, action) => { state.merchantsLoading = false; state.merchantsError = action.payload ?? "Something went wrong"; });

    // ── One Merchant's Catalogue ──
    builder
      .addCase(fetchMarketplaceMerchantProducts.pending,   (state) => { state.merchantProductsLoading = true;  state.merchantProductsError = null; })
      .addCase(fetchMarketplaceMerchantProducts.fulfilled, (state, action) => {
        state.merchantProductsLoading = false;
        state.activeMerchant   = action.payload.merchant;
        state.merchantProducts = action.payload.products;
      })
      .addCase(fetchMarketplaceMerchantProducts.rejected,  (state, action) => { state.merchantProductsLoading = false; state.merchantProductsError = action.payload ?? "Something went wrong"; });
  },
});

export const {
  clearMerchantsError,
  clearMerchantProductsError,
  clearActiveMerchant,
} = buyerSlice.actions;
export default buyerSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectMarketplaceMerchants        = (state: { buyer: BuyerState }) => state.buyer.merchants;
export const selectMarketplaceMerchantsLoading = (state: { buyer: BuyerState }) => state.buyer.merchantsLoading;
export const selectMarketplaceMerchantsError   = (state: { buyer: BuyerState }) => state.buyer.merchantsError;

export const selectActiveMerchant          = (state: { buyer: BuyerState }) => state.buyer.activeMerchant;
export const selectMerchantProducts        = (state: { buyer: BuyerState }) => state.buyer.merchantProducts;
export const selectMerchantProductsLoading = (state: { buyer: BuyerState }) => state.buyer.merchantProductsLoading;
export const selectMerchantProductsError   = (state: { buyer: BuyerState }) => state.buyer.merchantProductsError;