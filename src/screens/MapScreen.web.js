import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useApp } from "../AppContext.js";

export default function MapScreen({ navigation }) {
  const { tokens, myLocation, nearbyUsers } = useApp();

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <View style={[styles.headerRow, { backgroundColor: tokens.panel, borderBottomColor: tokens.border }]}>
        <Text style={{ color: tokens.text, fontWeight: "600", fontSize: 15 }}>
          Zone Map
          {nearbyUsers.length > 0 && (
            <Text style={{ color: tokens.mint, fontWeight: "400", fontSize: 12 }}>
              {"  "}
              {nearbyUsers.length} user{nearbyUsers.length !== 1 ? "s" : ""} nearby
            </Text>
          )}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: tokens.muted, fontSize: 13 }}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.icon, { color: tokens.mint }]}>📍</Text>
        <Text style={[styles.title, { color: tokens.text }]}>Map view is mobile-only</Text>
        <Text style={[styles.copy, { color: tokens.muted }]}>Open the app on Android or iOS to use the native interactive map.</Text>
        {myLocation ? (
          <Text style={[styles.copy, { color: tokens.text }]}>Current location: {myLocation.lat.toFixed(4)}, {myLocation.lng.toFixed(4)}</Text>
        ) : (
          <Text style={[styles.copy, { color: tokens.muted }]}>Location data is not available yet.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  icon: {
    fontSize: 36,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  copy: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 8,
  },
});