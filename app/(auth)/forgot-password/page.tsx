export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4">
      <section className="admin-card w-full max-w-md p-8">
        <p className="section-tag mb-3">Password Recovery</p>
        <h1 className="font-display text-3xl text-navy-900">Forgot Password</h1>
        <p className="mt-2 text-sm text-navy-500">
          Enter your admin email and we will send a reset link.
        </p>
        <form className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="recovery-email" className="font-mono text-[11px] uppercase tracking-[0.14em]">
              Email
            </label>
            <input
              id="recovery-email"
              type="email"
              placeholder="admin@cryptominingmiles.in"
              className="w-full rounded-xl border border-navy-900/20 bg-white px-4 py-3 text-sm outline-none ring-mint-400 transition focus:ring-2"
            />
          </div>
          <button type="button" className="btn-primary w-full justify-center">
            <span className="dot" aria-hidden />
            Send Reset Link
          </button>
        </form>
      </section>
    </main>
  );
}
