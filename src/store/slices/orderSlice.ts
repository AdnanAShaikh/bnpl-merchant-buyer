/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "../../utils/apiFetch";

// ─── Shared Nested Types ──────────────────────────────────────────────────────
interface CompanyRef {
  companyName: string;
}

interface ProductRef {
  id:       number;
  name:     string;
  category: string;
  currency: string;
}

interface PartyRef {
  id:             number;
  companyDetails: CompanyRef | null;
}

interface AdminRef {
  id:    number;
  name:  string | null;
  email: string;
}

// ─── Order Status ─────────────────────────────────────────────────────────────
export type OrderStatus =
  | "PENDING_REVIEW"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "CONFIRMED"     // merchant confirmed fulfillment
  | "ACTIVE"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "DEFAULTED";

// ─── Entity Type ──────────────────────────────────────────────────────────────
export interface Order {
  id:       number;
  orderRef: string;

  productId:  number;
  product?:   ProductRef;
  buyerId:    number;
  buyer?:     PartyRef;
  merchantId: number;
  merchant?:  PartyRef;

  assignedAdminId: number | null;
  assignedAdmin?:  AdminRef | null;

  // ── Pricing ──
  quantity:     number;
  unitPrice:    number;
  costAmount:   number;
  profitRate:   number;
  profitAmount: number;
  totalAmount:  number;
  downPayment:  number;

  // ── Installments ──
  numberOfInstallments: number;
  installmentAmount:    number;
  installmentFrequency: string;

  currency: string;
  status:   OrderStatus;

  rejectionReason: string | null;
  adminNotes:      string | null;

  // ── Merchant fulfillment ──
  merchantConfirmed?:  boolean;
  merchantDeclined?:   boolean;
  merchantRespondedAt?: string | null;
  declineReason?:      string | null;

  // ── Dates ──
  submittedAt: string;
  reviewedAt:  string | null;
  approvedAt:  string | null;
  disbursedAt: string | null;
  completedAt: string | null;
  createdAt:   string;
  updatedAt:   string;

  contactName:     string;
  contactEmail:    string;
  contactPhone:    string;
  deliveryAddress: string;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

// Buyer places an order — sends inputs only; server computes all money figures
export interface PlaceOrderPayload {
  productId:            number;
  quantity?:            number;
  requestedPlanId?:     number;  
  contactName:     string;
  contactEmail:    string;
  contactPhone:    string;
  deliveryAddress: string;    
}

// Buyer cancels an early-stage order
export interface CancelOrderPayload {
  id: number;
}

// Merchant confirms fulfillment
export interface ConfirmOrderPayload {
  id: number;
}

// Merchant declines fulfillment
export interface DeclineOrderPayload {
  id:            number;
  declineReason: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────
interface OrderListResponse {
  message: string;
  count:   number;
  orders:  Order[];
}

interface OrderResponse {
  message: string;
  order:   Order;
}

// ─── State ────────────────────────────────────────────────────────────────────
interface OrderState {
  orders:       Order[];
  currentOrder: Order | null;

  myOrders: any;
  myOrdersLoading: boolean;
  myOrdersError: string | null;

  ordersLoading: boolean;
  ordersError:   string | null;

  singleLoading: boolean;
  singleError:   string | null;

  actionLoading: boolean;   // shared for place/cancel/confirm/decline
  actionError:   string | null;
}

const initialState: OrderState = {
  orders:       [],
  currentOrder: null,

  myOrders:   [],
  myOrdersLoading: false,
  myOrdersError: null,

  ordersLoading: false,
  ordersError:   null,

  singleLoading: false,
  singleError:   null,

  actionLoading: false,
  actionError:   null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

// ── Fetch My Orders (buyer or merchant — backend scopes by cookie identity) ──
export const fetchMyOrders = createAsyncThunk<OrderListResponse, void, { rejectValue: string }>(
  "order/fetchMyOrders",
  async (_, { rejectWithValue }) => {
    try {
      const res  = await apiFetch("/api/order/my");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch orders");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ── Fetch Single Order ──
export const fetchOrderById = createAsyncThunk<OrderResponse, number, { rejectValue: string }>(
  "order/fetchOrderById",
  async (id, { rejectWithValue }) => {
    try {
      const res  = await apiFetch(`/api/order/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch order");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ── Place Order (BUYER) ──
export const placeOrder = createAsyncThunk<OrderResponse, PlaceOrderPayload, { rejectValue: string }>(
  "order/placeOrder",
  async (payload, { rejectWithValue }) => {
    try {
      const res  = await apiFetch("/api/order/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to place order");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ── Cancel Order (BUYER — early stage only, enforced server-side) ──
export const cancelOrder = createAsyncThunk<OrderResponse, CancelOrderPayload, { rejectValue: string }>(
  "order/cancelOrder",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res  = await apiFetch(`/api/order/cancel/${id}`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel order");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ── Confirm Fulfillment (MERCHANT) ──
export const confirmOrder = createAsyncThunk<OrderResponse, ConfirmOrderPayload, { rejectValue: string }>(
  "order/confirmOrder",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res  = await apiFetch(`/api/order/confirm/${id}`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to confirm order");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ── Decline Fulfillment (MERCHANT) ──
export const declineOrder = createAsyncThunk<OrderResponse, DeclineOrderPayload, { rejectValue: string }>(
  "order/declineOrder",
  async ({ id, declineReason }, { rejectWithValue }) => {
    try {
      const res  = await apiFetch(`/api/order/decline/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ declineReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to decline order");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ─── Helper: keep list + currentOrder in sync after a mutation ─────────────────
const upsertOrder = (state: OrderState, order: Order) => {
  const idx = state.orders.findIndex((o) => o.id === order.id);
  if (idx !== -1) state.orders[idx] = order;
  if (state.currentOrder?.id === order.id) state.currentOrder = order;
};

// ─── Slice ────────────────────────────────────────────────────────────────────
const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearOrdersError:  (state) => { state.ordersError  = null; },
    clearSingleError:  (state) => { state.singleError  = null; },
    clearActionError:  (state) => { state.actionError  = null; },
    clearCurrentOrder: (state) => { state.currentOrder = null; },
  },
  extraReducers: (builder) => {
    // ── Fetch My Orders ──
    builder
      .addCase(fetchMyOrders.pending,   (state) => { state.myOrdersLoading = true;  state.myOrdersError = null; })
      .addCase(fetchMyOrders.fulfilled, (state, action) => { state.myOrdersLoading = false; state.myOrders = action.payload.orders; })
      .addCase(fetchMyOrders.rejected,  (state, action) => { state.myOrdersLoading = false; state.myOrdersError = action.payload ?? "Something went wrong"; });

    // ── Fetch Single Order ──
    builder
      .addCase(fetchOrderById.pending,   (state) => { state.singleLoading = true;  state.singleError = null; })
      .addCase(fetchOrderById.fulfilled, (state, action) => { state.singleLoading = false; state.currentOrder = action.payload.order; })
      .addCase(fetchOrderById.rejected,  (state, action) => { state.singleLoading = false; state.singleError = action.payload ?? "Something went wrong"; });

    // ── Place Order ──
    builder
      .addCase(placeOrder.pending,   (state) => { state.actionLoading = true;  state.actionError = null; })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.orders.unshift(action.payload.order); // add to top of list
      })
      .addCase(placeOrder.rejected,  (state, action) => { state.actionLoading = false; state.actionError = action.payload ?? "Something went wrong"; });

    // ── Cancel Order ──
    builder
      .addCase(cancelOrder.pending,   (state) => { state.actionLoading = true;  state.actionError = null; })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        upsertOrder(state, action.payload.order);
      })
      .addCase(cancelOrder.rejected,  (state, action) => { state.actionLoading = false; state.actionError = action.payload ?? "Something went wrong"; });

    // ── Confirm Fulfillment ──
    builder
      .addCase(confirmOrder.pending,   (state) => { state.actionLoading = true;  state.actionError = null; })
      .addCase(confirmOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        upsertOrder(state, action.payload.order);
      })
      .addCase(confirmOrder.rejected,  (state, action) => { state.actionLoading = false; state.actionError = action.payload ?? "Something went wrong"; });

    // ── Decline Fulfillment ──
    builder
      .addCase(declineOrder.pending,   (state) => { state.actionLoading = true;  state.actionError = null; })
      .addCase(declineOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        upsertOrder(state, action.payload.order);
      })
      .addCase(declineOrder.rejected,  (state, action) => { state.actionLoading = false; state.actionError = action.payload ?? "Something went wrong"; });
  },
});

export const {
  clearOrdersError,
  clearSingleError,
  clearActionError,
  clearCurrentOrder,
} = orderSlice.actions;
export default orderSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectOrders        = (state: { order: OrderState }) => state.order.orders;
export const selectCurrentOrder  = (state: { order: OrderState }) => state.order.currentOrder;

export const selectOrdersLoading = (state: { order: OrderState }) => state.order.ordersLoading;
export const selectOrdersError   = (state: { order: OrderState }) => state.order.ordersError;

export const selectSingleLoading = (state: { order: OrderState }) => state.order.singleLoading;
export const selectSingleError   = (state: { order: OrderState }) => state.order.singleError;

export const selectActionLoading = (state: { order: OrderState }) => state.order.actionLoading;
export const selectActionError   = (state: { order: OrderState }) => state.order.actionError;

export const selectMyOrders        = (s: any) => s.order.myOrders;
export const selectMyOrdersLoading = (s: any) => s.order.myOrdersLoading;
export const selectMyOrdersError   = (s: any) => s.order.myOrdersError;