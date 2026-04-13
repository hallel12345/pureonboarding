import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="shell">
      <section className="panel success-panel">
        <p className="eyebrow">Submission Complete</p>
        <h1>Onboarding Packet Sent Successfully</h1>
        <p className="subtitle">
          Your onboarding details and uploaded forms were sent to payroll/accounting. You can close this page.
        </p>
        <Link className="btn-secondary" href="/">
          Start Another Submission
        </Link>
      </section>
    </main>
  );
}
