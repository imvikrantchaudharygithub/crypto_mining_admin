"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getAuthToken, getStoredUser, setAuthSession, clearAuthSession, type AdminUser } from "@/lib/api";

/**
 * Client-side route guard for the admin area.
 *
 * On mount:
 *  - if no token in storage → redirect to /login
 *  - if token exists → validate via /admin/me; refresh cached user, render children
 *  - on 401 → clear + redirect to /login
 *
 * Renders nothing (a thin spinner) while the check is in flight to avoid
 * flashing the admin shell to a logged-out user.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    // No token at all → straight to login
    if (!token) {
      router.replace("/login");
      return;
    }

    // Validate token by hitting /admin/me. Refresh cached user with server truth.
    apiFetch<{ success: boolean; user: AdminUser }>("/admin/me")
      .then((res) => {
        if (res?.user) setAuthSession(token, res.user);
        setReady(true);
      })
      .catch(() => {
        // /admin/me rejected → clear session and bounce
        clearAuthSession();
        router.replace("/login");
      });
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--admin-bg)" }}>
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-navy-400">
          Loading…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook for accessing the current user inside admin pages.
 * Reads from localStorage cache (synchronously populated by AuthGuard).
 */
export function useCurrentUser(): AdminUser | null {
  const [user, setUser] = useState<AdminUser | null>(null);
  useEffect(() => {
    setUser(getStoredUser());
  }, []);
  return user;
}
