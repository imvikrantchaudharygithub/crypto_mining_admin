"use client";

import { Search, Bell, HelpCircle } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-navy-900/8 bg-white/90 px-5 backdrop-blur-sm">
      {/* Search */}
      <label className="flex max-w-sm flex-1 items-center gap-2.5 rounded-xl border border-navy-900/10 bg-admin-bg px-3.5 py-2 transition hover:border-navy-900/20"
        style={{ background: "var(--admin-bg)" }}>
        <Search size={14} className="shrink-0 text-navy-400" aria-hidden />
        <input
          id="admin-search"
          name="admin-search"
          placeholder="Search pages, products, tickets…"
          autoComplete="off"
          className="w-full border-none bg-transparent text-[13px] text-navy-900 outline-none placeholder:text-navy-300"
        />
        <kbd className="hidden rounded-lg border border-navy-900/12 bg-white px-1.5 py-0.5 font-mono text-[10px] text-navy-400 sm:inline">
          ⌘K
        </kbd>
      </label>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {/* Environment badge */}
        <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-amber-700 sm:inline-flex">
          DEV
        </span>

        {/* Help */}
        <button
          type="button"
          aria-label="Help"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-navy-400 transition hover:bg-navy-900/6 hover:text-navy-700"
        >
          <HelpCircle size={16} />
        </button>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-xl text-navy-400 transition hover:bg-navy-900/6 hover:text-navy-700"
        >
          <Bell size={16} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-mint-400" />
        </button>

        {/* User avatar */}
        <button
          type="button"
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-xl bg-navy-900 font-mono text-[11px] font-bold text-mint-300 transition hover:bg-navy-800"
        >
          VK
        </button>
      </div>
    </header>
  );
}
