"use client";

import { useState, useEffect, useRef, DragEvent, useCallback } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Plus,
  Sparkles,
  ShieldAlert,
  Clock,
  ExternalLink,
  Film,
  Filter,
} from "lucide-react";
import {
  getGalleryThumbnailUrl,
  getVideoThumbnailUrl,
  getAdaptiveVideoUrl,
} from "@/lib/mediaTransformations";
import { getClearErrorMessage } from "@/utils/errorMessage";

export interface MediaAssetItem {
  id: string;
  publicId: string;
  secureUrl: string;
  resourceType: "image" | "video";
  assetType: "poster" | "banner" | "gallery" | "promo_video";
  format: string;
  eventId: string;
  uploadedBy: string;
  tags: string[];
  tagSource?: "cloudinary_ai" | "context" | "manual";
  moderationStatus: "pending" | "approved" | "rejected";
  processingStatus: "uploading" | "ready" | "failed";
  moderationReason?: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  createdAt: string;
}

interface MediaLibraryProps {
  eventId: string;
  eventTitle?: string;
  isHost?: boolean;
  onCoverSelected?: (url: string, publicId: string) => void;
  className?: string;
}

type TabType = "all" | "gallery" | "posters" | "videos";
type StatusFilter = "all" | "approved" | "pending" | "rejected";

export default function MediaLibrary({
  eventId,
  eventTitle = "Event",
  isHost = true,
  onCoverSelected,
  className = "",
}: MediaLibraryProps) {
  const [assets, setAssets] = useState<MediaAssetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadAssetType, setUploadAssetType] = useState<"gallery" | "poster" | "banner" | "promo_video">("gallery");
  const [isDragging, setIsDragging] = useState(false);

  // Preview & Modal states
  const [previewAsset, setPreviewAsset] = useState<MediaAssetItem | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<MediaAssetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tag editing state
  const [editingTagAssetId, setEditingTagAssetId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState("");
  const [isSavingTag, setIsSavingTag] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch event media assets
  const fetchMediaAssets = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    setUploadError(null);

    try {
      const url = new URL("/api/media", window.location.origin);
      url.searchParams.set("eventId", eventId);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch event media");
      }

      setAssets(data.assets || []);
    } catch (err) {
      console.error("Fetch media error:", err);
      setUploadError(
        getClearErrorMessage(err, "Unable to load media assets for this event.")
      );
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      if (!eventId) return;
      try {
        const url = new URL("/api/media", window.location.origin);
        url.searchParams.set("eventId", eventId);
        const res = await fetch(url.toString());
        const data = await res.json();
        if (!ignore) {
          if (!res.ok) {
            throw new Error(data.error || "Failed to fetch event media");
          }
          setAssets(data.assets || []);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Fetch media error:", err);
          setUploadError(
            getClearErrorMessage(err, "Unable to load media assets for this event.")
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadInitial();
    return () => {
      ignore = true;
    };
  }, [eventId]);

  // 2. Upload file handler
  const handleUploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append("eventId", eventId);
    formData.append("assetType", uploadAssetType);

    for (const file of files) {
      formData.append("files", file);
    }

    try {
      setUploadProgress(40);
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Media upload failed.");
      }

      setUploadProgress(100);
      setUploadSuccess(
        `Successfully uploaded ${data.count || files.length} asset${files.length > 1 ? "s" : ""}.`
      );

      // Refresh library list
      await fetchMediaAssets();

      // Clear success feedback after 3 seconds
      setTimeout(() => {
        setUploadSuccess(null);
        setUploadProgress(null);
      }, 3500);
    } catch (err) {
      console.error("Media upload error:", err);
      setUploadError(
        getClearErrorMessage(
          err,
          "Failed to upload media. Please check file sizes and formats."
        )
      );
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 3. Delete asset handler
  const confirmDeleteAsset = async () => {
    if (!assetToDelete) return;
    setIsDeleting(true);
    setUploadError(null);

    try {
      const res = await fetch(`/api/media/${assetToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete media asset.");
      }

      setAssets((prev) => prev.filter((a) => a.id !== assetToDelete.id));
      if (previewAsset?.id === assetToDelete.id) {
        setPreviewAsset(null);
      }
      setAssetToDelete(null);
    } catch (err) {
      console.error("Delete media error:", err);
      setUploadError(
        getClearErrorMessage(
          err,
          "Failed to delete the selected asset. Please try again."
        )
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // 4. Tag update handler
  const handleAddTag = async (asset: MediaAssetItem) => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;

    if (asset.tags.includes(trimmed)) {
      setNewTagInput("");
      setEditingTagAssetId(null);
      return;
    }

    setIsSavingTag(true);
    const updatedTags = [...asset.tags, trimmed];

    try {
      const res = await fetch(`/api/media/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update tags.");
      }

      setAssets((prev) =>
        prev.map((a) => (a.id === asset.id ? { ...a, tags: data.asset.tags, tagSource: "manual" } : a))
      );
      if (previewAsset?.id === asset.id) {
        setPreviewAsset((prev) => (prev ? { ...prev, tags: data.asset.tags, tagSource: "manual" } : null));
      }

      setNewTagInput("");
      setEditingTagAssetId(null);
    } catch (err) {
      console.error("Tag update error:", err);
      setUploadError(
        getClearErrorMessage(err, "Failed to update asset tags. Please try again.")
      );
    } finally {
      setIsSavingTag(false);
    }
  };

  const handleRemoveTag = async (asset: MediaAssetItem, tagToRemove: string) => {
    const updatedTags = asset.tags.filter((t) => t !== tagToRemove);
    setIsSavingTag(true);

    try {
      const res = await fetch(`/api/media/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove tag.");
      }

      setAssets((prev) =>
        prev.map((a) => (a.id === asset.id ? { ...a, tags: data.asset.tags, tagSource: "manual" } : a))
      );
      if (previewAsset?.id === asset.id) {
        setPreviewAsset((prev) => (prev ? { ...prev, tags: data.asset.tags, tagSource: "manual" } : null));
      }
    } catch (err) {
      console.error("Tag removal error:", err);
      setUploadError(
        getClearErrorMessage(err, "Failed to remove tag. Please try again.")
      );
    } finally {
      setIsSavingTag(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  // Filter assets by tab and status
  const filteredAssets = assets.filter((asset) => {
    // Tab filter
    if (activeTab === "gallery" && asset.assetType !== "gallery") return false;
    if (activeTab === "posters" && asset.assetType !== "poster" && asset.assetType !== "banner")
      return false;
    if (activeTab === "videos" && asset.resourceType !== "video") return false;

    // Moderation status filter (for host)
    if (statusFilter !== "all" && asset.moderationStatus !== statusFilter) return false;

    return true;
  });

  const counts = {
    all: assets.length,
    gallery: assets.filter((a) => a.assetType === "gallery").length,
    posters: assets.filter((a) => a.assetType === "poster" || a.assetType === "banner").length,
    videos: assets.filter((a) => a.resourceType === "video").length,
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header & Upload Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#E8E5DF]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[#171923]">Event Media Intelligence</h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEEAFE] text-[#5146E5]">
              <Sparkles className="w-3 h-3" />
              <span>Cloudinary Powered</span>
            </span>
          </div>
          <p className="text-xs text-[#686D78] mt-1">
            Manage high-resolution posters, photo gallery, and promotional videos with smart transforms and AI tagging.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "all"
                ? "bg-white text-[#171923] shadow-2xs border border-[#E8E5DF]"
                : "text-[#686D78] hover:text-[#171923]"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gallery")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "gallery"
                ? "bg-white text-[#171923] shadow-2xs border border-[#E8E5DF]"
                : "text-[#686D78] hover:text-[#171923]"
            }`}
          >
            Gallery ({counts.gallery})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("posters")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "posters"
                ? "bg-white text-[#171923] shadow-2xs border border-[#E8E5DF]"
                : "text-[#686D78] hover:text-[#171923]"
            }`}
          >
            Posters ({counts.posters})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("videos")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "videos"
                ? "bg-white text-[#171923] shadow-2xs border border-[#E8E5DF]"
                : "text-[#686D78] hover:text-[#171923]"
            }`}
          >
            Videos ({counts.videos})
          </button>
        </div>
      </div>

      {/* Host Upload Dropzone */}
      {isHost && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-[#686D78]">
            <div className="flex items-center gap-2">
              <span>Upload as:</span>
              <select
                value={uploadAssetType}
                onChange={(e) =>
                  setUploadAssetType(
                    e.target.value as "gallery" | "poster" | "banner" | "promo_video"
                  )
                }
                className="px-2.5 py-1 text-xs font-semibold bg-white border border-[#E8E5DF] rounded-lg text-[#171923] focus:outline-hidden focus:border-[#5146E5]"
              >
                <option value="gallery">Gallery Photo</option>
                <option value="poster">Event Poster / Cover</option>
                <option value="banner">Wide Panoramic Banner</option>
                <option value="promo_video">Promotional Video</option>
              </select>
            </div>
            <span className="text-[11px] text-[#A0A4AB]">
              Images: JPEG/PNG/WebP (≤5MB) • Videos: MP4/WebM/MOV (≤50MB)
            </span>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? "border-[#5146E5] bg-[#EEEAFE]/40 scale-[0.99]"
                : "border-[#E8E5DF] hover:border-[#D5D1C8] bg-white hover:bg-[#FAF9F6]"
            } ${isUploading ? "opacity-75 pointer-events-none" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              onChange={(e) => {
                if (e.target.files) handleUploadFiles(e.target.files);
              }}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-full bg-[#EEEAFE] text-[#5146E5] flex items-center justify-center">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-[#171923]">
                {isUploading
                  ? "Uploading and processing assets with Cloudinary..."
                  : "Click or drag & drop files here to upload"}
              </p>
              <p className="text-xs text-[#686D78] mt-0.5">
                Multi-file upload supported. Assets are automatically optimized, tagged, and delivered via CDN.
              </p>
            </div>

            {uploadProgress !== null && (
              <div className="w-full max-w-xs mt-2 space-y-1">
                <div className="w-full bg-[#E8E5DF] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#5146E5] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium text-[#686D78]">{uploadProgress}% complete</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback Banners */}
      {uploadError && (
        <div
          role="alert"
          className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626] flex items-start gap-2.5 animate-fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{uploadError}</span>
        </div>
      )}

      {uploadSuccess && (
        <div
          role="status"
          className="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-xs text-[#16A34A] flex items-center gap-2.5 animate-fade-in"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Moderation filter for Hosts */}
      {isHost && assets.length > 0 && (
        <div className="flex items-center justify-between text-xs text-[#686D78]">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#A0A4AB]" />
            <span className="font-medium">Filter by Moderation:</span>
            <div className="inline-flex gap-1">
              {(["all", "approved", "pending", "rejected"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                    statusFilter === status
                      ? "bg-[#171923] text-white"
                      : "bg-[#FAF9F6] border border-[#E8E5DF] text-[#686D78] hover:text-[#171923]"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <span className="text-[11px] text-[#A0A4AB]">
            Showing {filteredAssets.length} of {assets.length} assets
          </span>
        </div>
      )}

      {/* Asset Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-[#E8E5DF]/50 rounded-2xl" />
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="py-12 text-center bg-white border border-[#E8E5DF] rounded-2xl p-8 space-y-3">
          <div className="w-12 h-12 bg-[#FAF9F6] border border-[#E8E5DF] rounded-full flex items-center justify-center mx-auto text-[#686D78]">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[#171923]">No media assets found</h4>
          <p className="text-xs text-[#686D78] max-w-sm mx-auto">
            {activeTab === "all"
              ? "This gathering does not have any uploaded media yet."
              : `No assets found in the "${activeTab}" category.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => {
            const isVideo = asset.resourceType === "video";
            const thumbnail = isVideo
              ? getVideoThumbnailUrl(asset.publicId, { width: 400, height: 400 })
              : getGalleryThumbnailUrl(asset.publicId, { width: 400, height: 400 });

            return (
              <div
                key={asset.id}
                className="group relative bg-white border border-[#E8E5DF] hover:border-[#D5D1C8] rounded-2xl overflow-hidden shadow-2xs hover:shadow-xs transition-all flex flex-col"
              >
                {/* Media Image / Video Poster Thumbnail */}
                <div className="relative aspect-square w-full bg-[#FAF9F6] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnail}
                    alt={asset.tags.join(", ") || `${eventTitle} media`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Video Indicator */}
                  {isVideo && (
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1">
                      <Film className="w-3 h-3 text-[#A5B4FC]" />
                      <span>Video{asset.duration ? ` • ${Math.round(asset.duration)}s` : ""}</span>
                    </div>
                  )}

                  {/* Moderation Status Pill */}
                  <div className="absolute top-2.5 right-2.5">
                    {asset.moderationStatus === "approved" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/90 text-white backdrop-blur-xs shadow-2xs">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Approved</span>
                      </span>
                    ) : asset.moderationStatus === "pending" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/90 text-white backdrop-blur-xs shadow-2xs">
                        <Clock className="w-2.5 h-2.5" />
                        <span>In Review</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-600/90 text-white backdrop-blur-xs shadow-2xs">
                        <ShieldAlert className="w-2.5 h-2.5" />
                        <span>Flagged</span>
                      </span>
                    )}
                  </div>

                  {/* Hover Quick Action Buttons */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                    <button
                      type="button"
                      onClick={() => setPreviewAsset(asset)}
                      className="p-2 rounded-xl bg-white/90 hover:bg-white text-[#171923] shadow-xs cursor-pointer transition-transform hover:scale-110"
                      title="Preview full media"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {isHost && onCoverSelected && !isVideo && (
                      <button
                        type="button"
                        onClick={() => onCoverSelected(asset.secureUrl, asset.publicId)}
                        className="px-2.5 py-2 rounded-xl bg-[#5146E5] hover:bg-[#4338CA] text-white text-xs font-semibold shadow-xs cursor-pointer transition-transform hover:scale-105"
                        title="Set as main cover poster"
                      >
                        Set as Cover
                      </button>
                    )}

                    {isHost && (
                      <button
                        type="button"
                        onClick={() => setAssetToDelete(asset)}
                        className="p-2 rounded-xl bg-white/90 hover:bg-white text-[#DC2626] shadow-xs cursor-pointer transition-transform hover:scale-110"
                        title="Delete asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Metadata & Tag Footer */}
                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  {/* File Dimensions & Size */}
                  <div className="flex items-center justify-between text-[11px] text-[#686D78]">
                    <span className="uppercase font-semibold tracking-wider text-[#A0A4AB]">
                      {asset.assetType.replace("_", " ")}
                    </span>
                    <span>
                      {(asset.bytes / (1024 * 1024)).toFixed(1)} MB • {asset.format.toUpperCase()}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#A0A4AB] uppercase tracking-wider flex items-center gap-1">
                        {asset.tagSource === "cloudinary_ai" && <Sparkles className="w-2.5 h-2.5 text-[#5146E5]" />}
                        <span>Tags ({asset.tags.length})</span>
                      </span>

                      {isHost && editingTagAssetId !== asset.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTagAssetId(asset.id);
                            setNewTagInput("");
                          }}
                          className="text-[10px] font-semibold text-[#5146E5] hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 max-h-14 overflow-y-auto">
                      {asset.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-[#FAF9F6] border border-[#E8E5DF] text-[#171923]"
                        >
                          <span>{tag}</span>
                          {isHost && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTag(asset, tag);
                              }}
                              className="text-[#A0A4AB] hover:text-[#DC2626] cursor-pointer"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>

                    {/* Inline Tag Add Input */}
                    {isHost && editingTagAssetId === asset.id && (
                      <div className="pt-1 flex items-center gap-1">
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTag(asset);
                            }
                          }}
                          placeholder="Type tag..."
                          className="flex-1 px-2 py-0.5 text-xs bg-white border border-[#E8E5DF] rounded-md text-[#171923] focus:outline-hidden focus:border-[#5146E5]"
                          autoFocus
                        />
                        <button
                          type="button"
                          disabled={isSavingTag}
                          onClick={() => handleAddTag(asset)}
                          className="px-2 py-0.5 text-xs font-semibold bg-[#5146E5] text-white rounded-md cursor-pointer hover:bg-[#4338CA] disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTagAssetId(null)}
                          className="p-1 text-[#686D78] hover:text-[#171923] cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Full Media Preview Modal */}
      {previewAsset && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative bg-white border border-[#E8E5DF] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E8E5DF] flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-[#171923]">
                  {previewAsset.resourceType === "video" ? "Promotional Video Player" : "Media Preview"}
                </h4>
                <p className="text-xs text-[#686D78]">
                  Public ID: <code className="font-mono text-[11px]">{previewAsset.publicId}</code>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="p-2 rounded-xl text-[#686D78] hover:text-[#171923] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="w-full bg-black rounded-2xl overflow-hidden flex items-center justify-center max-h-[500px]">
                {previewAsset.resourceType === "video" ? (
                  <video
                    controls
                    autoPlay
                    playsInline
                    poster={getVideoThumbnailUrl(previewAsset.publicId, { width: 1280, height: 720 })}
                    className="w-full max-h-[500px] object-contain"
                  >
                    <source
                      src={getAdaptiveVideoUrl(previewAsset.publicId)}
                      type={`video/${previewAsset.format || "mp4"}`}
                    />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewAsset.secureUrl}
                    alt={eventTitle}
                    className="max-h-[500px] w-full object-contain"
                  />
                )}
              </div>

              {/* Asset Technical Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#FAF9F6] border border-[#E8E5DF] rounded-2xl text-xs">
                <div>
                  <span className="text-[#A0A4AB] block font-medium">Type</span>
                  <span className="font-semibold text-[#171923] capitalize">
                    {previewAsset.assetType.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <span className="text-[#A0A4AB] block font-medium">Resolution</span>
                  <span className="font-semibold text-[#171923]">
                    {previewAsset.width && previewAsset.height
                      ? `${previewAsset.width} × ${previewAsset.height}`
                      : "Automatic"}
                  </span>
                </div>
                <div>
                  <span className="text-[#A0A4AB] block font-medium">File Size</span>
                  <span className="font-semibold text-[#171923]">
                    {(previewAsset.bytes / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                <div>
                  <span className="text-[#A0A4AB] block font-medium">Moderation</span>
                  <span
                    className={`font-semibold capitalize ${
                      previewAsset.moderationStatus === "approved"
                        ? "text-emerald-600"
                        : previewAsset.moderationStatus === "rejected"
                        ? "text-red-600"
                        : "text-amber-600"
                    }`}
                  >
                    {previewAsset.moderationStatus}
                  </span>
                </div>
              </div>

              {previewAsset.moderationReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{previewAsset.moderationReason}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E8E5DF] bg-[#FAF9F6] flex items-center justify-between">
              <a
                href={previewAsset.secureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#5146E5] hover:underline flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Raw Cloudinary CDN URL</span>
              </a>

              <div className="flex items-center gap-2">
                {isHost && onCoverSelected && previewAsset.resourceType === "image" && (
                  <button
                    type="button"
                    onClick={() => {
                      onCoverSelected(previewAsset.secureUrl, previewAsset.publicId);
                      setPreviewAsset(null);
                    }}
                    className="px-4 py-2 bg-[#5146E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Set as Event Cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewAsset(null)}
                  className="px-4 py-2 bg-white border border-[#E8E5DF] hover:bg-[#FAF9F6] text-[#171923] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {assetToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white border border-[#E8E5DF] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-[#171923]">Delete Media Asset</h4>
              <p className="text-xs text-[#686D78] leading-relaxed">
                Are you sure you want to delete this media asset? It will be permanently removed from Cloudinary and this event gallery.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setAssetToDelete(null)}
                className="flex-1 px-4 py-2 bg-white border border-[#E8E5DF] hover:bg-[#FAF9F6] text-[#171923] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteAsset}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? "Deleting..." : "Confirm Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
