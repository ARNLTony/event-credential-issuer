"use client";

import { useState } from "react";
import type { FormEvent } from "react";

interface EventFormData {
  name: string;
  date: string;
  location: string;
  description: string;
}

export default function CreateEventPage() {
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    date: "",
    location: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: POST to /api/events when backend is ready
    console.log("Event data:", formData);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    setIsSubmitting(false);
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
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
          Your event <strong className="text-foreground">{formData.name}</strong>{" "}
          has been created successfully. A QR code will be available for
          attendees to scan.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setFormData({ name: "", date: "", location: "", description: "" });
          }}
          className="mt-8 inline-flex h-10 items-center rounded-lg border border-white/15 px-6 text-sm font-medium transition-colors hover:border-white/30 hover:bg-white/5"
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
