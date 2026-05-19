"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, BarChart3, ArrowRight, Zap, Trash2 } from "lucide-react";
import { SectionedEditor } from "@/components/editors/SectionedEditor";
import { Card } from "@/components/primitives/Card";
import { Pill } from "@/components/primitives/Pill";
import { apiFetch } from "@/lib/api";
import type { SectionDef } from "@/lib/field-types";

type Params = { slug?: string[] };

type ApiPlan = {
  _id: string;
  slug: string;
  name: string;
  tag: string;
  price: number;
  hashrate: string;
  duration: string;
  featured: boolean;
  status: string;
};

// ─── Plan Editor Sections ────────────────────────────────────────────
const PLAN_EDITOR_SECTIONS: SectionDef[] = [
  {
    id: "identity",
    title: "Identity",
    description: "Name, slug, and badge that appear on the plan card.",
    fields: [
      { key: "slug", kind: "text", label: "Slug (URL-safe)", placeholder: "boulder", hint: "Used internally and in APIs. Lowercase, no spaces." },
      { key: "name", kind: "text", label: "Plan Name", placeholder: "Boulder" },
      { key: "tag", kind: "text", label: "Badge text (e.g. POPULAR)", placeholder: "POPULAR" },
      { key: "featured", kind: "toggle", label: "Featured plan", onLabel: "Dark card — highlighted", offLabel: "Light card — standard" },
      { key: "published", kind: "toggle", label: "Published", onLabel: "Visible on site", offLabel: "Hidden (draft)" },
    ],
  },
  {
    id: "pricing",
    title: "Pricing & Hashrate",
    description: "Cost, hashrate, contract length, and currency.",
    fields: [
      { key: "price", kind: "number", label: "Price", placeholder: "199", unit: "USD" },
      { key: "hashrate", kind: "text", label: "Hashrate", placeholder: "25 TH/s" },
      { key: "duration", kind: "text", label: "Contract duration", placeholder: "24 months" },
      {
        key: "currency",
        kind: "select",
        label: "Display currency",
        options: ["USD", "INR", "EUR", "AED"],
        placeholder: "USD",
      },
      { key: "sort-order", kind: "number", label: "Display order", placeholder: "2", hint: "Lower numbers appear first (1 = leftmost card)" },
    ],
  },
  {
    id: "features",
    title: "Features",
    description: "Bullet points shown on the plan card. Add one feature per row.",
    fields: [
      {
        key: "features",
        kind: "array-string",
        label: "Feature bullets",
        placeholder: "e.g. Daily payouts",
        wide: true,
      },
    ],
  },
  {
    id: "cta",
    title: "CTA Button",
    description: "The button at the bottom of the plan card.",
    fields: [
      { key: "cta-label", kind: "text", label: "Button text", placeholder: "Start Mining →" },
      { key: "cta-href", kind: "text", label: "Button URL", placeholder: "/shop" },
    ],
  },
  {
    id: "seo",
    title: "SEO",
    description: "Optional overrides for plan page meta tags.",
    fields: [
      { key: "seo-title", kind: "text", label: "SEO title", placeholder: "Boulder Plan — 25 TH/s · Crypto Mining Miles", wide: true },
      { key: "seo-desc", kind: "textarea", label: "SEO description", placeholder: "Start mining Bitcoin today with the Boulder plan.", rows: 3, wide: true },
    ],
  },
];

function planToInitialValues(p: Record<string, unknown>): Record<string, unknown> {
  return {
    slug: p.slug ?? "",
    name: p.name ?? "",
    tag: p.tag ?? "",
    featured: String(p.featured ?? false),
    published: String((p.status as string) === "active"),
    price: String(p.price ?? ""),
    hashrate: p.hashrate ?? "",
    duration: p.duration ?? "",
    currency: p.currency ?? "USD",
    "sort-order": String(p.sortOrder ?? ""),
    features: Array.isArray(p.features) ? p.features : [],
    "cta-label": p.ctaLabel ?? "",
    "cta-href": p.ctaHref ?? "",
  };
}

function valuesToPlanBody(values: Record<string, unknown>): Record<string, unknown> {
  return {
    name: values["name"],
    slug: values["slug"],
    tag: values["tag"],
    price: Number(values["price"]),
    hashrate: values["hashrate"],
    duration: values["duration"],
    durationMonths: parseInt(String(values["duration"]), 10) || 12,
    currency: values["currency"],
    featured: values["featured"] === "true",
    features: values["features"],
    ctaLabel: values["cta-label"],
    ctaHref: values["cta-href"],
    sortOrder: Number(values["sort-order"]) || 0,
    status: values["published"] === "true" ? "active" : "inactive",
  };
}

// ─── Plans List View ─────────────────────────────────────────────────
function PlanList() {
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ plans: ApiPlan[] }>("/get-plans");
      setPlans(data.plans ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete plan "${name}"?`)) return;
    try {
      await apiFetch("/delete-plan", { method: "POST", body: JSON.stringify({ id }) });
      fetchPlans();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-tag mb-2">Commerce</p>
          <h1 className="font-display text-3xl font-bold text-navy-900">Mining Plans</h1>
          <p className="mt-1.5 text-sm text-navy-500">Manage hosted hashrate plans shown on the homepage and shop.</p>
        </div>
        <Link href="/plans/new" className="btn-primary">
          <Plus size={14} />
          New Plan
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-48 animate-pulse bg-navy-900/4" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan._id} className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-xl font-bold text-navy-900">{plan.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-navy-400">{plan.slug}</p>
                </div>
                {plan.featured && <Pill tone="success">Featured</Pill>}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900">
                  <Zap size={16} className="text-mint-400" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-navy-900">{plan.hashrate}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-navy-400">
                    ${plan.price} · {plan.duration}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-navy-900/8 pt-4">
                <Pill tone={plan.status === "active" ? "success" : "warning"}>
                  {plan.status === "active" ? "Published" : "Draft"}
                </Pill>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/plans/edit/${plan._id}`}
                    className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-navy-600 transition hover:text-navy-900"
                  >
                    Edit <ArrowRight size={11} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(plan._id, plan.name)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-400 transition hover:bg-red-100 hover:text-red-600"
                    aria-label="Delete plan"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </Card>
          ))}

          <Link
            href="/plans/new"
            className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-navy-900/15 bg-white text-navy-400 transition hover:border-navy-900/30 hover:text-navy-700"
          >
            <Plus size={20} />
            <span className="font-mono text-[11px] uppercase tracking-[0.14em]">Add plan</span>
          </Link>
        </div>
      )}

      <Card className="mt-4">
        <div className="flex items-center gap-3">
          <BarChart3 size={16} className="text-navy-400" />
          <p className="font-mono text-[11px] text-navy-500">
            {loading ? "Loading…" : `${plans.length} plans total · ${plans.filter((p) => p.status === "active").length} published · ${plans.filter((p) => p.featured).length} featured`}
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── Plan Editor ─────────────────────────────────────────────────────
function PlanEditor({ planId }: { planId?: string }) {
  const router = useRouter();
  const isNew = !planId;
  const [initialValues, setInitialValues] = useState<Record<string, unknown> | undefined>(undefined);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    apiFetch<{ plans: Record<string, unknown>[] }>("/get-plans")
      .then((data) => {
        const p = (data.plans ?? []).find((x: Record<string, unknown>) => x._id === planId);
        if (p) setInitialValues(planToInitialValues(p));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [planId, isNew]);

  const savePlan = useCallback(
    async (values: Record<string, unknown>) => {
      const body = valuesToPlanBody(values);
      if (planId) {
        await apiFetch(`/update-plan/${planId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        const res = await apiFetch<{ plan: { _id: string } }>("/create-plan", {
          method: "POST",
          body: JSON.stringify(body),
        });
        const newId = res?.plan?._id;
        if (newId) router.push(`/plans/edit/${newId}`);
      }
    },
    [planId, router]
  );

  const onSaveSection = useCallback(async (_id: string, v: Record<string, unknown>) => { await savePlan(v); }, [savePlan]);
  const onSaveAll = useCallback(async (v: Record<string, unknown>) => { await savePlan(v); }, [savePlan]);

  if (loading) return <p className="p-8 text-sm text-navy-500">Loading…</p>;

  return (
    <SectionedEditor
      pageTag="Commerce · Plans"
      pageTitle={isNew ? "Create Plan" : "Edit Plan"}
      pageDescription={
        isNew
          ? "Set up the plan identity, pricing, features, and CTA using the sections below."
          : "Edit each section of the plan using the tabs on the left."
      }
      sections={PLAN_EDITOR_SECTIONS}
      initialValues={initialValues}
      onSaveSection={onSaveSection}
      onSaveAll={onSaveAll}
    />
  );
}

// ─── Page ────────────────────────────────────────────────────────────
export default function PlansPage({ params }: { params: Params }) {
  const mode = params.slug?.[0] ?? "list";

  if (mode === "list" || !mode) return <PlanList />;
  if (mode === "new") return <PlanEditor />;
  if (mode === "edit") return <PlanEditor planId={params.slug?.[1]} />;

  return <PlanList />;
}
