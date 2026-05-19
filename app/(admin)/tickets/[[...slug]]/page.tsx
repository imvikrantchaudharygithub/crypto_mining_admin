"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Edit2, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/primitives/Card";
import { Pill } from "@/components/primitives/Pill";
import { apiFetch } from "@/lib/api";

type Params = { slug?: string[] };

type TicketStep = {
  label: string;
  description: string;
  timestamp: string;
  done: boolean;
};

type Ticket = {
  _id: string;
  ticketId: string;
  customerName: string;
  customerEmail: string;
  minerModel?: string;
  issueDescription?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  eta?: string;
  steps?: TicketStep[];
  createdAt: string;
};

const statusTone = (s: string): "neutral" | "success" | "warning" | "danger" => {
  if (s === "resolved" || s === "closed") return "success";
  if (s === "in-progress") return "warning";
  if (s === "critical") return "danger";
  return "neutral";
};

const priorityTone = (p: string): "neutral" | "success" | "warning" | "danger" => {
  if (p === "Critical") return "danger";
  if (p === "High") return "warning";
  return "neutral";
};

// ─── Ticket List ──────────────────────────────────────────────────────
function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<{ tickets: Ticket[] }>("/admin/get-tickets")
      .then((data) => setTickets(data.tickets ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load tickets"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-tag mb-2">Tickets</p>
          <h1 className="font-display text-3xl font-bold text-navy-900">Tickets Queue</h1>
          <p className="mt-1.5 text-sm text-navy-500">Service requests from customers.</p>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-900/8 bg-cream">
                {["Ticket ID", "Customer", "Miner", "Status", "Priority", "Date", "Action"].map((h, i) => (
                  <th key={h} className={`px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-500 ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/6">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 animate-pulse rounded-lg bg-navy-900/8" />
                        </td>
                      ))}
                    </tr>
                  ))
                : tickets.map((tkt) => (
                    <tr key={tkt._id} className="group transition-colors hover:bg-cream/50">
                      <td className="px-5 py-4 font-mono text-[12px] font-semibold text-navy-900">{tkt.ticketId}</td>
                      <td className="px-5 py-4 text-[13px] text-navy-800">{tkt.customerName}</td>
                      <td className="px-5 py-4 text-[12px] text-navy-600">{tkt.minerModel ?? "—"}</td>
                      <td className="px-5 py-4">
                        <Pill tone={statusTone(tkt.status)}>{tkt.status}</Pill>
                      </td>
                      <td className="px-5 py-4">
                        <Pill tone={priorityTone(tkt.priority)}>{tkt.priority}</Pill>
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-navy-400">
                        {new Date(tkt.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/tickets/${tkt._id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-navy-900/12 bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-navy-700 shadow-sm transition hover:bg-navy-900 hover:text-mint-300 hover:border-navy-900"
                        >
                          View <ArrowRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-navy-900/8 bg-cream px-5 py-3">
          <p className="font-mono text-[11px] text-navy-400">
            {loading ? "Loading…" : `${tickets.length} tickets`}
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── Step Item ────────────────────────────────────────────────────────
function StepItem({
  step,
  index,
  ticketId,
  onRefresh,
}: {
  step: TicketStep;
  index: number;
  ticketId: string;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(step.label);
  const [description, setDescription] = useState(step.description);
  const [done, setDone] = useState(step.done);

  const inputBase = "w-full rounded-xl border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-mint-400";

  const handleSave = async () => {
    await apiFetch("/admin/ticket-step/update", {
      method: "POST",
      body: JSON.stringify({ ticketId, stepIndex: index, label, description, done }),
    });
    setEditing(false);
    onRefresh();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this step?")) return;
    await apiFetch("/admin/ticket-step/delete", {
      method: "POST",
      body: JSON.stringify({ ticketId, stepIndex: index }),
    });
    onRefresh();
  };

  return (
    <div className={`relative flex gap-4 pb-6 ${index === 0 ? "" : ""}`}>
      <div className="flex flex-col items-center">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${step.done ? "border-navy-900 bg-navy-900" : "border-navy-900/20 bg-white"}`}>
          {step.done ? <CheckCircle2 size={14} className="text-mint-400" /> : <Circle size={14} className="text-navy-300" />}
        </div>
        <div className="mt-1 w-0.5 flex-1 bg-navy-900/10" />
      </div>
      <div className="flex-1 pb-2">
        {editing ? (
          <div className="space-y-2">
            <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputBase} placeholder="Step label" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputBase} resize-none`} placeholder="Description" />
            <label className="flex items-center gap-2 text-sm text-navy-700">
              <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} />
              Mark as done
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={handleSave} className="btn-primary" style={{ padding: "8px 16px", fontSize: 11 }}>
                <span className="dot" aria-hidden /> Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-navy-900/12 bg-white px-4 py-2 font-mono text-[11px] text-navy-600 transition hover:bg-navy-900/5">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-navy-900/10 bg-cream p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[14px] text-navy-900">{step.label}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-navy-600">{step.description}</p>
                {step.timestamp && (
                  <p className="mt-2 font-mono text-[10px] text-navy-400">{step.timestamp}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => setEditing(true)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-navy-900/12 bg-white text-navy-500 transition hover:bg-navy-900/5">
                  <Edit2 size={11} />
                </button>
                <button type="button" onClick={handleDelete} className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-400 transition hover:bg-red-100 hover:text-red-600">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Ticket Detail ────────────────────────────────────────────────────
function TicketDetail({ ticketId }: { ticketId: string }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [eta, setEta] = useState("");
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTimestamp, setNewTimestamp] = useState("");
  const [addingStep, setAddingStep] = useState(false);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ ticket: Ticket }>(`/admin/get-ticket/${ticketId}`);
      setTicket(data.ticket);
      setStatus(data.ticket.status ?? "open");
      setPriority(data.ticket.priority ?? "Medium");
      setAssignedTo(data.ticket.assignedTo ?? "");
      setEta(data.ticket.eta ?? "");
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await apiFetch(`/admin/update-ticket/${ticketId}`, {
        method: "PUT",
        body: JSON.stringify({ status, priority, assignedTo, eta }),
      });
      fetchTicket();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = async () => {
    if (!newLabel.trim()) return;
    setAddingStep(true);
    try {
      await apiFetch("/admin/ticket-step/add", {
        method: "POST",
        body: JSON.stringify({ ticketId, label: newLabel, description: newDesc, timestamp: newTimestamp }),
      });
      setNewLabel("");
      setNewDesc("");
      setNewTimestamp("");
      fetchTicket();
    } catch {
      // silent
    } finally {
      setAddingStep(false);
    }
  };

  if (loading) return <p className="p-8 text-sm text-navy-500">Loading…</p>;
  if (!ticket) return <p className="p-8 text-sm text-red-500">Ticket not found.</p>;

  const inputBase = "w-full rounded-xl border border-navy-900/12 bg-white px-4 py-3 text-sm text-navy-900 shadow-sm outline-none transition focus:border-mint-400 focus:ring-2 focus:ring-mint-400/20";
  const labelBase = "mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-500";

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/tickets" className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-navy-500 transition hover:text-navy-900">
          <ArrowLeft size={13} /> Back
        </Link>
        <span className="text-navy-300">/</span>
        <span className="font-mono text-[11px] text-navy-700">{ticket.ticketId}</span>
      </div>

      {/* Header card */}
      <Card className="mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-navy-400 mb-1">{ticket.ticketId}</p>
            <h1 className="font-display text-2xl font-bold text-navy-900">{ticket.customerName}</h1>
            {ticket.minerModel && (
              <p className="mt-1 font-mono text-[12px] text-navy-500">{ticket.minerModel}</p>
            )}
            {ticket.issueDescription && (
              <p className="mt-3 text-[13px] leading-relaxed text-navy-600">{ticket.issueDescription}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Pill tone={statusTone(ticket.status)}>{ticket.status}</Pill>
            <Pill tone={priorityTone(ticket.priority)}>{ticket.priority}</Pill>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        {/* Timeline */}
        <div className="space-y-5">
          <Card>
            <p className="section-tag mb-6">Timeline</p>
            {(ticket.steps ?? []).length === 0 && (
              <p className="font-mono text-[11px] text-navy-400 mb-4">No steps yet.</p>
            )}
            {(ticket.steps ?? []).map((step, i) => (
              <StepItem
                key={i}
                step={step}
                index={i}
                ticketId={ticketId}
                onRefresh={fetchTicket}
              />
            ))}

            {/* Add step form */}
            <div className="mt-4 rounded-2xl border border-dashed border-navy-900/20 p-5">
              <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-500">
                <Plus size={11} className="inline mr-1.5" />
                Add Step
              </p>
              <div className="space-y-3">
                <div>
                  <label className={labelBase}>Step Label</label>
                  <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Engineer Dispatched" className={inputBase} />
                </div>
                <div>
                  <label className={labelBase}>Description</label>
                  <textarea rows={2} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What happened at this step…" className={`${inputBase} resize-none`} />
                </div>
                <div>
                  <label className={labelBase}>Timestamp</label>
                  <input type="text" value={newTimestamp} onChange={(e) => setNewTimestamp(e.target.value)} placeholder="e.g. 2026-05-07T14:30:00Z" className={inputBase} />
                </div>
                <button type="button" onClick={handleAddStep} disabled={addingStep} className="btn-primary disabled:opacity-60">
                  <span className="dot" aria-hidden />
                  {addingStep ? "Adding…" : "Add Step"}
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Controls */}
        <Card className="h-fit space-y-4">
          <p className="section-tag">Controls</p>
          <div>
            <label className={labelBase}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputBase} cursor-pointer`}>
              {["open", "in-progress", "investigating", "resolved", "closed"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelBase}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={`${inputBase} cursor-pointer`}>
              {["Low", "Medium", "High", "Critical"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelBase}>Assigned To</label>
            <input type="text" placeholder="Engineer name" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={inputBase} />
          </div>
          <div>
            <label className={labelBase}>ETA</label>
            <input type="text" placeholder="e.g. 2026-05-08 17:00" value={eta} onChange={(e) => setEta(e.target.value)} className={inputBase} />
          </div>
          <button type="button" onClick={handleUpdate} disabled={saving} className="btn-primary w-full justify-center disabled:opacity-60">
            <span className="dot" aria-hidden />
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </Card>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────
export default function TicketsPage({ params }: { params: Params }) {
  const id = params.slug?.[0];
  if (!id) return <TicketList />;
  return <TicketDetail ticketId={id} />;
}
