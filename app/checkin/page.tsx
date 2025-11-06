"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useUser } from "@/hooks/useUser";

export default function CheckInPage() {
  const { user } = useUser();

  return (
    <ProtectedRoute>
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-16">
        <header>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">Daily Check-in</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Capture your latest updates and sync them to Firestore.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Logged in as {user?.email ?? user?.uid}. Replace this placeholder with your Firestore-backed
            check-in form.
          </p>
        </section>
      </main>
    </ProtectedRoute>
  );
}
