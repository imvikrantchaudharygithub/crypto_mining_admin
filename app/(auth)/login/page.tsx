"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/primitives/Logo";
import { apiFetch, setAuthSession, getStoredUser, type AdminUser } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, skip the form
  useEffect(() => {
    if (getStoredUser()) router.replace("/dashboard");
  }, [router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await apiFetch<{ success: boolean; token: string; user: AdminUser }>(
        "/admin/login",
        {
          method: "POST",
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        }
      );
      setAuthSession(data.token, data.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
      style={{ background: "var(--admin-bg)" }}
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-64 w-64 rounded-full bg-mint-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-navy-300/15 blur-3xl" />

      {/* Card */}
      <section className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <LogoMark size={56} />
          </div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Admin Sign In</h1>
          <p className="mt-1.5 text-sm text-navy-500">
            Crypto Mining Miles · Editorial Console
          </p>
        </div>

        {/* Form card */}
        <div className="admin-card overflow-hidden">
          <div className="border-b border-navy-900/8 bg-cream px-6 py-4">
            <p className="section-tag">Secure Access</p>
          </div>

          <form className="space-y-4 p-6" onSubmit={onSubmit}>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-500"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="admin@gmail.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-500"
                >
                  Password
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center disabled:opacity-60"
            >
              <span className="dot" aria-hidden />
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-navy-400">
          © 2026 Crypto Mining Miles · Admin v0.1
        </p>
      </section>
    </main>
  );
}
