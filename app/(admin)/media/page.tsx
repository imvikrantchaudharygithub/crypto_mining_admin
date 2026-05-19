"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, Trash2, Copy, Check, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/primitives/Card";
import { apiFetch, apiUpload } from "@/lib/api";

type MediaItem = {
  _id: string;
  url: string;
  filename: string;
  mimetype?: string;
  size?: number;
  createdAt: string;
};

function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Copy-to-clipboard modal ──────────────────────────────────────────
function CopyModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-navy-900/10 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-500">Image URL</p>
        <div className="mb-4 flex gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 rounded-xl border border-navy-900/12 bg-cream px-4 py-3 font-mono text-[12px] text-navy-700 outline-none"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-3 font-mono text-[11px] text-mint-400 transition hover:bg-navy-800"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <button type="button" onClick={onClose} className="font-mono text-[11px] text-navy-400 transition hover:text-navy-900">
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────
export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ media: MediaItem[] }>("/admin/get-media");
      setMedia(data.media ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await apiUpload("/admin/upload-media", fd);
      fetchMedia();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string, filename: string) => {
    if (!confirm(`Delete "${filename}"?`)) return;
    try {
      await apiFetch("/admin/delete-media", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      fetchMedia();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div>
      {selectedUrl && <CopyModal url={selectedUrl} onClose={() => setSelectedUrl(null)} />}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-tag mb-2">Media</p>
          <h1 className="font-display text-3xl font-bold text-navy-900">Media Library</h1>
          <p className="mt-1.5 text-sm text-navy-500">Upload and manage images used across the site.</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="media-upload-input"
          />
          <label
            htmlFor="media-upload-input"
            className={`btn-primary cursor-pointer ${uploading ? "opacity-60 pointer-events-none" : ""}`}
          >
            <Upload size={14} />
            {uploading ? "Uploading…" : "Upload Image"}
          </label>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="aspect-square animate-pulse bg-navy-900/4 p-0" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <ImageIcon size={36} className="mb-4 text-navy-300" />
          <p className="font-display text-lg font-semibold text-navy-900">No images yet</p>
          <p className="mt-1 text-sm text-navy-500">Upload your first image using the button above.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {media.map((item) => (
            <div
              key={item._id}
              className="group relative overflow-hidden rounded-2xl border border-navy-900/10 bg-cream"
            >
              {/* Thumbnail */}
              <button
                type="button"
                onClick={() => setSelectedUrl(item.url)}
                className="block aspect-square w-full overflow-hidden"
                aria-label={`Copy URL for ${item.filename}`}
              >
                <img
                  src={item.url}
                  alt={item.filename}
                  className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-navy-900/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 font-mono text-[10px] font-semibold text-navy-900">
                    <Copy size={11} /> Copy URL
                  </div>
                </div>
              </button>

              {/* Footer */}
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[10px] font-medium text-navy-700">{item.filename}</p>
                  <p className="font-mono text-[9px] text-navy-400">{formatBytes(item.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item._id, item.filename)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-400 transition hover:bg-red-100 hover:text-red-600"
                  aria-label="Delete image"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
