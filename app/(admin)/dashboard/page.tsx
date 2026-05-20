"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Package, Ticket, Users, BarChart3, ArrowRight, TrendingUp, AlertCircle, Wallet, IndianRupee } from "lucide-react";
import { Card } from "@/components/primitives/Card";
import { Pill } from "@/components/primitives/Pill";
import { apiFetch } from "@/lib/api";

// ─── Expense summary types ──────────────────────────────────────────
type ExpenseSummary = {
  thisMonthTotal: number;
  thisMonthCount: number;
  lastMonthTotal: number;
  deltaPct: number;
  topCategory: { name: string; total: number } | null;
  series: { date: string; total: number }[];
};

const INR = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const rupees = (n: number) => `₹${INR.format(Math.round(n))}`;

// Sparkline — pure SVG, no library
function Sparkline({ data, color = "#1a2d4a" }: { data: number[]; color?: string }) {
  if (!data || data.length === 0) {
    return <div className="h-9 w-full rounded bg-navy-900/4" />;
  }
  const w = 100;
  const h = 30;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const points = data.map((v, i) => `${(i * step).toFixed(2)},${(h - ((v - min) / range) * h).toFixed(2)}`).join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-9 w-full">
      <polygon points={areaPoints} fill={color} opacity="0.12" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExpenseSmartCard({ summary, loading }: { summary: ExpenseSummary | null; loading: boolean }) {
  const positive = summary ? summary.deltaPct >= 0 : false;
  return (
    <Link href="/expenses" className="block">
      <Card className="group relative flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <Wallet size={18} className="text-amber-600" />
          </div>
          <ArrowUpRight size={15} className="text-navy-300 transition group-hover:text-navy-700" />
        </div>
        <div>
          {loading || !summary ? (
            <div className="h-10 w-28 animate-pulse rounded-lg bg-navy-900/8" />
          ) : (
            <div className="flex items-baseline gap-1">
              <IndianRupee size={20} className="text-navy-900" />
              <p className="font-display text-4xl font-bold tabular-nums leading-none text-navy-900">
                {INR.format(Math.round(summary.thisMonthTotal))}
              </p>
            </div>
          )}
          <p className="mt-1 text-[13px] font-medium text-navy-500">Expenses this month</p>
        </div>

        <div className="flex items-center gap-2">
          {loading || !summary ? (
            <div className="h-5 w-24 animate-pulse rounded-full bg-navy-900/8" />
          ) : summary.lastMonthTotal === 0 && summary.thisMonthTotal === 0 ? (
            <Pill tone="neutral">No data yet</Pill>
          ) : (
            <Pill tone={positive ? "danger" : "success"}>
              {positive ? "▲" : "▼"} {Math.abs(summary.deltaPct).toFixed(1)}% vs last month
            </Pill>
          )}
        </div>

        {!loading && summary && summary.topCategory && (
          <div className="flex items-center justify-between border-t border-navy-900/6 pt-2.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-navy-400">Top</span>
            <span className="truncate text-[12px] font-medium text-navy-700">
              {summary.topCategory.name} · <span className="tabular-nums">{rupees(summary.topCategory.total)}</span>
            </span>
          </div>
        )}

        {!loading && summary && (
          <Sparkline data={summary.series.map((s) => s.total)} color="#0a1628" />
        )}
      </Card>
    </Link>
  );
}

// ─── Types ────────────────────────────────────────────────
type Lead = { _id: string; name: string; subject?: string; status?: string; createdAt: string };
type TicketItem = {
  _id: string; ticketId: string; minerModel?: string;
  customerName?: string; issueDescription?: string; status?: string; priority?: string; createdAt: string
};

// ─── Helpers ─────────────────────────────────────────────
function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function statusTone(s?: string): "success" | "warning" | "neutral" | "danger" {
  if (!s) return "neutral";
  const l = s.toLowerCase();
  if (l === "resolved" || l === "closed") return "success";
  if (l === "critical" || l === "high") return "danger";
  if (l === "in progress" || l === "in-progress") return "warning";
  return "neutral";
}

// ─── Stat Card ───────────────────────────────────────────
type StatEntry = {
  label: string; value: string | number; delta: string;
  tone: "success" | "warning" | "neutral" | "danger";
  icon: React.ElementType; href: string; color: string; iconColor: string;
};

function StatCard({ stat, loading }: { stat: StatEntry; loading: boolean }) {
  const Icon = stat.icon;
  return (
    <Link href={stat.href} className="block">
      <Card className="group flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
            <Icon size={18} className={stat.iconColor} />
          </div>
          <ArrowUpRight size={15} className="text-navy-300 transition group-hover:text-navy-700" />
        </div>
        <div>
          {loading ? (
            <div className="h-10 w-16 animate-pulse rounded-lg bg-navy-900/8" />
          ) : (
            <p className="font-display text-4xl font-bold tabular-nums text-navy-900">{stat.value}</p>
          )}
          <p className="mt-1 text-[13px] font-medium text-navy-500">{stat.label}</p>
        </div>
        <Pill tone={stat.tone}>{stat.delta}</Pill>
      </Card>
    </Link>
  );
}

// ─── Activity Row ────────────────────────────────────────
function ActivityRow({
  primary, secondary,
  pill, time,
}: {
  primary: string; secondary: string;
  pill: { tone: "success" | "warning" | "neutral" | "danger"; label: string };
  time: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-navy-900/3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-navy-900">{primary}</p>
        <p className="mt-0.5 truncate text-[12px] text-navy-500">{secondary}</p>
      </div>
      <Pill tone={pill.tone}>{pill.label}</Pill>
      <span className="shrink-0 font-mono text-[10px] text-navy-400">{time}</span>
    </li>
  );
}

const CONTENT_PAGES = [
  { label: "Home", href: "/content/home" },
  { label: "Shop", href: "/content/shop" },
  { label: "Plans", href: "/plans" },
  { label: "Contact", href: "/content/contact" },
  { label: "Navbar", href: "/content/nav" },
  { label: "Footer", href: "/content/footer" },
];

// ─── Page ────────────────────────────────────────────────
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ products: 0, plans: 0, leads: 0, openTickets: 0 });
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [recentTickets, setRecentTickets] = useState<TicketItem[]>([]);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary | null>(null);
  const [expenseLoading, setExpenseLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<{ products: unknown[] }>("/get-products"),
      apiFetch<{ plans: unknown[] }>("/get-plans"),
      apiFetch<{ leads: Lead[] }>("/admin/get-leads"),
      apiFetch<{ tickets: TicketItem[] }>("/admin/get-tickets"),
    ])
      .then(([prodData, planData, leadData, ticketData]) => {
        const allLeads = leadData.leads ?? [];
        const allTickets = ticketData.tickets ?? [];
        const openTickets = allTickets.filter(t => {
          const s = (t.status ?? "").toLowerCase();
          return s !== "resolved" && s !== "closed";
        });
        setCounts({
          products: (prodData.products ?? []).length,
          plans: (planData.plans ?? []).length,
          leads: allLeads.length,
          openTickets: openTickets.length,
        });
        setRecentLeads(allLeads.slice(0, 5));
        setRecentTickets(allTickets.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    apiFetch<{ summary: ExpenseSummary }>("/admin/expense-dashboard-summary")
      .then((d) => setExpenseSummary(d.summary))
      .catch(() => {})
      .finally(() => setExpenseLoading(false));
  }, []);

  const STATS: StatEntry[] = [
    { label: "Products", value: counts.products, delta: "Total listed", tone: "success", icon: Package, href: "/products", color: "bg-mint-100", iconColor: "text-mint-600" },
    { label: "Plans", value: counts.plans, delta: "Active plans", tone: "warning", icon: BarChart3, href: "/plans", color: "bg-amber-50", iconColor: "text-amber-600" },
    { label: "Total Leads", value: counts.leads, delta: "All time", tone: "neutral", icon: Users, href: "/leads", color: "bg-blue-50", iconColor: "text-blue-600" },
    { label: "Open Tickets", value: counts.openTickets, delta: "Need action", tone: "danger", icon: Ticket, href: "/tickets", color: "bg-red-50", iconColor: "text-red-500" },
  ];

  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="section-tag mb-2">Dashboard</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-navy-900">Good morning 👋</h1>
            <p className="mt-1 text-sm text-navy-500">
              Here&apos;s what&apos;s happening across Crypto Mining Miles today.
            </p>
          </div>
          <span className="font-mono text-[11px] text-navy-400">{today}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} stat={stat} loading={loading} />
        ))}
      </div>

      {/* Expense smart card */}
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <ExpenseSmartCard summary={expenseSummary} loading={expenseLoading} />
        <Card className="flex flex-col justify-center">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50">
              <Wallet size={15} className="text-amber-600" />
            </div>
            <h2 className="font-display text-[15px] font-bold text-navy-900">Spend overview</h2>
          </div>
          {expenseLoading || !expenseSummary ? (
            <div className="h-16 animate-pulse rounded-lg bg-navy-900/5" />
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-navy-400">Entries</p>
                <p className="mt-1 font-display text-xl font-bold text-navy-900">{expenseSummary.thisMonthCount}</p>
                <p className="text-[11px] text-navy-500">this month</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-navy-400">Last month</p>
                <p className="mt-1 font-display text-xl font-bold text-navy-900 tabular-nums">{rupees(expenseSummary.lastMonthTotal)}</p>
                <p className="text-[11px] text-navy-500">total spend</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-navy-400">Top category</p>
                <p className="mt-1 truncate font-display text-base font-bold text-navy-900">
                  {expenseSummary.topCategory?.name ?? "—"}
                </p>
                <p className="text-[11px] text-navy-500 tabular-nums">
                  {expenseSummary.topCategory ? rupees(expenseSummary.topCategory.total) : ""}
                </p>
              </div>
            </div>
          )}
          <Link
            href="/expenses"
            className="mt-4 inline-flex w-fit items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-navy-500 transition hover:text-navy-900"
          >
            View all expenses <ArrowRight size={11} />
          </Link>
        </Card>
      </div>

      {/* Middle row: Leads + Tickets */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Recent Leads */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
                <Users size={15} className="text-blue-600" />
              </div>
              <h2 className="font-display text-[16px] font-bold text-navy-900">Recent Leads</h2>
            </div>
            <Link href="/leads" className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-navy-500 transition hover:text-navy-900">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <ul className="divide-y divide-navy-900/6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="h-14 animate-pulse rounded-xl bg-navy-900/4 p-3 my-1" />
              ))
            ) : recentLeads.length === 0 ? (
              <li className="py-6 text-center text-sm text-navy-400">No leads yet</li>
            ) : (
              recentLeads.map((lead) => (
                <ActivityRow
                  key={lead._id}
                  primary={lead.name}
                  secondary={lead.subject ?? "—"}
                  pill={{ tone: statusTone(lead.status), label: lead.status ?? "new" }}
                  time={timeAgo(lead.createdAt)}
                />
              ))
            )}
          </ul>
        </Card>

        {/* Recent Tickets */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50">
                <Ticket size={15} className="text-red-500" />
              </div>
              <h2 className="font-display text-[16px] font-bold text-navy-900">Recent Tickets</h2>
            </div>
            <Link href="/tickets" className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-navy-500 transition hover:text-navy-900">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <ul className="divide-y divide-navy-900/6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="h-14 animate-pulse rounded-xl bg-navy-900/4 p-3 my-1" />
              ))
            ) : recentTickets.length === 0 ? (
              <li className="py-6 text-center text-sm text-navy-400">No tickets yet</li>
            ) : (
              recentTickets.map((tkt) => (
                <ActivityRow
                  key={tkt._id}
                  primary={tkt.issueDescription?.slice(0, 50) ?? tkt.ticketId}
                  secondary={`${tkt.ticketId} · ${tkt.customerName ?? "—"}`}
                  pill={{ tone: statusTone(tkt.priority ?? tkt.status), label: tkt.status ?? "open" }}
                  time={timeAgo(tkt.createdAt)}
                />
              ))
            )}
          </ul>
        </Card>
      </div>

      {/* Bottom row: Quick actions + Content pages */}
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        {/* Quick actions */}
        <Card>
          <h2 className="mb-4 font-display text-[16px] font-bold text-navy-900">Quick Actions</h2>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {[
              { label: "Add Product", href: "/products/new", icon: Package, desc: "List a new ASIC miner" },
              { label: "New Lead", href: "/leads/new", icon: Users, desc: "Log an incoming enquiry" },
              { label: "Raise Ticket", href: "/tickets/new", icon: Ticket, desc: "Open a support ticket" },
              { label: "Edit Home", href: "/content/home", icon: TrendingUp, desc: "Update homepage content" },
              { label: "Edit Plans", href: "/plans", icon: BarChart3, desc: "Manage pricing plans" },
              { label: "View Reports", href: "/settings/audit-log", icon: AlertCircle, desc: "Audit log & activity" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-xl border border-navy-900/8 bg-cream p-3 transition hover:border-navy-900/20 hover:bg-cream-2"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-900/6 transition group-hover:bg-navy-900">
                    <Icon size={15} className="text-navy-600 transition group-hover:text-mint-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-navy-900">{action.label}</p>
                    <p className="text-[11px] text-navy-400">{action.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        {/* Content pages */}
        <Card>
          <h2 className="mb-4 font-display text-[16px] font-bold text-navy-900">Content Pages</h2>
          <div className="space-y-1">
            {CONTENT_PAGES.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-navy-900/4"
              >
                <span className="text-[13px] font-medium text-navy-800">{page.label}</span>
                <ArrowRight size={11} className="text-navy-300" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
