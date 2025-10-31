import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface RatingProps {
  value: number;
  size?: number;
}

export const Rating: React.FC<RatingProps> = ({ value, size = 16 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text key={i} style={[styles.star, { fontSize: size }]}>
          {i < value ? '⭐' : '☆'}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    lineHeight: 16,
  },
});
