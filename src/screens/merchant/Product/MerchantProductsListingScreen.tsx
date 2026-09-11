/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from "react";
import SidebarMerchant from "../../../components/SidebarMerchant";
import DataTable from "../../../components/DataTable";
import type { ColumnDef, RowAction } from "../../../components/DataTable";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  fetchMyProducts,
  selectProducts,
  selectProductsLoading,
  selectProductsError,
  type Product,
} from "../../../store/slices/productSlice";

const NAVY = "#1a2a4a";

// ─── Status display ───────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; cls: string; fill: string }> = {
  Active:   { label: "Active",   cls: "bg-emerald-600", fill: "#059669" },
  Inactive: { label: "Inactive", cls: "bg-gray-500",    fill: "#6b7280" },
  Draft:    { label: "Draft",    cls: "bg-amber-400 text-gray-800", fill: "#f59e0b" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const money = (v: string | number, currency = "SAR") =>
  `${currency} ${Number(v).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-SA", { year: "numeric", month: "short", day: "numeric" });

// ─── Screen ───────────────────────────────────────────────────────────────────
const MerchantProductsListingScreen = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const products = useAppSelector(selectProducts);
  const loading  = useAppSelector(selectProductsLoading);
  const error    = useAppSelector(selectProductsError);

  useEffect(() => {
    dispatch(fetchMyProducts());
  }, [dispatch]);

  // ── Summary stats ──
  const stats = useMemo(() => {
    const active   = products.filter((p: Product) => p.status === "Active");
    const inactive = products.filter((p: Product) => p.status === "Inactive");
    const outOfStock = products.filter((p: Product) => !p.inStock);
    const inventoryValue = products.reduce((s: number, p: Product) => s + Number(p.price), 0);
    return {
      inventoryValue,
      activeCount:     active.length,
      inactiveCount:   inactive.length,
      outOfStockCount: outOfStock.length,
    };
  }, [products]);

  // ── Donut: products grouped by status ──
  const donutData = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p: Product) => { counts[p.status] = (counts[p.status] ?? 0) + 1; });
    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_META[status]?.label ?? status,
      value,
      fill: STATUS_META[status]?.fill ?? "#E5E7EB",
    }));
  }, [products]);

  const totalProducts = products.length;

  // ── Columns ──
  const COLUMNS: ColumnDef<Product>[] = [
    { key: "id", label: "ID", render: (v) => <span className="font-semibold text-primary">#{String(v)}</span> },
    {
      key: "name",
      label: "Product",
      render: (_v, row) => (
        <div className="flex items-center gap-3">
          {row.images?.[0] ? (
            <img src={row.images[0]} alt={row.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0" />
          )}
          <span className="font-medium text-primary">{row.name}</span>
        </div>
      ),
    },
    { key: "category", label: "Category" },
    { key: "sku", label: "SKU", render: (v) => v ?? "—" },
    { key: "price", label: "Price", render: (value, row) => money(value as unknown as string, row.currency) },    
    {
      key: "minOrder",
      label: "Min Order",
      render: (v, row) => `${v} ${row.unit}${Number(v) === 1 ? "" : "s"}`,
    },
    {
      key: "inStock",
      label: "Stock",
      render: (v) =>
        v ? (
          <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700">In Stock</span>
        ) : (
          <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-md bg-red-50 text-red-600">Out of Stock</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const meta = STATUS_META[String(value)] ?? { label: String(value), cls: "bg-gray-400" };
        return <span className={`inline-block text-xs font-bold px-3 py-1 rounded-md text-white ${meta.cls}`}>{meta.label}</span>;
      },
    },
    { key: "createdAt", label: "Added", render: (v) => dateFmt(String(v)) },
  ];

  // ── Row actions ──
  const eyeIcon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const ROW_ACTIONS: RowAction<Product>[] = [
    { label: "Edit Product", icon: eyeIcon, onClick: (product) => navigate(`/merchant/product/edit/${product.id}`) },
  ];

  return (
    <SidebarMerchant>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-primary">My Products</h1>
        <button
          onClick={() => navigate("/merchant/product/create")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-[#243a64] active:scale-[0.98] text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-md"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Product
        </button>
      </div>

      {/* Summary + donut */}
      <div className="flex gap-5 mb-6">
        {/* Left: stat cards */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-1">Inventory Value</p>
            <p className="text-lg font-bold text-primary">
              SAR {stats.inventoryValue.toLocaleString("en-SA", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-1">Active Products</p>
            <p className="text-2xl font-bold text-primary">{stats.activeCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-1">Inactive</p>
            <p className="text-2xl font-bold text-primary">{stats.inactiveCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-1">Out of Stock</p>
            <p className="text-2xl font-bold text-primary">{stats.outOfStockCount}</p>
          </div>
        </div>

        {/* Right: donut by status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 w-[380px] flex-shrink-0">
          <p className="text-sm font-semibold text-gray-600 mb-4">Products by Status</p>
          {totalProducts === 0 ? (
            <div className="h-[160px] flex items-center justify-center">
              <p className="text-sm text-gray-400">No products yet.</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-[160px] h-[160px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      strokeWidth={0}
                      labelLine={false}
                      label={({ cx, cy }: any) => (
                        <>
                          <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: NAVY }}>
                            {totalProducts}
                          </text>
                          <text x={cx} y={cy + 13} textAnchor="middle" style={{ fontSize: 11, fill: "#9CA3AF" }}>
                            Products
                          </text>
                        </>
                      )}
                    >
                      {donutData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: any, n: any) => [`${v} product${v === 1 ? "" : "s"}`, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex flex-col gap-2 flex-1">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: d.fill }} />
                    <span className="text-xs text-gray-500 flex-1">{d.name}</span>
                    <span className="text-xs font-bold text-primary">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 flex items-center justify-center">
          <span className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-400">Loading products…</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-sm font-semibold text-primary mb-1">Couldn't load products</p>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => dispatch(fetchMyProducts())}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-[#243a5e] transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <DataTable<Product>
          title="All Products"
          columns={COLUMNS}
          dataSource={products}
          rowActions={ROW_ACTIONS}
          searchable
          searchKeys={["id", "name", "sku", "category"]}
          showStatusFilter
          statusOptions={["Active", "Inactive", "Draft", "All Status"]}
          defaultStatus="All Status"
          defaultPageSize={10}
        />
      )}
    </SidebarMerchant>
  );
};

export default MerchantProductsListingScreen;