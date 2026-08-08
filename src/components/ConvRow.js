import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import Avatar from "./Avatar.js";

export default function ConvRow({ conv, active, onPress, tokens }) {
  let subtitle = "Direct message";
  if (conv.type === "group") subtitle = `Group · ${conv.members?.length ?? 0} members`;
  else if (conv.type === "zone") {
    const d = typeof conv.distance === "number" ? conv.distance.toFixed(1) + " km" : conv.distance ?? "?";
    subtitle = `📍 ${d} away`;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.row, { backgroundColor: active ? tokens.panelAlt : "transparent" }]}
      activeOpacity={0.7}
    >
      <Avatar name={conv.name} color={conv.color} small photoURL={conv.photoURL} tokens={tokens} />
      <View style={{ marginLeft: 10, flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 14, fontWeight: "500" }}>
          {conv.name}
        </Text>
        <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
});
