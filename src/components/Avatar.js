import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { initials } from "../lib/storage.js";

export default function Avatar({ name, color, small, photoURL, onPress, tokens }) {
  const s = small ? 36 : 40;
  const Wrapper = onPress ? TouchableOpacity : View;

  if (photoURL) {
    return (
      <Wrapper onPress={onPress} style={[styles.base, { width: s, height: s, borderRadius: s / 2 }]}>
        <Image source={{ uri: photoURL }} style={{ width: s, height: s, borderRadius: s / 2 }} />
      </Wrapper>
    );
  }

  return (
    <Wrapper
      onPress={onPress}
      style={[
        styles.base,
        {
          width: s,
          height: s,
          borderRadius: s / 2,
          backgroundColor: color || tokens.mint,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Text style={{ color: "#0B1220", fontWeight: "700", fontSize: 12 }}>{initials(name || "?")}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  base: { overflow: "hidden", flexShrink: 0 },
});
