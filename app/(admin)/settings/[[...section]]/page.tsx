"use client";

import { useState, useEffect, useCallback } from "react";
import { DummyEditorPage } from "@/components/shell/DummyUi";
import { SectionedEditor } from "@/components/editors/SectionedEditor";
import { apiFetch } from "@/lib/api";
import type { SectionDef } from "@/lib/field-types";

type Params = { section?: string[] };

// ─── Real Site Settings editor ────────────────────────────────────────
const SITE_SETTINGS_SECTIONS: SectionDef[] = [
  {
    id: "brand",
    title: "Brand",
    description: "Name and tagline used across the site.",
    fields: [
      { key: "brand.name", kind: "text", label: "Brand Name", placeholder: "Crypto Mining Miles" },
      { key: "brand.tagline", kind: "text", label: "Tagline", placeholder: "redefined mining" },
      { key: "brand.estYear", kind: "text", label: "Established Year", placeholder: "2017" },
    ],
  },
  {
    id: "contact",
    title: "Contact & Header CTA",
    description: "Phone number powering the navbar “Call Us” button and the floating WhatsApp button on every page.",
    fields: [
      { key: "contact.salesPhoneLabel", kind: "text", label: "Header CTA label", placeholder: "Call Us Now", hint: "Text shown on the navbar button" },
      { key: "contact.salesPhone", kind: "text", label: "Header CTA phone (display)", placeholder: "+91 99119 44472", hint: "Shown to users and used as the tel: link" },
      { key: "contact.whatsappEnabled", kind: "toggle", label: "Floating WhatsApp button", onLabel: "Visible on site", offLabel: "Hidden" },
      { key: "contact.whatsappNumber", kind: "text", label: "WhatsApp number (digits only, with country code)", placeholder: "919911944472", hint: "WhatsApp wa.me requires digits only — no +, spaces, or dashes." },
      { key: "contact.whatsappMessage", kind: "textarea", label: "WhatsApp pre-filled message", placeholder: "Hi, I'd like to know more about mining contracts.", rows: 2, wide: true },
      { key: "contact.salesEmail", kind: "email", label: "Sales Email", placeholder: "sales@cryptominingmiles.in" },
      { key: "contact.supportEmail", kind: "email", label: "Support Email", placeholder: "support@cryptominingmiles.in" },
      { key: "contact.workingHours", kind: "text", label: "Working Hours", placeholder: "Mon–Sat, 9AM–7PM IST", wide: true },
    ],
  },
  {
    id: "legal",
    title: "Legal",
    description: "Company identifiers shown in the footer and on invoices.",
    fields: [
      { key: "legal.gstNumber", kind: "text", label: "GST Number", placeholder: "07ABCDE1234F1Z5" },
      { key: "legal.cinNumber", kind: "text", label: "CIN", placeholder: "L12345DL2017PTC010101" },
      { key: "legal.privacyPolicyUrl", kind: "url", label: "Privacy Policy URL", placeholder: "/privacy" },
      { key: "legal.termsUrl", kind: "url", label: "Terms URL", placeholder: "/terms" },
    ],
  },
  {
    id: "social",
    title: "Social Links",
    description: "URLs shown in the footer and used for sharing.",
    fields: [
      { key: "social.twitter", kind: "url", label: "Twitter / X", placeholder: "https://x.com/handle" },
      { key: "social.linkedin", kind: "url", label: "LinkedIn", placeholder: "https://linkedin.com/company/handle" },
      { key: "social.youtube", kind: "url", label: "YouTube", placeholder: "https://youtube.com/@handle" },
      { key: "social.instagram", kind: "url", label: "Instagram", placeholder: "https://instagram.com/handle" },
      { key: "social.telegram", kind: "url", label: "Telegram", placeholder: "https://t.me/handle" },
    ],
  },
];

function flatten(prefix: string, obj: Record<string, unknown>, out: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(obj ?? {})) {
    if (k === "_id" || k === "__v" || k === "createdAt" || k === "updatedAt") continue;
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
      flatten(path, v as Record<string, unknown>, out);
    } else {
      out[path] = v;
    }
  }
}

function unflatten(values: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    const parts = key.split(".");
    let cursor: Record<string, unknown> = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (typeof cursor[p] !== "object" || cursor[p] === null || Array.isArray(cursor[p])) {
        cursor[p] = {};
      }
      cursor = cursor[p] as Record<string, unknown>;
    }
    cursor[parts[parts.length - 1]] = value;
  }
  return result;
}

const TOGGLE_KEYS = new Set(["contact.whatsappEnabled"]);

function buildInitial(raw: Record<string, unknown> | null): Record<string, unknown> {
  if (!raw) return {};
  const flat: Record<string, unknown> = {};
  flatten("", raw, flat);
  for (const key of Array.from(TOGGLE_KEYS)) {
    flat[key] = flat[key] === false ? "false" : "true";
  }
  return flat;
}

function buildPayload(values: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...values };
  for (const key of Array.from(TOGGLE_KEYS)) {
    next[key] = next[key] !== "false";
  }
  // Filter to only known keys (defensive)
  const known = new Set<string>();
  for (const section of SITE_SETTINGS_SECTIONS) {
    for (const f of section.fields) known.add(f.key);
  }
  const filtered: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(next)) {
    if (known.has(k)) filtered[k] = v;
  }
  return unflatten(filtered);
}

function SiteSettingsEditor() {
  const [initialValues, setInitialValues] = useState<Record<string, unknown> | undefined>(undefined);

  useEffect(() => {
    apiFetch<{ siteSettings?: Record<string, unknown> } & Record<string, unknown>>("/site-settings")
      .then((data) => {
        const doc = (data.siteSettings ?? data) as Record<string, unknown>;
        setInitialValues(buildInitial(doc));
      })
      .catch(() => setInitialValues({}));
  }, []);

  const save = useCallback(async (values: Record<string, unknown>) => {
    const payload = buildPayload(values);
    await apiFetch("/admin/update-site-settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }, []);

  return (
    <SectionedEditor
      pageTag="Settings"
      pageTitle="Site Settings"
      pageDescription="Brand, contact info, and the phone numbers powering the navbar Call CTA + floating WhatsApp button."
      sections={SITE_SETTINGS_SECTIONS}
      initialValues={initialValues}
      onSaveSection={async (_id, v) => { await save(v); }}
      onSaveAll={async (v) => { await save(v); }}
    />
  );
}

// ─── Dummy sub-sections (unchanged) ───────────────────────────────────
const dummyConfigs: Record<
  string,
  { title: string; description: string; sections: Array<{ title: string; fields: Array<{ label: string; placeholder: string }> }> }
> = {
  seo: {
    title: "SEO Overrides",
    description: "Per-page title/description/open graph placeholders.",
    sections: [
      {
        title: "Global Defaults",
        fields: [
          { label: "Default Title", placeholder: "Crypto Mining Miles | Home" },
          { label: "Default Description", placeholder: "Performance-first mining hardware..." },
          { label: "OG Image URL", placeholder: "https://assets.../og-home.jpg" },
          { label: "Twitter Handle", placeholder: "@cryptominingmiles" },
        ],
      },
    ],
  },
  users: {
    title: "Admin Users",
    description: "Super-admin user management scaffold.",
    sections: [
      {
        title: "Invite User",
        fields: [
          { label: "Name", placeholder: "New Team Member" },
          { label: "Email", placeholder: "team@example.com" },
          { label: "Role", placeholder: "editor / support / super-admin" },
          { label: "Status", placeholder: "active / inactive" },
        ],
      },
    ],
  },
  "audit-log": {
    title: "Audit Log",
    description: "Read-only event trace and diff preview scaffold.",
    sections: [
      {
        title: "Filters",
        fields: [
          { label: "Actor", placeholder: "vikrant@..." },
          { label: "Entity", placeholder: "product / plan / page" },
          { label: "Action", placeholder: "update / publish / delete" },
          { label: "Date Window", placeholder: "Last 24 hours" },
        ],
      },
    ],
  },
};

export default function SettingsPage({ params }: { params: Params }) {
  const key = params.section?.[0];
  if (!key) return <SiteSettingsEditor />;
  const config = dummyConfigs[key];
  if (!config) return <SiteSettingsEditor />;
  return (
    <DummyEditorPage
      sectionTag="Settings"
      title={config.title}
      description={config.description}
      formSections={config.sections}
      tableRows={[]}
    />
  );
}
