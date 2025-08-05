import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface MiniChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function MiniChart({ 
  data, 
  width = 100, 
  height = 40,
  color 
}: MiniChartProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const chartColor = color || colors.primary;

  const chartData = {
    labels: [],
    datasets: [
      {
        data: data,
        color: (opacity = 1) => chartColor,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => chartColor,
    style: {
      borderRadius: 8,
    },
    propsForDots: {
      r: '0',
    },
    propsForBackgroundLines: {
      stroke: 'transparent',
    },
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={width}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={false}
        withVerticalLabels={false}
        withHorizontalLabels={false}
        withDots={false}
        withShadow={false}
        withScrollableDot={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  chart: {
    paddingRight: 0,
    paddingLeft: 0,
  },
});
