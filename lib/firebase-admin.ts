import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import { Storage, getStorage } from "firebase-admin/storage";

let cachedDb: Firestore | null = null;
let cachedStorage: Storage | null = null;

function resolvePrivateKey() {
  let key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!key && process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64) {
    key = Buffer.from(
      process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64,
      "base64",
    ).toString("utf8");
  }

  return key?.replace(/\\n/g, "\n");
}

function getFirebaseAdminApp() {
  if (getApps().length) {
    return getApp();
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = resolvePrivateKey();
  const storageBucket =
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET ??
    process.env.FIREBASE_STORAGE_BUCKET ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin environment variables are not fully configured. Please set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY (or FIREBASE_ADMIN_PRIVATE_KEY_BASE64).",
    );
  }

  if (!storageBucket) {
    throw new Error(
      "Firebase Storage bucket is not configured. Set FIREBASE_ADMIN_STORAGE_BUCKET or reuse your public bucket env values.",
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket,
  });
}

export function getAdminDb() {
  if (!cachedDb) {
    cachedDb = getFirestore(getFirebaseAdminApp());
  }

  return cachedDb;
}

export function getAdminStorage() {
  if (!cachedStorage) {
    cachedStorage = getStorage(getFirebaseAdminApp());
  }

  return cachedStorage;
}
