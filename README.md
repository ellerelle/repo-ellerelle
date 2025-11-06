## Overview

Full-stack Next.js 16 application with Tailwind CSS 4, Firebase (Auth, Firestore, Storage), React Query, Axios, OpenAI SDK, Lucide icons, and Unkey API-key middleware utilities. Email/password and Google authentication are available out of the box, with protected areas for world management and check-ins.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

The app is served from [http://localhost:3000](http://localhost:3000).

## Firebase Configuration

1. Create a Firebase project and enable **Authentication** (Email/Password and Google providers), **Cloud Firestore**, and **Cloud Storage** in the Firebase console.
2. Copy `.env.local.example` to `.env.local` and populate the `NEXT_PUBLIC_FIREBASE_*` values from your Firebase project settings.
3. Add Firebase Admin service account credentials (`FIREBASE_ADMIN_*`) and your `OPENAI_API_KEY` so server routes can call OpenAI and upload to Storage.
4. Restart the dev server after updating environment variables.

Key exports are configured in `lib/firebase.ts`:

```ts
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const worldsCollection = collection(db, "worlds");
export const worldImageRef = (worldId: string, filename: string) =>
  ref(storage, `world-images/${worldId}/${filename}`);
```

## Authentication & Routing

- `app/login/page.tsx` handles email/password sign-up & sign-in plus Google OAuth.
- `hooks/useUser.ts` exposes the authenticated user, loading state, and a sign-out helper.
- `components/auth/protected-route.tsx` enforces client-side protection and redirects to `/login` when needed.
- `/world` and `/checkin` routes demonstrate protected areas ready for Firestore + Storage integrations.

Wrap additional client routes with the `ProtectedRoute` component to require authentication.

## Firestore Schema

Typed converters for each collection live in `lib/firestore.ts`:

```ts
export interface UserDoc {
  worldState: Record<string, unknown>;
  createdAt: Timestamp;
}

export interface EventDoc {
  userId: string;
  type: "fitness" | "learning" | "sleep";
  timestamp: Timestamp;
}

export interface WorldItemDoc {
  userId: string;
  imageUrl: string;
  description: string;
  position: { x: number; y: number };
  createdAt: Timestamp;
  habitType: "exercise" | "learning" | "sleep";
}
```

Use the exported `usersCollection`, `eventsCollection`, and `worldItemsCollection` helpers for type-safe reads and writes. The `worldsCollection` and `worldImageRef` utilities remain available in `lib/firebase.ts` for higher-level world management features.

## World Generation API

- `POST /api/generateWorldItem` accepts `{ userId, habitType }` where `habitType` is `exercise`, `learning`, or `sleep`.
- The route generates a concise prompt via OpenAI Responses, produces a 512×512 image with OpenAI Images, uploads it to Firebase Storage, stores the resulting record in Firestore, and returns the new world item payload (including a signed image URL) to the client.
