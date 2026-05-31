"use client";

import { useEffect, useState, FormEvent, useCallback } from "react";
import { Card } from "@/components/primitives/Card";
import { Pill } from "@/components/primitives/Pill";
import { Plus, Power, Trash2 } from "lucide-react";
import { apiFetch, type AdminUser } from "@/lib/api";
import { useCurrentUser } from "@/components/shell/AuthGuard";

type DbUser = AdminUser & { isActive?: boolean; createdAt?: string; lastLoginAt?: string };

const ROLES: AdminUser["role"][] = ["super-admin", "editor", "support"];

const roleTone = (r: string): "neutral" | "success" | "warning" => {
  if (r === "super-admin") return "warning";
  if (r === "editor") return "success";
  return "neutral";
};

export default function UsersPage() {
  const current = useCurrentUser();
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add-user form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminUser["role"]>("editor");
  const [submitting, setSubmitting] = useState(false);

  const flash = (kind: "ok" | "err", msg: string) => {
    if (kind === "ok") { setSuccess(msg); setError(""); }
    else { setError(msg); setSuccess(""); }
    window.setTimeout(() => { setSuccess(""); setError(""); }, 4000);
  };

  const isSuperAdmin = current?.role === "super-admin";

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ success: boolean; users: DbUser[] }>("/admin/get-users");
      setUsers(data.users ?? []);
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 6) {
      flash("err", "Name, email, and password (min 6 chars) are required");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/admin/create-user", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, role }),
      });
      flash("ok", `Admin ${email.trim().toLowerCase()} added`);
      setName(""); setEmail(""); setPassword(""); setRole("editor");
      fetchUsers();
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "Failed to add user");
    } finally {
      setSubmitting(false);
    }
  };

  const onDeactivate = async (id: string, email: string) => {
    if (!confirm(`Deactivate ${email}? They will no longer be able to log in.`)) return;
    try {
      await apiFetch("/admin/deactivate-user", { method: "POST", body: JSON.stringify({ id }) });
      flash("ok", `${email} deactivated`);
      fetchUsers();
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "Failed to deactivate user");
    }
  };

  const inputBase = "w-full rounded-xl border border-navy-900/12 bg-white px-4 py-3 text-sm text-navy-900 shadow-sm outline-none transition focus:border-mint-400 focus:ring-2 focus:ring-mint-400/20";
  const labelBase = "mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-500";

  return (
    <div>
      <div className="mb-6">
        <p className="section-tag mb-2">Admin Users</p>
        <h1 className="font-display text-3xl font-bold text-navy-900">Team Access</h1>
        <p className="mt-1.5 text-sm text-navy-500">Manage who can sign in to the admin console.</p>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}
      {success && (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        {/* Users list */}
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-900/8 bg-cream">
                  {["Name", "Email", "Role", "Status", "Last Login", isSuperAdmin ? "Action" : ""].filter(Boolean).map((h, i, arr) => (
                    <th key={h} className={`px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-500 ${i === arr.length - 1 && isSuperAdmin ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-900/6">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: isSuperAdmin ? 6 : 5 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 animate-pulse rounded-lg bg-navy-900/8" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr><td colSpan={isSuperAdmin ? 6 : 5} className="px-5 py-8 text-center text-sm text-navy-400">No users yet.</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="group transition-colors hover:bg-cream/50">
                      <td className="px-5 py-4 text-[13px] font-semibold text-navy-900">{u.name}</td>
                      <td className="px-5 py-4 font-mono text-[12px] text-navy-700">{u.email}</td>
                      <td className="px-5 py-4"><Pill tone={roleTone(u.role)}>{u.role}</Pill></td>
                      <td className="px-5 py-4">
                        {u.isActive === false ? (
                          <Pill tone="danger">disabled</Pill>
                        ) : (
                          <Pill tone="success">active</Pill>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-navy-400">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—"}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-5 py-4 text-right">
                          {u._id !== current?._id && u.isActive !== false ? (
                            <button
                              type="button"
                              onClick={() => onDeactivate(u._id, u.email)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-red-600 transition hover:bg-red-100"
                            >
                              <Power size={11} /> Disable
                            </button>
                          ) : (
                            <span className="font-mono text-[10px] text-navy-300">{u._id === current?._id ? "you" : "—"}</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-navy-900/8 bg-cream px-5 py-3">
            <p className="font-mono text-[11px] text-navy-400">
              {loading ? "Loading…" : `${users.length} user${users.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </Card>

        {/* Add user form — super-admin only */}
        {isSuperAdmin ? (
          <Card className="h-fit">
            <p className="section-tag mb-4"><Plus size={11} className="inline mr-1.5" /> Add Admin</p>
            <form onSubmit={onCreate} className="space-y-3">
              <div>
                <label className={labelBase}>Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" className={inputBase} required />
              </div>
              <div>
                <label className={labelBase}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="priya@example.com" className={inputBase} required autoComplete="off" />
              </div>
              <div>
                <label className={labelBase}>Password</label>
                <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 6 characters" className={inputBase} required minLength={6} autoComplete="off" />
                <p className="mt-1 font-mono text-[10px] text-navy-400">Share this with the new user — they can change it after signing in.</p>
              </div>
              <div>
                <label className={labelBase}>Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as AdminUser["role"])} className={`${inputBase} cursor-pointer`}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full justify-center disabled:opacity-60">
                <span className="dot" aria-hidden /> {submitting ? "Adding…" : "Add Admin"}
              </button>
            </form>
          </Card>
        ) : (
          <Card className="h-fit text-sm text-navy-500">
            Only <strong>super-admin</strong> users can add or disable other admins.
          </Card>
        )}
      </div>
    </div>
  );
}
