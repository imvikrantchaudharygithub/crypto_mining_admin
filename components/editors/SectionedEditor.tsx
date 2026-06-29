"use client";

import { useState, useCallback, useId, useEffect } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  ChevronRight,
  GripVertical,
  LayoutGrid,
  Eye,
  EyeOff,
} from "lucide-react";
import type {
  FieldDef,
  SectionDef,
  SimpleFieldDef,
  ArrayStringFieldDef,
  ArrayObjectFieldDef,
} from "@/lib/field-types";
import { RichTextEditor } from "@/components/editors/RichTextEditor";

type FieldValue = string | string[] | Record<string, string>[];
type FormState = Record<string, FieldValue>;

function initFormState(sections: SectionDef[]): FormState {
  const state: FormState = {};
  for (const section of sections) {
    if (section.visibleKey) state[section.visibleKey] = "true";
    for (const field of section.fields) {
      if (field.kind === "array-string") {
        state[field.key] = [""];
      } else if (field.kind === "array-object") {
        const empty: Record<string, string> = {};
        field.schema.forEach((f) => {
          empty[f.key] = f.placeholder ?? "";
        });
        state[field.key] = [empty];
      } else {
        state[field.key] = field.placeholder ?? "";
      }
    }
  }
  return state;
}

const inputBase =
  "w-full rounded-xl border border-navy-900/12 bg-white px-4 py-3 text-sm text-navy-900 shadow-sm outline-none transition duration-150 placeholder:text-navy-300 focus:border-mint-400 focus:ring-2 focus:ring-mint-400/20 hover:border-navy-900/25";

function ToggleSwitch({
  checked,
  onChange,
  size = "md",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  size?: "sm" | "md";
}) {
  const dims = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const knob = size === "sm" ? "h-4 w-4 translate-x-4" : "h-5 w-5 translate-x-5";
  const knobBase = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative ${dims} rounded-full transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-400 ${
        checked ? "bg-navy-900" : "bg-navy-900/20"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 ${knobBase} rounded-full shadow transition-all duration-200 ${
          checked ? `${knob} bg-mint-400` : "bg-white"
        }`}
      />
    </button>
  );
}

function SimpleField({
  field,
  value,
  onChange,
}: {
  field: SimpleFieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputId = useId();
  const isWide = "wide" in field && field.wide;

  return (
    <div className={`flex flex-col gap-1.5 ${isWide ? "md:col-span-2" : ""}`}>
      <label
        htmlFor={inputId}
        className="select-none font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-500"
      >
        {field.label}
      </label>

      {field.kind === "toggle" ? (
        <div className="flex items-center gap-3 py-1">
          <ToggleSwitch
            checked={value === "true"}
            onChange={(v) => onChange(v ? "true" : "false")}
          />
          <span className="text-sm text-navy-700">
            {value === "true"
              ? ("onLabel" in field && field.onLabel ? field.onLabel : "Enabled")
              : ("offLabel" in field && field.offLabel ? field.offLabel : "Disabled")}
          </span>
        </div>
      ) : field.kind === "select" ? (
        <select
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputBase} cursor-pointer`}
        >
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.kind === "richtext" ? (
        <RichTextEditor value={value} onChange={onChange} />
      ) : field.kind === "textarea" ? (
        <textarea
          id={inputId}
          rows={"rows" in field && field.rows ? field.rows : 4}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputBase} resize-y leading-relaxed`}
        />
      ) : (
        <div className="relative">
          <input
            id={inputId}
            type={field.kind === "number" ? "number" : field.kind}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputBase} ${"unit" in field && field.unit ? "pr-14" : ""}`}
          />
          {"unit" in field && field.unit && (
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[11px] text-navy-400">
              {field.unit}
            </span>
          )}
        </div>
      )}

      {field.hint && (
        <p className="font-mono text-[10px] leading-relaxed text-navy-400">{field.hint}</p>
      )}
    </div>
  );
}

function ArrayStringEditor({
  field,
  value,
  onChange,
}: {
  field: ArrayStringFieldDef;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const add = () => onChange([...value, ""]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i: number, v: string) => {
    const next = [...value];
    next[i] = v;
    onChange(next);
  };

  const isWide = "wide" in field && field.wide;

  return (
    <div
      className={`flex flex-col gap-2.5 ${isWide ? "md:col-span-2" : ""}`}
    >
      <div className="flex items-center gap-2">
        <p className="select-none font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-500">
          {field.label}
        </p>
        <span className="rounded-full bg-navy-900/6 px-2 py-0.5 font-mono text-[10px] text-navy-400">
          {value.length} item{value.length !== 1 ? "s" : ""}
        </span>
      </div>

      {field.hint && (
        <p className="font-mono text-[10px] leading-relaxed text-navy-400">{field.hint}</p>
      )}

      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="cursor-grab text-navy-300">
              <GripVertical size={14} />
            </div>
            <input
              type="text"
              value={item}
              placeholder={field.placeholder ?? `Item ${i + 1}`}
              onChange={(e) => update(i, e.target.value)}
              className={`${inputBase} flex-1`}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove item"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-400 transition hover:bg-red-100 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="flex w-fit items-center gap-1.5 rounded-xl border border-dashed border-navy-900/20 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-navy-500 transition hover:border-navy-900/40 hover:text-navy-900"
      >
        <Plus size={12} />
        Add item
      </button>
    </div>
  );
}

function ArrayObjectEditor({
  field,
  value,
  onChange,
}: {
  field: ArrayObjectFieldDef;
  value: Record<string, string>[];
  onChange: (v: Record<string, string>[]) => void;
}) {
  const itemLabel = field.itemLabel ?? "Item";
  const isWide = "wide" in field && field.wide;

  const add = () => {
    const empty: Record<string, string> = {};
    field.schema.forEach((f) => {
      empty[f.key] = "";
    });
    onChange([...value, empty]);
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const update = (i: number, key: string, v: string) => {
    onChange(value.map((item, idx) => (idx === i ? { ...item, [key]: v } : item)));
  };

  return (
    <div className={`flex flex-col gap-3 ${isWide ? "md:col-span-2" : ""}`}>
      <div className="flex items-center justify-between">
        <p className="select-none font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-500">
          {field.label}
        </p>
        <span className="rounded-full bg-navy-900/6 px-2.5 py-0.5 font-mono text-[10px] text-navy-400">
          {value.length} {value.length === 1 ? itemLabel.toLowerCase() : `${itemLabel.toLowerCase()}s`}
        </span>
      </div>

      {field.hint && (
        <p className="font-mono text-[10px] leading-relaxed text-navy-400">{field.hint}</p>
      )}

      <div className="space-y-3">
        {value.map((item, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-navy-900/10 bg-cream"
          >
            <div className="flex items-center justify-between border-b border-navy-900/8 bg-navy-900/3 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <GripVertical size={13} className="cursor-grab text-navy-300" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-mint-500">
                  {itemLabel} {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[10px] text-navy-400 transition hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 size={11} />
                Remove
              </button>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-2">
              {field.schema.map((subField) => (
                <SimpleField
                  key={subField.key}
                  field={subField}
                  value={item[subField.key] ?? ""}
                  onChange={(v) => update(i, subField.key, v)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="flex w-fit items-center gap-1.5 rounded-xl border border-dashed border-navy-900/20 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-navy-500 transition hover:border-navy-900/40 hover:text-navy-900"
      >
        <Plus size={12} />
        Add {itemLabel.toLowerCase()}
      </button>
    </div>
  );
}

function FieldRenderer({
  field,
  values,
  setValue,
}: {
  field: FieldDef;
  values: FormState;
  setValue: (key: string, v: FieldValue) => void;
}) {
  if (field.kind === "array-string") {
    return (
      <ArrayStringEditor
        field={field}
        value={(values[field.key] as string[]) ?? [""]}
        onChange={(v) => setValue(field.key, v)}
      />
    );
  }
  if (field.kind === "array-object") {
    return (
      <ArrayObjectEditor
        field={field}
        value={(values[field.key] as Record<string, string>[]) ?? [{}]}
        onChange={(v) => setValue(field.key, v)}
      />
    );
  }
  return (
    <SimpleField
      field={field}
      value={(values[field.key] as string) ?? ""}
      onChange={(v) => setValue(field.key, v)}
    />
  );
}

type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string };

function SaveBadge({ state }: { state: SaveState }) {
  if (state.kind === "saved") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-mint-100 px-3 py-1.5 font-mono text-[11px] font-semibold text-mint-600">
        <CheckCircle2 size={12} />
        Saved
      </span>
    );
  }
  if (state.kind === "saving") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 font-mono text-[11px] font-semibold text-amber-600">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        Saving…
      </span>
    );
  }
  if (state.kind === "error") {
    return (
      <span
        className="flex max-w-[280px] items-center gap-1.5 truncate rounded-full bg-red-50 px-3 py-1.5 font-mono text-[11px] font-semibold text-red-600"
        title={state.message}
      >
        <span className="h-2 w-2 rounded-full bg-red-500" />
        Save failed
      </span>
    );
  }
  return null;
}

export function SectionedEditor({
  pageTitle,
  pageTag,
  pageDescription,
  sections,
  publishable = true,
  initialValues,
  onSaveSection,
  onSaveAll,
}: {
  pageTitle: string;
  pageTag: string;
  pageDescription: string;
  sections: SectionDef[];
  publishable?: boolean;
  initialValues?: Record<string, unknown>;
  onSaveSection?: (sectionId: string, values: FormState) => Promise<void>;
  onSaveAll?: (values: FormState) => Promise<void>;
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [values, setValues] = useState<FormState>(() => initFormState(sections));
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });

  useEffect(() => {
    if (!initialValues) return;
    setValues((prev) => {
      const merged = { ...prev };
      for (const key of Object.keys(prev)) {
        if (initialValues[key] !== undefined && initialValues[key] !== null) {
          merged[key] = initialValues[key] as FieldValue;
        }
      }
      return merged;
    });
  }, [initialValues]);

  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0];
  const activeVisible = activeSection?.visibleKey
    ? values[activeSection.visibleKey] !== "false"
    : true;

  const setValue = useCallback((key: string, v: FieldValue) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setSaveState({ kind: "idle" });
  }, []);

  const errMessage = (e: unknown) => (e instanceof Error ? e.message : "Save failed");

  const handleSave = useCallback(async () => {
    setSaveState({ kind: "saving" });
    try {
      if (onSaveAll) await onSaveAll(values);
      setSaveState({ kind: "saved" });
      setTimeout(() => setSaveState((s) => (s.kind === "saved" ? { kind: "idle" } : s)), 4000);
    } catch (e) {
      setSaveState({ kind: "error", message: errMessage(e) });
    }
  }, [values, onSaveAll]);

  const handleSaveAndNext = useCallback(async () => {
    setSaveState({ kind: "saving" });
    try {
      if (onSaveSection) await onSaveSection(activeId, values);
      setSaveState({ kind: "saved" });
      setTimeout(() => setSaveState((s) => (s.kind === "saved" ? { kind: "idle" } : s)), 4000);
      const currentIndex = sections.findIndex((s) => s.id === activeId);
      if (currentIndex < sections.length - 1) {
        setActiveId(sections[currentIndex + 1].id);
      }
    } catch (e) {
      setSaveState({ kind: "error", message: errMessage(e) });
    }
  }, [activeId, sections, values, onSaveSection]);

  return (
    <div className="flex min-h-screen flex-col pb-24">
      {/* ── Page header ── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-tag mb-2">{pageTag}</p>
          <h1 className="font-display text-3xl font-bold text-navy-900">{pageTitle}</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-navy-500">
            {pageDescription}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <SaveBadge state={saveState} />
          {publishable && (
            <button
              type="button"
              className="cursor-pointer rounded-full border border-navy-900/20 bg-white px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-navy-700 shadow-sm transition hover:border-navy-900 hover:bg-navy-900 hover:text-mint-300"
            >
              Publish live
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saveState.kind === "saving"}
            className="btn-primary disabled:opacity-60"
          >
            <span className="dot" aria-hidden />
            {saveState.kind === "saving" ? "Saving…" : "Save Draft"}
          </button>
        </div>
      </div>

      {/* ── Editor layout ── */}
      <div className="flex flex-1 items-start gap-5">
        {/* Left: Section tabs */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24 overflow-hidden rounded-2xl border border-navy-900/10 bg-white shadow-sm">
            <div className="border-b border-navy-900/8 bg-navy-900/2 px-4 py-3">
              <div className="flex items-center gap-2">
                <LayoutGrid size={12} className="text-navy-400" />
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-400">
                  Sections
                </p>
              </div>
            </div>
            <nav className="space-y-0.5 p-2">
              {sections.map((section, i) => {
                const active = section.id === activeSection?.id;
                const hidden = section.visibleKey
                  ? values[section.visibleKey] === "false"
                  : false;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveId(section.id)}
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                      active
                        ? "bg-navy-900 text-white shadow-sm"
                        : "text-navy-600 hover:bg-navy-900/4 hover:text-navy-900"
                    }`}
                  >
                    <span
                      className={`font-mono text-[9px] font-bold uppercase tracking-widest transition-colors ${
                        active ? "text-mint-400" : "text-navy-300"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`flex-1 truncate text-[12px] font-medium leading-none ${
                        hidden ? "line-through opacity-60" : ""
                      }`}
                    >
                      {section.title}
                    </span>
                    {hidden && (
                      <span
                        className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider ${
                          active
                            ? "bg-mint-400/15 text-mint-300"
                            : "bg-amber-50 text-amber-600"
                        }`}
                        title="Hidden on the live site"
                      >
                        <EyeOff size={9} />
                        Hidden
                      </span>
                    )}
                    {active && !hidden && (
                      <ChevronRight size={12} className="shrink-0 opacity-50" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right: Active section form */}
        <div className="min-w-0 flex-1">
          {activeSection && (
            <div className="overflow-hidden rounded-2xl border border-navy-900/10 bg-white shadow-sm">
              {/* Section header bar */}
              <div className="flex items-center justify-between gap-3 border-b border-navy-900/8 bg-cream px-6 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-900">
                    <span className="h-2.5 w-2.5 rounded-full bg-mint-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-[15px] font-bold text-navy-900">
                      {activeSection.title}
                    </h2>
                    {activeSection.description && (
                      <p className="mt-0.5 truncate text-[12px] text-navy-500">
                        {activeSection.description}
                      </p>
                    )}
                  </div>
                </div>

                {activeSection.visibleKey && (
                  <div
                    className={`flex shrink-0 items-center gap-2.5 rounded-full border px-3 py-1.5 transition-colors ${
                      activeVisible
                        ? "border-mint-300/60 bg-mint-50"
                        : "border-amber-300/60 bg-amber-50"
                    }`}
                    title={
                      activeVisible
                        ? "This section is visible on the live homepage"
                        : "Hidden — the live homepage will skip this section"
                    }
                  >
                    {activeVisible ? (
                      <Eye size={13} className="text-mint-600" />
                    ) : (
                      <EyeOff size={13} className="text-amber-600" />
                    )}
                    <span
                      className={`font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${
                        activeVisible ? "text-mint-700" : "text-amber-700"
                      }`}
                    >
                      {activeVisible ? "Visible" : "Hidden"}
                    </span>
                    <ToggleSwitch
                      size="sm"
                      checked={activeVisible}
                      onChange={(v) =>
                        setValue(activeSection.visibleKey!, v ? "true" : "false")
                      }
                    />
                  </div>
                )}
              </div>

              {/* Hidden banner */}
              {activeSection.visibleKey && !activeVisible && (
                <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50/60 px-6 py-2.5 text-[12px] text-amber-700">
                  <EyeOff size={13} className="mt-0.5 shrink-0" />
                  <span>
                    This section will not render on the live site. Toggle visibility to bring it back.
                  </span>
                </div>
              )}

              {/* Form body */}
              <div className={`p-6 transition-opacity ${activeVisible ? "" : "opacity-60"}`}>
                <div className="grid gap-6 md:grid-cols-2">
                  {activeSection.fields.map((field) => (
                    <FieldRenderer
                      key={field.key}
                      field={field}
                      values={values}
                      setValue={setValue}
                    />
                  ))}
                </div>
              </div>

              {/* Section footer */}
              <div className="flex items-center justify-between border-t border-navy-900/8 bg-cream px-6 py-4">
                <p className="font-mono text-[11px] text-navy-400">
                  Click save to push changes to the live site
                </p>
                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  disabled={saveState.kind === "saving"}
                  className="btn-primary"
                  style={{ padding: "10px 20px" }}
                >
                  <span className="dot" aria-hidden />
                  Save {activeSection.title}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky save bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-navy-900/10 bg-cream/95 px-6 py-3 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`h-2 w-2 rounded-full transition-colors ${
                saveState.kind === "saved"
                  ? "bg-mint-400"
                  : saveState.kind === "saving"
                  ? "bg-amber-400 animate-pulse"
                  : saveState.kind === "error"
                  ? "bg-red-500"
                  : "bg-navy-300"
              }`}
            />
            <p
              className={`font-mono text-[11px] ${
                saveState.kind === "error" ? "text-red-600" : "text-navy-500"
              }`}
              title={saveState.kind === "error" ? saveState.message : undefined}
            >
              {saveState.kind === "saved"
                ? "All changes saved"
                : saveState.kind === "saving"
                ? "Saving changes…"
                : saveState.kind === "error"
                ? `Save failed · ${saveState.message}`
                : "Unsaved changes · save when ready"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {publishable && (
              <button
                type="button"
                className="cursor-pointer rounded-full border border-navy-900/20 bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-navy-700 shadow-sm transition hover:border-navy-900 hover:bg-navy-900 hover:text-mint-300"
              >
                Publish live
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saveState.kind === "saving"}
              className="btn-primary disabled:opacity-60"
              style={{ padding: "10px 20px" }}
            >
              <span className="dot" aria-hidden />
              {saveState.kind === "saving" ? "Saving…" : "Save all"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
