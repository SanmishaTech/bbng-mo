# React Native Routing Structure

This document explains the routing structure for the React Native mobile app, which is based on Expo Router and file-based routing.

## Overview

The mobile app uses **Expo Router** (file-based routing) instead of React Router DOM (used in web). The routing structure is organized as follows:

```
app/
├── _layout.tsx              # Root layout with auth handling
├── login.tsx               # Login screen
├── (tabs)/                 # Tab-based navigation
│   ├── _layout.tsx         # Tab layout configuration
│   ├── index.tsx           # Dashboard (Home tab)
│   ├── modules.tsx         # Modules hub
│   ├── performance.tsx     # Performance metrics
│   ├── profile.tsx         # User profile
│   ├── references.tsx      # References list
│   └── settings.tsx        # Settings
├── modules/                # Feature modules
│   ├── meetings/
│   ├── chapters/
│   ├── onetoone/
│   ├── members/
│   ├── visitors/
│   └── ...
├── references/             # Reference management
└── done-deals/            # Thank you slips
```

## Key Differences from Web

### Web (React Router DOM)
```jsx
<Route path="/members" element={<Members />} />
```

### Mobile (Expo Router)
```
app/modules/members/index.tsx  → /modules/members
app/modules/members/[id].tsx   → /modules/members/:id
```

## Module Categories

The app organizes features into these categories:

### 1. Core Modules
- **Meetings**: Chapter meeting management
- **Chapters**: Chapter information and transactions
- **One-to-One**: Schedule 1-on-1 meetings

### 2. Member Management
- **Members**: View and manage member list
- **Member Search**: Search for specific members
- **Visitors**: Track meeting visitors

### 3. Communication
- **Messages**: View announcements
- **Trainings**: Access training materials

### 4. Business
- **Requirements**: Manage business needs
- **Power Teams**: Organize power team groups

### 5. Reports
- **Member Reports**: Member performance analytics
- **Transaction Reports**: Financial tracking
- **Membership Reports**: Subscription status

### 6. Admin (Admin Role Only)
- **Zones**: Manage geographical zones
- **Categories**: Business category management
- **Packages**: Membership package management
- **Memberships**: Subscription management
- **Users**: User account management

## Adding a New Module

### Step 1: Add to modules.tsx

```tsx
const modules: Module[] = [
  // ... existing modules
  {
    id: 'your-module',
    name: 'Your Module',
    route: '/modules/your-module',
    icon: 'star',  // SF Symbols icon
    category: 'Core',  // or Members, Communication, Business, Reports, Admin
    description: 'Brief description of the module',
    roles: ['admin'],  // Optional: restrict to specific roles
  },
];
```

### Step 2: Create the module directory

```bash
mkdir -p app/modules/your-module
```

### Step 3: Create index.tsx (list view)

```tsx
// app/modules/your-module/index.tsx
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { NavigationHeader } from '@/components/NavigationHeader';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function YourModuleScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={styles.container}>
      <NavigationHeader title="Your Module" />
      {/* Your content here */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

### Step 4: Create detail screen (optional)

```tsx
// app/modules/your-module/[id].tsx
import React from 'react';
import { useLocalSearchParams } from 'expo-router';

export default function YourModuleDetailScreen() {
  const { id } = useLocalSearchParams();
  
  // Your detail view implementation
}
```

### Step 5: Register in root layout

```tsx
// app/_layout.tsx
<Stack>
  {/* ... existing screens */}
  <Stack.Screen name="modules/your-module" options={{ headerShown: false }} />
</Stack>
```

## Navigation Patterns

### Navigate to a screen
```tsx
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/modules/your-module');
```

### Navigate with parameters
```tsx
router.push(`/modules/your-module/${id}`);
router.push({
  pathname: '/modules/your-module/[id]',
  params: { id: '123' }
});
```

### Go back
```tsx
router.back();
```

### Replace current screen
```tsx
router.replace('/modules/your-module');
```

## Role-Based Access Control

Modules can be restricted by role:

```tsx
{
  id: 'admin-only',
  name: 'Admin Feature',
  route: '/modules/admin/feature',
  roles: ['admin'],  // Only admins can see this
}
```

The filtering happens automatically in `modules.tsx`:

```tsx
const filteredModules = modules.filter(module => {
  if (module.roles && module.roles.length > 0) {
    return module.roles.includes(user?.role || '');
  }
  return true;
});
```

## UI Consistency Guidelines

### 1. Use ThemedComponents
```tsx
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
```

### 2. Use NavigationHeader
```tsx
<NavigationHeader 
  title="Screen Title"
  rightComponent={<CustomButton />}  // Optional
/>
```

### 3. Use Colors from theme
```tsx
const colorScheme = useColorScheme();
const colors = Colors[colorScheme ?? 'light'];

<View style={{ backgroundColor: colors.background }} />
```

### 4. Common styling patterns
```tsx
// Card style
{
  backgroundColor: colors.card,
  borderColor: colors.border,
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
}

// Button style
{
  backgroundColor: colors.primary,
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 8,
}
```

### 5. Use IconSymbol for icons
```tsx
import { IconSymbol } from '@/components/ui/IconSymbol';

<IconSymbol name="star" size={24} color={colors.primary} />
```

## Complete Module Example

Here's a full example of a module with list and detail views:

### List View (index.tsx)
```tsx
import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { NavigationHeader } from '@/components/NavigationHeader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { apiService } from '@/services/apiService';

interface Item {
  id: string;
  name: string;
  description: string;
}

export default function ItemListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const response = await apiService.get('/api/items');
      setItems(response.data);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  }

  function renderItem({ item }: { item: Item }) {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push(`/modules/items/${item.id}`)}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <IconSymbol name="star" size={24} color={colors.primary} />
        </View>
        <View style={styles.content}>
          <ThemedText style={styles.title}>{item.name}</ThemedText>
          <ThemedText style={styles.description}>{item.description}</ThemedText>
        </View>
        <IconSymbol name="chevron.right" size={20} color={colors.icon} />
      </TouchableOpacity>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <NavigationHeader 
        title="Items" 
        rightComponent={
          <TouchableOpacity onPress={() => router.push('/modules/items/create')}>
            <IconSymbol name="plus" size={24} color={colors.primary} />
          </TouchableOpacity>
        }
      />
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadItems}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
  },
});
```

### Detail View ([id].tsx)
```tsx
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { apiService } from '@/services/apiService';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItem();
  }, [id]);

  async function loadItem() {
    try {
      const response = await apiService.get(`/api/items/${id}`);
      setItem(response.data);
    } catch (error) {
      console.error('Error loading item:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <NavigationHeader title={item?.name || 'Detail'} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <ThemedText style={styles.label}>Name</ThemedText>
          <ThemedText style={styles.value}>{item?.name}</ThemedText>
        </View>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <ThemedText style={styles.label}>Description</ThemedText>
          <ThemedText style={styles.value}>{item?.description}</ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
});
```

## Testing Navigation

```bash
# Run the app
npx expo start

# Test navigation
# 1. Login
# 2. Go to Modules tab
# 3. Select a module category
# 4. Tap on a module card
# 5. Verify navigation works
```

## Common Issues & Solutions

### Issue: Route not found
**Solution**: Ensure the file structure matches the route path and the screen is registered in `_layout.tsx`

### Issue: Navigation doesn't work
**Solution**: Use `router.push()` instead of direct navigation. Ensure the route path starts with `/`

### Issue: Params not received
**Solution**: Use `useLocalSearchParams()` from `expo-router`, not `useParams` from React Router

### Issue: Module not visible
**Solution**: Check if the module has role restrictions and ensure the user has the required role

## Web vs Mobile Route Mapping

| Web Route | Mobile Route |
|-----------|-------------|
| `/dashboard` | `/(tabs)/` |
| `/members` | `/modules/members` |
| `/members/:id/edit` | `/modules/members/[id]/edit` |
| `/references` | `/(tabs)/references` or `/references` |
| `/references/:id` | `/references/detail?id=:id` |
| `/one-to-ones` | `/modules/onetoone` |

## Additional Resources

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Navigation Docs](https://reactnavigation.org/)
- [SF Symbols (Icons)](https://developer.apple.com/sf-symbols/)

---

**Last Updated**: October 2025
**Maintainer**: Development Team
