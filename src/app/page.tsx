import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Create Event",
    description: "Set up your event with name, date, location, and details.",
  },
  {
    number: "02",
    title: "Share QR Code",
    description:
      "A unique QR code is generated for attendees to scan at the event.",
  },
  {
    number: "03",
    title: "Attendees Scan",
    description:
      "Participants scan the code with their EUDI Wallet to request a credential.",
  },
  {
    number: "04",
    title: "Credential in Wallet",
    description:
      "A verifiable attendance credential is issued directly to their wallet.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pt-24 pb-20 text-center">
        <span className="mb-6 inline-block rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-accent uppercase">
          EUDI Wallet Compatible
        </span>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Issue Verifiable{" "}
          <span className="text-accent">Event Attendance</span> Credentials
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Issue verifiable event attendance credentials to EUDI Wallets. Create
          your event, share a QR code, and let attendees receive tamper-proof
          credentials in seconds.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/events/create"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-8 text-sm font-semibold text-[#1a1a2e] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Create Event
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-white/15 px-8 text-sm font-semibold text-foreground transition-colors hover:border-white/30 hover:bg-white/5"
          >
            How It Works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto w-full max-w-5xl px-6 py-20"
      >
        <div className="mb-14 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            How It Works
          </h2>
          <p className="mt-3 text-muted">
            Four simple steps from event creation to credential issuance.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group rounded-xl border border-white/10 bg-surface p-6 transition-colors hover:border-accent/30 hover:bg-surface-light"
            >
              <span className="mb-4 block font-mono text-2xl font-bold text-accent">
                {step.number}
              </span>
              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 py-8 text-center text-sm text-muted">
        <p>
          Built for the{" "}
          <span className="font-medium text-accent">
            EU Digital Identity Wallet
          </span>{" "}
          ecosystem.
        </p>
      </footer>
    </div>
  );
}
