import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet } from "react-native";
import { initials } from "../lib/storage.js";
import ConvRow from "./ConvRow.js";

const SIZE = 220;
const CENTER = SIZE / 2;
const MAX_R = CENTER - 20;

export default function ZonePanel({ people, activeId, onSelect, onRefresh, onMap, myLocation, gpsError, isReal, tokens }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const maxDist = isReal ? Math.max(...people.map((p) => p.distanceKm ?? 0), 0.001) : 2;

  return (
    <View style={{ alignItems: "center", paddingHorizontal: 8 }}>
      <View style={{ width: "100%", marginBottom: 8 }}>
        {isReal ? (
          <Text style={[styles.badge, { color: tokens.mint, backgroundColor: "rgba(51,214,166,0.12)" }]}>
            📡 Live · {people.length} real user{people.length !== 1 ? "s" : ""} nearby
          </Text>
        ) : gpsError ? (
          <Text style={[styles.badge, { color: tokens.coral, backgroundColor: "rgba(255,122,89,0.08)" }]}>
            📍 Location denied · Showing simulated zone
          </Text>
        ) : (
          <Text style={[styles.badge, { color: tokens.muted, backgroundColor: "transparent" }]}>
            {myLocation ? "📍 GPS active · Waiting for nearby users..." : "⏳ Requesting location..."}
          </Text>
        )}
      </View>

      <View style={{ width: SIZE, height: SIZE }}>
        {[0.33, 0.66, 1].map((f, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: CENTER - MAX_R * f,
              top: CENTER - MAX_R * f,
              width: MAX_R * f * 2,
              height: MAX_R * f * 2,
              borderRadius: MAX_R * f,
              borderWidth: 1,
              borderColor: tokens.border,
            }}
          />
        ))}
        <View
          style={{
            position: "absolute",
            left: CENTER - 4,
            top: CENTER - 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: tokens.mint,
          }}
        />
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: CENTER - MAX_R,
            top: CENTER - MAX_R,
            width: MAX_R * 2,
            height: MAX_R * 2,
            borderRadius: MAX_R,
            borderWidth: 2,
            borderColor: "transparent",
            borderTopColor: tokens.lavender,
            opacity: 0.6,
            transform: [{ rotate }],
          }}
        />

        {people.map((p) => {
          const dist = isReal ? p.distanceKm ?? 0 : parseFloat(p.distance) || 1;
          const r = Math.min((dist / maxDist) * (MAX_R - 6) + 6, MAX_R - 4);
          const x = CENTER + r * Math.cos(p.angle) - 9;
          const y = CENTER + r * Math.sin(p.angle) - 9;
          const label = isReal ? p.distance : `${typeof p.distance === "number" ? p.distance.toFixed(1) : p.distance} km`;
          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => onSelect(p)}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: p.color,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: activeId === p.id ? 2 : 0,
                borderColor: tokens.text,
              }}
            >
              <Text style={{ fontSize: 8, fontWeight: "700", color: "#0B1220" }}>{initials(p.name)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={{ color: tokens.muted, fontSize: 11, marginTop: 8, textAlign: "center" }}>
        {isReal ? "Real GPS · sorted closest first" : "Simulated proximity · same Wi-Fi"}
      </Text>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 12, marginBottom: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {!isReal && (
          <TouchableOpacity onPress={onRefresh} style={[styles.pill, { borderColor: tokens.border }]}>
            <Text style={{ color: tokens.text, fontSize: 12 }}>↻ Rescan</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onMap} style={[styles.pill, { borderColor: tokens.border }]}>
          <Text style={{ color: tokens.mint, fontSize: 12 }}>🗺️ Map</Text>
        </TouchableOpacity>
      </View>

      <View style={{ width: "100%", marginTop: 4 }}>
        {people.map((p) => (
          <ConvRow key={p.id} conv={p} active={activeId === p.id} onPress={() => onSelect(p)} tokens={tokens} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { fontSize: 11, textAlign: "center", borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6 },
});
