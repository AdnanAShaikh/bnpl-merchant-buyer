export const Input = ({
  label,
  name,
  type = "text",
  placeholder = "Please enter",
  required = false,
  value,
  onChange,
  error,
  showToggle,
  onToggle,
  show,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  showToggle?: boolean;
  onToggle?: () => void;
  show?: boolean;
}) => (
  <div className="flex flex-col gap-1 w-full">
    <label
      className={`border rounded-xl px-4 pt-2.5 pb-2 transition-all block cursor-text ${
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
      <div className="flex items-center gap-2">
        <input
          name={name}
          type={showToggle ? (show ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm text-gray-800 outline-none placeholder:text-gray-300 bg-transparent mt-1"
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            {show ? (
              <svg
                className="w-[18px] h-[18px]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              <svg
                className="w-[18px] h-[18px]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            )}
          </button>
        )}
      </div>
    </label>
    {error && <p className="text-xs text-red-500 pl-1">{error}</p>}
  </div>
);
