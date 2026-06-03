import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface FileInputProps {
  label:        string;
  hint?:        string;
  required?:    boolean;
  // ── Upload mode (edit screens where entity ID exists) ──
  documentType?: string;
  entityType?:   "buyer" | "merchant";
  entityId?:     number;
  onUploaded?:   (doc: any) => void;
  // ── Collect mode (create/register screens where ID doesn't exist yet) ──
  onFileSelected?: (file: File | null) => void;
  selectedFile?:   File | null;
}

export const FileInput = ({
  label,
  hint,
  required,
  documentType,
  entityType,
  entityId,
  onUploaded,
  onFileSelected,
  selectedFile,
}: FileInputProps) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [status,   setStatus]   = useState<UploadStatus>("idle");
  const [error,    setError]    = useState<string | null>(null);

  // Sync selectedFile prop into local state (collect mode)
  useEffect(() => {
    if (selectedFile) {
      setFileName(selectedFile.name);
      setStatus("success");
    } else {
      setFileName(null);
      setStatus("idle");
    }
  }, [selectedFile]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // ── Collect mode — just store the file, don't upload yet ──
    if (onFileSelected) {
      onFileSelected(file);
      setStatus("success");
      return;
    }

    // ── Upload mode — needs entityType, entityId, documentType ──
    if (!entityType || !entityId || !documentType) return;

    setStatus("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file",         file);
      formData.append("documentType", documentType);
      formData.append("entityType",   entityType);
      formData.append("entityId",     String(entityId));

      const res  = await fetch("/api/document/upload", {
        method: "POST",
        body:   formData,
        // Do NOT set Content-Type — browser sets it with boundary automatically
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      setStatus("success");
      toast.success("Successfully uploaded and Saved File Changes");
      onUploaded?.(data.document);

    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Upload failed");
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Label + hint */}
      <div className="flex flex-col gap-0.5 pl-1 mb-1">
        <label className="text-sm text-gray-600 font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>

      {/* Upload area */}
      <label className={`flex items-center gap-3 border border-dashed rounded-xl px-4 py-3 cursor-pointer transition-all
        ${status === "success"   ? "border-green-400 bg-green-50"
        : status === "error"     ? "border-red-400 bg-red-50"
        : status === "uploading" ? "border-blue-300 bg-blue-50 cursor-not-allowed"
        : "border-gray-300 hover:border-[#1a2a4a] hover:bg-gray-50"}`}
      >
        {/* Icon */}
        {status === "uploading" ? (
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : status === "success" ? (
          <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : status === "error" ? (
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        )}

        {/* Text */}
        <span className={`text-sm ${
          status === "success"   ? "text-green-600"
          : status === "error"   ? "text-red-500"
          : status === "uploading" ? "text-blue-400"
          : "text-gray-400"
        }`}>
          {status === "uploading" ? "Uploading..."
          : status === "success"  ? fileName
          : status === "error"    ? (error ?? "Upload failed — click to retry")
          : (fileName ?? "Click to upload file")}
        </span>

        <input
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          disabled={status === "uploading"}
          onChange={handleChange}
        />
      </label>
    </div>
  );
};