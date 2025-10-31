import BBNGLogo from "@/components/BBNGLogo";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LoginFormData, loginSchema } from "@/schemas/loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const [generalError, setGeneralError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setGeneralError("");
    setIsSubmitting(true);
    
    try {
      const result = await signIn(data.email, data.password);
      console.log("Login result:", result);
      
      // Log debug information if available
      if ((result as any)._debug) {
        console.log("Debug information:", (result as any)._debug);
      }
      
      if (result.success) {
        console.log("Login successful, redirectUrl:", result.redirectUrl);
        // The AuthContext will update the authentication state
        // and the _layout.tsx will handle the navigation automatically
        // Keep the loading state active until navigation completes
      } else {
        // Handle validation errors from API
        if (result.validationErrors) {
          console.log("Validation errors received:", result.validationErrors);
          // The form will automatically show field-specific errors
          // But also show a general message if there's one
          if (result.error) {
            setGeneralError(result.error);
          }
        } else {
          // Show general error message
          setGeneralError(
            result.error || "Invalid credentials. Please try again."
          );
        }
        setIsSubmitting(false); // Only stop loading on error
      }
    } catch (error) {
      console.log("Login error:", error);
      setGeneralError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        {/* Logo/Header Section */}
        <View style={styles.header}>
          {/* BBNG Logo */}
          <BBNGLogo size="medium" />
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome to BBNG!
          </Text>
          <Text style={[styles.subtitle, { color: colors.placeholder }]}>
            Sign in to continue to your account
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.email ? colors.error : colors.border,
                      backgroundColor: colors.surface,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Enter your email"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor={colors.placeholder}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.email && (
              <Text style={[styles.fieldError, { color: colors.error }]}>
                {errors.email.message}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.password
                        ? colors.error
                        : colors.border,
                      backgroundColor: colors.surface,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Enter your password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  autoCorrect={false}
                  placeholderTextColor={colors.placeholder}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.password && (
              <Text style={[styles.fieldError, { color: colors.error }]}>
                {errors.password.message}
              </Text>
            )}
          </View>

          {generalError && (
            <View style={styles.errorContainer}>
              <Text style={[styles.error, { color: colors.error }]}>
                {generalError}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.placeholder }]}>
            Demo App - Use "admin" / "admin" for admin access
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  errorContainer: {
    marginBottom: 20,
  },
  error: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  fieldError: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  loginButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    textAlign: "center",
  },
});
