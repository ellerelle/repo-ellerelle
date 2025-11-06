import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { Timestamp, collection } from "firebase/firestore";

import { db } from "@/lib/firebase";

type FirestoreConverter<T extends DocumentData> = {
  toFirestore: (data: T) => DocumentData;
  fromFirestore: (snapshot: QueryDocumentSnapshot) => T;
};

const createConverter = <T extends DocumentData>(): FirestoreConverter<T> => ({
  toFirestore: (data) => data,
  fromFirestore: (snapshot) => snapshot.data() as T,
});

export type WorldState = Record<string, unknown>;

export interface UserDoc {
  worldState: WorldState;
  createdAt: Timestamp;
}

export const usersCollection = collection(db, "users").withConverter<UserDoc>(
  createConverter<UserDoc>(),
);

export type EventType = "fitness" | "learning" | "sleep";

export interface EventDoc {
  userId: string;
  type: EventType;
  timestamp: Timestamp;
}

export const eventsCollection = collection(db, "events").withConverter<EventDoc>(
  createConverter<EventDoc>(),
);

export interface WorldItemDoc {
  userId: string;
  imageUrl: string;
  description: string;
  position: {
    x: number;
    y: number;
  };
  createdAt: Timestamp;
}

export const worldItemsCollection = collection(db, "worldItems").withConverter<WorldItemDoc>(
  createConverter<WorldItemDoc>(),
);
