/* ============================================================
   ZoneTalk data layer (Expo / React Native)
   - AsyncStorage => persistent "database": messages, groups
   - Optional Firebase cloud sync (see ./firebase.js), off by default
   ============================================================ */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENABLED as CLOUD_ENABLED, syncMessagesToCloud, fetchMessagesFromCloud } from "./firebase.js";

export const DAY_MS = 24 * 60 * 60 * 1000;

const MSG_PREFIX = "zonetalk_msgs_";
const GROUPS_KEY = "zonetalk_groups";

/* ---------------- messages (AsyncStorage "database") ---------------- */
export async function loadMessages(convId) {
  try {
    const raw = await AsyncStorage.getItem(MSG_PREFIX + convId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveMessages(convId, msgs) {
  try {
    await AsyncStorage.setItem(MSG_PREFIX + convId, JSON.stringify(msgs));
  } catch {
    /* storage full/blocked — app still works in-memory for this session */
  }
  if (CLOUD_ENABLED) {
    syncMessagesToCloud(convId, msgs).catch(() => {});
  }
}

export async function loadMessagesPreferCloud(convId) {
  if (CLOUD_ENABLED) {
    const cloud = await fetchMessagesFromCloud(convId);
    if (cloud) return purgeExpired(cloud);
  }
  return purgeExpired(await loadMessages(convId));
}

export function purgeExpired(msgs) {
  const now = Date.now();
  return msgs.filter((m) => now - m.time < DAY_MS);
}

export async function seedIfEmpty(convId, seedFn) {
  const existing = await loadMessages(convId);
  if (existing.length === 0) {
    const seeded = purgeExpired(seedFn());
    await saveMessages(convId, seeded);
    return seeded;
  }
  return purgeExpired(existing);
}

/* ---------------- groups (AsyncStorage "database") ---------------- */
export async function loadGroups(defaultGroups) {
  try {
    const raw = await AsyncStorage.getItem(GROUPS_KEY);
    if (!raw) return defaultGroups;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultGroups;
  } catch {
    return defaultGroups;
  }
}

export async function saveGroups(groups) {
  try {
    await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  } catch {
    /* storage unavailable — groups still work for this session */
  }
}

/* ---------------- small formatting helpers ---------------- */
export function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return "expiring";
}

export function hoursLeft(ts) {
  const remain = DAY_MS - (Date.now() - ts);
  return Math.max(0, remain / (60 * 60 * 1000));
}

export function fmtClock(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function initials(name) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function cryptoId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
