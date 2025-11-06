"use client";

import { useCallback, useMemo } from "react";

import { auth } from "@/lib/firebase";
import { useAuthContext } from "@/components/auth/auth-context";

export function useUser() {
  const { user, loading } = useAuthContext();

  const signOut = useCallback(() => auth.signOut(), []);

  return useMemo(
    () => ({ user, loading, signOut }),
    [loading, signOut, user],
  );
}

export type UseUserReturn = ReturnType<typeof useUser>;
