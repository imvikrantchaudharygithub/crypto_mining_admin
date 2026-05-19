export default function LoginPage() {
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 shadow-lg">
            <span className="font-mono text-[13px] font-bold text-mint-400">CM</span>
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

          <form className="space-y-4 p-6">
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
                placeholder="admin@cryptominingmiles.in"
                autoComplete="email"
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
                <a
                  href="/forgot-password"
                  className="font-mono text-[10px] uppercase tracking-[0.1em] text-navy-400 transition hover:text-navy-900"
                >
                  Forgot?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="form-input"
              />
            </div>

            <button type="submit" className="btn-primary w-full justify-center">
              <span className="dot" aria-hidden />
              Sign in
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
