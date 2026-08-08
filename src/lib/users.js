import { db } from "./firebase.js";
import {
  doc, setDoc, collection,
  query, where, onSnapshot, serverTimestamp,
} from "firebase/firestore";

export async function updateUserPhoto(uid, photoURL) {
  await setDoc(
    doc(db, "users", uid),
    { photoURL },
    { merge: true }
  );
}

export async function updateUserLocation(uid, lat, lng) {
  await setDoc(
    doc(db, "users", uid),
    { location: { lat, lng }, lastSeen: serverTimestamp() },
    { merge: true }
  );
}

export function subscribeToUsers(currentUid, callback) {
  const q = query(
    collection(db, "users"),
    where("uid", "!=", currentUid)
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data())),
    (err) => {
      console.warn("[ZoneTalk] Users subscription error:", err);
      callback([]);
    }
  );
}

// Haversine formula — returns distance in km
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
