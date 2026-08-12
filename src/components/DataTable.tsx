import React, { useState, useMemo } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";

const NAVY = "#1a2a4a";
const PAGE_SIZES = [10, 20, 30, 40, 50];

// ─── Types ────────────────────────────────────────────────────────────────────

export type ColumnDef<Row> = {
  [Field in keyof Row]: {
    key: Field;
    label: string;
    render?: (value: Row[Field], row: Row) => React.ReactNode;
  };
}[keyof Row];

export interface RowAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  /** Optional: hide action based on row data */
  hidden?: (row: T) => boolean;
}

export interface DataTableProps<T extends { id: number | string }> {
  /** Table title shown top-left e.g. "All Users" */
  title?: string;
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Data array */
  dataSource: T[];
  /** 3-dot row actions. Omit to hide the actions column */
  rowActions?: RowAction<T>[];
  /** Show search bar. Default: true */
  searchable?: boolean;
  /** Keys to include in search. Defaults to all column keys */
  searchKeys?: (keyof T)[];
  /** Show status filter dropdown. Default: false */
  showStatusFilter?: boolean;
  /** Key used for status filtering. Default: "status" */
  statusKey?: keyof T;
  /** Status filter options e.g. ["Active","Inactive","All Status"]. Last option treated as "show all" */
  statusOptions?: string[];
  /** Default selected status filter value */
  defaultStatus?: string;
  /** Top-right action button */
  actionButton?: React.ReactNode;
  /** Default page size */
  defaultPageSize?: number;
}

// ─── Internal: Three-dot Row Menu ────────────────────────────────────────────
function RowMenu<T>({ row, actions }: { row: T; actions: RowAction<T>[] }) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const visible = actions.filter((a) => !a.hidden?.(row));
  if (visible.length === 0) return null;

  return (
    <>
      <button
        onClick={(e) => setAnchor(e.currentTarget)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              minWidth: 180,
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              "& .MuiMenuItem-root": {
                fontSize: "14px",
                fontFamily: "inherit",
                gap: "10px",
                padding: "10px 16px",
                color: "#374151",
                "&:hover": { background: "#F9FAFB" },
              },
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {visible.map((a) => (
          <MenuItem
            key={a.label}
            onClick={() => { a.onClick(row); setAnchor(null); }}
          >
            {a.icon && <span className="text-gray-400">{a.icon}</span>}
            {a.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

// ─── Internal: Pagination ─────────────────────────────────────────────────────
function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const maxVisible = 10;
  const start = Math.max(1, Math.min(page - Math.floor(maxVisible / 2), totalPages - maxVisible + 1));
  const end = Math.min(totalPages, start + maxVisible - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const btn = "min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-all duration-150";

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className={`${btn} flex items-center gap-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`${btn} ${p === page ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"}`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className={`${btn} flex items-center gap-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        Next
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────
function DataTable<T extends { id: number | string }>({
  title,
  columns,
  dataSource,
  rowActions,
  searchable = true,
  searchKeys,
  showStatusFilter = false,
  statusKey = "status" as keyof T,
  statusOptions = ["Active", "Inactive", "All Status"],
  defaultStatus,
  actionButton,
  defaultPageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(defaultStatus ?? statusOptions[0]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Keys to search across — defaults to all column keys
  const keysToSearch = searchKeys ?? columns.map((c) => c.key);

  // "All" option = last item in statusOptions
  const allStatusValue = statusOptions[statusOptions.length - 1];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return dataSource.filter((row) => {
      const matchSearch =
        !q ||
        keysToSearch.some((k) =>
          String(row[k] ?? "").toLowerCase().includes(q)
        );
      const matchStatus =
        statusFilter === allStatusValue ||
        String(row[statusKey] ?? "") === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, dataSource]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const resetPage = () => setPage(1);

  const selectSx = {
    borderRadius: "10px",
    fontFamily: "inherit",
    fontSize: "14px",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E5E7EB" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: NAVY },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: NAVY },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* ── Header ── */}
      {(title || actionButton) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          {title && <p className="text-base font-semibold text-primary">{title}</p>}
          {actionButton && <div>{actionButton}</div>}
        </div>
      )}

      {/* ── Filters ── */}
      {(searchable || showStatusFilter) && (
        <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100">
          {searchable && (
            <div className="flex-1 relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary transition-colors placeholder:text-gray-300"
              />
            </div>
          )}

          {showStatusFilter && (
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <span className="text-sm text-gray-500 font-medium">Status</span>
              <FormControl size="small">
                <Select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
                  sx={{ minWidth: 140, ...selectSx }}
                >
                  {statusOptions.map((opt) => (
                    <MenuItem key={opt} value={opt} sx={{ fontFamily: "inherit", fontSize: "14px" }}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ background: "#EFF4F8" }}>
              {columns.map((col) => (
                <TableCell
                  key={String(col.key)}
                  sx={{
                    fontFamily: "inherit", fontWeight: 700, fontSize: "12px",
                    color: "#6B7280", letterSpacing: "0.05em",
                    background: "#EFF4F8", borderBottom: "1px solid #E5E7EB",
                    textTransform: "uppercase",
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
              {rowActions && rowActions.length > 0 && (
                <TableCell sx={{ background: "#EFF4F8", borderBottom: "1px solid #E5E7EB", width: 48 }} />
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                  sx={{ textAlign: "center", py: 6, color: "#9CA3AF", fontFamily: "inherit", fontSize: "14px", borderBottom: "none" }}
                >
                  No data found.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row, idx) => (
                <TableRow
                  key={row.id}
                  sx={{
                    background: idx % 2 === 0 ? "#fff" : "#FAFAFA",
                    "&:hover": { background: "#F0F4F8" },
                    transition: "background .15s",
                  }}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={String(col.key)}
                      sx={{
                        fontFamily: "inherit", fontSize: "14px", color: "#374151",
                        borderBottom: "1px solid #F3F4F6", py: 1.5, px: 2,
                      }}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] as React.ReactNode)}
                    </TableCell>
                  ))}
                  {rowActions && rowActions.length > 0 && (
                    <TableCell sx={{ borderBottom: "1px solid #F3F4F6", py: 1.5, px: 2, width: 48 }}>
                      <RowMenu row={row} actions={rowActions} />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Footer: Pagination + Page size ── */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
        <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
        <FormControl size="small">
          <Select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); resetPage(); }}
            sx={{ minWidth: 80, ...selectSx }}
          >
            {PAGE_SIZES.map((s) => (
              <MenuItem key={s} value={s} sx={{ fontFamily: "inherit", fontSize: "14px" }}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    </div>
  );
}

export default DataTable;