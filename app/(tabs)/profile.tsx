import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const profileOptions = [
    {
      id: '1',
      title: 'Edit Profile',
      icon: 'person.crop.circle',
      onPress: () => console.log('Edit Profile'),
    },
    {
      id: '2',
      title: 'Notifications',
      icon: 'bell',
      onPress: () => console.log('Notifications'),
    },
    {
      id: '3',
      title: 'Privacy',
      icon: 'lock',
      onPress: () => console.log('Privacy'),
    },
    {
      id: '4',
      title: 'Help & Support',
      icon: 'questionmark.circle',
      onPress: () => console.log('Help & Support'),
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingBottom: Platform.OS === 'ios' ? 100 : 80 + insets.bottom,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>
          {user?.name || 'User'}
        </Text>
        <Text style={[styles.userEmail, { color: colors.placeholder }]}>
          {user?.email || 'user@example.com'}
        </Text>
      </View>

      {/* Appearance Section */}
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        
        <View style={[styles.themeContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.themeHeader}>
            <View style={[styles.themeIcon, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol name="moon.stars" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.themeTitle, { color: colors.text }]}>Theme</Text>
          </View>
          
          <View style={styles.themeOptions}>
            {/* System Option */}
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                themeMode === 'system' && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
              ]}
              onPress={() => setThemeMode('system')}
              activeOpacity={0.7}
            >
              <IconSymbol 
                name="gear" 
                size={20} 
                color={themeMode === 'system' ? colors.primary : colors.placeholder} 
              />
              <Text style={[
                styles.themeOptionText,
                { color: themeMode === 'system' ? colors.primary : colors.text }
              ]}>
                System
              </Text>
              {themeMode === 'system' && (
                <View style={[styles.checkMark, { backgroundColor: colors.primary }]}>
                  <IconSymbol name="checkmark" size={12} color="white" />
                </View>
              )}
            </TouchableOpacity>

            {/* Light Option */}
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                themeMode === 'light' && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
              ]}
              onPress={() => setThemeMode('light')}
              activeOpacity={0.7}
            >
              <IconSymbol 
                name="sun.max" 
                size={20} 
                color={themeMode === 'light' ? colors.primary : colors.placeholder} 
              />
              <Text style={[
                styles.themeOptionText,
                { color: themeMode === 'light' ? colors.primary : colors.text }
              ]}>
                Light
              </Text>
              {themeMode === 'light' && (
                <View style={[styles.checkMark, { backgroundColor: colors.primary }]}>
                  <IconSymbol name="checkmark" size={12} color="white" />
                </View>
              )}
            </TouchableOpacity>

            {/* Dark Option */}
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                themeMode === 'dark' && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
              ]}
              onPress={() => setThemeMode('dark')}
              activeOpacity={0.7}
            >
              <IconSymbol 
                name="moon" 
                size={20} 
                color={themeMode === 'dark' ? colors.primary : colors.placeholder} 
              />
              <Text style={[
                styles.themeOptionText,
                { color: themeMode === 'dark' ? colors.primary : colors.text }
              ]}>
                Dark
              </Text>
              {themeMode === 'dark' && (
                <View style={[styles.checkMark, { backgroundColor: colors.primary }]}>
                  <IconSymbol name="checkmark" size={12} color="white" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Options */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Account</Text>
        
        {profileOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.optionItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={option.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol name={option.icon as any} size={20} color={colors.primary} />
            </View>
            <Text style={[styles.optionTitle, { color: colors.text }]}>
              {option.title}
            </Text>
            <IconSymbol name="chevron.right" size={16} color={colors.placeholder} />
          </TouchableOpacity>
        ))}

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: colors.error + '20' }]}
          onPress={signOut}
          activeOpacity={0.7}
        >
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    marginTop: 60,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  themeContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  themeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
    position: 'relative',
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkMark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
