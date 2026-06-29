"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, FileText, Search, ArrowRight, Trash2, ImageIcon } from "lucide-react";
import { SectionedEditor } from "@/components/editors/SectionedEditor";
import { Card } from "@/components/primitives/Card";
import { Pill } from "@/components/primitives/Pill";
import { apiFetch, apiUpload } from "@/lib/api";
import type { SectionDef } from "@/lib/field-types";

type Params = { slug?: string[] };

type ApiBlog = {
  _id: string;
  slug: string;
  title: string;
  author: string;
  tags: string[];
  readTime: number;
  status: "draft" | "published";
  publishedAt?: string;
  updatedAt?: string;
};

// ─── Blog Editor Sections ─────────────────────────────────────────────
const BLOG_EDITOR_SECTIONS: SectionDef[] = [
  {
    id: "overview",
    title: "Overview",
    description: "Identity fields shown in the post card and URL.",
    fields: [
      { key: "title", kind: "text", label: "Title", placeholder: "How to choose a miner in India", wide: true },
      { key: "slug", kind: "text", label: "URL Slug (auto from title if blank)", placeholder: "how-to-choose-a-miner", hint: "Lowercase, hyphens only. Used in /blog/[slug]" },
      { key: "author", kind: "text", label: "Author", placeholder: "CMM Mining Team" },
      { key: "excerpt", kind: "textarea", rows: 3, label: "Excerpt", hint: "Shown on cards + used as meta description fallback", wide: true },
      { key: "tags", kind: "array-string", label: "Tags", hint: "e.g. mining, profitability, india", placeholder: "mining", wide: true },
    ],
  },
  {
    id: "body",
    title: "Content",
    description: "The full article body. Use the toolbar for formatting and inline images.",
    fields: [
      { key: "body", kind: "richtext", label: "Body", wide: true },
    ],
  },
  {
    id: "seo",
    title: "SEO",
    description: "Optional overrides. Falls back to the title and excerpt when blank.",
    fields: [
      { key: "seo-title", kind: "text", label: "SEO Title", placeholder: "How to choose a Bitcoin miner in India (2026)", wide: true },
      { key: "seo-desc", kind: "textarea", rows: 2, label: "SEO Description", placeholder: "A practical guide to picking the right ASIC miner for Indian electricity costs.", wide: true },
    ],
  },
  {
    id: "publish",
    title: "Publish",
    description: "Draft posts are hidden from the public site until published.",
    fields: [
      { key: "status", kind: "select", label: "Status", options: ["draft", "published"] },
      { key: "coverImageAlt", kind: "text", label: "Cover Image Alt Text", hint: "Describe the cover image for accessibility + SEO", wide: true },
      { key: "sortOrder", kind: "number", label: "Sort Order", hint: "Lower numbers appear first within the same publish date" },
    ],
  },
];

// ─── helpers ─────────────────────────────────────────────────────────
function buildBlogFormData(values: Record<string, unknown>, coverUrl: string): FormData {
  const fd = new FormData();
  const append = (k: string, v: unknown) => {
    if (v !== undefined && v !== null) fd.append(k, String(v));
  };
  append("title", values["title"]);
  if (values["slug"]) append("slug", values["slug"]);
  append("excerpt", values["excerpt"]);
  append("author", values["author"]);
  append("body", values["body"]);
  append("coverImageAlt", values["coverImageAlt"]);
  append("status", values["status"] || "draft");
  append("sortOrder", String(Number(values["sortOrder"]) || 0));
  append("tags", JSON.stringify(values["tags"] ?? []));
  append("seo", JSON.stringify({ title: values["seo-title"] ?? "", description: values["seo-desc"] ?? "" }));
  if (coverUrl) append("coverImage", coverUrl);
  return fd;
}

function blogToInitialValues(p: Record<string, unknown>): Record<string, unknown> {
  const seo = (p.seo as Record<string, unknown>) ?? {};
  return {
    title: p.title ?? "",
    slug: p.slug ?? "",
    excerpt: p.excerpt ?? "",
    author: p.author ?? "CMM Mining Team",
    body: p.body ?? "",
    coverImageAlt: p.coverImageAlt ?? "",
    status: (p.status as string) ?? "draft",
    sortOrder: String(p.sortOrder ?? 0),
    tags: Array.isArray(p.tags) ? p.tags : [],
    "seo-title": seo.title ?? "",
    "seo-desc": seo.description ?? "",
  };
}

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" }) : "—";

// ─── Blog List View ───────────────────────────────────────────────────
function BlogList() {
  const [posts, setPosts] = useState<ApiBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ posts: ApiBlog[] }>("/admin/get-blogs?status=all");
      setPosts(data.posts ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await apiFetch("/delete-blog", { method: "POST", body: JSON.stringify({ id }) });
      fetchPosts();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const filtered = search.trim()
    ? posts.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    : posts;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-tag mb-2">Content</p>
          <h1 className="font-display text-3xl font-bold text-navy-900">Blog</h1>
          <p className="mt-1.5 text-sm text-navy-500">Write and publish articles for the public /blog section.</p>
        </div>
        <Link href="/blog/new" className="btn-primary">
          <Plus size={14} />
          New Post
        </Link>
      </div>

      <Card className="mb-4 flex items-center gap-3 p-3">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-navy-900/12 bg-white px-3 py-2 shadow-sm">
          <Search size={14} className="shrink-0 text-navy-400" />
          <input
            type="text"
            placeholder="Search posts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border-none bg-transparent text-sm text-navy-900 outline-none placeholder:text-navy-300"
          />
        </label>
      </Card>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-900/8 bg-cream">
                {["Post", "Tags", "Published", "Read", "Status", "Action"].map((h, i) => (
                  <th key={h} className={`px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-500 ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/6">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 animate-pulse rounded-lg bg-navy-900/8" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((p) => (
                    <tr key={p._id} className="group transition-colors hover:bg-cream/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-900/6">
                            <FileText size={16} className="text-navy-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-navy-900">{p.title}</p>
                            <p className="font-mono text-[10px] uppercase tracking-widest text-navy-400">/blog/{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-[12px] text-navy-600">{(p.tags ?? []).slice(0, 3).join(", ") || "—"}</td>
                      <td className="px-5 py-4 font-mono text-[12px] text-navy-600">{fmtDate(p.publishedAt)}</td>
                      <td className="px-5 py-4 font-mono text-[12px] text-navy-600">{p.readTime ?? 1} min</td>
                      <td className="px-5 py-4">
                        <Pill tone={p.status === "published" ? "success" : "warning"}>
                          {p.status === "published" ? "Published" : "Draft"}
                        </Pill>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/blog/edit/${p._id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-navy-900/12 bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-navy-700 shadow-sm transition hover:bg-navy-900 hover:text-mint-300 hover:border-navy-900"
                          >
                            Edit <ArrowRight size={11} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(p._id, p.title)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-400 transition hover:bg-red-100 hover:text-red-600"
                            aria-label="Delete post"
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
            {loading ? "Loading…" : `${filtered.length} posts · ${posts.filter((p) => p.status === "published").length} published`}
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── Cover Image Uploader ─────────────────────────────────────────────
function CoverImageUploader({ url, onChange }: { url: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "blog");
      const res = await apiUpload<{ media: { url: string } }>("/admin/upload-media", fd);
      if (res?.media?.url) onChange(res.media.url);
    } catch (e2: unknown) {
      setErr(e2 instanceof Error ? e2.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Card className="mb-5">
      <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-500">Cover Image</p>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-28 w-44 items-center justify-center overflow-hidden rounded-xl border border-navy-900/12 bg-cream">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Cover preview" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon size={24} className="text-navy-300" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-fit rounded-xl border border-navy-900/15 bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-navy-700 shadow-sm transition hover:border-navy-900 hover:bg-navy-900 hover:text-mint-300 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : url ? "Replace image" : "Upload image"}
          </button>
          {url && (
            <button type="button" onClick={() => onChange("")} className="w-fit font-mono text-[11px] uppercase tracking-[0.14em] text-red-400 hover:text-red-600">
              Remove
            </button>
          )}
          {err && <p className="text-xs text-red-600">{err}</p>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
        </div>
      </div>
    </Card>
  );
}

// ─── Blog Editor (Create / Edit) ──────────────────────────────────────
function BlogEditor({ postId }: { postId?: string }) {
  const router = useRouter();
  const isNew = !postId;
  const [initialValues, setInitialValues] = useState<Record<string, unknown> | undefined>(isNew ? {} : undefined);
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [createdId, setCreatedId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isNew) return;
    apiFetch<{ posts: Record<string, unknown>[] }>("/admin/get-blogs?status=all")
      .then((data) => {
        const p = (data.posts ?? []).find((x: Record<string, unknown>) => x._id === postId);
        if (p) {
          setInitialValues(blogToInitialValues(p));
          setCoverUrl((p.coverImage as string) ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId, isNew]);

  const savePost = useCallback(
    async (values: Record<string, unknown>) => {
      const fd = buildBlogFormData(values, coverUrl);
      const targetId = createdId ?? postId;
      if (targetId) {
        await apiUpload(`/edit-blog/${targetId}`, fd, "PUT");
      } else {
        const res = await apiUpload<{ post: { _id: string } }>("/create-blog", fd);
        const newId = res?.post?._id;
        if (newId) {
          setCreatedId(newId);
          router.push(`/blog/edit/${newId}`);
        }
      }
    },
    [postId, createdId, coverUrl, router]
  );

  const onSaveSection = useCallback(async (_sectionId: string, values: Record<string, unknown>) => { await savePost(values); }, [savePost]);
  const onSaveAll = useCallback(async (values: Record<string, unknown>) => { await savePost(values); }, [savePost]);

  if (loading) return <p className="p-8 text-sm text-navy-500">Loading…</p>;

  return (
    <div>
      <CoverImageUploader url={coverUrl} onChange={setCoverUrl} />
      <SectionedEditor
        pageTag="Content · Blog"
        pageTitle={isNew ? "Create Post" : "Edit Post"}
        pageDescription={
          isNew
            ? "Fill in the sections below to publish a new article on the blog."
            : "Edit each section using the tabs on the left. Changes are saved per section."
        }
        sections={BLOG_EDITOR_SECTIONS}
        initialValues={initialValues}
        onSaveSection={onSaveSection}
        onSaveAll={onSaveAll}
      />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────
export default function BlogPage({ params }: { params: Params }) {
  const mode = params.slug?.[0] ?? "list";

  if (mode === "new") return <BlogEditor />;
  if (mode === "edit") return <BlogEditor postId={params.slug?.[1]} />;
  return <BlogList />;
}
