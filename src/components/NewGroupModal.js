import React from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import Avatar from "./Avatar.js";

export default function NewGroupModal({ visible, contacts, name, setName, selected, toggleMember, onCancel, onCreate, tokens }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: tokens.overlay }]}>
        <View style={[styles.card, { backgroundColor: tokens.panel, borderColor: tokens.border }]}>
          <Text style={{ color: tokens.text, fontSize: 18, fontWeight: "600", marginBottom: 16 }}>New group</Text>

          <Text style={{ color: tokens.muted, fontSize: 12 }}>Group name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Weekend Trip 🚗"
            placeholderTextColor={tokens.muted}
            style={[styles.input, { backgroundColor: tokens.panelAlt, borderColor: tokens.border, color: tokens.text }]}
          />

          <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 12 }}>Add members</Text>
          <ScrollView style={{ maxHeight: 160, marginTop: 8, marginBottom: 16 }}>
            {contacts.map((c) => {
              const isSel = selected.includes(c.name);
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => toggleMember(c.name)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, paddingHorizontal: 4 }}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      borderWidth: 1.5,
                      borderColor: isSel ? tokens.mint : tokens.border,
                      backgroundColor: isSel ? tokens.mint : "transparent",
                    }}
                  />
                  <Avatar name={c.name} color={c.color} small tokens={tokens} />
                  <Text style={{ color: tokens.text, fontSize: 14 }}>{c.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity onPress={onCancel} style={[styles.btn, { borderWidth: 1, borderColor: tokens.border }]}>
              <Text style={{ color: tokens.text, fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCreate}
              disabled={!name.trim() || selected.length === 0}
              style={[
                styles.btn,
                { backgroundColor: tokens.mint, opacity: !name.trim() || selected.length === 0 ? 0.5 : 1 },
              ]}
            >
              <Text style={{ color: tokens.tone, fontSize: 14, fontWeight: "600" }}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  card: { width: "100%", maxWidth: 360, borderRadius: 16, borderWidth: 1, padding: 20 },
  input: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginTop: 4 },
  btn: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: "center" },
});
