import React from 'react';
import { StyleSheet, Dimensions, ViewStyle, View } from 'react-native';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: number;
  spacing?: number;
  style?: ViewStyle;
}

const { width: screenWidth } = Dimensions.get('window');

export function ResponsiveGrid({
  children,
  columns = 2,
  spacing = 8,
  style,
}: ResponsiveGridProps) {
  const childrenArray = React.Children.toArray(children);
  const containerPadding = 40; // Total horizontal padding from parent
  const totalSpacing = (columns - 1) * spacing;
  const availableWidth = screenWidth - containerPadding;
  const itemWidth = Math.floor((availableWidth - totalSpacing) / columns);

  const renderRows = () => {
    const rows = [];
    for (let i = 0; i < childrenArray.length; i += columns) {
      const rowItems = childrenArray.slice(i, i + columns);
      
      rows.push(
        <View key={i} style={styles.row}>
          {rowItems.map((child, index) => (
            <View
              key={index}
              style={[
                styles.item,
                {
                  width: itemWidth,
                  marginRight: index < rowItems.length - 1 ? spacing : 0,
                },
              ]}
            >
              {child}
            </View>
          ))}
          
          {/* Fill remaining space for incomplete rows */}
          {rowItems.length < columns &&
            Array.from({ length: columns - rowItems.length }).map((_, index) => (
              <View
                key={`spacer-${index}`}
                style={{
                  width: itemWidth,
                  marginRight: index < columns - rowItems.length - 1 ? spacing : 0,
                }}
              />
            ))}
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={[styles.container, style]}>
      {renderRows()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
    justifyContent: 'flex-start',
  },
  item: {
    // Width is set dynamically
  },
});
