import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const modules: Module[] = [
  {
    id: 'states',
    name: 'States',
    route: '/modules/states',
    icon: 'map.fill',
    category: 'Location Management',
    description: 'Manage states and regions',
    color: '#3B82F6', // Blue
  },
  {
    id: 'regions',
    name: 'Regions',
    route: '/modules/regions',
    icon: 'globe',
    category: 'Location Management',
    description: 'Manage geographical regions',
    color: '#06B6D4', // Cyan
  },
  {
    id: 'locations',
    name: 'Locations',
    route: '/modules/locations',
    icon: 'mappin.and.ellipse',
    category: 'Location Management',
    description: 'Manage location assignments',
    color: '#14B8A6', // Teal
  },
  {
    id: 'categories',
    name: 'Categories',
    route: '/modules/categories',
    icon: 'tag.fill',
    category: 'Business Data',
    description: 'Manage business categories',
    color: '#EF4444', // Red
  },
  {
    id: 'subcategories',
    name: 'Sub-Categories',
    route: '/modules/subcategories',
    icon: 'tag',
    category: 'Business Data',
    description: 'Manage business sub-categories',
    color: '#F59E0B', // Amber
  },
  {
    id: 'packages',
    name: 'Packages',
    route: '/modules/packages',
    icon: 'shippingbox.fill',
    category: 'Membership',
    description: 'Manage membership packages and pricing',
    color: '#8B5CF6', // Purple
  },
  {
    id: 'members',
    name: 'Members',
    route: '/modules/members',
    icon: 'person.2.fill',
    category: 'Membership',
    description: 'Manage member information and accounts',
    color: '#10B981', // Green
  },
  {
    id: 'chapters',
    name: 'Chapters',
    route: '/modules/chapters',
    icon: 'book.fill',
    category: 'Organization',
    description: 'Manage chapters with zones and locations',
    color: '#6366F1', // Indigo
  },
  {
    id: 'powerteams',
    name: 'Power Teams',
    route: '/modules/powerteams',
    icon: 'person.3.fill',
    category: 'Organization',
    description: 'Manage power teams and their categories',
    color: '#EC4899', // Pink
  },
  {
    id: 'trainings',
    name: 'Trainings',
    route: '/modules/trainings',
    icon: 'book.closed.fill',
    category: 'Education',
    description: 'Manage training schedules and sessions',
    color: '#A855F7', // Violet
  },
  {
    id: 'sitesettings',
    name: 'Site Settings',
    route: '/modules/sitesettings',
    icon: 'gearshape.fill',
    category: 'Configuration',
    description: 'Configure application settings and preferences',
    color: '#F97316', // Orange
  },
  {
    id: 'messages',
    name: 'Messages',
    route: '/modules/messages',
    icon: 'envelope.fill',
    category: 'Communication',
    description: 'Manage messages and announcements',
    color: '#F43F5E', // Rose
  },
  {
    id: 'visitors',
    name: 'Visitors',
    route: '/modules/visitors',
    icon: 'person.3',
    category: 'Events',
    description: 'Manage chapter visitors',
    color: '#0EA5E9', // Sky Blue
  },
  {
    id: 'meetings',
    name: 'Meetings',
    route: '/modules/meetings',
    icon: 'calendar',
    category: 'Events',
    description: 'Manage chapter meetings',
    color: '#FF9500', // Orange
  },
  {
    id: 'onetoone',
    name: 'One to One',
    route: '/modules/onetoone',
    icon: 'person.2',
    category: 'Networking',
    description: 'Manage one-to-one meeting requests',
    color: '#FACC15', // Yellow
  },
  {
    id: 'references',
    name: 'Give Reference',
    route: '/references',
    icon: 'person.badge.plus',
    category: 'Business',
    description: 'Give and manage references',
    color: '#10B981', // Green
  },
  {
    id: 'donedeals',
    name: 'Done Deals',
    route: '/done-deals',
    icon: 'checkmark.circle.fill',
    category: 'Business',
    description: 'Mark and track completed deals',
    color: '#22C55E', // Success Green
  },
  {
    id: 'requirements',
    name: 'Requirements',
    route: '/modules/requirements',
    icon: 'list.bullet.clipboard',
    category: 'Business',
    description: 'View member requirements',
    color: '#8B5CF6', // Purple
  },
];

export default function ModulesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { hasChapterAccess } = useUserRole();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

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

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(filteredModules.map(m => m.category)))];

  // Filter by selected category
  const displayedModules = selectedCategory === 'All' 
    ? filteredModules 
    : filteredModules.filter(m => m.category === selectedCategory);

  // Group modules by category for display
  const groupedModules = displayedModules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  function renderModuleCard(item: Module) {
    const screenWidth = Dimensions.get('window').width;
    const padding = 16 * 2; // Total horizontal padding from scrollContent
    const gap = 12; // Gap between cards
    const cardWidth = (screenWidth - padding - gap * 2) / 3;

    return (
      <TouchableOpacity 
        key={item.id}
        style={[
          styles.gridCard, 
          { 
            backgroundColor: colors.card, 
            borderColor: colors.border,
            width: cardWidth,
          }
        ]} 
        onPress={() => router.push(item.route as any)}
        activeOpacity={0.7}
      >
        <View style={[styles.gridIconContainer, { backgroundColor: item.color + '1A' }]}>
          <IconSymbol name={item.icon as any} size={20} color={item.color} />
        </View>
        <Text style={[styles.gridModuleName, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  }


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingTop: insets.top || 16,
            paddingBottom: (Platform.OS === 'ios' ? 100 : 80) + insets.bottom
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>Modules</Text>
          <Text style={[styles.subtitle, { color: colors.placeholder }]}>
            Manage and access all available modules
          </Text>
        </View>

        {/* Modules Grid */}
        <View style={styles.gridContainer}>
          {filteredModules.map(module => renderModuleCard(module))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  gridCard: {
    minHeight: 96,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  gridIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridModuleName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
