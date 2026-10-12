import { openDB, DBSchema, IDBPDatabase } from "idb";
import { RoadFeature, ImportSummary } from "@/types/road";

export interface ProjectMetadata {
  name: string;
  lastSavedAt: number;
  version: number;
}

export interface SavedProjectSession {
  features: RoadFeature[];
  selectedFeatureIds: string[];
  importSummary: ImportSummary | null;
  metadata: ProjectMetadata;
}

interface RoadStudioDB extends DBSchema {
  sessions: {
    key: string;
    value: SavedProjectSession;
  };
}

const DB_NAME = "road-studio-storage";
const DB_VERSION = 1;
const SESSION_KEY = "current-session";

function isIndexedDbAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

let dbPromise: Promise<IDBPDatabase<RoadStudioDB>> | null = null;

function getDb(): Promise<IDBPDatabase<RoadStudioDB>> | null {
  if (!isIndexedDbAvailable()) return null;
  if (!dbPromise) {
    dbPromise = openDB<RoadStudioDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("sessions")) {
          db.createObjectStore("sessions");
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Saves current editing project session to IndexedDB.
 */
export async function saveProjectSession(
  features: RoadFeature[],
  selectedFeatureIds: Set<string>,
  importSummary: ImportSummary | null,
  projectName = "Untitled Project"
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    const session: SavedProjectSession = {
      features,
      selectedFeatureIds: Array.from(selectedFeatureIds),
      importSummary,
      metadata: {
        name: projectName,
        lastSavedAt: Date.now(),
        version: 1,
      },
    };

    const database = await db;
    await database.put("sessions", session, SESSION_KEY);
    return true;
  } catch (err) {
    console.warn("Failed to persist project session to IndexedDB:", err);
    return false;
  }
}

/**
 * Loads saved project session from IndexedDB.
 */
export async function loadProjectSession(): Promise<SavedProjectSession | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const database = await db;
    const session = await database.get("sessions", SESSION_KEY);
    return session || null;
  } catch (err) {
    console.warn("Failed to load project session from IndexedDB:", err);
    return null;
  }
}

/**
 * Clears current project session from IndexedDB.
 */
export async function clearProjectSession(): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    const database = await db;
    await database.delete("sessions", SESSION_KEY);
    return true;
  } catch (err) {
    console.warn("Failed to clear project session from IndexedDB:", err);
    return false;
  }
}
