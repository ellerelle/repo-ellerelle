"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useUser } from "@/hooks/useUser";

export default function WorldPage() {
  const { user, signOut } = useUser();

  return (
    <ProtectedRoute>
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-16">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              World Dashboard
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Manage your worlds and upload imagery to Firebase Storage.
            </p>
          </div>
          <button
            onClick={signOut}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </header>

        <section className="rounded-2xl border border-dashed border-zinc-300 p-6 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
          <p>Signed in as {user?.email ?? user?.uid}.</p>
          <p className="mt-2 text-sm">
            Connect this page to Firestore to list and manage your worlds or trigger storage uploads for
            world imagery.
          </p>
        </section>
      </main>
    </ProtectedRoute>
  );
}
