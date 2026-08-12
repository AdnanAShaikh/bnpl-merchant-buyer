import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

export const SelectField = ({ label, name, required, value, onChange, error, options }: {
  label: string;
  name: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  options: { value: string; label: string }[];
}) => (
  <div className="flex flex-col gap-1 w-full">
    <div className={`border rounded-xl px-4 pt-2.5 pb-2 transition-all ${
      error ? "border-red-500 border-2" : "border-gray-200 focus-within:border-primary"
    }`}>
      <label className="text-xs text-gray-500 font-medium block mb-1">
        {label} {required && <span className="text-red-500">*</span>}
        {!required && <span className="text-gray-300 text-[10px]"> (Optional)</span>}
      </label>
      <FormControl fullWidth size="small">
        <Select
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          displayEmpty
          sx={{
            fontFamily: "inherit",
            fontSize: "14px",
            color: value ? "#1f2937" : "#9CA3AF",
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            "& .MuiSelect-select": { padding: "0", paddingRight: "24px !important" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { border: "none" },
            "&:hover .MuiOutlinedInput-notchedOutline": { border: "none" },
          }}
        >
          <MenuItem value="" disabled sx={{ fontFamily: "inherit", fontSize: "13px", color: "#9CA3AF" }}>
            Please select
          </MenuItem>
          {options.map((o) => (
            <MenuItem
              key={o.value}
              value={o.value}
              sx={{ fontFamily: "inherit", fontSize: "13px" }}
            >
              {o.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
    {error && <p className="text-xs text-red-500 pl-1">{error}</p>}
  </div>
);