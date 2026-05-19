"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight, Trash2, Users, Upload, X } from "lucide-react";
import { SectionedEditor } from "@/components/editors/SectionedEditor";
import { Card } from "@/components/primitives/Card";
import { Pill } from "@/components/primitives/Pill";
import { apiFetch, apiUpload } from "@/lib/api";
import type { SectionDef } from "@/lib/field-types";

type Params = { slug?: string[] };

type ApiTeamMember = {
  _id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  linkedin: string;
  twitter: string;
  email: string;
  sortOrder: number;
  status: string;
};

// ─── Team Editor Sections ────────────────────────────────────────────
const TEAM_EDITOR_SECTIONS: SectionDef[] = [
  {
    id: "identity",
    title: "Identity",
    description: "Who they are and where they sit on the homepage grid.",
    fields: [
      { key: "name", kind: "text", label: "Full name", placeholder: "Vikrant Chaudhary" },
      { key: "role", kind: "text", label: "Role / Title", placeholder: "Founder & CEO" },
      { key: "sort-order", kind: "number", label: "Display order", placeholder: "1", hint: "Lower numbers appear first." },
      { key: "published", kind: "toggle", label: "Published", onLabel: "Visible on site", offLabel: "Hidden (draft)" },
    ],
  },
  {
    id: "bio",
    title: "Bio",
    description: "Short blurb shown under the role on the team card. Keep it under 240 characters.",
    fields: [
      { key: "bio", kind: "textarea", label: "Bio", placeholder: "Built the first hashrate desk in India. 10+ years in mining infra.", rows: 4, wide: true },
    ],
  },
  {
    id: "socials",
    title: "Socials",
    description: "Optional links — leave blank to hide individual icons.",
    fields: [
      { key: "linkedin", kind: "url", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/handle" },
      { key: "twitter", kind: "url", label: "Twitter / X URL", placeholder: "https://x.com/handle" },
      { key: "email", kind: "email", label: "Email", placeholder: "name@cryptominingmiles.com" },
    ],
  },
];

function memberToInitialValues(m: Record<string, unknown>): Record<string, unknown> {
  return {
    name: m.name ?? "",
    role: m.role ?? "",
    "sort-order": String(m.sortOrder ?? "0"),
    published: String((m.status as string) === "active"),
    bio: m.bio ?? "",
    linkedin: m.linkedin ?? "",
    twitter: m.twitter ?? "",
    email: m.email ?? "",
  };
}

function buildFormData(values: Record<string, unknown>, file: File | null, clearAvatar: boolean): FormData {
  const fd = new FormData();
  const append = (k: string, v: unknown) => {
    if (v !== undefined && v !== null) fd.append(k, String(v));
  };
  append("name", values["name"]);
  append("role", values["role"]);
  append("bio", values["bio"]);
  append("linkedin", values["linkedin"]);
  append("twitter", values["twitter"]);
  append("email", values["email"]);
  append("sortOrder", String(Number(values["sort-order"]) || 0));
  append("status", values["published"] === "true" ? "active" : "inactive");
  if (file) fd.append("avatar", file);
  else if (clearAvatar) fd.append("avatar", "");
  return fd;
}

// ─── Initials avatar (matches frontend default) ──────────────────────
function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function InitialsBadge({ name, size = 80 }: { name: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-2xl bg-mint-100 font-display font-bold text-navy-900"
      style={{ width: size, height: size, fontSize: size * 0.36, letterSpacing: "-0.02em" }}
    >
      {initialsFromName(name || "?")}
    </div>
  );
}

// ─── Team List View ──────────────────────────────────────────────────
function TeamList() {
  const [members, setMembers] = useState<ApiTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ team: ApiTeamMember[] }>("/get-team?status=all");
      setMembers(data.team ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from the team?`)) return;
    try {
      await apiFetch("/admin/delete-team", { method: "POST", body: JSON.stringify({ id }) });
      fetchTeam();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-tag mb-2">Content</p>
          <h1 className="font-display text-3xl font-bold text-navy-900">Team</h1>
          <p className="mt-1.5 text-sm text-navy-500">People shown in the “Our Team” section on the homepage.</p>
        </div>
        <Link href="/team/new" className="btn-primary">
          <Plus size={14} />
          New Member
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
                {["Member", "Role", "Order", "Status", "Action"].map((h, i) => (
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
                : members.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-14 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                        <Users size={22} className="text-navy-300" />
                        <p className="text-sm text-navy-500">No team members yet. Add the first one to start populating the homepage.</p>
                        <Link href="/team/new" className="btn-primary mt-1">
                          <Plus size={14} /> New Member
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
                : members.map((m) => (
                    <tr key={m._id} className="group transition-colors hover:bg-cream/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {m.avatar ? (
                            <Image
                              src={m.avatar}
                              alt={m.name}
                              width={36}
                              height={36}
                              className="h-9 w-9 shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <InitialsBadge name={m.name} size={36} />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-navy-900">{m.name}</p>
                            {m.bio && <p className="line-clamp-1 max-w-[320px] text-[12px] text-navy-500">{m.bio}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-[12px] text-navy-600">{m.role}</td>
                      <td className="px-5 py-4 font-mono text-[12px] text-navy-500">{m.sortOrder}</td>
                      <td className="px-5 py-4">
                        <Pill tone={m.status === "active" ? "success" : "warning"}>
                          {m.status === "active" ? "Published" : "Draft"}
                        </Pill>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/team/edit/${m._id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-navy-900/12 bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-navy-700 shadow-sm transition hover:bg-navy-900 hover:text-mint-300 hover:border-navy-900"
                          >
                            Edit <ArrowRight size={11} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(m._id, m.name)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-400 transition hover:bg-red-100 hover:text-red-600"
                            aria-label="Delete member"
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
            {loading ? "Loading…" : `${members.length} members · ${members.filter((m) => m.status === "active").length} published`}
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── Avatar Uploader ─────────────────────────────────────────────────
function AvatarUploader({
  currentUrl,
  pendingFile,
  onPick,
  onClear,
  name,
}: {
  currentUrl: string;
  pendingFile: File | null;
  onPick: (f: File) => void;
  onClear: () => void;
  name: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = pendingFile ? URL.createObjectURL(pendingFile) : currentUrl;

  useEffect(() => {
    return () => {
      if (pendingFile) URL.revokeObjectURL(URL.createObjectURL(pendingFile));
    };
  }, [pendingFile]);

  return (
    <Card className="mb-4">
      <div className="flex items-start gap-5">
        <div className="relative">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Avatar preview"
              className="h-20 w-20 rounded-2xl object-cover ring-1 ring-navy-900/10"
            />
          ) : (
            <InitialsBadge name={name} size={80} />
          )}
        </div>
        <div className="flex-1">
          <p className="section-tag mb-1.5">Avatar</p>
          <h3 className="font-display text-base font-semibold text-navy-900">Profile photo</h3>
          <p className="mt-1 text-[13px] text-navy-500">
            Square image works best. JPG, PNG, or WebP up to 5 MB. Leave empty to use the initials fallback.
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
            accept="image/jpeg,image/jpg,image/png,image/webp"
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

// ─── Team Editor ─────────────────────────────────────────────────────
function TeamEditor({ memberId }: { memberId?: string }) {
  const router = useRouter();
  const isNew = !memberId;
  const [initialValues, setInitialValues] = useState<Record<string, unknown> | undefined>(undefined);
  const [loading, setLoading] = useState(!isNew);
  const [currentAvatar, setCurrentAvatar] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [clearAvatar, setClearAvatar] = useState(false);
  const [currentName, setCurrentName] = useState("");

  useEffect(() => {
    if (isNew) return;
    apiFetch<{ team: Record<string, unknown>[] }>("/get-team?status=all")
      .then((data) => {
        const m = (data.team ?? []).find((x: Record<string, unknown>) => x._id === memberId);
        if (m) {
          setInitialValues(memberToInitialValues(m));
          setCurrentAvatar((m.avatar as string) ?? "");
          setCurrentName((m.name as string) ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [memberId, isNew]);

  const saveMember = useCallback(
    async (values: Record<string, unknown>) => {
      setCurrentName(String(values["name"] ?? currentName));
      const fd = buildFormData(values, pendingFile, clearAvatar);
      if (memberId) {
        await apiUpload(`/admin/update-team/${memberId}`, fd, "PUT");
        setPendingFile(null);
        setClearAvatar(false);
        if (pendingFile) setCurrentAvatar("");
      } else {
        const res = await apiUpload<{ member: { _id: string } }>("/admin/create-team", fd);
        const newId = res?.member?._id;
        if (newId) router.push(`/team/edit/${newId}`);
      }
    },
    [memberId, pendingFile, clearAvatar, router, currentName]
  );

  const onSaveSection = useCallback(async (_id: string, v: Record<string, unknown>) => { await saveMember(v); }, [saveMember]);
  const onSaveAll = useCallback(async (v: Record<string, unknown>) => { await saveMember(v); }, [saveMember]);

  if (loading) return <p className="p-8 text-sm text-navy-500">Loading…</p>;

  return (
    <div>
      <AvatarUploader
        currentUrl={clearAvatar ? "" : currentAvatar}
        pendingFile={pendingFile}
        onPick={(f) => { setPendingFile(f); setClearAvatar(false); }}
        onClear={() => { setPendingFile(null); setClearAvatar(true); }}
        name={currentName || (initialValues?.["name"] as string) || ""}
      />
      <SectionedEditor
        pageTag="Content · Team"
        pageTitle={isNew ? "New Team Member" : "Edit Team Member"}
        pageDescription={
          isNew
            ? "Fill in the identity, bio, and socials below. Upload an avatar above — or leave it blank to use an initials fallback."
            : "Edit each section using the tabs on the left. Avatar changes save with any section."
        }
        sections={TEAM_EDITOR_SECTIONS}
        initialValues={initialValues}
        onSaveSection={onSaveSection}
        onSaveAll={onSaveAll}
      />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────
export default function TeamPage({ params }: { params: Params }) {
  const mode = params.slug?.[0] ?? "list";

  if (mode === "list" || !mode) return <TeamList />;
  if (mode === "new") return <TeamEditor />;
  if (mode === "edit") return <TeamEditor memberId={params.slug?.[1]} />;

  return <TeamList />;
}
