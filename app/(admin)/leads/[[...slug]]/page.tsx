"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { Card } from "@/components/primitives/Card";
import { Pill } from "@/components/primitives/Pill";
import { apiFetch } from "@/lib/api";

type Params = { slug?: string[] };

type Lead = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message?: string;
  status: string;
  source?: string;
  assignedTo?: string;
  createdAt: string;
  notes?: { text: string; createdAt: string; author?: string }[];
};

const statusTone = (s: string): "neutral" | "success" | "warning" | "danger" => {
  if (s === "converted") return "success";
  if (s === "closed") return "warning";
  if (s === "open") return "neutral";
  return "neutral";
};

// ─── Lead List ────────────────────────────────────────────────────────
function LeadList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtered, setFiltered] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ leads: Lead[] }>("/admin/get-leads");
      setLeads(data.leads ?? []);
      setFiltered(data.leads ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleSearch = (q: string) => {
    setSearch(q);
    const lower = q.toLowerCase();
    setFiltered(
      leads.filter(
        (l) =>
          !q ||
          l.name.toLowerCase().includes(lower) ||
          l.email.toLowerCase().includes(lower) ||
          (l.subject ?? "").toLowerCase().includes(lower)
      )
    );
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-tag mb-2">Leads</p>
          <h1 className="font-display text-3xl font-bold text-navy-900">Leads Inbox</h1>
          <p className="mt-1.5 text-sm text-navy-500">Customer enquiries from the contact form and website.</p>
        </div>
      </div>

      <Card className="mb-4 p-3">
        <label className="flex items-center gap-2 rounded-xl border border-navy-900/12 bg-white px-3 py-2 shadow-sm">
          <Search size={14} className="shrink-0 text-navy-400" />
          <input
            type="text"
            placeholder="Search by name, email, subject…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 border-none bg-transparent text-sm text-navy-900 outline-none placeholder:text-navy-300"
          />
        </label>
      </Card>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-900/8 bg-cream">
                {["Name", "Email", "Subject", "Status", "Date", "Action"].map((h, i) => (
                  <th key={h} className={`px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-500 ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/6">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 animate-pulse rounded-lg bg-navy-900/8" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((lead) => (
                    <tr key={lead._id} className="group transition-colors hover:bg-cream/50">
                      <td className="px-5 py-4 text-sm font-semibold text-navy-900">{lead.name}</td>
                      <td className="px-5 py-4 font-mono text-[12px] text-navy-600">{lead.email}</td>
                      <td className="px-5 py-4 text-[13px] text-navy-600 max-w-[200px] truncate">{lead.subject ?? "—"}</td>
                      <td className="px-5 py-4">
                        <Pill tone={statusTone(lead.status)}>{lead.status}</Pill>
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-navy-400">
                        {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/leads/${lead._id}`}
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
            {loading ? "Loading…" : `${filtered.length} leads`}
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── Lead Detail ──────────────────────────────────────────────────────
function LeadDetail({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchLead = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ lead: Lead }>(`/admin/get-lead/${leadId}`);
      setLead(data.lead);
      setStatus(data.lead.status ?? "open");
      setAssignedTo(data.lead.assignedTo ?? "");
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { fetchLead(); }, [fetchLead]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await apiFetch(`/admin/update-lead/${leadId}`, {
        method: "PUT",
        body: JSON.stringify({ status, assignedTo }),
      });
      fetchLead();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await apiFetch("/admin/lead-note", {
        method: "POST",
        body: JSON.stringify({ leadId, text: noteText }),
      });
      setNoteText("");
      fetchLead();
    } catch {
      // silent
    }
  };

  if (loading) return <p className="p-8 text-sm text-navy-500">Loading…</p>;
  if (!lead) return <p className="p-8 text-sm text-red-500">Lead not found.</p>;

  const inputBase = "w-full rounded-xl border border-navy-900/12 bg-white px-4 py-3 text-sm text-navy-900 shadow-sm outline-none transition focus:border-mint-400 focus:ring-2 focus:ring-mint-400/20";
  const labelBase = "mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-500";

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/leads" className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-navy-500 transition hover:text-navy-900">
          <ArrowLeft size={13} /> Back
        </Link>
        <span className="text-navy-300">/</span>
        <span className="font-mono text-[11px] text-navy-700">{lead.name}</span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        {/* Main info */}
        <div className="space-y-5">
          <Card>
            <p className="section-tag mb-4">Contact Details</p>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: "Name", val: lead.name },
                { label: "Email", val: lead.email },
                { label: "Phone", val: lead.phone ?? "—" },
                { label: "Subject", val: lead.subject ?? "—" },
                { label: "Source", val: lead.source ?? "—" },
                { label: "Received", val: new Date(lead.createdAt).toLocaleString("en-IN") },
              ].map(({ label, val }) => (
                <div key={label}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy-400">{label}</p>
                  <p className="mt-1 text-sm text-navy-900">{val}</p>
                </div>
              ))}
            </div>
            {lead.message && (
              <div className="mt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy-400">Message</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-navy-700">{lead.message}</p>
              </div>
            )}
          </Card>

          {/* Notes */}
          <Card>
            <p className="section-tag mb-4">Notes</p>
            <div className="space-y-3 mb-4">
              {(lead.notes ?? []).length === 0 && (
                <p className="font-mono text-[11px] text-navy-400">No notes yet.</p>
              )}
              {(lead.notes ?? []).map((note, i) => (
                <div key={i} className="rounded-xl border border-navy-900/10 bg-cream p-4">
                  <p className="text-[13px] leading-relaxed text-navy-800">{note.text}</p>
                  <p className="mt-2 font-mono text-[10px] text-navy-400">
                    {note.author ? `${note.author} · ` : ""}{new Date(note.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <textarea
                rows={3}
                placeholder="Add a note…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className={`${inputBase} resize-y leading-relaxed`}
              />
              <button
                type="button"
                onClick={handleAddNote}
                className="btn-primary"
              >
                <span className="dot" aria-hidden />
                Add Note
              </button>
            </div>
          </Card>
        </div>

        {/* Controls */}
        <Card className="h-fit space-y-5">
          <p className="section-tag">Ops Controls</p>
          <div>
            <label className={labelBase}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputBase} cursor-pointer`}>
              {["open", "in-progress", "converted", "closed"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelBase}>Assigned To</label>
            <input
              type="text"
              placeholder="Team member name"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className={inputBase}
            />
          </div>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={saving}
            className="btn-primary w-full justify-center disabled:opacity-60"
          >
            <span className="dot" aria-hidden />
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </Card>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────
export default function LeadsPage({ params }: { params: Params }) {
  const leadId = params.slug?.[0];
  if (!leadId) return <LeadList />;
  return <LeadDetail leadId={leadId} />;
}
