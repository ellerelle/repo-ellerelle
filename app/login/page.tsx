"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

import { auth, googleAuthProvider } from "@/lib/firebase";
import { useUser } from "@/hooks/useUser";

const emailPasswordErrors: Record<string, string> = {
  "auth/email-already-in-use": "An account already exists for this email address.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/invalid-login-credentials": "Invalid email or password.",
  "auth/missing-password": "A password is required.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/user-not-found": "No account found with this email address.",
  "auth/wrong-password": "Incorrect password.",
};

type AuthMode = "sign-in" | "sign-up";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/world");
    }
  }, [loading, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "sign-in") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }

      router.replace("/world");
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setError(emailPasswordErrors[code] ?? "Unable to complete request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      await signInWithPopup(auth, googleAuthProvider);
      router.replace("/world");
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (code !== "auth/popup-closed-by-user") {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {mode === "sign-in" ? "Sign in" : "Create an account"}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {mode === "sign-in"
            ? "Welcome back! Sign in with your email or continue with Google."
            : "Create an account with your email or continue with Google."}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-75 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isSubmitting ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-75 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Continue with Google
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {mode === "sign-in" ? (
            <button
              type="button"
              onClick={() => setMode("sign-up")}
              className="font-medium text-zinc-900 underline-offset-2 transition hover:underline dark:text-zinc-100"
            >
              Need an account? Sign up
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode("sign-in")}
              className="font-medium text-zinc-900 underline-offset-2 transition hover:underline dark:text-zinc-100"
            >
              Already have an account? Sign in
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
