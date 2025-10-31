import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface StoryAvatarProps {
  member: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
  selected: boolean;
  onPress: () => void;
}

export const StoryAvatar: React.FC<StoryAvatarProps> = ({ member, selected, onPress }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.8}>
      <View style={[styles.ringWrapper, selected && styles.selected]}>
        <LinearGradient
          colors={['#34d399', '#22d3ee', '#818cf8', '#34d399']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientRing}
        >
          <View style={[styles.innerRing, { backgroundColor: colors.background }]}>
            <View style={styles.avatarContainer}>
              {member.profilePicture ? (
                <Image source={{ uri: member.profilePicture }} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.primary + '40' }]}>
                  <ThemedText style={styles.initialsText}>{getInitials(member.name)}</ThemedText>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
      <ThemedText style={styles.nameText} numberOfLines={1}>
        @{member.name.split(' ')[0].toLowerCase()}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 80,
  },
  ringWrapper: {
    transform: [{ scale: 1 }],
  },
  selected: {
    transform: [{ scale: 1.05 }],
  },
  gradientRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
  },
  innerRing: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    padding: 2,
  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 20,
    fontWeight: '700',
  },
  nameText: {
    fontSize: 12,
    marginTop: 6,
    opacity: 0.7,
    maxWidth: 80,
    textAlign: 'center',
  },
});
