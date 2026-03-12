"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

export default function EventDetailPage() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  const eventName = searchParams.get("event_name");
  const eventDate = searchParams.get("event_date");
  const location = searchParams.get("location");
  const description = searchParams.get("description");
  const offerUri = searchParams.get("offer_uri");

  async function copyToClipboard() {
    if (!offerUri) return;
    try {
      await navigator.clipboard.writeText(offerUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = offerUri;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // Missing data state
  if (!eventName || !offerUri) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
          <svg
            className="h-8 w-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Event Not Found</h1>
        <p className="mt-3 text-muted">
          This event link appears to be incomplete or invalid. Please create a
          new event to generate a valid credential offer.
        </p>
        <Link
          href="/events/create"
          className="mt-8 inline-flex h-11 items-center rounded-lg bg-accent px-6 text-sm font-semibold text-[#1a1a2e] transition-all hover:brightness-110"
        >
          Create Event
        </Link>
      </div>
    );
  }

  // Format date for display
  const formattedDate = eventDate
    ? new Date(eventDate + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-16">
      {/* Event badge */}
      <span className="mb-6 inline-block rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-accent uppercase">
        Event Credential
      </span>

      {/* Event info */}
      <h1 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
        {eventName}
      </h1>

      {(formattedDate || location) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted">
          {formattedDate && (
            <span className="flex items-center gap-1.5">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formattedDate}
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1.5">
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {location}
            </span>
          )}
        </div>
      )}

      {description && (
        <p className="mt-4 max-w-md text-center text-sm leading-relaxed text-muted">
          {description}
        </p>
      )}

      {/* QR Code section */}
      <div className="mt-10 w-full max-w-sm rounded-2xl border border-white/10 bg-surface p-8">
        <div className="flex justify-center">
          <div className="rounded-xl bg-white p-5">
            <QRCodeSVG
              value={offerUri}
              size={280}
              level="M"
              marginSize={0}
              aria-label={`QR code for credential offer: ${eventName}`}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
          <p className="text-center text-sm font-medium text-accent">
            Scan this QR code with your EUDI Wallet to receive your attendance
            credential
          </p>
        </div>
      </div>

      {/* Credential offer URI */}
      <div className="mt-6 w-full max-w-sm rounded-xl border border-white/10 bg-surface p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
          Credential Offer URI
        </p>
        <a
          href={offerUri}
          target="_blank"
          rel="noopener noreferrer"
          className="block break-all text-sm text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
        >
          {offerUri}
        </a>
      </div>

      {/* Actions */}
      <div className="mt-6 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
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

        <Link
          href="/events/create"
          className="flex h-11 flex-1 items-center justify-center rounded-lg border border-white/15 px-6 text-sm font-medium transition-colors hover:border-white/30 hover:bg-white/5"
        >
          Create Event
        </Link>
      </div>

      {/* Footer note */}
      <p className="mt-10 text-center text-xs text-muted/60">
        This credential is issued via the OpenID4VCI pre-authorized code flow
        and is compatible with EUDI Wallet reference implementations.
      </p>
    </div>
  );
}
