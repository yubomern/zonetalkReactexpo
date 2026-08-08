import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

async function upsertUserDoc(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName || user.email.split("@")[0],
      email: user.email,
      photoURL: user.photoURL || null,
      location: null,
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, { lastSeen: serverTimestamp() }, { merge: true });
  }
}

export async function signUp(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await upsertUserDoc({ ...cred.user, displayName });
  return cred.user;
}

export async function signIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await upsertUserDoc(cred.user);
  return cred.user;
}

// Google sign-in via popup is web-only. On native this needs
// expo-auth-session + a native Google client id — wired up separately.
export async function signInWithGoogle() {
  const err = new Error("Google sign-in isn't set up for this mobile build yet — use email instead.");
  err.code = "auth/operation-not-supported-in-this-environment";
  throw err;
}

export async function signOut() {
  await fbSignOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
