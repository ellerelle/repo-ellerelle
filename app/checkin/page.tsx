"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dumbbell, GraduationCap, MoonStar } from "lucide-react";
import { addDoc, Timestamp } from "firebase/firestore";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useUser } from "@/hooks/useUser";
import { eventsCollection, type EventType } from "@/lib/firestore";

type StatusState =
  | { state: "idle"; message: string | null }
  | { state: "loading"; message: string }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

const eventOptions: Array<{
  type: EventType;
  label: string;
  description: string;
  Icon: typeof Dumbbell;
}> = [
  {
    type: "exercise",
    label: "I Exercised",
    description: "Log a workout or movement milestone.",
    Icon: Dumbbell,
  },
  {
    type: "learning",
    label: "I Learned",
    description: "Capture a breakthrough or new insight.",
    Icon: GraduationCap,
  },
  {
    type: "sleep",
    label: "I Slept Well",
    description: "Celebrate a night of quality rest.",
    Icon: MoonStar,
  },
];

export default function CheckInPage() {
  const router = useRouter();
  const { user } = useUser();
  const [status, setStatus] = useState<StatusState>({ state: "idle", message: null });
  const [activeType, setActiveType] = useState<EventType | null>(null);

  const handleCheckIn = async (eventType: EventType) => {
    if (!user) {
      router.replace("/login");
      return;
    }

    setActiveType(eventType);
    setStatus({ state: "loading", message: "Saving your check-in…" });

    try {
      await addDoc(eventsCollection, {
        userId: user.uid,
        type: eventType,
        timestamp: Timestamp.now(),
      });

      setStatus({ state: "loading", message: "Generating a new world item…" });

      const response = await fetch("/api/generateWorldItem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, habitType: eventType }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to generate world item.");
      }

      setStatus({
        state: "success",
        message:
          payload?.worldItem?.description ??
          payload?.message ??
          "World item generated successfully!",
      });
    } catch (error) {
      setStatus({
        state: "error",
        message:
          error instanceof Error ? error.message : "Something went wrong. Please try again shortly.",
      });
    } finally {
      setActiveType(null);
    }
  };

  const isButtonLoading = (type: EventType) => status.state === "loading" && activeType === type;

  return (
    <ProtectedRoute>
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-10 px-6 py-16">
        <header className="text-center">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">Daily Check-in</h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Log your progress and grow your virtual world. Each check-in creates an event and triggers a
            new world artifact.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {eventOptions.map(({ type, label, description, Icon }) => {
            const loadingForButton = isButtonLoading(type);

            return (
              <button
                key={type}
                type="button"
                onClick={() => handleCheckIn(type)}
                disabled={status.state === "loading"}
                className="group relative flex h-48 flex-col items-center justify-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-zinc-900 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-75 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-200"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition group-hover:bg-zinc-900 group-hover:text-white dark:bg-zinc-900 dark:text-zinc-100 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900">
                  {loadingForButton ? (
                    <svg
                      className="h-8 w-8 animate-spin text-current"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
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
                  ) : (
                    <Icon className="h-8 w-8" />
                  )}
                </span>
                <div className="space-y-2">
                  <span className="block text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {label}
                  </span>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="min-h-[80px] rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          {status.state === "idle" && <p>Select an option to record today&apos;s progress.</p>}
          {status.state === "loading" && (
            <div className="flex flex-col items-center gap-3">
              <svg
                className="h-8 w-8 animate-spin text-zinc-900 dark:text-zinc-200"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
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
              <p>{status.message}</p>
            </div>
          )}
          {status.state === "success" && <p className="text-green-600 dark:text-green-400">{status.message}</p>}
          {status.state === "error" && <p className="text-red-600 dark:text-red-400">{status.message}</p>}
        </div>
      </main>
    </ProtectedRoute>
  );
}
