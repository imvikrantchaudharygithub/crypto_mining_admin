"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/primitives/Card";
import { Pill } from "@/components/primitives/Pill";
import { PageHeader } from "@/components/shell/PageHeader";

type Field = {
  key?: string;
  label: string;
  placeholder: string;
  type?: "text" | "number" | "email" | "url" | "textarea" | "select" | "list";
  options?: string[];
};

type Section = {
  id?: string;
  title: string;
  fields: Field[];
};

type TableRow = {
  id: string;
  primary: string;
  secondary: string;
  status: "success" | "warning" | "neutral" | "danger";
};

type DummyEditorPageProps = {
  sectionTag: string;
  title: string;
  description: string;
  formSections: Section[];
  rightPanelTitle?: string;
  tableRows?: TableRow[];
};

export function DummyEditorPage({
  sectionTag,
  title,
  description,
  formSections,
  rightPanelTitle = "Live Preview",
  tableRows = []
}: DummyEditorPageProps) {
  const normalizedSections = useMemo(
    () =>
      formSections.map((section, sectionIndex) => ({
        id: section.id ?? `section-${sectionIndex}`,
        title: section.title,
        fields: section.fields.map((field, fieldIndex) => ({
          key: field.key ?? `${section.title.toLowerCase().replace(/\s+/g, "-")}-${fieldIndex}`,
          ...field
        }))
      })),
    [formSections]
  );

  const [activeSectionId, setActiveSectionId] = useState(normalizedSections[0]?.id ?? "");
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    normalizedSections.forEach((section) => {
      section.fields.forEach((field) => {
        initial[field.key] = field.placeholder ?? "";
      });
    });
    return initial;
  });

  const activeSection =
    normalizedSections.find((section) => section.id === activeSectionId) ?? normalizedSections[0];

  const totalFields = normalizedSections.reduce((acc, section) => acc + section.fields.length, 0);
  const changedFields = Object.entries(values).filter(
    ([, value]) => value.trim().length > 0
  ).length;

  return (
    <div className="pb-24">
      <PageHeader section={sectionTag} title={title} description={description} />
      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4">
          <Card className="p-0">
            <div className="grid gap-0 md:grid-cols-[240px_1fr]">
              <aside className="border-b border-navy-900/10 bg-white/40 p-3 md:border-b-0 md:border-r">
                <p className="section-tag mb-3">Sections</p>
                <div className="space-y-1">
                  {normalizedSections.map((section) => {
                    const active = section.id === activeSection?.id;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSectionId(section.id)}
                        className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                          active ? "bg-navy-900 text-mint-300" : "bg-transparent text-navy-700 hover:bg-navy-900/5"
                        }`}
                      >
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
                          {section.title}
                        </span>
                        <span className={`h-2 w-2 rounded-full ${active ? "bg-mint-400" : "bg-navy-300"}`} />
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div className="p-5">
                <p className="section-tag mb-4">{activeSection?.title ?? "Fields"}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {activeSection?.fields.map((field) => (
                    <div
                      key={`${activeSection.title}-${field.key}`}
                      className={field.type === "textarea" || field.type === "list" ? "space-y-2 md:col-span-2" : "space-y-2"}
                    >
                      <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy-700">
                        {field.label}
                      </label>

                      {field.type === "textarea" || field.type === "list" ? (
                        <textarea
                          rows={field.type === "list" ? 5 : 4}
                          value={values[field.key]}
                          onChange={(event) =>
                            setValues((current) => ({ ...current, [field.key]: event.target.value }))
                          }
                          className="w-full rounded-xl border border-navy-900/20 bg-white px-3 py-2.5 text-sm text-ink outline-none ring-mint-400 transition focus:ring-2"
                        />
                      ) : field.type === "select" ? (
                        <select
                          value={values[field.key]}
                          onChange={(event) =>
                            setValues((current) => ({ ...current, [field.key]: event.target.value }))
                          }
                          className="w-full cursor-pointer rounded-xl border border-navy-900/20 bg-white px-3 py-2.5 text-sm text-ink outline-none ring-mint-400 transition focus:ring-2"
                        >
                          {(field.options ?? [field.placeholder]).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type ?? "text"}
                          value={values[field.key]}
                          onChange={(event) =>
                            setValues((current) => ({ ...current, [field.key]: event.target.value }))
                          }
                          className="w-full rounded-xl border border-navy-900/20 bg-white px-3 py-2.5 text-sm text-ink outline-none ring-mint-400 transition focus:ring-2"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="sticky top-24">
            <p className="section-tag mb-3">{rightPanelTitle}</p>
            <div className="rounded-2xl border border-navy-900/10 bg-white p-4">
              <p className="font-display text-lg text-navy-900">Draft preview placeholder</p>
              <p className="mt-2 text-sm text-navy-500">
                Data now maps to editable form state. Next step is binding this to backend payloads
                and frontend preview frame.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill tone="warning">Unsaved: {Math.max(0, changedFields)}</Pill>
                <Pill tone="neutral">Autosave: 2s</Pill>
                <Pill tone="success">
                  Fields: {changedFields}/{totalFields}
                </Pill>
              </div>
            </div>
          </Card>

          <Card>
            <p className="section-tag mb-3">Live Payload</p>
            <pre className="max-h-64 overflow-auto rounded-xl border border-navy-900/10 bg-white p-3 font-mono text-[11px] leading-relaxed text-navy-700">
              {JSON.stringify(values, null, 2)}
            </pre>
          </Card>

          {tableRows.length > 0 ? (
            <Card>
              <p className="section-tag mb-3">Dummy Records</p>
              <ul className="space-y-2">
                {tableRows.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-navy-900/10 bg-white px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-navy-900">{row.primary}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy-500">
                        {row.id} • {row.secondary}
                      </p>
                    </div>
                    <Pill tone={row.status}>
                      {row.status === "danger" ? "Critical" : row.status}
                    </Pill>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-navy-900/10 bg-cream/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy-700">
            {changedFields} fields ready to save
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-primary">
              <span className="dot" aria-hidden />
              Save Draft
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-full border border-navy-900/20 bg-white px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-navy-700 transition-colors hover:bg-navy-900 hover:text-mint-300"
            >
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
