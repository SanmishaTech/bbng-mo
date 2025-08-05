import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

interface BBNGLogoProps {
  size?: "small" | "medium" | "large";
}

export default function BBNGLogo({ size = "medium" }: BBNGLogoProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const sizeStyles = {
    small: { width: 60, height: 60, fontSize: 24 },
    medium: { width: 100, height: 100, fontSize: 36 },
    large: { width: 140, height: 140, fontSize: 48 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        { width: currentSize.width, height: currentSize.height },
      ]}
    >
      <Image
        source={require("@/images/WhatsApp Image 2025-07-29 at 16.34.01.jpeg")}
        style={[
          styles.logoImage,
          {
            width: currentSize.width,
            height: currentSize.height,
          },
        ]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  logoImage: {
    borderRadius: 20,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 8,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
