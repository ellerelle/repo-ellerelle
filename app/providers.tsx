"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/components/auth/auth-context";

export default function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
