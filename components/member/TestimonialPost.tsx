import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Testimonial } from '@/types/member';
import { getTestimonialAvatar } from '@/utils/avatarUtils';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface TestimonialPostProps {
  testimonial: Testimonial;
}

export const TestimonialPost: React.FC<TestimonialPostProps> = ({ testimonial }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  // Map testimonial giver data to user format for avatar utility
  const giverUser = {
    id: testimonial.id,
    name: testimonial.giverName,
    profilePicture: testimonial.giverProfilePicture,
    avatar: testimonial.giverProfilePicture,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header with Giver Info */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: getTestimonialAvatar(giverUser, backendUrl) }}
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>

        <View style={styles.headerInfo}>
          <ThemedText style={styles.giverName}>{testimonial.giverName}</ThemedText>
          <ThemedText style={[styles.organization, { color: colors.tabIconDefault }]}>
            {testimonial.giverOrganization || 'Member'}
          </ThemedText>
          <ThemedText style={[styles.timestamp, { color: colors.tabIconDefault }]}>
            {formatDate(testimonial.createdAt)}
          </ThemedText>
        </View>

        {/* Rating if available */}
        {testimonial.rating && (
          <View style={styles.ratingContainer}>
            {[...Array(5)].map((_, index) => (
              <ThemedText key={index} style={styles.star}>
                {index < testimonial.rating! ? '⭐' : '☆'}
              </ThemedText>
            ))}
          </View>
        )}
      </View>

      {/* Testimonial Content */}
      <View style={styles.contentContainer}>
        <View
          style={[
            styles.quoteContainer,
            {
              backgroundColor: colors.primary + '10',
              borderColor: colors.primary + '25',
            },
          ]}
        >
          <ThemedText style={styles.quoteIcon}>"</ThemedText>
          <ThemedText style={styles.content}>{testimonial.content}</ThemedText>
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.footerItem}>
          <ThemedText style={styles.footerEmoji}>💬</ThemedText>
          <ThemedText style={[styles.footerText, { color: colors.tabIconDefault }]}>
            Testimonial
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  giverName: {
    fontSize: 16,
    fontWeight: '700',
  },
  organization: {
    fontSize: 13,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    fontSize: 16,
  },
  contentContainer: {
    marginBottom: 12,
  },
  quoteContainer: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  quoteIcon: {
    fontSize: 22,
    fontWeight: '700',
    opacity: 0.3,
    marginBottom: 6,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerEmoji: {
    fontSize: 16,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
