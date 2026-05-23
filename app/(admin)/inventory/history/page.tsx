"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Card } from "@/components/primitives/Card";
import { Pill } from "@/components/primitives/Pill";
import { apiFetch } from "@/lib/api";

type Movement = {
  _id: string; createdAt: string; type: "sale" | "restock" | "adjustment"; delta: number;
  productName: string; productSlug: string; quantityAfter: number;
  performedByEmail: string;
  recipient?: { name?: string; phone?: string; email?: string; company?: string; city?: string };
  supplier?: string; poNumber?: string; unitCost?: number;
  notes?: string;
  reverses?: string | null;
};

export default function HistoryPage() {
  const sp = useSearchParams(); const router = useRouter();

  const [movements, setMovements] = useState<Movement[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filter = useMemo(() => ({
    type:    sp.get("type")    ?? "",
    product: sp.get("product") ?? "",
    from:    sp.get("from")    ?? "",
    to:      sp.get("to")      ?? "",
    q:       sp.get("q")       ?? "",
  }), [sp]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    router.push(`/inventory/history?${params.toString()}`);
  };

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (filter.type)    params.set("type",    filter.type);
      if (filter.product) params.set("product", filter.product);
      if (filter.from)    params.set("from",    filter.from);
      if (filter.to)      params.set("to",      filter.to);
      if (filter.q)       params.set("q",       filter.q);
      params.set("page",  String(page));
      params.set("limit", "20");
      const data = await apiFetch<{ movements: Movement[]; totalPages: number; total: number }>(
        `/get-stock-movements?${params.toString()}`
      );
      setMovements(data.movements ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const typePill = (t: Movement["type"]) =>
    t === "sale" ? <Pill tone="danger">sale</Pill>
    : t === "restock" ? <Pill tone="success">restock</Pill>
    : <Pill tone="warning">adjustment</Pill>;

  return (
    <div>
      <div className="mb-6">
        <p className="section-tag mb-2">Commerce · Inventory</p>
        <h1 className="font-display text-3xl font-bold text-navy-900">Stock History</h1>
        <p className="mt-1.5 text-sm text-navy-500">All restocks, sales, and adjustments across every product.</p>
      </div>

      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex flex-1 min-w-[200px] items-center gap-2 rounded-xl border border-navy-900/12 bg-white px-3 py-2">
            <Search size={14} className="shrink-0 text-navy-400" />
            <input
              type="text" placeholder="Recipient, notes, PO…" defaultValue={filter.q}
              onBlur={(e) => updateFilter("q", e.target.value)}
              className="flex-1 border-none bg-transparent text-sm text-navy-900 outline-none placeholder:text-navy-300"
            />
          </label>
          <select
            value={filter.type} onChange={(e) => updateFilter("type", e.target.value)}
            className="rounded-xl border border-navy-900/12 bg-white px-3 py-2 text-sm"
          >
            <option value="">All types</option>
            <option value="sale">Sales</option>
            <option value="restock">Restocks</option>
            <option value="adjustment">Adjustments</option>
          </select>
          <input type="date" value={filter.from} onChange={(e) => updateFilter("from", e.target.value)}
            className="rounded-xl border border-navy-900/12 bg-white px-3 py-2 text-sm" />
          <input type="date" value={filter.to} onChange={(e) => updateFilter("to", e.target.value)}
            className="rounded-xl border border-navy-900/12 bg-white px-3 py-2 text-sm" />
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001/api"}/export-stock-movements.csv?${new URLSearchParams(filter).toString()}`}
            className="btn-primary"
          >Export CSV</a>
        </div>
      </Card>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-900/8 bg-cream">
                {["Date", "Type", "Δ", "Product", "Details", "Admin"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/6">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-3"><div className="h-3 animate-pulse rounded-lg bg-navy-900/8" /></td>
                    ))}</tr>
                  ))
                : movements.map((m) => (
                    <tr key={m._id} className="hover:bg-cream/50">
                      <td className="px-5 py-3 font-mono text-[11px] text-navy-600">{new Date(m.createdAt).toLocaleString()}</td>
                      <td className="px-5 py-3">{typePill(m.type)}</td>
                      <td className={`px-5 py-3 font-mono text-sm font-bold ${m.delta < 0 ? "text-red-500" : "text-emerald-600"}`}>
                        {m.delta > 0 ? "+" : ""}{m.delta}
                      </td>
                      <td className="px-5 py-3 text-sm text-navy-900">{m.productName}</td>
                      <td className="px-5 py-3 text-sm text-navy-500">
                        {m.type === "sale" && m.recipient && (
                          <>
                            <span className="font-medium text-navy-900">{m.recipient.name}</span>
                            {" · "}{m.recipient.phone}
                            {m.recipient.company && <> · {m.recipient.company}</>}
                            {m.recipient.city && <> · {m.recipient.city}</>}
                          </>
                        )}
                        {m.type === "restock" && (
                          <>{m.supplier && <>{m.supplier} </>}{m.poNumber && <>· {m.poNumber}</>}{m.unitCost ? <> · ₹{m.unitCost}/unit</> : null}</>
                        )}
                        {m.type === "adjustment" && (m.notes ?? "")}
                        {m.notes && m.type !== "adjustment" && <> · {m.notes}</>}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-navy-500">{m.performedByEmail}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-navy-900/8 bg-cream px-5 py-3">
          <p className="font-mono text-[11px] text-navy-400">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded-xl border border-navy-900/12 bg-white px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-navy-700 disabled:opacity-30">Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="rounded-xl border border-navy-900/12 bg-white px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-navy-700 disabled:opacity-30">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
