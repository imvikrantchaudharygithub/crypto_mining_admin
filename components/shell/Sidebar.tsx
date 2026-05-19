"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  FileText,
  Images,
  LayoutDashboard,
  Package,
  Settings,
  Ticket,
  Users,
  UserSquare2,
  Globe,
  ChevronDown,
  UserCircle,
} from "lucide-react";
import clsx from "clsx";

type NavItem = { href: string; label: string; icon: React.ElementType };
type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Core",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/content/home", label: "Home", icon: FileText },
      { href: "/content/shop", label: "Shop", icon: FileText },
      { href: "/content/profitability", label: "Profitability", icon: FileText },
      { href: "/content/contact", label: "Contact", icon: FileText },
      { href: "/content/service-request", label: "Service Request", icon: FileText },
      { href: "/content/track-ticket", label: "Track Ticket", icon: FileText },
      { href: "/content/nav", label: "Navbar", icon: Globe },
      { href: "/content/footer", label: "Footer", icon: Globe },
      { href: "/team", label: "Our Team", icon: UserSquare2 },
      { href: "/software-partners", label: "Software Partners", icon: Boxes },
    ],
  },
  {
    title: "Commerce",
    items: [
      { href: "/products", label: "Products", icon: Package },
      { href: "/plans", label: "Plans", icon: BarChart3 },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/leads", label: "Leads", icon: Users },
      { href: "/tickets", label: "Tickets", icon: Ticket },
      { href: "/media", label: "Media", icon: Images },
    ],
  },
  {
    title: "Settings",
    items: [
      { href: "/settings", label: "Site Settings", icon: Settings },
      { href: "/settings/seo", label: "SEO", icon: Settings },
      { href: "/settings/users", label: "Team Members", icon: Users },
      { href: "/account", label: "My Account", icon: UserCircle },
    ],
  },
];

function NavGroupSection({ group, pathname }: { group: NavGroup; pathname: string }) {
  return (
    <div>
      <p className="mb-1 px-3 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-white/25">
        {group.title}
      </p>
      <div className="space-y-0.5">
        {group.items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "sidebar-link",
                active && "active"
              )}
            >
              <Icon
                size={15}
                className={clsx(
                  "shrink-0 transition-colors",
                  active ? "text-mint-400" : "text-white/35"
                )}
              />
              <span>{label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-mint-400" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-hidden lg:flex"
      style={{ background: "var(--admin-sidebar)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-white/8 px-5 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-mint-400">
          <span className="font-mono text-[11px] font-bold text-navy-900">CM</span>
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-[14px] font-bold leading-tight text-white">
            Mining Miles
          </p>
          <p className="font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-mint-400/70">
            Admin Console
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <NavGroupSection key={group.title} group={group} pathname={pathname} />
        ))}
      </nav>

      {/* Bottom user row */}
      <div className="border-t border-white/8 px-3 py-3">
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 transition hover:bg-white/6"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-navy-700 font-mono text-[11px] font-bold text-mint-300">
            VK
          </div>
          <div className="min-w-0 text-left">
            <p className="truncate text-[13px] font-medium text-white/80">Vikrant K.</p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Super Admin</p>
          </div>
          <ChevronDown size={13} className="ml-auto shrink-0 text-white/25" />
        </button>
      </div>
    </aside>
  );
}
