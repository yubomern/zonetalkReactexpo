import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { initializeAuth, getAuth } from "firebase/auth";
// eslint-disable-next-line import/no-unresolved
import { getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyC42DSeRa7WODnGRb0CPXIg-DhrOoUSCwk",
  authDomain: "zonechatt-b0e00.firebaseapp.com",
  projectId: "zonechatt-b0e00",
  storageBucket: "zonechatt-b0e00.firebasestorage.app",
  messagingSenderId: "106626543683",
  appId: "1:106626543683:web:c7fbd11110ae8d2a4164f6",
  measurementId: "G-37DS7Q8EZS",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// initializeAuth must only be called once; on Fast Refresh reuse getAuth().
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  authInstance = getAuth(app);
}
export const auth = authInstance;

export const ENABLED = true;

// ── kept for storage.js compatibility ─────────────────────────────────
export async function syncMessagesToCloud(convId, messages) {
  try {
    await setDoc(doc(db, "conversations", convId), {
      messages,
      updatedAt: Date.now(),
    });
    return true;
  } catch (err) {
    console.warn("[ZoneTalk] Cloud sync failed.", err);
    return false;
  }
}

export async function fetchMessagesFromCloud(convId) {
  try {
    const snap = await getDoc(doc(db, "conversations", convId));
    return snap.exists() ? snap.data().messages || null : null;
  } catch {
    return null;
  }
}
