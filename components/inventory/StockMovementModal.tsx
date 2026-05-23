"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/api";

export type MovementMode = "sale" | "restock" | "adjustment";

interface Props {
  open: boolean;
  mode: MovementMode;
  product: { _id: string; name: string; quantity: number } | null;
  onClose: () => void;
  onSaved: () => void;
}

export function StockMovementModal({ open, mode, product, onClose, onSaved }: Props) {
  const [qty,         setQty]         = useState(1);
  const [newQty,      setNewQty]      = useState(0);
  const [recipient,   setRecipient]   = useState({ name: "", phone: "", email: "", company: "", address: "", city: "" });
  const [supplier,    setSupplier]    = useState("");
  const [poNumber,    setPoNumber]    = useState("");
  const [unitCost,    setUnitCost]    = useState<string>("");
  const [notes,       setNotes]       = useState("");
  const [moreDetails, setMoreDetails] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    if (!open) return;
    setQty(1); setNewQty(product?.quantity ?? 0);
    setRecipient({ name: "", phone: "", email: "", company: "", address: "", city: "" });
    setSupplier(""); setPoNumber(""); setUnitCost(""); setNotes("");
    setMoreDetails(false); setError("");
  }, [open, product]);

  if (!open || !product) return null;

  const delta = mode === "sale" ? -qty : mode === "restock" ? +qty : newQty - product.quantity;

  const submit = async () => {
    setSubmitting(true); setError("");
    try {
      const body: Record<string, unknown> = { productId: product._id, type: mode };
      if (mode === "sale") {
        if (!recipient.name.trim() || !recipient.phone.trim()) {
          throw new Error("Recipient name and phone are required");
        }
        body.quantity = qty;
        body.recipient = recipient;
      } else if (mode === "restock") {
        body.quantity = qty;
        if (supplier) body.supplier = supplier;
        if (poNumber) body.poNumber = poNumber;
        if (unitCost) body.unitCost = Number(unitCost);
      } else {
        if (!notes.trim()) throw new Error("A reason is required for adjustments");
        body.newQuantity = newQty;
      }
      if (notes) body.notes = notes;

      await apiFetch("/create-stock-movement", { method: "POST", body: JSON.stringify(body) });
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === "sale" ? "Record sale" : mode === "restock" ? "Restock" : "Adjust quantity";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="section-tag mb-1">Inventory</p>
            <h2 className="font-display text-xl font-bold text-navy-900">{title}</h2>
            <p className="mt-1 text-sm text-navy-500">{product.name} · on hand: {product.quantity}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-navy-400 hover:bg-navy-900/5">
            <X size={18} />
          </button>
        </div>

        {mode !== "adjustment" && (
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-medium text-navy-600">Quantity</span>
            <input
              type="number" min={1} value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded-xl border border-navy-900/12 px-3 py-2 text-sm"
            />
          </label>
        )}

        {mode === "adjustment" && (
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-medium text-navy-600">
              New quantity (delta: {delta >= 0 ? "+" : ""}{delta})
            </span>
            <input
              type="number" min={0} value={newQty}
              onChange={(e) => setNewQty(Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-xl border border-navy-900/12 px-3 py-2 text-sm"
            />
          </label>
        )}

        {mode === "sale" && (
          <>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-medium text-navy-600">Recipient name *</span>
              <input
                type="text" value={recipient.name}
                onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
                className="w-full rounded-xl border border-navy-900/12 px-3 py-2 text-sm"
              />
            </label>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-medium text-navy-600">Recipient phone *</span>
              <input
                type="text" value={recipient.phone} placeholder="9876543210"
                onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })}
                className="w-full rounded-xl border border-navy-900/12 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button" onClick={() => setMoreDetails((v) => !v)}
              className="mb-3 font-mono text-[11px] uppercase tracking-widest text-navy-500 hover:text-navy-900"
            >
              {moreDetails ? "− Hide" : "+ Add"} more details
            </button>
            {moreDetails && (
              <div className="mb-3 space-y-2">
                <input className="w-full rounded-xl border border-navy-900/12 px-3 py-2 text-sm"
                  placeholder="Email" value={recipient.email}
                  onChange={(e) => setRecipient({ ...recipient, email: e.target.value })} />
                <input className="w-full rounded-xl border border-navy-900/12 px-3 py-2 text-sm"
                  placeholder="Company" value={recipient.company}
                  onChange={(e) => setRecipient({ ...recipient, company: e.target.value })} />
                <input className="w-full rounded-xl border border-navy-900/12 px-3 py-2 text-sm"
                  placeholder="Address" value={recipient.address}
                  onChange={(e) => setRecipient({ ...recipient, address: e.target.value })} />
                <input className="w-full rounded-xl border border-navy-900/12 px-3 py-2 text-sm"
                  placeholder="City" value={recipient.city}
                  onChange={(e) => setRecipient({ ...recipient, city: e.target.value })} />
              </div>
            )}
          </>
        )}

        {mode === "restock" && (
          <>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-medium text-navy-600">Supplier</span>
              <input className="w-full rounded-xl border border-navy-900/12 px-3 py-2 text-sm"
                value={supplier} onChange={(e) => setSupplier(e.target.value)} />
            </label>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-medium text-navy-600">PO number</span>
              <input className="w-full rounded-xl border border-navy-900/12 px-3 py-2 text-sm"
                value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
            </label>
            <label className="mb-3 block">
              <span className="mb-1 block text-xs font-medium text-navy-600">Unit cost (₹)</span>
              <input type="number" min={0} className="w-full rounded-xl border border-navy-900/12 px-3 py-2 text-sm"
                value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
            </label>
          </>
        )}

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-navy-600">
            Notes {mode === "adjustment" ? "(reason — required)" : "(optional)"}
          </span>
          <textarea rows={3} className="w-full rounded-xl border border-navy-900/12 px-3 py-2 text-sm"
            value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        {error && (
          <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-navy-900/12 bg-white px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-900/5">
            Cancel
          </button>
          <button onClick={submit} disabled={submitting}
            className="rounded-xl bg-navy-900 px-4 py-2 text-sm font-medium text-mint-300 hover:bg-navy-800 disabled:opacity-50">
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
