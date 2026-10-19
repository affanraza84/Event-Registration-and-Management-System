"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface ImageUploadProps {
  value?: string;
  publicId?: string;
  onChange: (url: string, publicId: string) => void;
  onRemove?: () => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  uploadType?: "event" | "profile";
  eventId?: string;
}

const MAX_SIZE_MB = 5;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function ImageUpload({
  value = "",
  publicId = "",
  onChange,
  onRemove,
  onUploadStateChange,
  disabled = false,
  label = "Event Cover Poster",
  helperText = "Upload a high-resolution banner (JPEG, PNG, WebP up to 5MB). Landscape 16:9 recommended.",
  uploadType = "event",
  eventId,
}: ImageUploadProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [localPublicId, setLocalPublicId] = useState<string | null>(null);
  const [prevValue, setPrevValue] = useState<string>(value);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset local override when parent value prop changes (React recommended pattern)
  if (value !== prevValue) {
    setPrevValue(value);
    setLocalPreview(null);
    setLocalPublicId(null);
    setImageLoadError(false);
  }

  const preview = localPreview !== null ? localPreview : value;
  const currentPublicId = localPublicId !== null ? localPublicId : publicId;

  const updateUploading = (uploading: boolean) => {
    setIsUploading(uploading);
    onUploadStateChange?.(uploading);
  };

  const handleFileProcess = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(false);
    setImageLoadError(false);

    // 1. Client-side format validation
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError(
        "Unsupported format. Please select a JPEG, PNG, WebP, or GIF image."
      );
      return;
    }

    // 2. Client-side size validation
    if (file.size > MAX_BYTES) {
      setUploadError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is ${MAX_SIZE_MB}MB.`
      );
      return;
    }

    // 3. Create local preview
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    updateUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", uploadType);
      if (eventId) {
        formData.append("eventId", eventId);
      }
      if (currentPublicId) {
        formData.append("previousPublicId", currentPublicId);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image to Cloudinary");
      }

      setLocalPublicId(data.publicId);
      setLocalPreview(data.secureUrl);
      setUploadSuccess(true);
      onChange(data.secureUrl, data.publicId);
    } catch (err) {
      console.error("Upload error:", err);
      // Revert preview on failure
      setLocalPreview(null);
      setUploadError(
        err instanceof Error
          ? err.message
          : "Failed to upload image. Please verify your connection."
      );
    } finally {
      updateUploading(false);
      // Give browser time to display the newly returned secureUrl before revoking blob
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileProcess(files[0]);
    }
    // reset input so the same file can be re-selected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileProcess(files[0]);
    }
  };

  const handleRemove = async () => {
    const publicIdToDelete = currentPublicId;
    setLocalPreview("");
    setLocalPublicId("");
    setUploadError(null);
    setUploadSuccess(false);
    setImageLoadError(false);
    onChange("", "");
    onRemove?.();

    if (publicIdToDelete) {
      try {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: publicIdToDelete }),
        });
      } catch (err) {
        console.warn("Failed to delete removed asset from Cloudinary:", err);
      }
    }
  };

  const isProfile = uploadType === "profile";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-[#171923] uppercase tracking-wider">
          {label}
        </label>
        {uploadSuccess && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#059669]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Uploaded to Cloudinary
          </span>
        )}
      </div>

      {preview ? (
        <div
          className={`relative group overflow-hidden border border-[#E8E5DF] bg-[#FAF9F6] shadow-xs transition-all ${
            isProfile
              ? "w-32 h-32 rounded-full mx-auto"
              : "w-full h-56 sm:h-72 min-h-[224px] rounded-xl"
          }`}
        >
          {!imageLoadError ? (
            <Image
              src={preview}
              alt={label}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 750px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              priority={false}
              onError={() => setImageLoadError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#FEF2F2] p-4 text-center">
              <AlertCircle className="w-6 h-6 text-[#DC2626] mb-1" />
              <p className="text-xs font-medium text-[#DC2626]">
                Unable to display image preview
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-xs text-[#5146E5] underline cursor-pointer"
              >
                Choose another file
              </button>
            </div>
          )}

          {/* Top-right Status Badge */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-[#E8E5DF] shadow-xs text-[11px] font-semibold text-[#171923]">
            <CheckCircle2 className="w-3 h-3 text-[#059669]" />
            <span>Ready</span>
          </div>

          {/* Bottom Action Controls */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 sm:p-4 flex items-center justify-between z-10">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-[#171923] text-xs font-semibold rounded-lg shadow-sm backdrop-blur-xs transition-all cursor-pointer disabled:opacity-50 hover:shadow"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#5146E5]" />
              <span>Replace</span>
            </button>

            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold rounded-lg shadow-sm backdrop-blur-xs transition-all cursor-pointer disabled:opacity-50 hover:shadow"
              title="Remove image"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>

          {/* Uploading progress indicator overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
              <Loader2 className="w-7 h-7 text-[#5146E5] animate-spin" />
              <span className="text-xs font-semibold text-[#171923]">
                Optimizing & uploading to Cloudinary...
              </span>
              <span className="text-[11px] text-[#686D78]">
                Please wait a moment
              </span>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isUploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
            isDragging
              ? "border-[#5146E5] bg-[#EEEAFE]/40"
              : "border-[#E8E5DF] hover:border-[#D5D1C8] bg-white hover:bg-[#FAF9F6]"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-[#5146E5] animate-spin" />
              <p className="text-xs font-medium text-[#171923]">
                Uploading image to Cloudinary...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center mb-3">
                {isDragging ? (
                  <UploadCloud className="w-6 h-6 animate-bounce" />
                ) : (
                  <ImageIcon className="w-6 h-6" />
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#171923]">
                <span className="text-[#5146E5]">Click to upload</span> or drag and drop
              </p>
              <p className="text-[11px] text-[#686D78] mt-1 max-w-sm">
                JPEG, PNG, WebP or GIF (Max {MAX_SIZE_MB}MB). We automatically optimize quality and format.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
        aria-label="Upload poster file"
      />

      {/* Error message */}
      {uploadError && (
        <div className="flex items-start gap-1.5 p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Helper text */}
      {!uploadError && helperText && !preview && (
        <p className="text-[11px] text-[#686D78]">{helperText}</p>
      )}
    </div>
  );
}
