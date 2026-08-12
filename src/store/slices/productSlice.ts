/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "../../utils/apiFetch";

interface User {
  name: string;
  email: string
}
// ─── Shared Types ─────────────────────────────────────────────────────────────
interface MerchantInfo {
  id:             number;
  user: User
  companyDetails: { companyName: string; corporateTelephone: string } | null;
  powerOfAttorney: { homeAddress: string }
}

// ─── Entity Type ──────────────────────────────────────────────────────────────
export interface Product {
  id:          number;
  name:        string;
  description: string | null;
  category:    string;
  price:       number;
  currency:    string;
  images:      string[];
  minOrder:    number;
  unit:        string;
  inStock:     boolean;
  sku:         string | null;
  status:      string;
  merchantId:  number;
  merchant?:   MerchantInfo;
  createdAt:   string;
  updatedAt:   string;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────
export interface CreateProductPayload {
  name:         string;
  category:     string;
  price:        number;
  merchantId:   number;
  description?: string;
  currency?:    string;
  images?:      string[];
  minOrder?:    number;
  unit?:        string;
  inStock?:     boolean;
  sku?:         string;
  status?:      string;
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  id: number;
}

// ─── API Response Types ───────────────────────────────────────────────────────
interface ProductListResponse {
  message:  string;
  count:    number;
  products: Product[];
}

interface ProductResponse {
  message: string;
  product: Product;
}

interface DeleteProductResponse {
  message: string;
}

interface CategoriesResponse {
  message:    string;
  count:      number;
  categories: string[];
}

// ─── State ────────────────────────────────────────────────────────────────────
interface ProductState {
  products:        Product[];
  currentProduct:  Product | null;

  productsLoading: boolean;
  productsError:   string | null;

  singleLoading:   boolean;
  singleError:     string | null;

  actionLoading:   boolean;   // shared for create/update/delete
  actionError:     string | null;

  categories:        string[];
  categoriesLoading: boolean;
  categoriesError:   string | null;
}

const initialState: ProductState = {
  products:        [],
  currentProduct:  null,

  productsLoading: false,
  productsError:   null,

  singleLoading:   false,
  singleError:     null,

  actionLoading:   false,
  actionError:     null,

  categories:        [],
  categoriesLoading: false,
  categoriesError:   null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

// ── Fetch All Products ──
export const fetchAllProducts = createAsyncThunk<ProductListResponse, void, { rejectValue: string }>(
  "product/fetchAllProducts",
  async (_, { rejectWithValue }) => {
    try {
      const res  = await apiFetch("/api/product/all");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch products");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

export const fetchMyProducts = createAsyncThunk<ProductListResponse, void, { rejectValue: string }>(
  "product/fetchMyProducts",
  async (_, { rejectWithValue }) => {
    try {
      const res  = await apiFetch("/api/product/my");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch products");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ── Fetch Single Product ──
export const fetchProductById = createAsyncThunk<ProductResponse, number, { rejectValue: string }>(
  "product/fetchProductById",
  async (id, { rejectWithValue }) => {
    try {
      const res  = await apiFetch(`/api/product/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch product");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ── Create Product ──
export const createProduct = createAsyncThunk<ProductResponse, CreateProductPayload, { rejectValue: string }>(
  "product/createProduct",
  async (payload, { rejectWithValue }) => {
    try {
      const res  = await apiFetch("/api/product/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create product");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ── Update Product ──
export const updateProduct = createAsyncThunk<ProductResponse, UpdateProductPayload, { rejectValue: string }>(
  "product/updateProduct",
  async (payload, { rejectWithValue }) => {
    try {
      const { id, ...body } = payload;
      const res  = await apiFetch(`/api/product/update/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update product");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ── Delete Product ──
export const deleteProduct = createAsyncThunk<DeleteProductResponse & { id: number }, number, { rejectValue: string }>(
  "product/deleteProduct",
  async (id, { rejectWithValue }) => {
    try {
      const res  = await apiFetch(`/api/product/delete/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete product");
      return { ...data, id }; // pass id back so we can remove from state
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ── Fetch Categories ──
export const fetchCategories = createAsyncThunk<CategoriesResponse, void, { rejectValue: string }>(
  "product/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const res  = await apiFetch("/api/product/categories");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch categories");
      return data;
    } catch (err: any) { return rejectWithValue(err.message); }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    clearProductsError: (state) => { state.productsError = null; },
    clearSingleError:   (state) => { state.singleError   = null; },
    clearActionError:   (state) => { state.actionError   = null; },
    clearCurrentProduct:(state) => { state.currentProduct = null; },
  },
  extraReducers: (builder) => {
    // ── Fetch All Products ──
    builder
      .addCase(fetchAllProducts.pending,   (state) => { state.productsLoading = true;  state.productsError = null; })
      .addCase(fetchAllProducts.fulfilled, (state, action) => { state.productsLoading = false; state.products = action.payload.products; })
      .addCase(fetchAllProducts.rejected,  (state, action) => { state.productsLoading = false; state.productsError = action.payload ?? "Something went wrong"; });

    // ── Fetch Single Product ──
    builder
      .addCase(fetchProductById.pending,   (state) => { state.singleLoading = true;  state.singleError = null; })
      .addCase(fetchProductById.fulfilled, (state, action) => { state.singleLoading = false; state.currentProduct = action.payload.product; })
      .addCase(fetchProductById.rejected,  (state, action) => { state.singleLoading = false; state.singleError = action.payload ?? "Something went wrong"; });

    // ── Create Product ──
    builder
      .addCase(createProduct.pending,   (state) => { state.actionLoading = true;  state.actionError = null; })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.products.unshift(action.payload.product); // add to top of list
      })
      .addCase(createProduct.rejected,  (state, action) => { state.actionLoading = false; state.actionError = action.payload ?? "Something went wrong"; });

    // ── Update Product ──
    builder
      .addCase(updateProduct.pending,   (state) => { state.actionLoading = true;  state.actionError = null; })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.products.findIndex((p) => p.id === action.payload.product.id);
        if (idx !== -1) state.products[idx] = action.payload.product;
        if (state.currentProduct?.id === action.payload.product.id) {
          state.currentProduct = action.payload.product;
        }
      })
      .addCase(updateProduct.rejected,  (state, action) => { state.actionLoading = false; state.actionError = action.payload ?? "Something went wrong"; });

    // ── Delete Product ──
    builder
      .addCase(deleteProduct.pending,   (state) => { state.actionLoading = true;  state.actionError = null; })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.products = state.products.filter((p) => p.id !== action.payload.id);
      })
      .addCase(deleteProduct.rejected,  (state, action) => { state.actionLoading = false; state.actionError = action.payload ?? "Something went wrong"; });
  
  // ── Fetch My Products ──
    builder
      .addCase(fetchMyProducts.pending,   (state) => { state.productsLoading = true;  state.productsError = null; })
      .addCase(fetchMyProducts.fulfilled, (state, action) => { state.productsLoading = false; state.products = action.payload.products; })
      .addCase(fetchMyProducts.rejected,  (state, action) => { state.productsLoading = false; state.productsError = action.payload ?? "Something went wrong"; });



    // ── Fetch Categories ──
    builder
      .addCase(fetchCategories.pending,   (state) => { state.categoriesLoading = true;  state.categoriesError = null; })
      .addCase(fetchCategories.fulfilled, (state, action) => { state.categoriesLoading = false; state.categories = action.payload.categories; })
      .addCase(fetchCategories.rejected,  (state, action) => { state.categoriesLoading = false; state.categoriesError = action.payload ?? "Something went wrong"; });



  
    },
});

export const {
  clearProductsError,
  clearSingleError,
  clearActionError,
  clearCurrentProduct,
} = productSlice.actions;
export default productSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectProducts        = (state: { product: ProductState }) => state.product.products;
export const selectCurrentProduct  = (state: { product: ProductState }) => state.product.currentProduct;

export const selectProductsLoading = (state: { product: ProductState }) => state.product.productsLoading;
export const selectProductsError   = (state: { product: ProductState }) => state.product.productsError;

export const selectSingleLoading   = (state: { product: ProductState }) => state.product.singleLoading;
export const selectSingleError     = (state: { product: ProductState }) => state.product.singleError;

export const selectActionLoading   = (state: { product: ProductState }) => state.product.actionLoading;
export const selectActionError     = (state: { product: ProductState }) => state.product.actionError;


export const selectCategories        = (state: { product: ProductState }) => state.product.categories;
export const selectCategoriesLoading = (state: { product: ProductState }) => state.product.categoriesLoading;
export const selectCategoriesError   = (state: { product: ProductState }) => state.product.categoriesError;