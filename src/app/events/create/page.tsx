"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import type { FormEvent } from "react";

interface EventFormData {
  name: string;
  date: string;
  location: string;
  description: string;
}

interface EventResponse {
  event_id: string;
  credential_offer_uri: string;
  pre_authorized_code: string;
  credential_offer: Record<string, unknown>;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    date: "",
    location: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EventResponse | null>(null);
  const [copied, setCopied] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_name: formData.name,
          event_date: formData.date,
          location: formData.location,
          description: formData.description,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error || `Failed to create event (${res.status})`
        );
      }

      const data: EventResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyToClipboard() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.credential_offer_uri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = result.credential_offer_uri;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setCopied(false);
    setFormData({ name: "", date: "", location: "", description: "" });
  }

  function handleViewSharePage() {
    if (!result) return;
    const params = new URLSearchParams({
      event_name: formData.name,
      event_date: formData.date,
      location: formData.location,
      description: formData.description,
      offer_uri: result.credential_offer_uri,
    });
    router.push(`/events/${result.event_id}?${params.toString()}`);
  }

  // Success state — show QR code and credential offer
  if (result) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-16 text-center">
        {/* Success icon */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
          <svg
            className="h-8 w-8 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold">Event Created</h1>
        <p className="mt-3 text-muted">
          Your event{" "}
          <strong className="text-foreground">{formData.name}</strong> has been
          created successfully.
        </p>

        {/* QR Code */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-surface p-6">
          <div className="rounded-xl bg-white p-4">
            <QRCodeSVG
              value={result.credential_offer_uri}
              size={256}
              level="M"
              marginSize={0}
              aria-label={`QR code for credential offer: ${formData.name}`}
            />
          </div>
          <p className="mt-4 text-sm text-muted">
            Scan with a EUDI Wallet to receive your credential
          </p>
        </div>

        {/* Credential offer URI */}
        <div className="mt-6 w-full rounded-xl border border-white/10 bg-surface p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
            Credential Offer URI
          </p>
          <a
            href={result.credential_offer_uri}
            target="_blank"
            rel="noopener noreferrer"
            className="block break-all text-sm text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
          >
            {result.credential_offer_uri}
          </a>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
          <button
            onClick={copyToClipboard}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-6 text-sm font-semibold text-[#1a1a2e] transition-all hover:brightness-110"
            aria-label="Copy credential offer link to clipboard"
          >
            {copied ? (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy Link
              </>
            )}
          </button>

          <button
            onClick={handleViewSharePage}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-white/15 px-6 text-sm font-medium transition-colors hover:border-white/30 hover:bg-white/5"
            aria-label="View shareable event page"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Share Page
          </button>
        </div>

        <button
          onClick={handleReset}
          className="mt-4 inline-flex h-10 items-center rounded-lg px-6 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Create Another Event
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Create Event
        </h1>
        <p className="mt-2 text-muted">
          Set up a new event to issue attendance credentials.
        </p>
      </div>

      {error && (
        <div
          className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          role="alert"
        >
          <p className="font-medium">Error creating event</p>
          <p className="mt-1 text-red-400/80">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Event Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium">
            Event Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. EUDI Wallet Summit 2026"
            className="h-11 rounded-lg border border-white/15 bg-surface px-4 text-sm text-foreground placeholder:text-muted/60 transition-colors focus:border-accent focus:outline-none"
          />
        </div>

        {/* Event Date */}
        <div className="flex flex-col gap-2">
          <label htmlFor="date" className="text-sm font-medium">
            Event Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            value={formData.date}
            onChange={handleChange}
            className="h-11 rounded-lg border border-white/15 bg-surface px-4 text-sm text-foreground transition-colors focus:border-accent focus:outline-none [color-scheme:dark]"
          />
        </div>

        {/* Location */}
        <div className="flex flex-col gap-2">
          <label htmlFor="location" className="text-sm font-medium">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            required
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Brussels Convention Center"
            className="h-11 rounded-lg border border-white/15 bg-surface px-4 text-sm text-foreground placeholder:text-muted/60 transition-colors focus:border-accent focus:outline-none"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of the event..."
            className="rounded-lg border border-white/15 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 transition-colors focus:border-accent focus:outline-none resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex h-11 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-[#1a1a2e] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Creating...
            </span>
          ) : (
            "Create Event"
          )}
        </button>
      </form>
    </div>
  );
}
