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

### Environment Variable Reference

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public Firebase web API key. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain (e.g., `your-project.firebaseapp.com`). |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket (e.g., `your-project.appspot.com`). |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID from Firebase console. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID from Firebase console. |
| `OPENAI_API_KEY` | Secret key for the OpenAI API. |
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase Admin project ID (can match the public project ID). |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Service account client email. |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Service account private key (wrap in quotes, replace newlines with `\n`). |
| `FIREBASE_ADMIN_PRIVATE_KEY_BASE64` *(optional)* | Base64 alternative for the private key. |
| `FIREBASE_ADMIN_STORAGE_BUCKET` | Storage bucket for Firebase Admin (typically the same as the public bucket). |

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
- Neighboring world placement logic lives in `lib/world.ts#getNewPosition`, ensuring each new artifact appears on an adjacent tile (4-direction grid) relative to the most recent item.

## Deployment (Vercel)

1. Install the Vercel CLI (`npm i -g vercel`) and authenticate with `vercel login`.
2. From the project root run `vercel` to create the project (or connect an existing repo via the Vercel dashboard).
3. Configure environment variables in Vercel:
   - Via CLI: `vercel env add VARIABLE_NAME` for each of the variables listed above (repeat for the Production and Preview environments).
   - Or via the Vercel dashboard under *Project Settings → Environment Variables*.
4. Pull the environment variables locally with `vercel env pull .env.local` if needed.
5. Deploy with `vercel --prod` (or rely on the Git integration for automatic deployments).

> **Tip:** Ensure Firebase Firestore and Storage security rules allow the deployed origin (and service account) to read/write the required collections/buckets.
