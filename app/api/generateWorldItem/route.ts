import { NextResponse } from "next/server";
import { Timestamp, addDoc } from "firebase/firestore";

import {
  worldItemsCollection,
  type EventType,
  type WorldItemDoc,
} from "@/lib/firestore";

const eventDescriptions: Record<EventType, string> = {
  fitness: "A vibrant energy shard forged from your recent fitness victory.",
  learning: "A glowing knowledge relic capturing your latest insight.",
  sleep: "A tranquil dream bloom distilled from restorative rest.",
};

const eventImages: Record<EventType, string> = {
  fitness: "https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=800&q=80",
  learning: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=800&q=80",
  sleep: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
};

const EVENT_TYPES: EventType[] = ["fitness", "learning", "sleep"];

export async function POST(request: Request) {
  try {
    const { userId, eventType } = (await request.json()) as {
      userId?: string;
      eventType?: string;
    };

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid userId." },
        { status: 400 },
      );
    }

    if (!eventType || !EVENT_TYPES.includes(eventType as EventType)) {
      return NextResponse.json(
        { error: "Invalid event type." },
        { status: 400 },
      );
    }

    const typedEventType = eventType as EventType;

    const worldItem: WorldItemDoc = {
      userId,
      imageUrl: eventImages[typedEventType],
      description: eventDescriptions[typedEventType],
      position: {
        x: Number((Math.random() * 100).toFixed(2)),
        y: Number((Math.random() * 100).toFixed(2)),
      },
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(worldItemsCollection, worldItem);

    return NextResponse.json({
      success: true,
      message: "World item generated!",
      id: docRef.id,
      worldItem,
    });
  } catch (error) {
    console.error("generateWorldItem error", error);
    return NextResponse.json(
      { error: "Failed to generate world item." },
      { status: 500 },
    );
  }
}
