import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="shell">
      <section className="panel success-panel">
        <p className="eyebrow">Submission Complete</p>
        <h1>Welcome to Pure Pest Solutions</h1>
        <p className="subtitle" style={{ margin: "0.8rem auto 0" }}>
          Your onboarding packet and signed forms were sent to payroll and accounting. You&rsquo;re all
          set &mdash; you can safely close this page.
        </p>
        <Link className="btn-secondary" href="/">
          Start Another Submission
        </Link>
      </section>
    </main>
  );
}
