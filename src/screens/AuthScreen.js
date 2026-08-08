import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Alert,
} from "react-native";
import { signIn, signUp, signInWithGoogle } from "../lib/auth.js";
import { useApp } from "../AppContext.js";

function friendlyError(code) {
  const msgs = {
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/email-already-in-use": "Email already in use.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "Invalid email address.",
    "auth/network-request-failed": "Network error. Try again.",
  };
  return msgs[code] || `Something went wrong (${code || "unknown"}).`;
}

export default function AuthScreen() {
  const { theme, tokens: T, toggleTheme } = useApp();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!email || !password) {
      setError("Fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
      } else {
        if (!name.trim()) {
          setError("Enter your name.");
          setLoading(false);
          return;
        }
        await signUp(email.trim(), password, name.trim());
      }
    } catch (err) {
      setError(friendlyError(err.code));
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      await signInWithGoogle();
    } catch (err) {
      Alert.alert("Google sign-in", err.message);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: T.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.themeBtn, { borderColor: T.border }]}
        >
          <Text style={{ color: T.muted, fontSize: 12 }}>{theme === "dark" ? "☀️ Light" : "🌙 Dark"}</Text>
        </TouchableOpacity>

        <View style={styles.brandRow}>
          <View style={[styles.brandMark, { backgroundColor: T.mint }]}>
            <Text style={{ color: T.tone, fontWeight: "700", fontSize: 22 }}>Z</Text>
          </View>
          <Text style={{ color: T.text, fontSize: 26, fontWeight: "600" }}>ZoneTalk</Text>
        </View>

        <View style={[styles.card, { backgroundColor: T.panel, borderColor: T.border }]}>
          <View style={{ flexDirection: "row", gap: 4, marginBottom: 20 }}>
            {[
              ["login", "Sign In"],
              ["register", "Create Account"],
            ].map(([m, label]) => (
              <TouchableOpacity
                key={m}
                onPress={() => {
                  setMode(m);
                  setError("");
                }}
                style={[styles.modeBtn, { backgroundColor: mode === m ? T.mint : "transparent" }]}
              >
                <Text style={{ color: mode === m ? T.tone : T.muted, fontSize: 14, fontWeight: "500" }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === "register" && (
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.label, { color: T.muted }]}>Your name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Yassine"
                placeholderTextColor={T.muted}
                style={[styles.input, { backgroundColor: T.panelAlt, borderColor: T.border, color: T.text }]}
              />
            </View>
          )}

          <View style={{ marginBottom: 12 }}>
            <Text style={[styles.label, { color: T.muted }]}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={T.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, { backgroundColor: T.panelAlt, borderColor: T.border, color: T.text }]}
            />
          </View>

          <View style={{ marginBottom: 4 }}>
            <Text style={[styles.label, { color: T.muted }]}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={T.muted}
              secureTextEntry
              style={[styles.input, { backgroundColor: T.panelAlt, borderColor: T.border, color: T.text }]}
            />
          </View>

          {!!error && <Text style={{ color: T.coral, fontSize: 12, marginTop: 8 }}>{error}</Text>}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitBtn, { backgroundColor: T.mint, opacity: loading ? 0.6 : 1 }]}
          >
            <Text style={{ color: T.tone, fontSize: 14, fontWeight: "600" }}>
              {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={{ flex: 1, height: 1, backgroundColor: T.border }} />
            <Text style={{ color: T.muted, fontSize: 12 }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: T.border }} />
          </View>

          <TouchableOpacity
            onPress={handleGoogle}
            disabled={loading}
            style={[styles.googleBtn, { borderColor: T.border, opacity: loading ? 0.6 : 1 }]}
          >
            <Text style={{ color: T.text, fontSize: 14, fontWeight: "500" }}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: T.muted, fontSize: 11, textAlign: "center", marginTop: 16 }}>
          Messages auto-delete after 24h · Location shared only while app is open
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  themeBtn: { alignSelf: "flex-end", borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 32 },
  brandMark: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  card: { width: "100%", maxWidth: 420, borderWidth: 1, borderRadius: 16, padding: 20 },
  modeBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  label: { fontSize: 12, marginBottom: 4 },
  input: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  submitBtn: { borderRadius: 8, paddingVertical: 10, alignItems: "center", marginTop: 8 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 16 },
  googleBtn: { borderWidth: 1, borderRadius: 8, paddingVertical: 10, alignItems: "center" },
});
