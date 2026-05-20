"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Download,
  Tags,
  Calendar,
  TrendingUp,
  IndianRupee,
  Receipt,
  Filter,
} from "lucide-react";
import { Card } from "@/components/primitives/Card";
import { Pill } from "@/components/primitives/Pill";
import { apiFetch } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────
type Expense = {
  _id: string;
  title: string;
  categoryId: string;
  categorySnapshot: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
};

type Category = {
  _id: string;
  name: string;
  color: string;
  isDefault: boolean;
  order: number;
};

type Stats = {
  total: number;
  count: number;
  avg: number;
  prevTotal: number;
  byCategory: { categoryId: string; name: string; total: number; count: number; color: string }[];
  series: { date: string; total: number }[];
};

type PresetKey = "today" | "7d" | "30d" | "50d" | "90d" | "this-month" | "last-month" | "this-year" | "all" | "custom";

// ─── Helpers ──────────────────────────────────────────────────────────
const INR = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
function rupees(n: number) {
  return `₹${INR.format(Math.round(n))}`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toInputDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function presetRange(preset: PresetKey): { from?: string; to?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === "all") return {};
  if (preset === "today") return { from: toInputDate(today), to: toInputDate(today) };
  if (preset === "7d" || preset === "30d" || preset === "50d" || preset === "90d") {
    const days = parseInt(preset);
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    return { from: toInputDate(start), to: toInputDate(today) };
  }
  if (preset === "this-month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toInputDate(start), to: toInputDate(today) };
  }
  if (preset === "last-month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: toInputDate(start), to: toInputDate(end) };
  }
  if (preset === "this-year") {
    const start = new Date(now.getFullYear(), 0, 1);
    return { from: toInputDate(start), to: toInputDate(today) };
  }
  return {};
}

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today",       label: "Today" },
  { key: "7d",          label: "7 days" },
  { key: "30d",         label: "30 days" },
  { key: "50d",         label: "50 days" },
  { key: "90d",         label: "90 days" },
  { key: "this-month",  label: "This month" },
  { key: "last-month",  label: "Last month" },
  { key: "this-year",   label: "This year" },
  { key: "all",         label: "All time" },
];

// ─── Page ─────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [preset, setPreset] = useState<PresetKey>("30d");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // drawers / modals
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Expense | null>(null);

  // Init preset → date range
  useEffect(() => {
    const r = presetRange(preset);
    setFrom(r.from ?? "");
    setTo(r.to ?? "");
  }, [preset]);

  // Build query string
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (selectedCats.length) p.set("categoryId", selectedCats.join(","));
    if (minAmount) p.set("minAmount", minAmount);
    if (maxAmount) p.set("maxAmount", maxAmount);
    if (search.trim()) p.set("search", search.trim());
    return p.toString();
  }, [from, to, selectedCats, minAmount, maxAmount, search]);

  // Fetch categories once
  useEffect(() => {
    apiFetch<{ categories: Category[] }>("/admin/get-expense-categories")
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  // Fetch expenses + stats whenever filters change (debounced for search)
  const debouncedSearch = useDebounce(search, 300);
  const refreshKey = `${from}|${to}|${selectedCats.join(",")}|${minAmount}|${maxAmount}|${debouncedSearch}`;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [exp, st] = await Promise.all([
        apiFetch<{ expenses: Expense[]; total: number }>(`/admin/get-expenses?${queryString}`),
        apiFetch<{ stats: Stats }>(`/admin/expense-stats?${queryString}`),
      ]);
      setExpenses(exp.expenses ?? []);
      setStats(st.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // ─── Handlers ────────────────────────────────────────────────────
  const onSave = async (data: { title: string; categoryId: string; amount: number; date: string; notes?: string }) => {
    if (editing) {
      await apiFetch(`/admin/update-expense/${editing._id}`, { method: "PUT", body: JSON.stringify(data) });
    } else {
      await apiFetch("/admin/create-expense", { method: "POST", body: JSON.stringify(data) });
    }
    setEditorOpen(false);
    setEditing(null);
    fetchAll();
  };

  const onDelete = async () => {
    if (!confirmDelete) return;
    await apiFetch("/admin/delete-expense", { method: "POST", body: JSON.stringify({ id: confirmDelete._id }) });
    setConfirmDelete(null);
    fetchAll();
  };

  const onExportCsv = () => {
    const header = ["Date", "Title", "Category", "Amount (INR)", "Notes"];
    const rows = expenses.map((e) => [
      fmtDate(e.date),
      escapeCsv(e.title),
      escapeCsv(e.categorySnapshot),
      String(e.amount),
      escapeCsv(e.notes ?? ""),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${toInputDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deltaPct = useMemo(() => {
    if (!stats || stats.prevTotal === 0) return null;
    return ((stats.total - stats.prevTotal) / stats.prevTotal) * 100;
  }, [stats]);

  const toggleCat = (id: string) => {
    setSelectedCats((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const clearFilters = () => {
    setPreset("30d");
    setSelectedCats([]);
    setMinAmount("");
    setMaxAmount("");
    setSearch("");
  };

  const filtersActive = selectedCats.length > 0 || minAmount || maxAmount || search.trim() || preset !== "30d";

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-tag mb-2">Finance</p>
          <h1 className="font-display text-3xl font-bold text-navy-900">Expenses</h1>
          <p className="mt-1.5 text-sm text-navy-500">
            Track operational spend across electricity, hardware, hosting, salaries and more.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCatManagerOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-navy-900/12 bg-white px-3.5 py-2 text-[13px] font-medium text-navy-700 transition hover:border-navy-900/25 hover:bg-cream"
          >
            <Tags size={14} /> Categories
          </button>
          <button
            onClick={onExportCsv}
            disabled={!expenses.length}
            className="flex items-center gap-1.5 rounded-xl border border-navy-900/12 bg-white px-3.5 py-2 text-[13px] font-medium text-navy-700 transition hover:border-navy-900/25 hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => { setEditing(null); setEditorOpen(true); }}
            className="flex items-center gap-1.5 rounded-xl bg-navy-900 px-3.5 py-2 text-[13px] font-semibold text-mint-300 transition hover:bg-navy-800"
          >
            <Plus size={14} /> New Expense
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryStat
          icon={<IndianRupee size={16} className="text-mint-600" />}
          bg="bg-mint-100"
          label="Total spend"
          value={loading ? null : rupees(stats?.total ?? 0)}
          sub={deltaPct === null ? "—" : `${deltaPct >= 0 ? "▲" : "▼"} ${Math.abs(deltaPct).toFixed(1)}% vs prev. period`}
          subTone={deltaPct === null ? "neutral" : deltaPct > 0 ? "danger" : "success"}
        />
        <SummaryStat
          icon={<Receipt size={16} className="text-blue-600" />}
          bg="bg-blue-50"
          label="Entries"
          value={loading ? null : String(stats?.count ?? 0)}
          sub={`${expenses.length} shown`}
          subTone="neutral"
        />
        <SummaryStat
          icon={<TrendingUp size={16} className="text-amber-600" />}
          bg="bg-amber-50"
          label="Avg / entry"
          value={loading ? null : rupees(stats?.avg ?? 0)}
          sub="across selected window"
          subTone="neutral"
        />
        <SummaryStat
          icon={<Filter size={16} className="text-red-500" />}
          bg="bg-red-50"
          label="Top category"
          value={loading ? null : stats?.byCategory[0]?.name ?? "—"}
          sub={stats?.byCategory[0] ? rupees(stats.byCategory[0].total) : "—"}
          subTone="neutral"
        />
      </div>

      {/* Filter bar */}
      <Card className="space-y-4">
        {/* Date preset chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={
                "rounded-full px-3 py-1.5 text-[11px] font-semibold transition " +
                (preset === p.key
                  ? "bg-navy-900 text-mint-300"
                  : "bg-navy-900/5 text-navy-600 hover:bg-navy-900/10")
              }
            >
              {p.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 text-[11px] text-navy-500">
            <Calendar size={12} className="text-navy-400" />
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPreset("custom"); }}
              className="rounded-lg border border-navy-900/12 bg-white px-2 py-1 text-[11px] text-navy-900 outline-none focus:border-navy-900/30"
            />
            <span className="text-navy-300">→</span>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPreset("custom"); }}
              className="rounded-lg border border-navy-900/12 bg-white px-2 py-1 text-[11px] text-navy-900 outline-none focus:border-navy-900/30"
            />
          </div>
        </div>

        {/* Filter row */}
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
          <label className="flex items-center gap-2 rounded-xl border border-navy-900/12 bg-white px-3 py-2 shadow-sm">
            <Search size={14} className="shrink-0 text-navy-400" />
            <input
              type="text"
              placeholder="Search title, notes, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border-none bg-transparent text-sm text-navy-900 outline-none placeholder:text-navy-300"
            />
          </label>

          <div className="flex items-center gap-1.5 rounded-xl border border-navy-900/12 bg-white px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-navy-400">Amount</span>
            <input
              type="number"
              min={0}
              placeholder="Min"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-20 border-none bg-transparent text-sm text-navy-900 outline-none placeholder:text-navy-300"
            />
            <span className="text-navy-300">–</span>
            <input
              type="number"
              min={0}
              placeholder="Max"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-20 border-none bg-transparent text-sm text-navy-900 outline-none placeholder:text-navy-300"
            />
          </div>

          {filtersActive && (
            <button
              onClick={clearFilters}
              className="rounded-xl border border-navy-900/12 bg-white px-3 py-2 text-[12px] font-medium text-navy-600 transition hover:bg-cream"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Category multi-select */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-navy-400">Category</span>
          <button
            onClick={() => setSelectedCats([])}
            className={
              "rounded-full px-3 py-1 text-[11px] font-semibold transition " +
              (selectedCats.length === 0
                ? "bg-navy-900 text-mint-300"
                : "bg-navy-900/5 text-navy-600 hover:bg-navy-900/10")
            }
          >
            All
          </button>
          {categories.map((c) => {
            const on = selectedCats.includes(c._id);
            return (
              <button
                key={c._id}
                onClick={() => toggleCat(c._id)}
                style={on ? { background: c.color, color: "#fff" } : { background: c.color + "22", color: c.color }}
                className="rounded-full px-3 py-1 text-[11px] font-semibold transition hover:opacity-90"
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Error */}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-900/8 bg-navy-900/3 text-left">
                <Th>Date</Th>
                <Th>Title</Th>
                <Th>Category</Th>
                <Th className="text-right">Amount</Th>
                <Th>Notes</Th>
                <Th className="w-20 text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-navy-900/6 last:border-0">
                    <td colSpan={6} className="p-4">
                      <div className="h-6 animate-pulse rounded-lg bg-navy-900/5" />
                    </td>
                  </tr>
                ))
              ) : expenses.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-navy-400">
                  {filtersActive ? "No expenses match these filters." : "No expenses yet. Click \"New Expense\" to add your first."}
                </td></tr>
              ) : (
                expenses.map((e) => {
                  const cat = categories.find((c) => c._id === e.categoryId);
                  return (
                    <tr key={e._id} className="border-b border-navy-900/6 last:border-0 transition hover:bg-navy-900/3">
                      <Td className="whitespace-nowrap font-mono text-[12px] text-navy-500">{fmtDate(e.date)}</Td>
                      <Td className="font-medium text-navy-900">{e.title}</Td>
                      <Td>
                        <span
                          style={{ background: (cat?.color ?? "#7c8aa3") + "22", color: cat?.color ?? "#7c8aa3" }}
                          className="rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest"
                        >
                          {e.categorySnapshot}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap text-right font-display font-bold tabular-nums text-navy-900">{rupees(e.amount)}</Td>
                      <Td className="max-w-[280px] truncate text-[12px] text-navy-500">{e.notes || "—"}</Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton onClick={() => { setEditing(e); setEditorOpen(true); }} title="Edit">
                            <Pencil size={13} />
                          </IconButton>
                          <IconButton onClick={() => setConfirmDelete(e)} title="Delete" danger>
                            <Trash2 size={13} />
                          </IconButton>
                        </div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {!loading && expenses.length > 0 && (
              <tfoot>
                <tr className="bg-navy-900/3">
                  <td colSpan={3} className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-navy-500">
                    {expenses.length} {expenses.length === 1 ? "entry" : "entries"} on this page
                  </td>
                  <td className="px-4 py-3 text-right font-display text-[15px] font-bold text-navy-900">
                    {rupees(expenses.reduce((s, e) => s + e.amount, 0))}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* Category breakdown bars */}
      {!loading && stats && stats.byCategory.length > 0 && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-bold text-navy-900">Breakdown by category</h2>
            <Pill tone="neutral">{stats.byCategory.length} active</Pill>
          </div>
          <div className="space-y-2.5">
            {stats.byCategory.map((c) => {
              const pct = stats.total > 0 ? (c.total / stats.total) * 100 : 0;
              return (
                <div key={c.categoryId}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="font-medium text-navy-800">{c.name}</span>
                    <span className="font-mono tabular-nums text-navy-500">
                      {rupees(c.total)} · {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-navy-900/6">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Editor drawer */}
      {editorOpen && (
        <ExpenseEditor
          editing={editing}
          categories={categories}
          onClose={() => { setEditorOpen(false); setEditing(null); }}
          onSave={onSave}
        />
      )}

      {/* Category manager modal */}
      {catManagerOpen && (
        <CategoryManager
          categories={categories}
          onClose={() => setCatManagerOpen(false)}
          onChanged={async () => {
            const d = await apiFetch<{ categories: Category[] }>("/admin/get-expense-categories");
            setCategories(d.categories ?? []);
            fetchAll();
          }}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <ConfirmDelete
          item={confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={onDelete}
        />
      )}
    </div>
  );
}

// ─── Small subcomponents ──────────────────────────────────────────────
function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={"px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-navy-500 " + className}>
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={"px-4 py-3 text-[13px] " + className}>{children}</td>;
}

function IconButton({
  children, onClick, title, danger,
}: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={
        "flex h-8 w-8 items-center justify-center rounded-lg transition " +
        (danger
          ? "text-navy-400 hover:bg-red-50 hover:text-red-600"
          : "text-navy-400 hover:bg-navy-900/6 hover:text-navy-900")
      }
    >
      {children}
    </button>
  );
}

function SummaryStat({
  icon, bg, label, value, sub, subTone,
}: {
  icon: React.ReactNode; bg: string; label: string; value: string | null;
  sub: string; subTone: "success" | "warning" | "neutral" | "danger";
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={"flex h-9 w-9 items-center justify-center rounded-xl " + bg}>{icon}</div>
      </div>
      <div>
        {value === null ? (
          <div className="h-7 w-24 animate-pulse rounded bg-navy-900/8" />
        ) : (
          <p className="font-display text-2xl font-bold tabular-nums text-navy-900">{value}</p>
        )}
        <p className="mt-0.5 text-[12px] font-medium text-navy-500">{label}</p>
      </div>
      <Pill tone={subTone}>{sub}</Pill>
    </Card>
  );
}

// ─── Editor Drawer ────────────────────────────────────────────────────
function ExpenseEditor({
  editing, categories, onClose, onSave,
}: {
  editing: Expense | null;
  categories: Category[];
  onClose: () => void;
  onSave: (d: { title: string; categoryId: string; amount: number; date: string; notes?: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? categories[0]?._id ?? "");
  const [amount, setAmount] = useState(editing?.amount?.toString() ?? "");
  const [date, setDate] = useState(editing ? toInputDate(new Date(editing.date)) : toInputDate(new Date()));
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const valid = title.trim() && categoryId && amount !== "" && Number(amount) >= 0 && date;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    setErr("");
    try {
      await onSave({ title: title.trim(), categoryId, amount: Number(amount), date, notes: notes.trim() });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <div className="ml-auto h-full w-full max-w-md bg-cream shadow-2xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-navy-900/8 px-5 py-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-navy-400">
                {editing ? "Edit" : "New"}
              </p>
              <h2 className="font-display text-lg font-bold text-navy-900">
                {editing ? "Edit expense" : "Add expense"}
              </h2>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-navy-400 transition hover:bg-navy-900/6 hover:text-navy-900">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <Field label="Title">
              <input
                type="text"
                value={title}
                autoFocus
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. April electricity bill"
                className="form-input"
              />
            </Field>

            <Field label="Category">
              <div className="grid grid-cols-2 gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => setCategoryId(c._id)}
                    style={
                      categoryId === c._id
                        ? { background: c.color, color: "#fff", borderColor: c.color }
                        : { background: "#fff", color: "#1a2d4a", borderColor: "rgba(10,22,40,0.12)" }
                    }
                    className="rounded-xl border px-3 py-2 text-left text-[12px] font-medium transition"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount (₹)">
                <input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="form-input tabular-nums"
                />
              </Field>
              <Field label="Date">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="form-input"
                />
              </Field>
            </div>

            <Field label="Notes (optional)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Vendor, invoice ref, anything that'll help later…"
                className="form-input"
              />
            </Field>

            {err && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">{err}</p>
            )}
          </div>

          <div className="border-t border-navy-900/8 px-5 py-4">
            <button
              onClick={submit}
              disabled={!valid || saving}
              className="w-full rounded-xl bg-navy-900 px-4 py-2.5 text-[13px] font-semibold text-mint-300 transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Add expense"}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ─── Category Manager ────────────────────────────────────────────────
function CategoryManager({
  categories, onClose, onChanged,
}: {
  categories: Category[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#7c8aa3");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true); setErr("");
    try {
      await apiFetch("/admin/create-expense-category", { method: "POST", body: JSON.stringify({ name: name.trim(), color }) });
      setName("");
      await onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setErr("");
    try {
      await apiFetch("/admin/delete-expense-category", { method: "POST", body: JSON.stringify({ id }) });
      await onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  return (
    <Overlay onClose={onClose}>
      <div className="m-auto w-full max-w-lg overflow-hidden rounded-2xl bg-cream shadow-2xl">
        <div className="flex items-center justify-between border-b border-navy-900/8 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-navy-900">Manage categories</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-navy-400 transition hover:bg-navy-900/6 hover:text-navy-900">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New category name"
              className="form-input flex-1"
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-12 cursor-pointer rounded-xl border border-navy-900/12 bg-white"
            />
            <button
              onClick={add}
              disabled={!name.trim() || busy}
              className="rounded-xl bg-navy-900 px-4 py-2.5 text-[13px] font-semibold text-mint-300 transition hover:bg-navy-800 disabled:opacity-50"
            >
              Add
            </button>
          </div>
          {err && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">{err}</p>}

          <div className="max-h-[50vh] space-y-1.5 overflow-y-auto">
            {categories.map((c) => (
              <div key={c._id} className="flex items-center justify-between rounded-xl border border-navy-900/8 bg-white px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                  <span className="text-[13px] font-medium text-navy-900">{c.name}</span>
                  {c.isDefault && (
                    <span className="rounded-full bg-navy-900/6 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-navy-500">default</span>
                  )}
                </div>
                {!c.isDefault && (
                  <button
                    onClick={() => remove(c._id)}
                    className="rounded-lg p-1.5 text-navy-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Overlay>
  );
}

function ConfirmDelete({
  item, onClose, onConfirm,
}: { item: Expense; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <Overlay onClose={onClose}>
      <div className="m-auto w-full max-w-md overflow-hidden rounded-2xl bg-cream shadow-2xl">
        <div className="px-5 py-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
            <Trash2 size={16} className="text-red-600" />
          </div>
          <h3 className="font-display text-lg font-bold text-navy-900">Delete expense?</h3>
          <p className="mt-1 text-[13px] text-navy-500">
            <span className="font-medium text-navy-800">{item.title}</span> — {rupees(item.amount)} on {fmtDate(item.date)}. This cannot be undone.
          </p>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button onClick={onClose} className="rounded-xl border border-navy-900/12 bg-white px-4 py-2 text-[13px] font-medium text-navy-700 transition hover:bg-navy-900/5">
              Cancel
            </button>
            <button
              onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}
              disabled={busy}
              className="rounded-xl bg-red-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-navy-500">{label}</span>
      {children}
    </label>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  // Close on Esc
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex bg-navy-900/40 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex w-full">
        {children}
      </div>
    </div>
  );
}

// ─── Utils ────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function escapeCsv(s: string): string {
  if (s == null) return "";
  const needsQuotes = /[",\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}
