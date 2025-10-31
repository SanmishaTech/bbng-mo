import { IconSymbol } from '@/components/ui/IconSymbol';
import React, { useEffect, useState } from 'react';
import { Animated, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface InfoCardProps {
  member: any;
  index?: number;
}

export const InfoCard: React.FC<InfoCardProps> = ({ member, index = 0 }) => {
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 60,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = (type: 'email' | 'phone' | 'website', value: string) => {
    if (type === 'email') {
      Linking.openURL(`mailto:${value}`);
    } else if (type === 'phone') {
      Linking.openURL(`tel:${value}`);
    } else if (type === 'website') {
      Linking.openURL(value);
    }
  };

  const items = [
    { type: 'email' as const, icon: 'envelope.fill' as const, label: 'Email', value: member.email, color: '#8B5CF6' },
    { type: 'phone' as const, icon: 'phone.fill' as const, label: 'Phone', value: member.phone, color: '#10B981' },
    { type: 'website' as const, icon: 'link.circle.fill' as const, label: 'Website', value: member.website?.replace('https://', '').replace('http://', ''), color: '#06B6D4' },
  ];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <View style={styles.card}>
        <Text style={styles.title}>Contact Information</Text>
        
        <View style={styles.content}>
          {items.map((item, idx) => (
            <Pressable
              key={idx}
              style={({ pressed }) => [
                styles.row,
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }
              ]}
              onPress={() => handlePress(item.type, item.value)}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <IconSymbol name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemValue} numberOfLines={1}>{item.value}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  content: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 20,
  },
});
