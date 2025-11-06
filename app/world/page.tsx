"use client";

import Image from "next/image";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onSnapshot, orderBy, query, where } from "firebase/firestore";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useUser } from "@/hooks/useUser";
import { worldItemsCollection, type WorldItemDoc } from "@/lib/firestore";

const TILE_SIZE = 40;

type RealtimeWorldItem = WorldItemDoc & {
  id: string;
};

export default function WorldPage() {
  const { user, signOut } = useUser();
  const [items, setItems] = useState<RealtimeWorldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    const worldItemsQuery = query(
      worldItemsCollection,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      worldItemsQuery,
      (snapshot) => {
        const nextItems = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setItems(nextItems);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        console.error("Failed to fetch world items", snapshotError);
        setError("Unable to load your world items right now.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    panStartRef.current = { ...pan };
    isDraggingRef.current = true;
    setIsDragging(true);
  }, [pan]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    event.preventDefault();
    const dx = event.clientX - pointerStartRef.current.x;
    const dy = event.clientY - pointerStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  }, []);

  const endDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    event.preventDefault();
    const target = event.currentTarget;
    try {
      target.releasePointerCapture(event.pointerId);
    } catch {
      // ignore if pointer was not captured
    }
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  const gridStyles = useMemo(
    () => ({
      backgroundImage:
        "linear-gradient(to right, rgba(148, 163, 184, 0.18) 1px, transparent 1px)," +
        "linear-gradient(to bottom, rgba(148, 163, 184, 0.18) 1px, transparent 1px)",
      backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
    }),
    [],
  );

  return (
    <ProtectedRoute>
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">Your World</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Drag to explore. New check-ins appear instantly as artifacts on the grid.
            </p>
          </div>
          <button
            onClick={signOut}
            className="self-start rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white/40 p-4 text-xs text-zinc-600 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
          <p>
            Tip: Scroll or drag the canvas to navigate. Each tile represents a 40px square. Items are positioned
            based on the generated world coordinates and update in real time.
          </p>
        </section>

        <div className="relative flex-1 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-inner dark:border-zinc-800 dark:bg-zinc-950">
          <div
            role="presentation"
            className={`absolute inset-0 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            style={gridStyles}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
          >
            <div
              className="relative h-full w-full"
              style={{
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0)`,
                transition: isDragging ? "none" : "transform 80ms ease-out",
                willChange: "transform",
              }}
            >
              {loading && (
                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  Loading your world…
                </div>
              )}

              {error && !loading && (
                <div className="pointer-events-none absolute left-1/2 top-1/2 max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-600 shadow-sm dark:border-red-800 dark:bg-zinc-900 dark:text-red-400">
                  {error}
                </div>
              )}

              {!loading && !error && items.length === 0 && (
                <div className="pointer-events-none absolute left-1/2 top-1/2 max-w-sm -translate-x-1/2 -translate-y-1/2 space-y-3 rounded-xl border border-zinc-200 bg-white/90 p-6 text-center text-sm text-zinc-600 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
                  <p>No artifacts yet.</p>
                  <p>Check in from the dashboard to seed your world.</p>
                </div>
              )}

              {items.map((item) => {
                const left = item.position?.x ?? 0;
                const top = item.position?.y ?? 0;

                return (
                  <div
                    key={item.id}
                    className="absolute flex -translate-y-1/2 -translate-x-1/2 flex-col items-center gap-2"
                    style={{
                      left: left * TILE_SIZE,
                      top: top * TILE_SIZE,
                    }}
                  >
                    <div className="overflow-hidden rounded-2xl bg-white/60 p-2 shadow-[0_20px_45px_rgba(15,23,42,0.25)] ring-1 ring-zinc-200/70 backdrop-blur dark:bg-zinc-900/60 dark:ring-zinc-700/70">
                      <Image
                        src={item.imageUrl}
                        alt={item.description}
                        width={96}
                        height={96}
                        className="h-24 w-24 rounded-xl object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="max-w-[12rem] text-center text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      {item.description}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
