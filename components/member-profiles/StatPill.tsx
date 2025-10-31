import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface StatPillProps {
  icon: string;
  label: string;
  value: string | number;
}

export const StatPill: React.FC<StatPillProps> = ({ icon, label, value }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(0, 0, 0, 0.15)' }]}>
      <ThemedText style={styles.icon}>{icon}</ThemedText>
      <View style={styles.content}>
        <ThemedText style={[styles.label, { color: '#666666' }]}>{label}</ThemedText>
        <ThemedText style={[styles.value, { color: '#000000' }]}>{value}</ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    minWidth: '48%',
  },
  icon: {
    fontSize: 16,
  },
  content: {
    gap: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
  },
});
