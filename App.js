import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProvider, useApp } from "./src/AppContext.js";
import AuthScreen from "./src/screens/AuthScreen.js";
import HomeScreen from "./src/screens/HomeScreen.js";
import ChatScreen from "./src/screens/ChatScreen.js";
import MapScreen from "./src/screens/MapScreen.js";

const Stack = createNativeStackNavigator();

function Splash({ tokens }) {
  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: tokens.mint, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontWeight: "700", color: tokens.tone, fontSize: 20 }}>Z</Text>
      </View>
    </View>
  );
}

function RootNavigator() {
  const { authReady, currentUser, tokens, theme } = useApp();

  if (!authReady) return <Splash tokens={tokens} />;

  return (
    <NavigationContainer>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!currentUser ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Map" component={MapScreen} options={{ presentation: "modal" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
