"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Minus, Pencil, AlertTriangle, ArrowRight } from "lucide-react";
import { Card } from "@/components/primitives/Card";
import { Pill } from "@/components/primitives/Pill";
import { apiFetch } from "@/lib/api";
import { StockMovementModal, type MovementMode } from "@/components/inventory/StockMovementModal";

type Row = {
  _id: string;
  name: string;
  slug: string;
  algo: string;
  quantity: number;
  lowStockThreshold: number;
  stockStatusOverride: string | null;
  computedStatus: "In Stock" | "Sold Out" | "Coming Soon";
  lastMovedAt: string | null;
  isLowStock: boolean;
};

type Summary = { success: boolean; totalUnits: number; lowStockCount: number; products: Row[] };
type Movement = {
  _id: string; createdAt: string; type: "sale" | "restock" | "adjustment"; delta: number;
  productName: string; performedByEmail: string;
  recipient?: { name?: string; phone?: string };
  poNumber?: string; supplier?: string; notes?: string;
};

function statusTone(s: Row["computedStatus"]): "success" | "warning" | "danger" {
  if (s === "In Stock") return "success";
  if (s === "Coming Soon") return "warning";
  return "danger";
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function InventoryPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<Movement[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Row["computedStatus"]>("all");
  const [modal, setModal] = useState<{ mode: MovementMode; product: Row | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [sum, recentList] = await Promise.all([
        apiFetch<Summary>("/get-inventory-summary"),
        apiFetch<{ movements: Movement[] }>("/get-stock-movements?limit=10"),
      ]);
      setData(sum); setRecent(recentList.movements ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const rows = (data?.products ?? []).filter((p) => {
    if (statusFilter !== "all" && p.computedStatus !== statusFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-tag mb-2">Commerce</p>
          <h1 className="font-display text-3xl font-bold text-navy-900">Inventory</h1>
          <p className="mt-1.5 text-sm text-navy-500">Current stock for every product, with recent activity.</p>
        </div>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001/api"}/export-stock-movements.csv`}
          className="btn-primary"
        >
          Export CSV
        </a>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-navy-500">Total units on hand</p>
          <p className="mt-1 font-display text-3xl font-bold text-navy-900">{data?.totalUnits ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-navy-500">Low stock items</p>
          <p className="mt-1 flex items-center gap-2 font-display text-3xl font-bold text-navy-900">
            {data?.lowStockCount ?? 0}
            {(data?.lowStockCount ?? 0) > 0 && <AlertTriangle size={20} className="text-amber-500" />}
          </p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-navy-500">Products listed</p>
          <p className="mt-1 font-display text-3xl font-bold text-navy-900">{data?.products?.length ?? 0}</p>
        </Card>
      </div>

      <Card className="mb-4 flex items-center gap-3 p-3">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-navy-900/12 bg-white px-3 py-2 shadow-sm">
          <Search size={14} className="shrink-0 text-navy-400" />
          <input
            type="text" placeholder="Search products…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border-none bg-transparent text-sm text-navy-900 outline-none placeholder:text-navy-300"
          />
        </label>
        <select
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | Row["computedStatus"])}
          className="rounded-xl border border-navy-900/12 bg-white px-3 py-2 text-sm shadow-sm"
        >
          <option value="all">All status</option>
          <option value="In Stock">In Stock</option>
          <option value="Sold Out">Sold Out</option>
          <option value="Coming Soon">Coming Soon</option>
        </select>
      </Card>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <Card className="mb-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-900/8 bg-cream">
                {["Product", "Algo", "On hand", "Status", "Last moved", "Actions"].map((h, i) => (
                  <th key={h} className={`px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-500 ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/6">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 animate-pulse rounded-lg bg-navy-900/8" /></td>
                    ))}</tr>
                  ))
                : rows.map((p) => (
                    <tr key={p._id} className="group hover:bg-cream/50">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-navy-900">{p.name}</p>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-navy-400">{p.slug}</p>
                      </td>
                      <td className="px-5 py-4 font-mono text-[12px] text-navy-600">{p.algo}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setModal({ mode: "adjustment", product: p })}
                          className="flex items-center gap-1.5 font-mono text-sm font-bold text-navy-900 hover:text-navy-700"
                          title="Click to adjust quantity"
                        >
                          {p.quantity}
                          <Pencil size={11} className="opacity-30 group-hover:opacity-70" />
                          {p.isLowStock && <AlertTriangle size={13} className="text-amber-500" />}
                        </button>
                      </td>
                      <td className="px-5 py-4"><Pill tone={statusTone(p.computedStatus)}>{p.computedStatus}</Pill></td>
                      <td className="px-5 py-4 font-mono text-[11px] text-navy-500">{relativeTime(p.lastMovedAt)}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setModal({ mode: "restock", product: p })}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-mint-300 bg-mint-50 text-navy-900 hover:bg-mint-100" title="Restock">
                            <Plus size={13} />
                          </button>
                          <button onClick={() => setModal({ mode: "sale", product: p })}
                            disabled={p.quantity === 0}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-30" title="Record sale">
                            <Minus size={13} />
                          </button>
                          <a href={`/inventory/history?product=${p._id}`}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-navy-900/12 bg-white text-navy-500 hover:bg-navy-900 hover:text-mint-300" title="History">
                            <ArrowRight size={12} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-0">
        <div className="border-b border-navy-900/8 bg-cream px-5 py-3 flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-widest text-navy-500">Recent activity</p>
          <a href="/inventory/history" className="font-mono text-[11px] text-navy-700 hover:text-navy-900">View all →</a>
        </div>
        <ul className="divide-y divide-navy-900/6">
          {recent.length === 0 && !loading && (
            <li className="px-5 py-4 text-sm text-navy-400">No movements yet.</li>
          )}
          {recent.map((m) => (
            <li key={m._id} className="px-5 py-3 text-sm">
              <span className="font-mono text-[11px] text-navy-400">{new Date(m.createdAt).toLocaleString()}</span>{" · "}
              <span className="font-mono text-[11px] text-navy-500">{m.performedByEmail}</span>{" · "}
              <span className={m.type === "sale" ? "text-red-500" : m.type === "restock" ? "text-emerald-600" : "text-amber-600"}>
                {m.delta > 0 ? `+${m.delta}` : m.delta}
              </span>{" "}
              <span className="font-semibold text-navy-900">{m.productName}</span>{" "}
              <span className="text-navy-500">
                {m.type === "sale"     && m.recipient ? `→ ${m.recipient.name ?? ""} ${m.recipient.phone ?? ""}` : ""}
                {m.type === "restock"  && m.poNumber  ? `· ${m.poNumber}` : ""}
                {m.notes ? ` · ${m.notes}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <StockMovementModal
        open={!!modal}
        mode={modal?.mode ?? "restock"}
        product={modal?.product ? { _id: modal.product._id, name: modal.product.name, quantity: modal.product.quantity } : null}
        onClose={() => setModal(null)}
        onSaved={refresh}
      />
    </div>
  );
}
