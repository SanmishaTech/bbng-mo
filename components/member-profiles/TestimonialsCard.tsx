import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getTestimonialAvatar } from '@/utils/avatarUtils';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface TestimonialsCardProps {
  testimonials: any[];
  member?: any;
}

export const TestimonialsCard: React.FC<TestimonialsCardProps> = ({ testimonials, member }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ThemedText style={styles.title}>Testimonials</ThemedText>
      
      <View style={styles.content}>
        {testimonials.map((item, index) => {
          // Map testimonial data to user format for avatar utility
          const testimonialUser = {
            id: item.id || index,
            name: item.by,
            avatar: item.avatar,
            profilePicture: item.avatar,
          };
          
          return (
            <View key={index} style={styles.testimonialRow}>
              <View style={[styles.avatarContainer, { backgroundColor: colors.background }]}>
                <Image 
                  source={{ uri: getTestimonialAvatar(testimonialUser, backendUrl) }} 
                  style={styles.avatar} 
                  resizeMode="cover"
                />
              </View>
            
            <View style={styles.testimonialContent}>
              <ThemedText style={styles.authorName}>{item.by}</ThemedText>
              
              <ThemedText style={[styles.testimonialText, { color: colors.text }]}>
                {item.text}
              </ThemedText>
              
              <ThemedText style={[styles.testimonialDate, { color: colors.tabIconDefault }]}>
                {item.date}
              </ThemedText>
            </View>
          </View>
          );
        })}
        
        {testimonials.length === 0 && (
          <ThemedText style={[styles.emptyText, { color: colors.tabIconDefault }]}>
            No testimonials yet
          </ThemedText>
        )}
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
    gap: 16,
  },
  testimonialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 13,
    lineHeight: 18,
  },
  testimonialDate: {
    fontSize: 11,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    padding: 16,
  },
});
