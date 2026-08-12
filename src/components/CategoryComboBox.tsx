/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";

interface CategoryComboboxProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];          // existing categories
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export const CategoryCombobox = ({
  label = "Category",
  value,
  onChange,
  options,
  error,
  required,
  placeholder = "Search or type to create…",
}: CategoryComboboxProps) => {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState(value);
  const wrapRef = useRef<HTMLDivElement>(null);

  // keep the input text in sync if the parent value changes externally
  useEffect(() => { setQuery(value); }, [value]);

  // close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value); // snap back to committed value
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [query, options]);

  // is the exact typed string already an option? (case-insensitive)
  const exactMatch = useMemo(
    () => options.some((o) => o.toLowerCase() === query.trim().toLowerCase()),
    [query, options]
  );

  const canCreate = query.trim().length > 0 && !exactMatch;

  const commit = (v: string) => {
    onChange(v);
    setQuery(v);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1 w-full" ref={wrapRef}>
      {label && (
        <label className="text-sm font-medium text-primary">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none transition-colors
            ${error ? "border-red-400" : "border-gray-200 focus:border-primary"}`}
        />

        {/* chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>

        {open && (
          <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {filtered.map((opt) => {
              const selected = opt.toLowerCase() === value.trim().toLowerCase();
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => commit(opt)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50
                    ${selected ? "bg-primary/[0.04] font-semibold text-primary" : "text-gray-700"}`}
                >
                  {opt}
                </button>
              );
            })}

            {/* create-new row */}
            {canCreate && (
              <button
                type="button"
                onClick={() => commit(query.trim())}
                className="w-full text-left px-4 py-2.5 text-sm border-t border-gray-100 hover:bg-amber-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-[#e8a020] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-gray-700">
                  Create category <span className="font-semibold text-primary">"{query.trim()}"</span>
                </span>
              </button>
            )}

            {/* nothing at all */}
            {filtered.length === 0 && !canCreate && (
              <p className="px-4 py-3 text-sm text-gray-400">No categories found.</p>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
};