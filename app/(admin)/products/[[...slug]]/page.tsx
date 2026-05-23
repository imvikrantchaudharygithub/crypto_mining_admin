"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Package, Search, SlidersHorizontal, ArrowRight, Trash2 } from "lucide-react";
import { SectionedEditor } from "@/components/editors/SectionedEditor";
import { Card } from "@/components/primitives/Card";
import { Pill } from "@/components/primitives/Pill";
import { apiFetch, apiUpload } from "@/lib/api";
import type { SectionDef } from "@/lib/field-types";

type Params = { slug?: string[] };

type ApiProduct = {
  _id: string;
  slug: string;
  name: string;
  algo: string;
  hashrate: string;
  priceDisplay: string;
  quantity: number;
  computedStatus: "In Stock" | "Sold Out" | "Coming Soon";
  available: boolean;
  bestSeller?: boolean;
  status: string;
};

// ─── Product Editor Sections ─────────────────────────────────────────
const PRODUCT_EDITOR_SECTIONS: SectionDef[] = [
  {
    id: "overview",
    title: "Overview",
    description: "Core identity fields that appear in the product card and URL.",
    fields: [
      { key: "slug", kind: "text", label: "URL Slug", placeholder: "antminer-s19-xp", hint: "Lowercase, hyphens only. Used in /shop/[slug]" },
      { key: "name", kind: "text", label: "Product Name", placeholder: "Antminer S19 XP" },
      { key: "short-name", kind: "text", label: "Short Name", placeholder: "S19" },
      { key: "sub-name", kind: "text", label: "Sub Name / Variant", placeholder: "XP" },
      { key: "edition", kind: "text", label: "Edition line", placeholder: "Bitmain · 2024 ed." },
      { key: "sku", kind: "text", label: "SKU", placeholder: "BTM-S19XP-140" },
      { key: "tag", kind: "text", label: "Badge text (e.g. BESTSELLER)", placeholder: "BESTSELLER" },
      {
        key: "algorithm",
        kind: "select",
        label: "Algorithm",
        options: ["SHA-256", "ETHASH", "SCRYPT", "KASPA", "X11", "BLAKE2S", "HANDSHAKE"],
        placeholder: "SHA-256",
      },
      {
        key: "coming-soon-override",
        kind: "toggle",
        label: "Mark as Coming Soon",
        onLabel: "Shows Coming Soon badge (overrides stock count)",
        offLabel: "Auto: In Stock if qty > 0, else Sold Out",
      },
      { key: "available", kind: "toggle", label: "Listed on shop", onLabel: "Visible to customers", offLabel: "Hidden (draft)" },
      { key: "best-seller", kind: "toggle", label: "Best Seller", onLabel: "Glowing card + Best Seller badge", offLabel: "Standard card" },
    ],
  },
  {
    id: "performance",
    title: "Performance",
    description: "Hashrate, power, efficiency, and noise figures for the performance card.",
    fields: [
      { key: "hashrate-display", kind: "text", label: "Hashrate (display)", placeholder: "140 TH/s" },
      { key: "hashrate-num", kind: "number", label: "Hashrate number", placeholder: "140", unit: "TH/s" },
      { key: "power-display", kind: "text", label: "Power draw (display)", placeholder: "3010W" },
      { key: "power-num", kind: "number", label: "Power draw number", placeholder: "3010", unit: "W" },
      { key: "efficiency-display", kind: "text", label: "Efficiency (display)", placeholder: "21.5 J/TH" },
      { key: "efficiency-num", kind: "number", label: "Efficiency number", placeholder: "21.5", unit: "J/TH" },
      { key: "noise-display", kind: "text", label: "Noise level (display)", placeholder: "75 dB" },
      { key: "noise-num", kind: "number", label: "Noise level number", placeholder: "75", unit: "dB" },
    ],
  },
  {
    id: "pricing",
    title: "Pricing & Contract",
    description: "Sale price, display formatting, and contract duration.",
    fields: [
      { key: "price-inr", kind: "number", label: "Price (INR)", placeholder: "320000", unit: "₹" },
      { key: "price-display", kind: "text", label: "Price display string", placeholder: "₹3,20,000", hint: "Shown on the product card" },
      { key: "silencer-price", kind: "number", label: "Silencer add-on price", placeholder: "8000", unit: "₹" },
      { key: "contract", kind: "text", label: "Contract duration", placeholder: "12 months" },
    ],
  },
  {
    id: "description",
    title: "Description",
    description: "Marketing copy shown on the product detail page.",
    fields: [
      {
        key: "tagline",
        kind: "textarea",
        label: "Tagline / short description",
        placeholder: "The flagship workhorse. Bitmain's most efficient SHA-256 ASIC packs 140 TH/s into a compact frame with industry-leading J/TH efficiency.",
        rows: 3,
        wide: true,
      },
    ],
  },
  {
    id: "specs-performance",
    title: "Specs — Performance",
    description: "Performance specification table rows.",
    fields: [
      {
        key: "specs-performance",
        kind: "array-object",
        label: "Performance Specs",
        itemLabel: "Row",
        wide: true,
        schema: [
          { key: "label", kind: "text", label: "Spec name", placeholder: "Algorithm" },
          { key: "value", kind: "text", label: "Spec value", placeholder: "SHA-256" },
        ],
      },
    ],
  },
  {
    id: "specs-power",
    title: "Specs — Power",
    description: "Power specification table rows.",
    fields: [
      {
        key: "specs-power",
        kind: "array-object",
        label: "Power Specs",
        itemLabel: "Row",
        wide: true,
        schema: [
          { key: "label", kind: "text", label: "Spec name", placeholder: "Power Draw" },
          { key: "value", kind: "text", label: "Spec value", placeholder: "3010W ±5% @ 25°C" },
        ],
      },
    ],
  },
  {
    id: "specs-physical",
    title: "Specs — Physical",
    description: "Dimensions, weight, and form-factor details.",
    fields: [
      {
        key: "specs-physical",
        kind: "array-object",
        label: "Physical Specs",
        itemLabel: "Row",
        wide: true,
        schema: [
          { key: "label", kind: "text", label: "Spec name", placeholder: "Dimensions" },
          { key: "value", kind: "text", label: "Spec value", placeholder: "400 × 195 × 290 mm" },
        ],
      },
    ],
  },
  {
    id: "specs-connectivity",
    title: "Specs — Connectivity",
    description: "Network and interface specifications.",
    fields: [
      {
        key: "specs-connectivity",
        kind: "array-object",
        label: "Connectivity Specs",
        itemLabel: "Row",
        wide: true,
        schema: [
          { key: "label", kind: "text", label: "Spec name", placeholder: "Network" },
          { key: "value", kind: "text", label: "Spec value", placeholder: "RJ45 Ethernet 10/100M" },
        ],
      },
    ],
  },
  {
    id: "box-items",
    title: "Box Contents",
    description: "What's included in the product box.",
    fields: [
      {
        key: "box-items",
        kind: "array-object",
        label: "Box Items",
        itemLabel: "Item",
        wide: true,
        schema: [
          { key: "icon", kind: "text", label: "Icon (emoji)", placeholder: "◼" },
          { key: "label", kind: "text", label: "Item name", placeholder: "Antminer S19 XP unit" },
          { key: "sub", kind: "text", label: "Sub-detail", placeholder: "Sealed factory box" },
        ],
      },
    ],
  },
  {
    id: "electrical",
    title: "Electrical Requirements",
    description: "AC voltage, circuit, and PDU requirements.",
    fields: [
      {
        key: "electrical",
        kind: "array-object",
        label: "Electrical Rows",
        itemLabel: "Row",
        wide: true,
        schema: [
          { key: "label", kind: "text", label: "Requirement", placeholder: "AC Voltage" },
          { key: "value", kind: "text", label: "Value", placeholder: "220V – 240V AC" },
        ],
      },
    ],
  },
  {
    id: "media",
    title: "Media",
    description: "Product images. Add the hero image URL and any additional gallery images.",
    fields: [
      { key: "hero-image", kind: "url", label: "Hero image URL", placeholder: "https://assets.example.com/products/hero.webp", wide: true },
      {
        key: "gallery",
        kind: "array-string",
        label: "Gallery image URLs",
        placeholder: "https://assets.example.com/products/1.webp",
        wide: true,
      },
    ],
  },
  {
    id: "seo",
    title: "SEO",
    description: "Title and description used for search engine and social sharing previews.",
    fields: [
      { key: "seo-title", kind: "text", label: "SEO title", placeholder: "Antminer S19 XP 140TH/s — Crypto Mining Miles", wide: true },
      { key: "seo-desc", kind: "textarea", label: "SEO description", placeholder: "Buy the Antminer S19 XP. 140 TH/s SHA-256, 21.5 J/TH efficiency.", rows: 3, wide: true },
    ],
  },
  {
    id: "related",
    title: "Related Products",
    description: "Products shown in the 'You may also like' carousel.",
    fields: [
      {
        key: "related",
        kind: "array-string",
        label: "Related product slugs",
        placeholder: "antminer-s19j-pro",
        wide: true,
        hint: "Enter the URL slug for each related product",
      },
    ],
  },
];

// ─── helpers ─────────────────────────────────────────────────────────
function buildFormData(values: Record<string, unknown>): FormData {
  const fd = new FormData();
  const append = (k: string, v: unknown) => {
    if (v !== undefined && v !== null) fd.append(k, String(v));
  };
  append("name", values["name"]);
  append("slug", values["slug"]);
  append("shortName", values["short-name"]);
  append("subName", values["sub-name"]);
  append("edition", values["edition"]);
  append("sku", values["sku"]);
  append("tag", values["tag"]);
  append("algo", values["algorithm"]);
  append("stockStatusOverride", values["coming-soon-override"] === "true" ? "Coming Soon" : "");
  append("available", String(values["available"] === "true"));
  append("bestSeller", String(values["best-seller"] === "true"));
  append("hashrate", values["hashrate-display"]);
  append("hashrateNum", values["hashrate-num"]);
  append("hashrateUnit", "TH/s");
  append("power", values["power-display"]);
  append("powerNum", values["power-num"]);
  append("efficiency", values["efficiency-display"]);
  append("efficiencyNum", values["efficiency-num"]);
  append("noise", values["noise-display"]);
  append("noiseNum", values["noise-num"]);
  append("price", String(Number(values["price-inr"]) || 0));
  append("priceDisplay", values["price-display"]);
  append("silencerPrice", String(Number(values["silencer-price"]) || 0));
  append("contract", values["contract"]);
  append("tagline", values["tagline"]);
  append("specs[performance]", JSON.stringify(values["specs-performance"] ?? []));
  append("specs[power]", JSON.stringify(values["specs-power"] ?? []));
  append("specs[physical]", JSON.stringify(values["specs-physical"] ?? []));
  append("specs[connectivity]", JSON.stringify(values["specs-connectivity"] ?? []));
  append("boxItems", JSON.stringify(values["box-items"] ?? []));
  append("electricalReqs", JSON.stringify(values["electrical"] ?? []));
  append("seo[title]", values["seo-title"]);
  append("seo[description]", values["seo-desc"]);
  append("relatedSlugs", JSON.stringify(values["related"] ?? []));
  return fd;
}

function productToInitialValues(p: Record<string, unknown>): Record<string, unknown> {
  const specs = (p.specs as Record<string, unknown>) ?? {};
  const seo = (p.seo as Record<string, unknown>) ?? {};
  const toRows = (arr: unknown) =>
    Array.isArray(arr)
      ? (arr as [string, string][]).map(([label, value]) => ({ label, value }))
      : [];

  return {
    slug: p.slug ?? "",
    name: p.name ?? "",
    "short-name": p.shortName ?? "",
    "sub-name": p.subName ?? "",
    edition: p.edition ?? "",
    sku: p.sku ?? "",
    tag: p.tag ?? "",
    algorithm: p.algo ?? "SHA-256",
    "coming-soon-override": String(p.stockStatusOverride === "Coming Soon"),
    available: String(p.available ?? true),
    "best-seller": String(p.bestSeller ?? false),
    "hashrate-display": p.hashrate ?? "",
    "hashrate-num": String(p.hashrateNum ?? ""),
    "power-display": p.power ?? "",
    "power-num": String(p.powerNum ?? ""),
    "efficiency-display": p.efficiency ?? "",
    "efficiency-num": String(p.efficiencyNum ?? ""),
    "noise-display": p.noise ?? "",
    "noise-num": String(p.noiseNum ?? ""),
    "price-inr": String(p.price ?? ""),
    "price-display": p.priceDisplay ?? "",
    "silencer-price": String(p.silencerPrice ?? ""),
    contract: p.contract ?? "",
    tagline: p.tagline ?? "",
    "specs-performance": toRows(specs.performance),
    "specs-power": toRows(specs.power),
    "specs-physical": toRows(specs.physical),
    "specs-connectivity": toRows(specs.connectivity),
    "box-items": Array.isArray(p.boxItems) ? p.boxItems : [],
    electrical: toRows(p.electricalReqs),
    "seo-title": seo.title ?? "",
    "seo-desc": seo.description ?? "",
    related: Array.isArray(p.relatedSlugs) ? p.relatedSlugs : [],
  };
}

// ─── Product List View ────────────────────────────────────────────────
function ProductList() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ products: ApiProduct[] }>("/get-products?status=all");
      setProducts(data.products ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearchChange = (q: string) => {
    setSearch(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { fetchProducts(); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await apiFetch<{ products: ApiProduct[] }>("/search-products", {
          method: "POST",
          body: JSON.stringify({ query: q }),
        });
        setProducts(data.products ?? []);
      } catch {
        // keep current list on search error
      }
    }, 400);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await apiFetch("/delete-product", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      fetchProducts();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const statusTone = (p: ApiProduct) =>
    p.available ? ("success" as const) : ("warning" as const);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-tag mb-2">Commerce</p>
          <h1 className="font-display text-3xl font-bold text-navy-900">Products</h1>
          <p className="mt-1.5 text-sm text-navy-500">Manage all ASIC miners listed on the shop.</p>
        </div>
        <Link href="/products/new" className="btn-primary">
          <Plus size={14} />
          New Product
        </Link>
      </div>

      <Card className="mb-4 flex items-center gap-3 p-3">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-navy-900/12 bg-white px-3 py-2 shadow-sm">
          <Search size={14} className="shrink-0 text-navy-400" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 border-none bg-transparent text-sm text-navy-900 outline-none placeholder:text-navy-300"
          />
        </label>
        <button type="button" className="flex items-center gap-2 rounded-xl border border-navy-900/12 bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-navy-600 shadow-sm transition hover:bg-navy-900/5">
          <SlidersHorizontal size={13} />
          Filter
        </button>
      </Card>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-900/8 bg-cream">
                {["Product", "Algorithm", "Hashrate", "Price", "Status", "Action"].map((h, i) => (
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
                : products.map((p) => (
                    <tr key={p._id} className="group transition-colors hover:bg-cream/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-900/6">
                            <Package size={16} className="text-navy-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-navy-900">{p.name}</p>
                            <p className="font-mono text-[10px] uppercase tracking-widest text-navy-400">{p.computedStatus} · qty {p.quantity ?? 0}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-[12px] text-navy-600">{p.algo}</td>
                      <td className="px-5 py-4 font-mono text-[12px] text-navy-600">{p.hashrate}</td>
                      <td className="px-5 py-4 font-mono text-[12px] font-semibold text-navy-900">{p.priceDisplay}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Pill tone={statusTone(p)}>{p.available ? "Published" : "Draft"}</Pill>
                          {p.bestSeller && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-mint-300 bg-mint-50 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-navy-900">
                              <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
                              Best Seller
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/products/edit/${p._id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-navy-900/12 bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-navy-700 shadow-sm transition hover:bg-navy-900 hover:text-mint-300 hover:border-navy-900"
                          >
                            Edit <ArrowRight size={11} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(p._id, p.name)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-400 transition hover:bg-red-100 hover:text-red-600"
                            aria-label="Delete product"
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
            {loading ? "Loading…" : `${products.length} products · ${products.filter((p) => p.available).length} published`}
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── Product Editor (Create / Edit) ──────────────────────────────────
function ProductEditor({ productId }: { productId?: string }) {
  const router = useRouter();
  const isNew = !productId;
  const [initialValues, setInitialValues] = useState<Record<string, unknown> | undefined>(undefined);
  const [loading, setLoading] = useState(!isNew);
  const [createdId, setCreatedId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isNew) return;
    apiFetch<{ products: Record<string, unknown>[] }>("/get-products?status=all")
      .then((data) => {
        const p = (data.products ?? []).find((x: Record<string, unknown>) => x._id === productId);
        if (p) setInitialValues(productToInitialValues(p));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId, isNew]);

  const saveProduct = useCallback(
    async (values: Record<string, unknown>) => {
      const fd = buildFormData(values);
      const targetId = createdId ?? productId;
      if (targetId) {
        await apiUpload(`/edit-product/${targetId}`, fd, 'PUT');
      } else {
        const res = await apiUpload<{ product: { _id: string } }>("/create-product", fd);
        const newId = res?.product?._id;
        if (newId) {
          setCreatedId(newId);
          router.push(`/products/edit/${newId}`);
        }
      }
    },
    [productId, createdId, router]
  );

  const onSaveSection = useCallback(
    async (_sectionId: string, values: Record<string, unknown>) => {
      await saveProduct(values);
    },
    [saveProduct]
  );

  const onSaveAll = useCallback(
    async (values: Record<string, unknown>) => {
      await saveProduct(values);
    },
    [saveProduct]
  );

  if (loading) return <p className="p-8 text-sm text-navy-500">Loading…</p>;

  return (
    <SectionedEditor
      pageTag="Commerce · Products"
      pageTitle={isNew ? "Create Product" : "Edit Product"}
      pageDescription={
        isNew
          ? "Fill in all sections below to list a new product on the shop."
          : "Edit each section using the tabs on the left. Changes are saved per section."
      }
      sections={PRODUCT_EDITOR_SECTIONS}
      initialValues={initialValues}
      onSaveSection={onSaveSection}
      onSaveAll={onSaveAll}
    />
  );
}

// ─── Page ────────────────────────────────────────────────────────────
export default function ProductsPage({ params }: { params: Params }) {
  const mode = params.slug?.[0] ?? "list";

  if (mode === "list" || !mode) return <ProductList />;
  if (mode === "new") return <ProductEditor />;
  if (mode === "edit") return <ProductEditor productId={params.slug?.[1]} />;

  return <ProductList />;
}
