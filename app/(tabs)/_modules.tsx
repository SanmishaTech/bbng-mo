import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScaledSize,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';

const COLORS = {
  bg_primary: '#0F172A',
  bg_secondary: '#1E293B',
  bg_tertiary: '#334155',
  primary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#06B6D4',
  error: '#EF4444',
  text_primary: '#FFFFFF',
  text_secondary: '#CBD5E1',
  text_tertiary: '#94A3B8',
  text_quaternary: '#64748B',
  border: 'rgba(255, 255, 255, 0.05)',
  border_emphasis: 'rgba(255, 255, 255, 0.1)',
  gradient_header: ['#1F2937', '#111827'] as const,
};

const TYPOGRAPHY = {
  h1: { size: 28, weight: '800' as const, lineHeight: 34, letterSpacing: -0.5 },
  h4: { size: 18, weight: '700' as const, lineHeight: 24, letterSpacing: -0.3 },
  body: { size: 14, weight: '400' as const, lineHeight: 20 },
  bodySemibold: { size: 14, weight: '600' as const, lineHeight: 20 },
  small: { size: 12, weight: '500' as const, lineHeight: 16 },
  label: { size: 11, weight: '600' as const, lineHeight: 14, letterSpacing: 0.5 },
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

const SHADOW = {
  medium: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
};

interface Module {
  id: string;
  name: string;
  route: string;
  icon: string;
  category: string;
  roles?: string[]; // If specified, only these roles can access
  description?: string;
  color: string; // Color for icon background and text
}

const CARD_OFFSET = 56;

const modules: Module[] = [
  {
    id: 'states',
    name: 'States',
    route: '/modules/states',
    icon: 'map.fill',
    category: 'Location Management',
    description: 'Manage states and regions',
    color: COLORS.info,
  },
  {
    id: 'regions',
    name: 'Regions',
    route: '/modules/regions',
    icon: 'globe',
    category: 'Location Management',
    description: 'Manage geographical regions',
    color: COLORS.primary,
  },
  {
    id: 'locations',
    name: 'Locations',
    route: '/modules/locations',
    icon: 'mappin.and.ellipse',
    category: 'Location Management',
    description: 'Manage location assignments',
    color: COLORS.success,
  },
  {
    id: 'categories',
    name: 'Categories',
    route: '/modules/categories',
    icon: 'tag.fill',
    category: 'Business Data',
    description: 'Manage business categories',
    color: COLORS.error,
  },
  {
    id: 'subcategories',
    name: 'Sub-Categories',
    route: '/modules/subcategories',
    icon: 'tag',
    category: 'Business Data',
    description: 'Manage business sub-categories',
    color: COLORS.warning,
  },
  {
    id: 'packages',
    name: 'Packages',
    route: '/modules/packages',
    icon: 'shippingbox.fill',
    category: 'Membership',
    description: 'Manage membership packages and pricing',
    color: COLORS.primary,
  },
  {
    id: 'members',
    name: 'Members',
    route: '/modules/members',
    icon: 'person.2.fill',
    category: 'Membership',
    description: 'Manage member information and accounts',
    color: COLORS.success,
  },
  {
    id: 'chapters',
    name: 'Chapters',
    route: '/modules/chapters',
    icon: 'book.fill',
    category: 'Organization',
    description: 'Manage chapters with zones and locations',
    color: COLORS.info,
  },
  {
    id: 'powerteams',
    name: 'Power Teams',
    route: '/modules/powerteams',
    icon: 'person.3.fill',
    category: 'Organization',
    description: 'Manage power teams and their categories',
    color: COLORS.primary,
  },
  {
    id: 'trainings',
    name: 'Trainings',
    route: '/modules/trainings',
    icon: 'book.closed.fill',
    category: 'Education',
    description: 'Manage training schedules and sessions',
    color: COLORS.primary,
  },
  {
    id: 'sitesettings',
    name: 'Site Settings',
    route: '/modules/sitesettings',
    icon: 'gearshape.fill',
    category: 'Configuration',
    description: 'Configure application settings and preferences',
    color: COLORS.warning,
  },
  {
    id: 'messages',
    name: 'Messages',
    route: '/modules/messages',
    icon: 'envelope.fill',
    category: 'Communication',
    description: 'Manage messages and announcements',
    color: COLORS.error,
  },
  {
    id: 'visitors',
    name: 'Visitors',
    route: '/modules/visitors',
    icon: 'person.3',
    category: 'Events',
    description: 'Manage chapter visitors',
    color: COLORS.info,
  },
  {
    id: 'meetings',
    name: 'Meetings',
    route: '/modules/meetings',
    icon: 'calendar',
    category: 'Events',
    description: 'Manage chapter meetings',
    color: COLORS.warning,
  },
  {
    id: 'onetoone',
    name: 'One to One',
    route: '/modules/onetoone',
    icon: 'person.2',
    category: 'Networking',
    description: 'Manage one-to-one meeting requests',
    color: COLORS.primary,
  },
  {
    id: 'references',
    name: 'Give Reference',
    route: '/references',
    icon: 'person.badge.plus',
    category: 'Business',
    description: 'Give and manage references',
    color: COLORS.success,
  },
  {
    id: 'donedeals',
    name: 'Done Deals',
    route: '/done-deals',
    icon: 'checkmark.circle.fill',
    category: 'Business',
    description: 'Mark and track completed deals',
    color: COLORS.success,
  },
  {
    id: 'requirements',
    name: 'Requirements',
    route: '/modules/requirements',
    icon: 'list.bullet.clipboard',
    category: 'Business',
    description: 'View member requirements',
    color: COLORS.primary,
  },
];

export default function ModulesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasChapterAccess } = useUserRole();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cardWidth, setCardWidth] = useState<number>(() => {
    const { width } = Dimensions.get('window');
    return Math.max((width - CARD_OFFSET) / 3, 112);
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateAnim]);

  useEffect(() => {
    const handleDimensionsChange = ({ window }: { window: ScaledSize }) => {
      setCardWidth(Math.max((window.width - CARD_OFFSET) / 3, 112));
    };

    const subscription = Dimensions.addEventListener('change', handleDimensionsChange);

    return () => {
      if (typeof subscription?.remove === 'function') {
        subscription.remove();
      } else {
        Dimensions.removeEventListener('change', handleDimensionsChange);
      }
    };
  }, []);

  // Define module accessibility based on chapter association
  const commonModules = [
    'onetoone',      // One To One - available to all users
    'references',    // Give Reference - available to all users
    'donedeals',     // Done Deals - available to all users
    'requirements',  // Requirements - available to all users
  ];
  
  const chapterModules = [
    'visitors',    // Visitors - only for users with chapter
    'meetings',    // Meetings - only for users with chapter
  ];
  // Note: give-reference, done-deal, and performance are in tabs, not modules

  // Filter modules based on user role and chapter association
  const filteredModules = modules.filter(module => {
    // Admin users can see all modules
    if (user?.role === 'admin') {
      return true;
    }

    // Check if module has specific role restrictions
    if (module.roles && module.roles.length > 0) {
      return module.roles.includes(user?.role || '');
    }

    // For regular users:
    // 1. Always show common modules
    if (commonModules.includes(module.id)) {
      return true;
    }
    
    // 2. Show chapter-specific modules only if user has a chapter
    if (chapterModules.includes(module.id)) {
      return hasChapterAccess;
    }

    // 3. Hide all other modules from regular users
    return false;
  });

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(filteredModules.map(m => m.category)))],
    [filteredModules]
  );

  const displayedModules = useMemo(
    () =>
      selectedCategory === 'All'
        ? filteredModules
        : filteredModules.filter(m => m.category === selectedCategory),
    [filteredModules, selectedCategory]
  );

  const groupedModules = useMemo(() => {
    return displayedModules.reduce((acc, module) => {
      if (!acc[module.category]) {
        acc[module.category] = [];
      }
      acc[module.category].push(module);
      return acc;
    }, {} as Record<string, Module[]>);
  }, [displayedModules]);

  const moduleIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    displayedModules.forEach((module, index) => {
      map[module.id] = index;
    });
    return map;
  }, [displayedModules]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={COLORS.gradient_header}
        style={[
          styles.header,
          { paddingTop: insets.top + 60 },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Modules</Text>
            <Text style={styles.headerSubtitle}>
              Manage and access all available modules
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {displayedModules.length} ACTIVE
            </Text>
          </View>
        </View>
      </LinearGradient>

      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateAnim }],
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: SPACING['3xl'] + insets.bottom },
          ]}
        >
          <View style={styles.filterSection}>
            <Text style={styles.sectionLabel}>Filter by category</Text>
            <View style={styles.filterRow}>
              {categories.map(category => {
                const isActive = category === selectedCategory;
                return (
                  <Pressable
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      isActive && styles.filterChipActive,
                      pressed && styles.filterChipPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {Object.entries(groupedModules).map(([category, modulesInCategory]) => (
            <View key={category} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{category}</Text>
                <Text style={styles.sectionMeta}>
                  {modulesInCategory.length} MODULES
                </Text>
              </View>
              <View style={styles.grid}>
                {modulesInCategory.map(module => (
                  <ModuleCard
                    key={module.id}
                    item={module}
                    index={moduleIndexMap[module.id] ?? 0}
                    width={cardWidth}
                    onPress={() => router.push(module.route as never)}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg_primary,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['3xl'],
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.h1.size,
    fontWeight: TYPOGRAPHY.h1.weight,
    lineHeight: TYPOGRAPHY.h1.lineHeight,
    letterSpacing: TYPOGRAPHY.h1.letterSpacing,
    color: COLORS.text_primary,
  },
  headerSubtitle: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.body.size,
    fontWeight: TYPOGRAPHY.body.weight,
    lineHeight: TYPOGRAPHY.body.lineHeight,
    color: COLORS.text_secondary,
  },
  badge: {
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border_emphasis,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.label.size,
    fontWeight: TYPOGRAPHY.label.weight,
    lineHeight: TYPOGRAPHY.label.lineHeight,
    letterSpacing: TYPOGRAPHY.label.letterSpacing,
    textTransform: 'uppercase',
    color: COLORS.primary,
  },
  contentWrapper: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING['2xl'],
  },
  filterSection: {
    marginBottom: SPACING['2xl'],
    gap: SPACING.md,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.small.size,
    fontWeight: TYPOGRAPHY.small.weight,
    lineHeight: TYPOGRAPHY.small.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: TYPOGRAPHY.label.letterSpacing,
    color: COLORS.text_quaternary,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  filterChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg_secondary,
  },
  filterChipActive: {
    backgroundColor: `${COLORS.primary}20`,
    borderColor: COLORS.border_emphasis,
  },
  filterChipPressed: {
    opacity: 0.8,
  },
  filterChipText: {
    fontSize: TYPOGRAPHY.small.size,
    fontWeight: TYPOGRAPHY.small.weight,
    lineHeight: TYPOGRAPHY.small.lineHeight,
    color: COLORS.text_secondary,
  },
  filterChipTextActive: {
    color: COLORS.text_primary,
  },
  section: {
    marginBottom: SPACING['2xl'],
    gap: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.h4.size,
    fontWeight: TYPOGRAPHY.h4.weight,
    lineHeight: TYPOGRAPHY.h4.lineHeight,
    letterSpacing: TYPOGRAPHY.h4.letterSpacing,
    color: COLORS.text_primary,
  },
  sectionMeta: {
    fontSize: TYPOGRAPHY.small.size,
    fontWeight: TYPOGRAPHY.small.weight,
    lineHeight: TYPOGRAPHY.small.lineHeight,
    color: COLORS.text_tertiary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  gridCard: {
    minHeight: 112,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg_secondary,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: SPACING.md,
    ...SHADOW.medium,
  },
  gridCardPressed: {
    opacity: 0.9,
  },
  gridIconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridModuleName: {
    fontSize: TYPOGRAPHY.bodySemibold.size,
    fontWeight: TYPOGRAPHY.bodySemibold.weight,
    lineHeight: TYPOGRAPHY.bodySemibold.lineHeight,
    color: COLORS.text_primary,
    textAlign: 'center',
  },
  gridModuleDescription: {
    fontSize: TYPOGRAPHY.small.size,
    fontWeight: TYPOGRAPHY.small.weight,
    lineHeight: TYPOGRAPHY.small.lineHeight,
    color: COLORS.text_tertiary,
    textAlign: 'center',
  },
});

interface ModuleCardProps {
  item: Module;
  index: number;
  width: number;
  onPress: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ item, index, width, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacityAnim, scaleAnim]);

  return (
    <Animated.View
      style={{
        width,
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.gridCard,
          pressed && styles.gridCardPressed,
        ]}
      >
        <View style={[styles.gridIconContainer, { backgroundColor: `${item.color}20` }]}>
          <IconSymbol name={item.icon as any} size={20} color={item.color} />
        </View>
        <Text style={styles.gridModuleName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={styles.gridModuleDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
};
