"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, startTransition } from "react";
import { limit, onSnapshot, orderBy, query, where } from "firebase/firestore";

import { useUser } from "@/hooks/useUser";
import { eventsCollection } from "@/lib/firestore";

function formatDateKey(date: Date) {
  const copy = new Date(date.getTime());
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().split("T")[0];
}

function calculateStreak(dates: Set<string>): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const cursor = new Date(today.getTime());

  while (true) {
    const key = cursor.toISOString().split("T")[0];
    if (dates.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      cursor.setHours(0, 0, 0, 0);
    } else {
      break;
    }
  }

  return streak;
}

export default function Home() {
  const { user, loading, signOut } = useUser();
  const [streak, setStreak] = useState(0);
  const [streakLoading, setStreakLoading] = useState(false);
  const [streakError, setStreakError] = useState<string | null>(null);

  const userId = user?.uid;

  useEffect(() => {
    if (!userId) {
      startTransition(() => {
        setStreak(0);
        setStreakLoading(false);
        setStreakError(null);
      });
      return;
    }

    startTransition(() => {
      setStreakLoading(true);
      setStreakError(null);
    });

    const eventsQuery = query(
      eventsCollection,
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(90),
    );

    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const dateSet = new Set<string>();
        snapshot.forEach((doc) => {
          const data = doc.data();
          const ts = data.timestamp;
          if (ts && typeof ts.toDate === "function") {
            dateSet.add(formatDateKey(ts.toDate()));
          }
        });

        startTransition(() => {
          setStreak(calculateStreak(dateSet));
          setStreakLoading(false);
          setStreakError(null);
        });
      },
      (error) => {
        console.error("Failed to load streak", error);
        startTransition(() => {
          setStreakLoading(false);
          setStreakError("Unable to load your streak right now.");
        });
      },
    );

    return () => unsubscribe();
  }, [userId]);

  const isAuthenticated = useMemo(() => !loading && Boolean(user), [loading, user]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-50 via-white to-white font-sans text-zinc-900 dark:from-black dark:via-zinc-950 dark:to-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/70 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            World Builder
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <Link className="transition hover:text-zinc-900 dark:hover:text-zinc-100" href="/world">
              World
            </Link>
            <Link className="transition hover:text-zinc-900 dark:hover:text-zinc-100" href="/checkin">
              Check In
            </Link>
            {!isAuthenticated ? (
              <Link
                className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                href="/login"
              >
                Sign in
              </Link>
            ) : (
              <button
                type="button"
                onClick={signOut}
                className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden py-24">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),transparent_55%)]" />
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 sm:px-6">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                Grow your world, one habit at a time.
              </h1>
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
                Check in daily, capture your progress, and watch your personal universe expand with handcrafted
                artifacts representing each milestone.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/world"
                    className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-900/20 transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Go to World
                  </Link>
                  <Link
                    href="/checkin"
                    className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Check In
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-900/20 transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Sign in to begin
                </Link>
              )}
            </div>

            <div className="grid gap-6 rounded-3xl border border-zinc-200 bg-white/70 p-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Daily streak
                </h2>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Keep your momentum going by logging your wins each day. Streaks track how many consecutive days you have
                  recorded at least one event.
                </p>
              </div>
              <div className="flex flex-col items-start justify-center rounded-2xl border border-zinc-100 bg-zinc-50 p-5 shadow-inner dark:border-zinc-800 dark:bg-zinc-950">
                {streakLoading ? (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Calculating…</span>
                ) : streakError ? (
                  <span className="text-sm text-red-500 dark:text-red-400">{streakError}</span>
                ) : (
                  <>
                    <span className="text-4xl font-semibold text-zinc-900 dark:text-zinc-100">{streak}</span>
                    <span className="mt-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Day streak
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6">
          <div className="mx-auto grid w-full max-w-6xl gap-6 sm:grid-cols-3">
            <div className="rounded-3xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Visualize progress</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Every habit check-in forges a new artifact, plotted onto your infinite world grid.
              </p>
            </div>
            <div className="rounded-3xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Celebrate habits</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Track exercise, learning, and sleep rituals—each logged day keeps your streak alive.
              </p>
            </div>
            <div className="rounded-3xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Stay motivated</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Use the world view to reflect on progress and inspire the next day’s check-in.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white/70 py-6 text-sm text-zinc-500 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-400">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <span>&copy; {new Date().getFullYear()} World Builder. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link className="transition hover:text-zinc-900 dark:hover:text-zinc-100" href="/world">
              View World
            </Link>
            <Link className="transition hover:text-zinc-900 dark:hover:text-zinc-100" href="/checkin">
              Quick Check-in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
