export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4">
      <section className="admin-card w-full max-w-md p-8">
        <p className="section-tag mb-3">Password Reset</p>
        <h1 className="font-display text-3xl text-navy-900">Set New Password</h1>
        <p className="mt-2 text-sm text-navy-500">
          This is a UI scaffold. Token validation and API wiring comes next.
        </p>
        <form className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="new-password" className="font-mono text-[11px] uppercase tracking-[0.14em]">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-navy-900/20 bg-white px-4 py-3 text-sm outline-none ring-mint-400 transition focus:ring-2"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="font-mono text-[11px] uppercase tracking-[0.14em]">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-navy-900/20 bg-white px-4 py-3 text-sm outline-none ring-mint-400 transition focus:ring-2"
            />
          </div>
          <button type="button" className="btn-primary w-full justify-center">
            <span className="dot" aria-hidden />
            Update Password
          </button>
        </form>
      </section>
    </main>
  );
}
