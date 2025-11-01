import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getTestimonialAvatar } from '@/utils/avatarUtils';
import React, { useEffect, useState } from 'react';
import { Animated, Image, Platform, StyleSheet, Text, View } from 'react-native';

interface TestimonialsCardProps {
  testimonials: any[];
  member?: any;
  index?: number;
}

export const TestimonialsCard: React.FC<TestimonialsCardProps> = ({ testimonials, member, index = 0 }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 60,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Testimonials</Text>
          {testimonials.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.countText, { color: colors.primary }]}>{testimonials.length}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          {testimonials.map((item, idx) => {
            const testimonialUser = {
              id: item.id || idx,
              name: item.by,
              avatar: item.avatar,
              profilePicture: item.avatar,
            };
            
            return (
              <TestimonialItem
                key={idx}
                item={item}
                avatarUrl={getTestimonialAvatar(testimonialUser, backendUrl)}
                index={idx}
                colors={colors}
              />
            );
          })}
          
          {testimonials.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.placeholder }]}>No testimonials yet</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const TestimonialItem = ({ item, avatarUrl, index, colors }: any) => {
  const [slideAnim] = useState(new Animated.Value(20));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.testimonialRow,
        {
          borderBottomColor: colors.border,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.avatarContainer, { backgroundColor: colors.surface }]}>
        <Image 
          source={{ uri: avatarUrl }} 
          style={styles.avatar} 
          resizeMode="cover"
        />
      </View>
    
      <View style={styles.testimonialContent}>
        <Text style={[styles.authorName, { color: colors.text }]}>{item.by}</Text>
        
        <Text style={[styles.testimonialText, { color: colors.placeholder }]}>
          {item.text}
        </Text>
        
        <Text style={[styles.testimonialDate, { color: colors.placeholder }]}>
          {item.date}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    gap: 16,
  },
  testimonialRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  testimonialContent: {
    flex: 1,
    gap: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  testimonialText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  testimonialDate: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 32,
  },
});
