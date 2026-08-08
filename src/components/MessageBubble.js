import React, { useState, useRef } from "react";
import { View, Text, Image, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import { hoursLeft, fmtClock, timeAgo } from "../lib/storage.js";

function fileIcon(type = "") {
  if (type.startsWith("video/")) return "🎬";
  if (type.startsWith("audio/")) return "🎵";
  if (type.includes("pdf")) return "📄";
  if (type.includes("zip") || type.includes("archive") || type.includes("compressed")) return "🗜️";
  if (type.startsWith("text/")) return "📝";
  if (type.includes("word") || type.includes("document")) return "📃";
  if (type.includes("sheet") || type.includes("excel")) return "📊";
  return "📎";
}

function fmtBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function VoiceNote({ uri, mine, tokens }) {
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef(null);

  async function toggle() {
    if (playing) {
      await soundRef.current?.stopAsync();
      setPlaying(false);
      return;
    }
    try {
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlaying(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlaying(false);
          sound.unloadAsync();
        }
      });
    } catch {
      setPlaying(false);
    }
  }

  return (
    <TouchableOpacity onPress={toggle} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Text style={{ color: mine ? tokens.tone : tokens.text }}>{playing ? "⏸ Playing…" : "▶️ Voice note"}</Text>
    </TouchableOpacity>
  );
}

export default function MessageBubble({ msg, conv, onSpeak, tokens }) {
  const mine = msg.senderId === "me";
  const displayName = mine ? null : msg.senderName || conv.name;
  const left = hoursLeft(msg.time);

  return (
    <View style={{ flexDirection: "row", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 4 }}>
      <View style={{ maxWidth: "80%" }}>
        {!mine && (conv.type === "group" || conv.type === "zone") && (
          <Text style={{ color: tokens.muted, fontSize: 11, marginBottom: 2, marginLeft: 4 }}>{displayName}</Text>
        )}

        <View
          style={[
            styles.bubble,
            {
              backgroundColor: mine ? tokens.mint : tokens.panelAlt,
              borderWidth: mine ? 0 : 1,
              borderColor: tokens.border,
            },
          ]}
        >
          {msg.imageData ? (
            <Image source={{ uri: msg.imageData }} style={{ width: 200, height: 200, borderRadius: 10 }} resizeMode="cover" />
          ) : msg.fileData ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(msg.fileData).catch(() => {})}
              style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(0,0,0,0.12)", borderRadius: 10, padding: 10, minWidth: 180 }}
            >
              <Text style={{ fontSize: 22 }}>{fileIcon(msg.fileType)}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "600", color: mine ? tokens.tone : tokens.text }}>
                  {msg.fileName}
                </Text>
                <Text style={{ fontSize: 10, opacity: 0.7, color: mine ? tokens.tone : tokens.text }}>{fmtBytes(msg.fileSize)}</Text>
              </View>
              <Text style={{ opacity: 0.7, fontSize: 14, color: mine ? tokens.tone : tokens.text }}>⬇</Text>
            </TouchableOpacity>
          ) : msg.audioData ? (
            <VoiceNote uri={msg.audioData} mine={mine} tokens={tokens} />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
              <Text style={{ color: mine ? tokens.tone : tokens.text, fontSize: 14, flexShrink: 1 }}>{msg.text}</Text>
              <TouchableOpacity onPress={() => onSpeak(msg.text)}>
                <Text style={{ fontSize: 12, opacity: 0.7 }}>🔊</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 3, marginHorizontal: 4, justifyContent: mine ? "flex-end" : "flex-start" }}>
          <Text style={{ color: tokens.muted, fontSize: 10 }}>{fmtClock(msg.time)}</Text>
          <Text style={{ color: tokens.muted, fontSize: 10 }}>· {timeAgo(msg.time)}</Text>
          {left < 2 && <Text style={{ color: tokens.coral, fontSize: 10 }}>· deletes in {Math.round(left * 60)}m</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
});
