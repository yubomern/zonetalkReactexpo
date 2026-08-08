import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView,
  Platform, StyleSheet, Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { useApp } from "../AppContext.js";
import Avatar from "../components/Avatar.js";
import MessageBubble from "../components/MessageBubble.js";
import { seedIfEmpty, saveMessages, purgeExpired, cryptoId } from "../lib/storage.js";
import { EMOJIS } from "../theme.js";

const MAX_FILE_MB = 5;

export default function ChatScreen({ route, navigation }) {
  const { conv } = route.params;
  const { tokens } = useApp();

  const [messages, setMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [micError, setMicError] = useState("");
  const [recording, setRecording] = useState(false);

  const listRef = useRef(null);
  const replyTimerRef = useRef(null);
  const recordingRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let seeded;
      if (conv.type === "zone") {
        seeded = await seedIfEmpty(conv.id, () => []);
      } else if (conv.type === "group") {
        seeded = await seedIfEmpty(conv.id, () => {
          if (!conv.members || conv.members.length <= 1) return [];
          const other = conv.members.find((m) => m !== "You") || "Someone";
          return [
            {
              id: cryptoId(),
              senderId: other.toLowerCase(),
              senderName: other,
              text: "Welcome to " + conv.name + " 👋",
              time: Date.now() - 40 * 60000,
            },
          ];
        });
      } else {
        seeded = await seedIfEmpty(conv.id, () => [
          { id: cryptoId(), senderId: conv.id, text: "Hey there 👋", time: Date.now() - 30 * 60000 },
        ]);
      }
      if (!cancelled) {
        setMessages(seeded);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(replyTimerRef.current);
    };
  }, [conv.id]);

  useEffect(() => {
    const t = setInterval(() => {
      setMessages((prev) => {
        const fresh = purgeExpired(prev);
        if (fresh.length !== prev.length) saveMessages(conv.id, fresh);
        return fresh;
      });
    }, 30000);
    return () => clearInterval(t);
  }, [conv.id]);

  const pushMessage = useCallback(
    (msg) => {
      setMessages((prev) => {
        const next = purgeExpired([...prev, msg]);
        saveMessages(conv.id, next);
        return next;
      });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    },
    [conv.id]
  );

  function maybeAutoReply() {
    clearTimeout(replyTimerRef.current);
    replyTimerRef.current = setTimeout(() => {
      const replies = ["Sounds good 👍", "Haha true 😂", "On it!", "Let me check...", "😍 nice", "Be there soon", "👌", "Same here honestly"];
      const text = replies[Math.floor(Math.random() * replies.length)];
      let senderId = conv.id;
      let senderName;
      if (conv.type === "group") {
        const pool = (conv.members || []).filter((m) => m !== "You");
        if (pool.length === 0) return;
        senderName = pool[Math.floor(Math.random() * pool.length)];
        senderId = senderName.toLowerCase();
      } else if (conv.type === "zone") {
        senderName = conv.name;
      }
      setMessages((prev) => {
        const next = purgeExpired([...prev, { id: cryptoId(), senderId, senderName, text, time: Date.now() }]);
        saveMessages(conv.id, next);
        return next;
      });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }, 1200 + Math.random() * 1500);
  }

  function sendText() {
    const text = input.trim();
    if (!text) return;
    pushMessage({ id: cryptoId(), senderId: "me", text, time: Date.now() });
    setInput("");
    setShowEmoji(false);
    maybeAutoReply();
  }

  function addEmoji(e) {
    setInput((prev) => prev + e);
  }

  function speak(text) {
    Speech.stop();
    Speech.speak(text, { rate: 1.0 });
  }

  async function toggleRecording() {
    setMicError("");
    if (recording) {
      try {
        await recordingRef.current?.stopAndUnloadAsync();
        const uri = recordingRef.current?.getURI();
        setRecording(false);
        if (uri) {
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          pushMessage({ id: cryptoId(), senderId: "me", audioData: `data:audio/m4a;base64,${base64}`, time: Date.now() });
          maybeAutoReply();
        }
      } catch (err) {
        setMicError("Couldn't save the voice note.");
        setRecording(false);
      }
      return;
    }
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setMicError("Microphone access was blocked - voice notes need mic permission.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = rec;
      setRecording(true);
    } catch {
      setMicError("Microphone access was blocked or is unavailable - voice notes need mic permission.");
    }
  }

  async function handleAttach() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      if (file.size && file.size > MAX_FILE_MB * 1024 * 1024) {
        setMicError(`File too large - max ${MAX_FILE_MB} MB allowed.`);
        return;
      }
      const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
      const mime = file.mimeType || "application/octet-stream";
      const dataUri = `data:${mime};base64,${base64}`;
      const isImage = mime.startsWith("image/");
      pushMessage({
        id: cryptoId(),
        senderId: "me",
        ...(isImage
          ? { imageData: dataUri }
          : { fileData: dataUri, fileName: file.name, fileSize: file.size || 0, fileType: mime }),
        time: Date.now(),
      });
      maybeAutoReply();
    } catch (err) {
      Alert.alert("Attachment failed", "Couldn't attach that file.");
    }
  }

  const subtitle =
    conv.type === "group"
      ? conv.members.join(", ")
      : conv.type === "zone"
      ? `📍 ${conv.distance ?? "~"} away · Zone chat`
      : "Direct message";

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: tokens.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { borderBottomColor: tokens.border, backgroundColor: tokens.panelAlt }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { borderColor: tokens.border }]}>
          <Text style={{ color: tokens.muted }}>←</Text>
        </TouchableOpacity>
        <Avatar name={conv.name} color={conv.color || tokens.mint} photoURL={conv.photoURL} tokens={tokens} />
        <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
          <Text numberOfLines={1} style={{ color: tokens.text, fontWeight: "600" }}>{conv.name}</Text>
          <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12 }}>{subtitle}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("Map")}
          style={[styles.mapBtn, { borderColor: tokens.border }]}
        >
          <Text style={{ color: tokens.mint, fontSize: 12 }}>🗺️ Map</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          loaded ? (
            <Text style={{ color: tokens.muted, fontSize: 13, textAlign: "center", marginTop: 40 }}>
              No messages yet - say hi 👋 (messages vanish 24h after they are sent)
            </Text>
          ) : null
        }
        renderItem={({ item }) => <MessageBubble msg={item} conv={conv} onSpeak={speak} tokens={tokens} />}
      />

      {!!micError && (
        <View style={[styles.errorBar, { backgroundColor: "#2A1A17" }]}>
          <Text style={{ color: tokens.coral, fontSize: 12 }}>{micError}</Text>
        </View>
      )}

      {showEmoji && (
        <View style={[styles.emojiPanel, { backgroundColor: tokens.panel, borderColor: tokens.border }]}>
          <FlatList
            data={EMOJIS}
            keyExtractor={(e) => e}
            numColumns={8}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => addEmoji(item)} style={{ padding: 6 }}>
                <Text style={{ fontSize: 20 }}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <View style={[styles.inputBar, { borderTopColor: tokens.border, backgroundColor: tokens.panelAlt }]}>
        <TouchableOpacity onPress={handleAttach} style={styles.iconBtn}>
          <Text style={{ fontSize: 20, color: tokens.muted }}>📎</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowEmoji((s) => !s)} style={styles.iconBtn}>
          <Text style={{ fontSize: 22 }}>🙂</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleRecording}
          style={[styles.micBtn, { backgroundColor: recording ? tokens.coral : "transparent" }]}
        >
          <Text style={{ fontSize: 16, color: recording ? "#fff" : tokens.muted }}>{recording ? "⏹" : "🎙️"}</Text>
        </TouchableOpacity>
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendText}
          placeholder={recording ? "Recording voice note..." : "Type a message"}
          placeholderTextColor={tokens.muted}
          editable={!recording}
          style={[styles.textInput, { backgroundColor: tokens.panel, borderColor: tokens.border, color: tokens.text }]}
        />
        <TouchableOpacity onPress={sendText} style={[styles.sendBtn, { backgroundColor: tokens.mint }]}>
          <Text style={{ color: tokens.tone, fontSize: 14, fontWeight: "600" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, gap: 8 },
  backBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  mapBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  errorBar: { paddingHorizontal: 16, paddingVertical: 8 },
  emojiPanel: { borderWidth: 1, borderRadius: 12, margin: 8, padding: 6, maxHeight: 180 },
  inputBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1, gap: 6 },
  iconBtn: { padding: 6 },
  micBtn: { padding: 8, borderRadius: 999 },
  textInput: { flex: 1, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  sendBtn: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
});
