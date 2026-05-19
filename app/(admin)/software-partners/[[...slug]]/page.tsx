"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight, Trash2, Boxes, Upload, X, ExternalLink } from "lucide-react";
import { SectionedEditor } from "@/components/editors/SectionedEditor";
import { Card } from "@/components/primitives/Card";
import { Pill } from "@/components/primitives/Pill";
import { apiFetch, apiUpload } from "@/lib/api";
import type { SectionDef } from "@/lib/field-types";

type Params = { slug?: string[] };

type ApiPartner = {
  _id: string;
  name: string;
  tagline: string;
  logo: string;
  website: string;
  sortOrder: number;
  status: string;
};

const PARTNER_EDITOR_SECTIONS: SectionDef[] = [
  {
    id: "identity",
    title: "Identity",
    description: "Partner name, optional tagline, and where the logo links to.",
    fields: [
      { key: "name", kind: "text", label: "Partner name", placeholder: "Vnish.in" },
      { key: "tagline", kind: "text", label: "Tagline / sub-label", placeholder: "Custom Firmware", hint: "Optional short label shown next to the logo." },
      { key: "website", kind: "url", label: "Website URL", placeholder: "https://vnish.in", wide: true },
      { key: "sort-order", kind: "number", label: "Display order", placeholder: "1", hint: "Lower numbers appear first." },
      { key: "published", kind: "toggle", label: "Published", onLabel: "Visible on site", offLabel: "Hidden (draft)" },
    ],
  },
];

function partnerToInitialValues(p: Record<string, unknown>): Record<string, unknown> {
  return {
    name: p.name ?? "",
    tagline: p.tagline ?? "",
    website: p.website ?? "",
    "sort-order": String(p.sortOrder ?? "0"),
    published: String((p.status as string) === "active"),
  };
}

function buildFormData(values: Record<string, unknown>, file: File | null, clearLogo: boolean): FormData {
  const fd = new FormData();
  const append = (k: string, v: unknown) => {
    if (v !== undefined && v !== null) fd.append(k, String(v));
  };
  append("name", values["name"]);
  append("tagline", values["tagline"]);
  append("website", values["website"]);
  append("sortOrder", String(Number(values["sort-order"]) || 0));
  append("status", values["published"] === "true" ? "active" : "inactive");
  if (file) fd.append("logo", file);
  else if (clearLogo) fd.append("logo", "");
  return fd;
}

// ─── List view ───────────────────────────────────────────────────────
function PartnerList() {
  const [partners, setPartners] = useState<ApiPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ partners: ApiPartner[] }>("/get-software-partners?status=all");
      setPartners(data.partners ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load partners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from software partners?`)) return;
    try {
      await apiFetch("/admin/delete-software-partner", { method: "POST", body: JSON.stringify({ id }) });
      fetchPartners();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-tag mb-2">Content</p>
          <h1 className="font-display text-3xl font-bold text-navy-900">Software Partners</h1>
          <p className="mt-1.5 text-sm text-navy-500">Logos shown in the “Software Partners” section on the homepage.</p>
        </div>
        <Link href="/software-partners/new" className="btn-primary">
          <Plus size={14} />
          New Partner
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-900/8 bg-cream">
                {["Partner", "Website", "Order", "Status", "Action"].map((h, i) => (
                  <th key={h} className={`px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-500 ${i === 4 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/6">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 animate-pulse rounded-lg bg-navy-900/8" />
                        </td>
                      ))}
                    </tr>
                  ))
                : partners.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-14 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                        <Boxes size={22} className="text-navy-300" />
                        <p className="text-sm text-navy-500">No software partners yet. Add the first logo to start populating the homepage block.</p>
                        <Link href="/software-partners/new" className="btn-primary mt-1">
                          <Plus size={14} /> New Partner
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
                : partners.map((p) => (
                    <tr key={p._id} className="group transition-colors hover:bg-cream/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {p.logo ? (
                            <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg border border-navy-900/8 bg-white p-1">
                              <Image src={p.logo} alt={p.name} width={56} height={28} className="max-h-7 w-auto object-contain" />
                            </div>
                          ) : (
                            <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-navy-900/15 bg-navy-900/3 font-mono text-[10px] uppercase tracking-widest text-navy-300">
                              no logo
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-navy-900">{p.name}</p>
                            {p.tagline && <p className="font-mono text-[10px] uppercase tracking-widest text-navy-400">{p.tagline}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {p.website ? (
                          <a href={p.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono text-[12px] text-navy-600 transition hover:text-navy-900">
                            {p.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="font-mono text-[12px] text-navy-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-[12px] text-navy-500">{p.sortOrder}</td>
                      <td className="px-5 py-4">
                        <Pill tone={p.status === "active" ? "success" : "warning"}>
                          {p.status === "active" ? "Published" : "Draft"}
                        </Pill>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/software-partners/edit/${p._id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-navy-900/12 bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-navy-700 shadow-sm transition hover:bg-navy-900 hover:text-mint-300 hover:border-navy-900"
                          >
                            Edit <ArrowRight size={11} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(p._id, p.name)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-400 transition hover:bg-red-100 hover:text-red-600"
                            aria-label="Delete partner"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-navy-900/8 bg-cream px-5 py-3">
          <p className="font-mono text-[11px] text-navy-400">
            {loading ? "Loading…" : `${partners.length} partners · ${partners.filter((p) => p.status === "active").length} published`}
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── Logo uploader ───────────────────────────────────────────────────
function LogoUploader({
  currentUrl,
  pendingFile,
  onPick,
  onClear,
  partnerName,
}: {
  currentUrl: string;
  pendingFile: File | null;
  onPick: (f: File) => void;
  onClear: () => void;
  partnerName: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = pendingFile ? URL.createObjectURL(pendingFile) : currentUrl;

  return (
    <Card className="mb-4">
      <div className="flex items-start gap-5">
        <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-2xl border border-navy-900/10 bg-white p-3">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={`${partnerName || "Partner"} logo preview`} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-widest text-navy-300">no logo</span>
          )}
        </div>
        <div className="flex-1">
          <p className="section-tag mb-1.5">Logo</p>
          <h3 className="font-display text-base font-semibold text-navy-900">Partner logo</h3>
          <p className="mt-1 text-[13px] text-navy-500">
            Transparent PNG or SVG works best. JPG, PNG, or WebP up to 5 MB. Wide logos render at ~120px wide on the homepage.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-navy-900/12 bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-navy-700 shadow-sm transition hover:bg-navy-900 hover:text-mint-300 hover:border-navy-900"
            >
              <Upload size={12} />
              {previewUrl ? "Replace" : "Upload"}
            </button>
            {previewUrl && (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-red-500 transition hover:bg-red-100 hover:text-red-700"
              >
                <X size={12} /> Remove
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </Card>
  );
}

// ─── Editor ──────────────────────────────────────────────────────────
function PartnerEditor({ partnerId }: { partnerId?: string }) {
  const router = useRouter();
  const isNew = !partnerId;
  const [initialValues, setInitialValues] = useState<Record<string, unknown> | undefined>(undefined);
  const [loading, setLoading] = useState(!isNew);
  const [currentLogo, setCurrentLogo] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [clearLogo, setClearLogo] = useState(false);
  const [currentName, setCurrentName] = useState("");

  useEffect(() => {
    if (isNew) return;
    apiFetch<{ partners: Record<string, unknown>[] }>("/get-software-partners?status=all")
      .then((data) => {
        const p = (data.partners ?? []).find((x: Record<string, unknown>) => x._id === partnerId);
        if (p) {
          setInitialValues(partnerToInitialValues(p));
          setCurrentLogo((p.logo as string) ?? "");
          setCurrentName((p.name as string) ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [partnerId, isNew]);

  const savePartner = useCallback(
    async (values: Record<string, unknown>) => {
      setCurrentName(String(values["name"] ?? currentName));
      const fd = buildFormData(values, pendingFile, clearLogo);
      if (partnerId) {
        await apiUpload(`/admin/update-software-partner/${partnerId}`, fd, "PUT");
        setPendingFile(null);
        setClearLogo(false);
        if (pendingFile) setCurrentLogo("");
      } else {
        const res = await apiUpload<{ partner: { _id: string } }>("/admin/create-software-partner", fd);
        const newId = res?.partner?._id;
        if (newId) router.push(`/software-partners/edit/${newId}`);
      }
    },
    [partnerId, pendingFile, clearLogo, router, currentName]
  );

  const onSaveSection = useCallback(async (_id: string, v: Record<string, unknown>) => { await savePartner(v); }, [savePartner]);
  const onSaveAll = useCallback(async (v: Record<string, unknown>) => { await savePartner(v); }, [savePartner]);

  if (loading) return <p className="p-8 text-sm text-navy-500">Loading…</p>;

  return (
    <div>
      <LogoUploader
        currentUrl={clearLogo ? "" : currentLogo}
        pendingFile={pendingFile}
        onPick={(f) => { setPendingFile(f); setClearLogo(false); }}
        onClear={() => { setPendingFile(null); setClearLogo(true); }}
        partnerName={currentName || (initialValues?.["name"] as string) || ""}
      />
      <SectionedEditor
        pageTag="Content · Software Partners"
        pageTitle={isNew ? "New Software Partner" : "Edit Software Partner"}
        pageDescription={
          isNew
            ? "Fill in the identity below and upload the partner logo above. The card on the homepage links to the partner website."
            : "Update the identity below. Logo changes save with any section."
        }
        sections={PARTNER_EDITOR_SECTIONS}
        initialValues={initialValues}
        onSaveSection={onSaveSection}
        onSaveAll={onSaveAll}
      />
    </div>
  );
}

export default function SoftwarePartnersPage({ params }: { params: Params }) {
  const mode = params.slug?.[0] ?? "list";

  if (mode === "list" || !mode) return <PartnerList />;
  if (mode === "new") return <PartnerEditor />;
  if (mode === "edit") return <PartnerEditor partnerId={params.slug?.[1]} />;

  return <PartnerList />;
}
