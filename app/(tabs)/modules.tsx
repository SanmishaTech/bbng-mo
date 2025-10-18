import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';

interface Module {
  id: string;
  name: string;
  route: string;
  icon: string;
  category: string;
  roles?: string[]; // If specified, only these roles can access
  description?: string;
}

const modules: Module[] = [
  // Core Modules
  {
    id: 'meetings',
    name: 'Meetings',
    route: '/modules/meetings',
    icon: 'calendar',
    category: 'Core',
    description: 'View and manage chapter meetings',
  },
  {
    id: 'chapters',
    name: 'Chapters',
    route: '/modules/chapters',
    icon: 'building.2',
    category: 'Core',
    description: 'Manage chapters and transactions',
  },
  {
    id: 'onetoone',
    name: 'One-to-One',
    route: '/modules/onetoone',
    icon: 'person.2',
    category: 'Core',
    description: 'Schedule one-to-one meetings',
  },
  
  // Member Management
  {
    id: 'members',
    name: 'Members',
    route: '/modules/members',
    icon: 'person.3',
    category: 'Members',
    description: 'View and manage members',
  },
  {
    id: 'member-search',
    name: 'Member Search',
    route: '/modules/members/search',
    icon: 'magnifyingglass',
    category: 'Members',
    description: 'Search for members',
  },
  {
    id: 'visitors',
    name: 'Visitors',
    route: '/modules/visitors',
    icon: 'person.badge.plus',
    category: 'Members',
    description: 'Manage chapter visitors',
  },
  
  // Communication
  {
    id: 'messages',
    name: 'Messages',
    route: '/modules/messages',
    icon: 'envelope',
    category: 'Communication',
    description: 'View announcements and messages',
  },
  {
    id: 'trainings',
    name: 'Trainings',
    route: '/modules/trainings',
    icon: 'book',
    category: 'Communication',
    description: 'View training sessions',
  },
  
  // Business
  {
    id: 'requirements',
    name: 'Requirements',
    route: '/modules/requirements',
    icon: 'list.bullet',
    category: 'Business',
    description: 'Manage business requirements',
  },
  {
    id: 'powerteams',
    name: 'Power Teams',
    route: '/modules/powerteams',
    icon: 'person.3.fill',
    category: 'Business',
    description: 'Manage power team groups',
  },
  
  // Reports
  {
    id: 'member-reports',
    name: 'Member Reports',
    route: '/modules/reports/members',
    icon: 'chart.bar',
    category: 'Reports',
    description: 'View member performance reports',
  },
  {
    id: 'transaction-reports',
    name: 'Transaction Reports',
    route: '/modules/reports/transactions',
    icon: 'dollarsign.circle',
    category: 'Reports',
    description: 'View financial transactions',
  },
  {
    id: 'membership-reports',
    name: 'Membership Reports',
    route: '/modules/reports/memberships',
    icon: 'doc.text',
    category: 'Reports',
    description: 'View membership status',
  },
  
  // Admin Only
  {
    id: 'zones',
    name: 'Zones',
    route: '/modules/admin/zones',
    icon: 'map',
    category: 'Admin',
    roles: ['admin'],
    description: 'Manage geographical zones',
  },
  {
    id: 'categories',
    name: 'Categories',
    route: '/modules/admin/categories',
    icon: 'tag',
    category: 'Admin',
    roles: ['admin'],
    description: 'Manage business categories',
  },
  {
    id: 'packages',
    name: 'Packages',
    route: '/modules/admin/packages',
    icon: 'gift',
    category: 'Admin',
    roles: ['admin'],
    description: 'Manage membership packages',
  },
  {
    id: 'memberships',
    name: 'Memberships',
    route: '/modules/admin/memberships',
    icon: 'creditcard',
    category: 'Admin',
    roles: ['admin'],
    description: 'Manage member subscriptions',
  },
  {
    id: 'users',
    name: 'Users',
    route: '/modules/admin/users',
    icon: 'person.crop.circle',
    category: 'Admin',
    roles: ['admin'],
    description: 'Manage user accounts',
  },
];

export default function ModulesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Filter modules based on user role
  const filteredModules = modules.filter(module => {
    if (module.roles && module.roles.length > 0) {
      return module.roles.includes(user?.role || '');
    }
    return true;
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
    return (
      <TouchableOpacity 
        key={item.id}
        style={[styles.moduleCard, { backgroundColor: colors.card, borderColor: colors.border }]} 
        onPress={() => router.push(item.route as any)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <IconSymbol name={item.icon as any} size={28} color={colors.primary} />
        </View>
        <View style={styles.moduleInfo}>
          <Text style={[styles.moduleName, { color: colors.text }]}>{item.name}</Text>
          {item.description && (
            <Text style={[styles.moduleDescription, { color: colors.placeholder }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        <IconSymbol name="chevron.right" size={20} color={colors.icon} />
      </TouchableOpacity>
    );
  }

  function renderCategorySection(category: string, categoryModules: Module[]) {
    if (selectedCategory !== 'All') return null;
    
    return (
      <View key={category} style={styles.categorySection}>
        <Text style={[styles.categoryTitle, { color: colors.text }]}>{category}</Text>
        {categoryModules.map(module => renderModuleCard(module))}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Modules</Text>
        <Text style={styles.headerSubtitle}>Explore all features and tools</Text>
      </View>
      
      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && { backgroundColor: colors.primary },
              { borderColor: colors.border },
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category 
                  ? { color: 'white' } 
                  : { color: colors.text },
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modules List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {selectedCategory === 'All' ? (
          Object.entries(groupedModules).map(([category, categoryModules]) =>
            renderCategorySection(category, categoryModules)
          )
        ) : (
          displayedModules.map(module => renderModuleCard(module))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  categoryFilter: {
    maxHeight: 60,
    marginTop: 16,
  },
  categoryFilterContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 16,
  },
  categorySection: {
    marginBottom: 28,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  moduleInfo: {
    flex: 1,
    marginRight: 12,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  moduleDescription: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.75,
  },
  // Legacy styles kept for compatibility
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 15,
    borderRadius: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemText: {
    marginLeft: 15,
    fontSize: 18,
    fontWeight: '600',
  },
});
