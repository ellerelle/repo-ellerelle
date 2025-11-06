import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Timestamp } from "firebase-admin/firestore";

import { getAdminDb, getAdminStorage } from "@/lib/firebase-admin";
import { getNewPosition, type WorldPosition } from "@/lib/world";

export const runtime = "nodejs";

type HabitType = "exercise" | "learning" | "sleep";

type GenerateWorldItemRequest = {
  userId?: string;
  habitType?: string;
  eventType?: string;
};

type GenerateWorldItemResponse = {
  success: true;
  message: string;
  worldItem: {
    id: string;
    userId: string;
    description: string;
    imageUrl: string;
    position: { x: number; y: number };
    createdAt: string;
    habitType: HabitType;
  };
};

const HABIT_TYPES: HabitType[] = ["exercise", "learning", "sleep"];

const HABIT_TONE: Record<HabitType, string> = {
  exercise:
    "Create a dynamic artifact that represents physical vitality and progress after consistent exercise.",
  learning:
    "Create a brilliant artifact that symbolizes intellectual curiosity and a recent learning breakthrough.",
  sleep:
    "Create a serene artifact that embodies deep rest, calm, and rejuvenating sleep.",
};

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY environment variable is not configured.");
}

const openai = new OpenAI({
  apiKey,
});

const styleSuffix =
  "Style: whimsical, isometric, softly glowing, cinematic lighting, high detail, cohesive color palette.";

function buildPrompt(habit: HabitType) {
  return `You are an imaginative world builder. ${
    HABIT_TONE[habit]
  } Respond with one concise imperative prompt (max 25 words) describing the artifact to generate. Avoid mentioning humans. Example: "Generate a small magical tree with glowing leaves."`;
}

export async function POST(request: Request) {
  try {
    const { userId, habitType, eventType } = (await request.json()) as GenerateWorldItemRequest;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Missing or invalid userId." }, { status: 400 });
    }

    const habit = (habitType ?? eventType) as HabitType | undefined;

    if (!habit || !HABIT_TYPES.includes(habit)) {
      return NextResponse.json({ error: "Invalid habit type." }, { status: 400 });
    }

    const promptResponse = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: buildPrompt(habit),
    });

    const description = promptResponse.output_text?.trim();

    if (!description) {
      return NextResponse.json(
        { error: "Failed to generate world prompt." },
        { status: 500 },
      );
    }

    const imageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `${description} ${styleSuffix}`,
      size: "512x512",
      response_format: "b64_json",
    });

    const imageData = imageResponse.data?.[0]?.b64_json;

    if (!imageData) {
      return NextResponse.json({ error: "Failed to generate image." }, { status: 500 });
    }

    const buffer = Buffer.from(imageData, "base64");
    const filePath = `world-images/${userId}/${Date.now()}-${habit}.png`;
    const storage = getAdminStorage();
    const file = storage.bucket().file(filePath);

    await file.save(buffer, {
      contentType: "image/png",
      metadata: {
        cacheControl: "public,max-age=31536000,immutable",
      },
    });

    const [imageUrl] = await file.getSignedUrl({
      action: "read",
      expires: "2100-01-01T00:00:00Z",
    });

    const createdAt = Timestamp.now();

    const db = getAdminDb();
    const lastSnapshot = await db
      .collection("worldItems")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    const lastPosition = lastSnapshot.empty
      ? undefined
      : ((lastSnapshot.docs[0].data().position ?? null) as WorldPosition | null);

    const position = getNewPosition(lastPosition);

    const docRef = await db.collection("worldItems").add({
      userId,
      description,
      imageUrl,
      position,
      createdAt,
      habitType: habit,
    });

    const responsePayload: GenerateWorldItemResponse = {
      success: true,
      message: "World item generated!",
      worldItem: {
        id: docRef.id,
        userId,
        description,
        imageUrl,
        position,
        createdAt: createdAt.toDate().toISOString(),
        habitType: habit,
      },
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("generateWorldItem error", error);
    return NextResponse.json(
      { error: "Failed to generate world item." },
      { status: 500 },
    );
  }
}
