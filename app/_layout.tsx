import "../global.css";
import { ClerkProvider } from "@clerk/expo";
import { Slot } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Text, View } from "react-native";

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

export default function RootLayout() {
  const publishableKey =
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-lg font-semibold text-red-600">
          Missing Clerk key in env.
        </Text>
        <Text className="mt-2 text-center text-slate-600">
          Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env and restart Expo.
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <Slot />
    </ClerkProvider>
  );
}