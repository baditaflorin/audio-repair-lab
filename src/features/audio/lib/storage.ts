import { openDB } from "idb";
import { z } from "zod";
import { defaultSettings } from "./defaults";
import type { StoredSession } from "../types";

const sessionSchema = z.object({
  id: z.string(),
  schema: z.literal("audio-repair-session/v1"),
  fileName: z.string(),
  durationSeconds: z.number().nonnegative(),
  sampleRate: z.number().int().positive(),
  updatedAt: z.string(),
  settings: z.object({
    mode: z.enum(["noise", "vocal", "repair", "chain"]),
    noiseReduction: z.number().min(0).max(1),
    noiseSensitivity: z.number().min(0).max(1),
    vocalStrength: z.number().min(0).max(1),
    vocalTarget: z.enum(["vocals", "instrumental"]),
    repairStrength: z.number().min(0).max(1),
    removeClicks: z.boolean(),
    softenClipping: z.boolean(),
    removeHum: z.boolean().default(false),
    humFrequency: z.enum(["auto", "50", "60"]).default("auto")
  })
});

const dbPromise = openDB("audio-repair-lab", 1, {
  upgrade(db) {
    db.createObjectStore("sessions", { keyPath: "id" });
  }
});

export async function saveSession(session: StoredSession): Promise<void> {
  const parsed = sessionSchema.parse(session);
  const db = await dbPromise;
  await db.put("sessions", parsed);
}

export async function getRecentSessions(): Promise<StoredSession[]> {
  const db = await dbPromise;
  const records = await db.getAll("sessions");
  return records
    .map((record) => sessionSchema.safeParse(record))
    .filter((result) => result.success)
    .map((result) => result.data)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);
}

export function createSession(
  record: Omit<StoredSession, "id" | "schema" | "updatedAt">
): StoredSession {
  return {
    ...record,
    id: crypto.randomUUID(),
    schema: "audio-repair-session/v1",
    updatedAt: new Date().toISOString(),
    settings: {
      ...defaultSettings,
      ...record.settings
    }
  };
}
