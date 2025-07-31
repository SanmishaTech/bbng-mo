import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'toggle' | 'navigation';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [biometric, setBiometric] = useState(false);

  const settingsData: SettingItem[] = [
    {
      id: '1',
      title: 'Notifications',
      subtitle: 'Receive push notifications',
      icon: 'bell.fill',
      type: 'toggle',
      value: notifications,
      onToggle: setNotifications,
    },
    {
      id: '2',
      title: 'Dark Mode',
      subtitle: 'Use dark theme',
      icon: 'moon.fill',
      type: 'toggle',
      value: darkMode,
      onToggle: setDarkMode,
    },
    {
      id: '3',
      title: 'Biometric Login',
      subtitle: 'Use fingerprint or face ID',
      icon: 'faceid',
      type: 'toggle',
      value: biometric,
      onToggle: setBiometric,
    },
    {
      id: '4',
      title: 'Privacy',
      subtitle: 'Data and privacy settings',
      icon: 'lock.fill',
      type: 'navigation',
      onPress: () => console.log('Privacy settings'),
    },
    {
      id: '5',
      title: 'Security',
      subtitle: 'Password and security',
      icon: 'shield.fill',
      type: 'navigation',
      onPress: () => console.log('Security settings'),
    },
    {
      id: '6',
      title: 'About',
      subtitle: 'App version and info',
      icon: 'info.circle.fill',
      type: 'navigation',
      onPress: () => console.log('About'),
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <View
      key={item.id}
      style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
        <IconSymbol name={item.icon as any} size={20} color={colors.primary} />
      </View>
      
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.placeholder }]}>
            {item.subtitle}
          </Text>
        )}
      </View>

      {item.type === 'toggle' ? (
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="white"
        />
      ) : (
        <TouchableOpacity onPress={item.onPress} style={styles.navigationButton}>
          <IconSymbol name="chevron.right" size={16} color={colors.placeholder} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.placeholder }]}>
          Customize your app experience
        </Text>
      </View>

      {/* General Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>General</Text>
        {settingsData.slice(0, 3).map(renderSettingItem)}
      </View>

      {/* Security Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Security & Privacy</Text>
        {settingsData.slice(3, 5).map(renderSettingItem)}
      </View>

      {/* Other Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Other</Text>
        {settingsData.slice(5).map(renderSettingItem)}
      </View>

      {/* App Version */}
      <View style={styles.footer}>
        <Text style={[styles.versionText, { color: colors.placeholder }]}>
          Version 1.0.0
        </Text>
        <Text style={[styles.copyrightText, { color: colors.placeholder }]}>
          © 2024 Your App Name
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  navigationButton: {
    padding: 4,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  versionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
  },
});
