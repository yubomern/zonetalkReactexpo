import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { useApp } from "../AppContext.js";

export default function MapScreen({ navigation }) {
  const { tokens, myLocation, nearbyUsers } = useApp();

  const center = myLocation
    ? { latitude: myLocation.lat, longitude: myLocation.lng }
    : { latitude: 48.8566, longitude: 2.3522 };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <View style={[styles.headerRow, { backgroundColor: tokens.panel, borderBottomColor: tokens.border }]}>
        <Text style={{ color: tokens.text, fontWeight: "600", fontSize: 15 }}>
          📍 Zone Map
          {nearbyUsers.length > 0 && (
            <Text style={{ color: tokens.mint, fontWeight: "400", fontSize: 12 }}>
              {"  "}
              {nearbyUsers.length} user{nearbyUsers.length !== 1 ? "s" : ""} nearby
            </Text>
          )}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: tokens.muted, fontSize: 13 }}>✕ Close</Text>
        </TouchableOpacity>
      </View>

      {myLocation ? (
        <MapView
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: center.latitude,
            longitude: center.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Circle
            center={center}
            radius={500}
            strokeColor={tokens.mint}
            fillColor={`${tokens.mint}22`}
            strokeWidth={1.5}
          />
          <Marker coordinate={center} title="You" description="Your current location" pinColor={tokens.mint} />
          {nearbyUsers.map((u) =>
            u.location ? (
              <Marker
                key={u.uid || u.id}
                coordinate={{ latitude: u.location.lat, longitude: u.location.lng }}
                title={u.name}
                description={
                  u.distanceKm != null
                    ? u.distanceKm < 1
                      ? `${Math.round(u.distanceKm * 1000)} m away`
                      : `${u.distanceKm.toFixed(2)} km away`
                    : undefined
                }
              />
            ) : null
          )}
        </MapView>
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>📍</Text>
          <Text style={{ color: tokens.muted, textAlign: "center" }}>
            Enable location access in your device settings{"\n"}to see the map
          </Text>
        </View>
      )}
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
});
