import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useApp } from "../AppContext.js";
import Avatar from "../components/Avatar.js";
import ConvRow from "../components/ConvRow.js";
import ZonePanel from "../components/ZonePanel.js";
import NewGroupModal from "../components/NewGroupModal.js";

export default function HomeScreen({ navigation }) {
  const {
    theme, tokens, toggleTheme, currentUser, myLocation, gpsError,
    effectiveZonePeople, isRealUsers, markZoneJoined, refreshZone,
    dmAndGroups, dynamicDmContacts, groups, createGroup,
    myPhoto, updateMyPhoto, signOutUser,
  } = useApp();

  const [tab, setTab] = useState("chats");
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState([]);

  function openConversation(conv) {
    if (conv.type === "zone") markZoneJoined(conv.id);
    navigation.navigate("Chat", { conv });
  }

  function toggleNewMember(name) {
    setNewGroupMembers((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  async function handleCreateGroup() {
    const name = newGroupName.trim();
    if (!name || newGroupMembers.length === 0) return;
    const group = await createGroup(name, newGroupMembers);
    setShowNewGroup(false);
    setNewGroupName("");
    setNewGroupMembers([]);
    setTab("chats");
    openConversation(group);
  }

  async function handlePhotoPress() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Photo library access is needed to set a profile photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;
    const mime = result.assets[0].mimeType || "image/jpeg";
    const dataUri = `data:${mime};base64,${result.assets[0].base64}`;
    try {
      await updateMyPhoto(dataUri);
    } catch (err) {
      console.warn("[ZoneTalk] Photo update failed.", err);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.panel }}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[styles.brandMark, { backgroundColor: tokens.mint }]}>
              <Text style={{ color: tokens.tone, fontWeight: "700" }}>Z</Text>
            </View>
            <Text style={{ color: tokens.text, fontSize: 20, fontWeight: "600" }}>ZoneTalk</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 4 }}>
            <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
              <Text style={{ fontSize: 16 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={signOutUser} style={styles.iconBtn}>
              <Text style={{ fontSize: 18, color: tokens.muted }}>⏻</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 }}>
          <View>
            <Avatar
              name={currentUser?.displayName || currentUser?.email}
              color={tokens.mint}
              photoURL={myPhoto}
              onPress={handlePhotoPress}
              tokens={tokens}
            />
            <View style={[styles.editBadge, { backgroundColor: tokens.lavender, borderColor: tokens.panel }]}>
              <Text style={{ fontSize: 8 }}>✏️</Text>
            </View>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 14, fontWeight: "500" }}>
              {currentUser?.displayName || currentUser?.email?.split("@")[0]}
            </Text>
            <Text style={{ color: myLocation ? tokens.mint : tokens.muted, fontSize: 12 }}>
              {myLocation ? "📍 location live" : "Tap photo to update"}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 4, marginTop: 16 }}>
          <TouchableOpacity
            onPress={() => setTab("chats")}
            style={[styles.tabBtn, { backgroundColor: tab === "chats" ? tokens.mint : "transparent" }]}
          >
            <Text style={{ color: tab === "chats" ? tokens.tone : tokens.muted, fontSize: 14, fontWeight: "500" }}>Chats</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab("zone")}
            style={[styles.tabBtn, { backgroundColor: tab === "zone" ? tokens.lavender : "transparent" }]}
          >
            <Text style={{ color: tab === "zone" ? "#fff" : tokens.muted, fontSize: 14, fontWeight: "500" }}>Zone 📍</Text>
          </TouchableOpacity>
        </View>

        {tab === "chats" && (
          <TouchableOpacity
            onPress={() => setShowNewGroup(true)}
            style={[styles.newGroupBtn, { borderColor: tokens.border }]}
          >
            <Text style={{ color: tokens.muted, fontSize: 14 }}>+ New group</Text>
          </TouchableOpacity>
        )}
      </View>

      {tab === "chats" ? (
        <FlatList
          data={dmAndGroups}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
          renderItem={({ item }) => <ConvRow conv={item} active={false} onPress={() => openConversation(item)} tokens={tokens} />}
        />
      ) : (
        <FlatList
          data={[{ key: "zone-panel" }]}
          keyExtractor={(i) => i.key}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={() => (
            <ZonePanel
              people={effectiveZonePeople}
              activeId={null}
              onSelect={openConversation}
              onRefresh={refreshZone}
              onMap={() => navigation.navigate("Map")}
              myLocation={myLocation}
              gpsError={gpsError}
              isReal={isRealUsers}
              tokens={tokens}
            />
          )}
        />
      )}

      <NewGroupModal
        visible={showNewGroup}
        contacts={dynamicDmContacts.length > 0 ? dynamicDmContacts : []}
        name={newGroupName}
        setName={setNewGroupName}
        selected={newGroupMembers}
        toggleMember={toggleNewMember}
        onCancel={() => {
          setShowNewGroup(false);
          setNewGroupName("");
          setNewGroupMembers([]);
        }}
        onCreate={handleCreateGroup}
        tokens={tokens}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandMark: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  iconBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  editBadge: { position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  tabBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  newGroupBtn: { borderWidth: 1, borderStyle: "dashed", borderRadius: 8, paddingVertical: 8, alignItems: "center", marginTop: 12 },
});
