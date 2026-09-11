/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import SidebarMerchant from "../../../components/SidebarMerchant";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { Input } from "../../../components/Input";
import { SelectField } from "../../../components/SelectField";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchProductById,
  updateProduct,
  clearCurrentProduct,
  fetchCategories,
  selectCurrentProduct,
  selectSingleLoading,
  selectSingleError,
  selectActionLoading,
  selectCategories,
} from "../../../store/slices/productSlice";
import { toast } from "react-toastify";
import { CategoryCombobox } from "../../../components/CategoryComboBox";

const NAVY = "#1a2a4a";

type Errors = Record<string, string>;

const STATUS_STYLES: Record<string, string> = {
  Active:   "bg-emerald-600",
  Inactive: "bg-gray-500",
  Draft:    "bg-amber-400 text-gray-800",
};

const STATUSES = [
  { value: "Active",   label: "Active"   },
  { value: "Inactive", label: "Inactive" },
  { value: "Draft",    label: "Draft"    },
];

const UNITS = [
  { value: "unit",   label: "Unit"   },
  { value: "piece",  label: "Piece"  },
  { value: "box",    label: "Box"    },
  { value: "carton", label: "Carton" },
  { value: "kg",     label: "Kilogram" },
  { value: "litre",  label: "Litre"  },
  { value: "pack",   label: "Pack"   },
];

// ─── Tab 1: Details (editable) ────────────────────────────────────────────────
const DetailsTab = ({ data, onChange, errors, categories }: any) => (
  <div className="flex flex-col gap-4">
    <Input
      label="Product Name" name="name"
      required
      value={data.name} onChange={(v: any) => onChange("name", v)}
      error={errors.name}
    />
    <Input
      label="Description" name="description"
      value={data.description} onChange={(v: any) => onChange("description", v)}
      error={errors.description}
    />
    <div className="grid grid-cols-2 gap-4">
      <CategoryCombobox
        value={data.category}
        onChange={(v) => onChange("category", v)}
        options={categories}
        error={errors.category}
        required
      />
      <Input
        label="SKU" name="sku"
        value={data.sku} onChange={(v: any) => onChange("sku", v)}
        error={errors.sku}
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input
        label="Price (SAR)" name="price" type="number"
        required
        value={data.price} onChange={(v: any) => onChange("price", v)}
        error={errors.price}
      />
      <Input
        label="Minimum Order" name="minOrder" type="number"
        required
        value={data.minOrder} onChange={(v: any) => onChange("minOrder", v)}
        error={errors.minOrder}
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <SelectField
        label="Unit" name="unit"
        required
        value={data.unit} onChange={(v: any) => onChange("unit", v)}
        options={UNITS}
        error={errors.unit}
      />
      <SelectField
        label="Status" name="status"
        required
        value={data.status} onChange={(v: any) => onChange("status", v)}
        options={STATUSES}
        error={errors.status}
      />
    </div>
    <label className="flex items-center gap-3 border-2 border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-gray-300 transition-all w-fit">
      <input
        type="checkbox"
        checked={data.inStock}
        onChange={(e) => onChange("inStock", e.target.checked)}
        className="w-5 h-5 accent-primary cursor-pointer"
      />
      <span className="text-sm font-medium text-primary">In Stock</span>
    </label>
  </div>
);

// ─── Tab 2: Images (coming soon) ──────────────────────────────────────────────
const ImagesTab = ({ product }: { product: any }) => (
  <div className="flex flex-col gap-5">
    {product.images?.length > 0 ? (
      <div className="grid grid-cols-4 gap-3">
        {product.images.map((url: string, i: number) => (
          <div key={i} className="aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
            <img src={url} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-primary">No images yet</p>
        <p className="text-xs text-gray-400 max-w-sm text-center leading-relaxed">
          Image uploads are coming soon.
        </p>
      </div>
    )}
  </div>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const MerchantEditProductScreen = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const product     = useAppSelector(selectCurrentProduct);
  const loading     = useAppSelector(selectSingleLoading);
  const error       = useAppSelector(selectSingleError);
  const saving      = useAppSelector(selectActionLoading);
  const categories  = useAppSelector(selectCategories);

  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors]       = useState<Errors>({});
  const initialized = useRef(false);

  const [data, setData] = useState({
    name:        "",
    description: "",
    category:    "",
    sku:         "",
    price:       "",
    minOrder:    "1",
    unit:        "unit",
    status:      "Active",
    inStock:     true,
  });

  // fetch product + categories on mount, clear on unmount
  useEffect(() => {
    if (id) dispatch(fetchProductById(Number(id)));
    dispatch(fetchCategories());
    return () => { dispatch(clearCurrentProduct()); };
  }, [id, dispatch]);

  // seed the form once the product arrives
  useEffect(() => {
    if (product && !initialized.current) {
      initialized.current = true;
      setData({
        name:        product.name        ?? "",
        description: product.description  ?? "",
        category:    product.category     ?? "",
        sku:         product.sku          ?? "",
        price:       product.price != null ? String(product.price) : "",
        minOrder:    product.minOrder != null ? String(product.minOrder) : "1",
        unit:        product.unit         ?? "unit",
        status:      product.status       ?? "Active",
        inStock:     product.inStock ?? true,
      });
    }
  }, [product]);

  const patch = (k: string, v: any) => {
    setData((p) => ({ ...p, [k]: v }));
    setErrors((prev) => (prev[k] ? { ...prev, [k]: "" } : prev));
  };

  const validate = () => {
    const e: Errors = {};
    if (!data.name.trim())     e.name     = "Product name is required";
    if (!data.category.trim()) e.category = "Category is required";
    if (data.price === "" || Number.isNaN(Number(data.price))) {
      e.price = "Enter a valid price";
    } else if (Number(data.price) <= 0) {
      e.price = "Price must be greater than 0";
    }
    if (data.minOrder === "" || Number.isNaN(Number(data.minOrder)) || Number(data.minOrder) < 1) {
      e.minOrder = "Minimum order must be at least 1";
    }
    if (!data.unit)   e.unit   = "Unit is required";
    if (!data.status) e.status = "Status is required";
    return e;
  };

  const handleSave = async () => {
    if (!product) return;

    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setActiveTab(0);
      return;
    }

    const result = await dispatch(updateProduct({
      id:          product.id,
      name:        data.name.trim(),
      description: data.description.trim() || undefined,
      category:    data.category.trim(),
      price:       Number(data.price),
      sku:         data.sku.trim() || undefined,
      minOrder:    Number(data.minOrder) || 1,
      unit:        data.unit,
      status:      data.status,
      inStock:     data.inStock,
    }));

    if (updateProduct.fulfilled.match(result)) {
      toast.success("Product updated successfully!");
    } else {
      toast.error((result.payload as string) || "Failed to update product. Please try again.");
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <SidebarMerchant>
        <div className="flex items-center justify-center h-64">
          <span className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-400">Loading product...</span>
        </div>
      </SidebarMerchant>
    );
  }

  // ── Error / not found ──
  if (error || !product) {
    return (
      <SidebarMerchant>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-sm font-semibold text-primary mb-1">Couldn't load this product</p>
          <p className="text-sm text-gray-400 mb-4">{error || "Product not found."}</p>
          <button
            onClick={() => navigate("/merchant/products")}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-[#243a5e] transition-colors"
          >
            Back to Products
          </button>
        </div>
      </SidebarMerchant>
    );
  }

  return (
    <SidebarMerchant>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/merchant/products")}
            className="text-gray-400 hover:text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-primary">
              Edit Product
              <span className="text-sm text-gray-400 font-medium ml-2">#{product.id}</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {product.name} · {product.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-lg text-white ${STATUS_STYLES[product.status] ?? "bg-gray-400"}`}>
            {product.status}
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 bg-primary hover:bg-[#243a64] active:scale-[0.98] text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-md disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-100 px-2">
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            slotProps={{ indicator: { style: { background: NAVY, height: 3, borderRadius: 2 } } }}
            sx={{
              "& .MuiTab-root": {
                textTransform: "none", fontFamily: "inherit",
                fontSize: "14px", fontWeight: 500,
                color: "#6B7280", minHeight: 52, padding: "0 20px",
              },
              "& .Mui-selected": { color: `${NAVY} !important`, fontWeight: 600 },
            }}
          >
            <Tab label="Details" value={0} />
            <Tab label="Images"  value={1} />
          </Tabs>
        </div>

        {/* Content */}
        <div className="p-7">
          {activeTab === 0 && (
            <DetailsTab data={data} onChange={patch} errors={errors} categories={categories} />
          )}
          {activeTab === 1 && <ImagesTab product={product} />}
        </div>
      </div>
    </SidebarMerchant>
  );
};

export default MerchantEditProductScreen;