import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
} from 'react-native-chart-kit';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const screenWidth = Dimensions.get('window').width;

interface StatisticsChartProps {
  type: 'line' | 'bar' | 'pie' | 'progress';
  data: any;
  title: string;
  height?: number;
}

export function StatisticsChart({ type, data, title, height = 220 }: StatisticsChartProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
      strokeWidth: 1,
    },
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart
            data={data}
            width={screenWidth - 40}
            height={height}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={true}
            withHorizontalLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            segments={4}
          />
        );

      case 'bar':
        return (
          <BarChart
            data={data}
            width={screenWidth - 40}
            height={height}
            chartConfig={chartConfig}
            style={styles.chart}
            verticalLabelRotation={0}
            showValuesOnTopOfBars={true}
            withInnerLines={true}
          />
        );

      case 'pie':
        return (
          <PieChart
            data={data}
            width={screenWidth - 40}
            height={height}
            chartConfig={chartConfig}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        );

      case 'progress':
        return (
          <ProgressChart
            data={data}
            width={screenWidth - 40}
            height={height}
            strokeWidth={16}
            radius={32}
            chartConfig={chartConfig}
            style={styles.chart}
            hideLegend={false}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <ThemedText style={[styles.title, { color: colors.text }]}>{title}</ThemedText>
      {renderChart()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
