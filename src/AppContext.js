import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { THEMES, GROUP_COLORS, DM_CONTACTS, DEFAULT_GROUPS, generateZonePeople } from "./theme.js";
import { loadGroups, saveGroups, cryptoId } from "./lib/storage.js";
import { onAuthChange, signOut as fbSignOut } from "./lib/auth.js";
import { updateUserPhoto, updateUserLocation, subscribeToUsers, haversineKm } from "./lib/users.js";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const tokens = THEMES[theme];

  useEffect(() => {
    AsyncStorage.getItem("zonetalk-theme").then((saved) => {
      if (saved === "light" || saved === "dark") setTheme(saved);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      AsyncStorage.setItem("zonetalk-theme", next).catch(() => {});
      return next;
    });
  }, []);

  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    return onAuthChange((user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
  }, []);

  const [myLocation, setMyLocation] = useState(null);
  const [gpsError, setGpsError] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    let sub;
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (!cancelled) setGpsError(true);
        return;
      }
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 15000, distanceInterval: 20 },
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setMyLocation({ lat, lng });
          setGpsError(false);
          updateUserLocation(currentUser.uid, lat, lng).catch(() => {});
        }
      );
    })().catch(() => setGpsError(true));
    return () => {
      cancelled = true;
      if (sub) sub.remove();
    };
  }, [currentUser?.uid]);

  const [firestoreUsers, setFirestoreUsers] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToUsers(currentUser.uid, setFirestoreUsers);
    return unsub;
  }, [currentUser?.uid]);

  const nearbyUsers = useMemo(() => {
    return firestoreUsers
      .map((u, i) => {
        const distKm =
          myLocation && u.location
            ? haversineKm(myLocation.lat, myLocation.lng, u.location.lat, u.location.lng)
            : null;
        return {
          id: u.uid,
          uid: u.uid,
          name: u.displayName || u.email?.split("@")[0] || "User",
          type: "zone",
          color: GROUP_COLORS[i % GROUP_COLORS.length],
          distanceKm: distKm,
          distance:
            distKm !== null ? (distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`) : "?",
          angle:
            u.location && myLocation
              ? Math.atan2(u.location.lng - myLocation.lng, u.location.lat - myLocation.lat)
              : Math.random() * 2 * Math.PI,
          location: u.location,
          email: u.email,
          photoURL: u.photoURL || null,
        };
      })
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [firestoreUsers, myLocation]);

  const dynamicDmContacts = useMemo(() => {
    if (!currentUser) return [];
    return firestoreUsers.map((u, i) => {
      const [a, b] = [currentUser.uid, u.uid].sort();
      return {
        id: `dm_${a}_${b}`,
        name: u.displayName || u.email?.split("@")[0] || "User",
        type: "dm",
        color: GROUP_COLORS[i % GROUP_COLORS.length],
        uid: u.uid,
        photoURL: u.photoURL || null,
      };
    });
  }, [firestoreUsers, currentUser?.uid]);

  const [zonePeople, setZonePeople] = useState(() => generateZonePeople(4));
  const [zoneJoined, setZoneJoined] = useState({});

  useEffect(() => {
    const t = setInterval(() => {
      setZonePeople((prev) => {
        const count = 3 + Math.floor(Math.random() * 3);
        const next = generateZonePeople(count);
        const keep = prev.filter((p) => zoneJoined[p.id]);
        const merged = [...keep];
        next.forEach((p) => {
          if (!merged.find((m) => m.id === p.id) && merged.length < 6) merged.push(p);
        });
        return merged;
      });
    }, 9000);
    return () => clearInterval(t);
  }, [zoneJoined]);

  const markZoneJoined = useCallback((id) => {
    setZoneJoined((prev) => ({ ...prev, [id]: true }));
  }, []);

  const effectiveZonePeople = nearbyUsers.length > 0 ? nearbyUsers : zonePeople;

  const [groups, setGroups] = useState(DEFAULT_GROUPS);
  useEffect(() => {
    loadGroups(DEFAULT_GROUPS).then(setGroups);
  }, []);

  const createGroup = useCallback(
    async (name, members) => {
      const group = {
        id: "grp-" + cryptoId(),
        name,
        type: "group",
        color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
        members: [...members, "You"],
      };
      const next = [...groups, group];
      setGroups(next);
      await saveGroups(next);
      return group;
    },
    [groups]
  );

  const [myPhoto, setMyPhoto] = useState(null);
  useEffect(() => {
    if (currentUser?.photoURL) setMyPhoto(currentUser.photoURL);
  }, [currentUser?.photoURL]);

  const updateMyPhoto = useCallback(
    async (dataUri) => {
      if (!currentUser) return;
      setMyPhoto(dataUri);
      await updateUserPhoto(currentUser.uid, dataUri);
      const { updateProfile } = await import("firebase/auth");
      await updateProfile(currentUser, { photoURL: dataUri });
    },
    [currentUser]
  );

  const signOutUser = useCallback(() => fbSignOut(), []);

  const dmAndGroups = useMemo(
    () => [...(dynamicDmContacts.length > 0 ? dynamicDmContacts : DM_CONTACTS), ...groups],
    [dynamicDmContacts, groups]
  );

  const value = {
    theme,
    tokens,
    toggleTheme,
    currentUser,
    authReady,
    myLocation,
    gpsError,
    nearbyUsers,
    isRealUsers: nearbyUsers.length > 0,
    effectiveZonePeople,
    markZoneJoined,
    refreshZone: () => setZonePeople(generateZonePeople(3 + Math.floor(Math.random() * 3))),
    groups,
    createGroup,
    dmAndGroups,
    dynamicDmContacts,
    myPhoto,
    updateMyPhoto,
    signOutUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
