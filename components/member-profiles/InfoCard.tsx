import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';

interface InfoCardProps {
  member: any;
}

export const InfoCard: React.FC<InfoCardProps> = ({ member }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handlePress = (type: 'email' | 'phone' | 'website', value: string) => {
    if (type === 'email') {
      Linking.openURL(`mailto:${value}`);
    } else if (type === 'phone') {
      Linking.openURL(`tel:${value}`);
    } else if (type === 'website') {
      Linking.openURL(value);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ThemedText style={styles.title}>Contact & Links</ThemedText>
      
      <View style={styles.content}>
        <TouchableOpacity style={styles.row} onPress={() => handlePress('email', member.email)} activeOpacity={0.7}>
          <ThemedText style={styles.icon}>📧</ThemedText>
          <ThemedText style={[styles.text, { color: colors.text }]} numberOfLines={1}>{member.email}</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.row} onPress={() => handlePress('phone', member.phone)} activeOpacity={0.7}>
          <ThemedText style={styles.icon}>📱</ThemedText>
          <ThemedText style={[styles.text, { color: colors.text }]}>{member.phone}</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.row} onPress={() => handlePress('website', member.website)} activeOpacity={0.7}>
          <ThemedText style={styles.icon}>🌐</ThemedText>
          <ThemedText style={[styles.text, { color: colors.primary }]} numberOfLines={1}>
            {member.website?.replace('https://', '').replace('http://', '')}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  content: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
  text: {
    fontSize: 13,
    flex: 1,
  },
});
