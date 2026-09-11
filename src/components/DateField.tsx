import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

export const DateField = ({
  label,
  required = false,
  value, // stored as "yyyy-MM-dd" string, matching your other inputs
  onChange,
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) => (
  <div className="flex flex-col gap-1 w-full">
    <div
      className={`border rounded-xl px-4 pt-2.5 transition-all ${
        error
          ? "border-red-500 border-2"
          : "border-gray-200 focus-within:border-primary"
      }`}
    >
      <span className="block text-xs text-gray-500 font-medium">
        {label}{" "}
        {required ? (
          <span className="text-red-500">*</span>
        ) : (
          <span className="text-gray-400 font-normal">(optional)</span>
        )}
      </span>

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          value={value ? new Date(value) : null}
          onChange={(d) => {
            // convert back to "yyyy-MM-dd" string for your form state
            if (d && !isNaN(d.getTime())) {
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const dd = String(d.getDate()).padStart(2, "0");
              onChange(`${yyyy}-${mm}-${dd}`);
            } else {
              onChange("");
            }
          }}
          slotProps={{
            textField: {
              variant: "standard",
              fullWidth: true,
              sx: {
                "& .MuiInputBase-input": {
                  fontFamily: "inherit",
                  fontSize: "14px",
                  color: "#1f2937",
                  padding: 0,
                  marginTop: "4px",
                },
              },
            },
          }}
        />
      </LocalizationProvider>
    </div>
    {error && <p className="text-xs text-red-500 pl-1">{error}</p>}
  </div>
);
