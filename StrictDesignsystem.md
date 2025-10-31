# BBNG App Design System - AI Refactoring Instructions

**Purpose:** This document provides instructions for converting any component/screen in the BBNG app to match the modern design system.

---

## Core Design Rules

### 1. Color System (ALWAYS USE THESE)

```typescript
// REQUIRED COLORS - Use these exact values
COLORS = {
  // Backgrounds
  bg_primary: '#0F172A',      // Main screen background
  bg_secondary: '#1E293B',    // Card background
  bg_tertiary: '#334155',     // Tertiary surfaces
  
  // Primary & Semantic
  primary: '#8B5CF6',         // Purple - main actions
  success: '#10B981',         // Green - positive/received
  warning: '#F59E0B',         // Amber - attention
  info: '#06B6D4',           // Cyan - informational
  error: '#EF4444',          // Red - destructive
  
  // Text
  text_primary: '#FFFFFF',    // Main text
  text_secondary: '#CBD5E1',  // Secondary text
  text_tertiary: '#94A3B8',   // Tertiary text
  text_quaternary: '#64748B', // Labels, meta text
  
  // Borders
  border: 'rgba(255, 255, 255, 0.05)',      // Subtle
  border_emphasis: 'rgba(255, 255, 255, 0.1)', // Default
  
  // Gradients
  gradient_header: ['#1F2937', '#111827'],
  gradient_primary: ['#8B5CF6', '#7C3AED'],
}

// Icon backgrounds - append opacity to color
color + '20'  // e.g., '#8B5CF620' for 20% opacity
color + '15'  // e.g., '#8B5CF615' for 15% opacity
```

### 2. Typography Rules

```typescript
// Font sizes and weights - ALWAYS USE THESE
TYPOGRAPHY = {
  display: { size: 36, weight: '800', lineHeight: 42, letterSpacing: -1 },
  h1: { size: 28, weight: '800', lineHeight: 34, letterSpacing: -0.5 },
  h2: { size: 24, weight: '700', lineHeight: 30, letterSpacing: -0.5 },
  h3: { size: 20, weight: '700', lineHeight: 26, letterSpacing: -0.3 },
  h4: { size: 18, weight: '700', lineHeight: 24, letterSpacing: -0.3 },
  body: { size: 14, weight: '400', lineHeight: 20 },
  bodySemibold: { size: 14, weight: '600', lineHeight: 20 },
  small: { size: 12, weight: '500', lineHeight: 16 },
  label: { size: 11, weight: '600', lineHeight: 14, letterSpacing: 0.5, uppercase: true },
  button: { size: 14, weight: '700', lineHeight: 20 },
}
```

### 3. Spacing (8pt Grid)

```typescript
// ONLY use these spacing values
SPACING = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64]

// Common usage
padding: 20           // Container padding
gap: 12              // Grid/flex gap
marginBottom: 24     // Section spacing
```

### 4. Border Radius

```typescript
RADIUS = {
  sm: 8,    // Badges, tags
  md: 12,   // Inputs, small cards
  lg: 16,   // Standard cards, buttons
  xl: 20,   // Large cards
  '2xl': 24, // Hero sections
  full: 9999, // Circular
}
```

### 5. Shadows (Platform-Specific)

```typescript
// ALWAYS use platform-specific shadows
SHADOW = {
  small: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
      android: { elevation: 1 }
    })
  },
  medium: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 }
    })
  },
  large: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 4 }
    })
  },
}
```

---

## Component Patterns (FOLLOW THESE STRUCTURES)

### Pattern 1: Standard Card

```typescript
// Structure
<View style={styles.card}>
  {/* Content */}
</View>

// Required Styles
card: {
  backgroundColor: '#1E293B',
  borderRadius: 16,
  padding: 16,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.05)',
  ...SHADOW.medium,
}
```

### Pattern 2: Stat Card (2-column grid)

```typescript
// Structure
<View style={styles.statCard}>
  <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
    <IconSymbol name="icon" size={20} color={color} />
  </View>
  <Text style={styles.statValue}>{value}</Text>
  <Text style={styles.statLabel}>{label}</Text>
</View>

// Required Styles
statCard: {
  flex: 1,
  minWidth: '48%',
  maxWidth: '48%',
  backgroundColor: '#1E293B',
  borderRadius: 16,
  padding: 16,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.05)',
  ...SHADOW.medium,
},
iconContainer: {
  width: 40,
  height: 40,
  borderRadius: 20,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 12,
},
statValue: {
  fontSize: 18,
  fontWeight: '700',
  color: '#FFFFFF',
  marginBottom: 4,
  letterSpacing: -0.3,
},
statLabel: {
  fontSize: 11,
  fontWeight: '600',
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  textAlign: 'center',
},
```

### Pattern 3: Primary Button with Gradient

```typescript
// Structure
<Pressable
  style={({ pressed }) => [
    styles.primaryButton,
    pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }
  ]}
  onPress={onPress}
>
  <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.buttonGradient}>
    <Text style={styles.buttonText}>Button Text</Text>
  </LinearGradient>
</Pressable>

// Required Styles
primaryButton: {
  borderRadius: 16,
  overflow: 'hidden',
  shadowColor: '#8B5CF6',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 4,
},
buttonGradient: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  paddingVertical: 14,
  paddingHorizontal: 20,
},
buttonText: {
  fontSize: 14,
  fontWeight: '700',
  color: '#FFFFFF',
},
```

### Pattern 4: List Item

```typescript
// Structure
<View style={styles.listItem}>
  <View style={[styles.itemIcon, { backgroundColor: color + '15' }]}>
    <IconSymbol name="icon" size={20} color={color} />
  </View>
  <View style={styles.itemContent}>
    <Text style={styles.itemTitle}>{title}</Text>
    <Text style={styles.itemSubtitle}>{subtitle}</Text>
  </View>
  <Text style={styles.itemMeta}>{meta}</Text>
</View>

// Required Styles
listItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255, 255, 255, 0.05)',
},
itemIcon: {
  width: 36,
  height: 36,
  borderRadius: 18,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
},
itemContent: {
  flex: 1,
},
itemTitle: {
  fontSize: 14,
  fontWeight: '600',
  color: '#FFFFFF',
  marginBottom: 2,
},
itemSubtitle: {
  fontSize: 12,
  color: '#94A3B8',
},
itemMeta: {
  fontSize: 12,
  color: '#64748B',
  fontWeight: '600',
},
```

### Pattern 5: Gradient Header

```typescript
// Structure
<LinearGradient colors={['#1F2937', '#111827']} style={styles.header}>
  <View style={styles.headerContent}>
    <Text style={styles.headerTitle}>Title</Text>
    {/* Optional badge or button */}
  </View>
</LinearGradient>

// Required Styles
header: {
  paddingTop: 60,
  paddingHorizontal: 20,
  paddingBottom: 32,
  borderBottomLeftRadius: 32,
  borderBottomRightRadius: 32,
},
headerContent: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
headerTitle: {
  fontSize: 28,
  fontWeight: '800',
  color: '#FFFFFF',
  letterSpacing: -0.5,
},
```

### Pattern 6: Section Header with Badge

```typescript
// Structure
<View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>Title</Text>
  <View style={styles.badge}>
    <Text style={styles.badgeText}>BADGE</Text>
  </View>
</View>

// Required Styles
sectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
  marginTop: 8,
},
sectionTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#FFFFFF',
  letterSpacing: -0.3,
},
badge: {
  backgroundColor: '#8B5CF615',
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 8,
},
badgeText: {
  fontSize: 10,
  fontWeight: '700',
  color: '#8B5CF6',
  letterSpacing: 0.5,
  textTransform: 'uppercase',
},
```

---

## Animation Rules (MANDATORY)

### 1. Screen Entrance Animation

```typescript
// ALWAYS add fade-in to screens
const [fadeAnim] = useState(new Animated.Value(0));

useEffect(() => {
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 600,
    useNativeDriver: true,
  }).start();
}, []);

// Wrap main content
<Animated.View style={{ opacity: fadeAnim }}>
  {/* Content */}
</Animated.View>
```

### 2. Card/Component Mount Animation

```typescript
// Use spring for scale animations
const [scaleAnim] = useState(new Animated.Value(0.9));

useEffect(() => {
  Animated.spring(scaleAnim, {
    toValue: 1,
    delay: index * 60,  // Stagger if in a list
    friction: 8,
    tension: 40,
    useNativeDriver: true,
  }).start();
}, []);

// Apply
<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
  {/* Content */}
</Animated.View>
```

### 3. List Item Animation (Staggered)

```typescript
// ALWAYS animate list items with stagger
const [slideAnim] = useState(new Animated.Value(20));
const [fadeAnim] = useState(new Animated.Value(0));

useEffect(() => {
  Animated.parallel([
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      delay: index * 50,  // Stagger delay
      useNativeDriver: true,
    }),
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }),
  ]).start();
}, []);

// Apply
<Animated.View
  style={{
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  }}
>
  {/* Item content */}
</Animated.View>
```

### 4. Press Feedback (REQUIRED for all interactive elements)

```typescript
// Use Pressable with press state
<Pressable
  style={({ pressed }) => [
    styles.element,
    pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }
  ]}
  onPress={onPress}
>
  {/* Content */}
</Pressable>
```

---

## Refactoring Instructions

### Step 1: Analyze Component
Identify:
- Component type (screen, card, list, form, etc.)
- Data being displayed
- Actions available
- Current layout structure

### Step 2: Convert Container

```typescript
// ALWAYS use this base structure
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',  // REQUIRED
  },
});
```

### Step 3: Apply Pattern
Choose the appropriate pattern from above based on:
- **Header needed?** → Use Pattern 5 (Gradient Header)
- **Stats/metrics?** → Use Pattern 2 (Stat Card)
- **List of items?** → Use Pattern 4 (List Item)
- **Actions?** → Use Pattern 3 (Primary Button)
- **Sections?** → Use Pattern 6 (Section Header)

### Step 4: Add Animations
1. Screen entrance: Fade in (600ms)
2. Cards/components: Scale spring with stagger
3. List items: Slide + fade with stagger (50ms per item)
4. All pressables: opacity 0.8 + scale 0.97 on press

### Step 5: Verify Colors
Check EVERY color in the component:
- ✅ Backgrounds must be #0F172A or #1E293B
- ✅ Text must be #FFFFFF, #CBD5E1, #94A3B8, or #64748B
- ✅ Borders must be rgba(255, 255, 255, 0.05) or 0.1
- ✅ Colored elements use exact semantic colors
- ✅ Icon backgrounds use color + '20' or '15'

### Step 6: Apply Typography
- ✅ All font sizes match TYPOGRAPHY values
- ✅ All weights are '400', '500', '600', '700', or '800'
- ✅ Letter spacing applied where specified
- ✅ Line height set correctly

### Step 7: Check Spacing
- ✅ All padding/margin values are from SPACING array
- ✅ Consistent gap: 12 for grids
- ✅ Container padding: 20
- ✅ Section margin: 24

---

## Grid Layouts

### 2-Column Grid (Stat Cards)
```typescript
<View style={styles.grid}>
  {items.map((item, i) => (
    <StatCard key={item.id} {...item} index={i} />
  ))}
</View>

grid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12,
},
// StatCard must have: flex: 1, minWidth: '48%', maxWidth: '48%'
```

### 3-Column Grid (Category Cards)
```typescript
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 3;  // 20px padding * 2 + 12px gap * 2

<View style={styles.grid}>
  {items.map((item, i) => (
    <CategoryCard key={item.id} {...item} index={i} />
  ))}
</View>

grid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12,
},
// CategoryCard must have: width: CARD_WIDTH
```

### Horizontal Scroll
```typescript
<FlatList
  horizontal
  data={items}
  renderItem={({ item, index }) => <Item item={item} index={index} />}
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ paddingVertical: 8, gap: 12 }}
/>
```

---

## Critical Rules (NEVER VIOLATE)

1. **ALWAYS use useNativeDriver: true** for opacity and transform animations
2. **NEVER use useNativeDriver** for width, height, or layout animations
3. **ALWAYS use Platform.select** for shadows (iOS) and elevation (Android)
4. **ALWAYS use LinearGradient** from 'expo-linear-gradient' for gradients
5. **ALWAYS use Pressable** not TouchableOpacity (for press feedback)
6. **ALWAYS stagger list animations** by index * 50ms
7. **ALWAYS use exact color values** from COLORS (no custom colors)
8. **ALWAYS use 8pt grid** for all spacing (only values from SPACING array)
9. **ALWAYS add borderColor** when using borderWidth
10. **ALWAYS set backgroundColor** when using shadows/elevation

---

## Common Mistakes to Avoid

❌ `backgroundColor: 'white'` → ✅ `backgroundColor: '#FFFFFF'`
❌ `fontSize: 15` → ✅ `fontSize: 14` or `fontSize: 16`
❌ `padding: 10` → ✅ `padding: 8` or `padding: 12`
❌ `borderRadius: 10` → ✅ `borderRadius: 12`
❌ `TouchableOpacity` → ✅ `Pressable`
❌ `fontWeight: 'bold'` → ✅ `fontWeight: '700'`
❌ Custom colors → ✅ Use COLORS from system
❌ No animations → ✅ Always add animations
❌ Missing borders on cards → ✅ Add borderWidth: 1 with borderColor

---

## Example: Converting a Simple List Screen

**BEFORE:**
```typescript
<View style={{ flex: 1, padding: 16 }}>
  <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Items</Text>
  {items.map(item => (
    <TouchableOpacity key={item.id} style={{ padding: 12, borderBottomWidth: 1 }}>
      <Text>{item.name}</Text>
    </TouchableOpacity>
  ))}
</View>
```

**AFTER:**
```typescript
const [fadeAnim] = useState(new Animated.Value(0));

useEffect(() => {
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 600,
    useNativeDriver: true,
  }).start();
}, []);

return (
  <View style={styles.container}>
    <LinearGradient colors={['#1F2937', '#111827']} style={styles.header}>
      <Text style={styles.headerTitle}>Items</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{items.length} TOTAL</Text>
      </View>
    </LinearGradient>
    
    <Animated.FlatList
      data={items}
      renderItem={({ item, index }) => <ListItem item={item} index={index} />}
      contentContainerStyle={styles.listContent}
      style={{ opacity: fadeAnim }}
    />
  </View>
);

const ListItem = ({ item, index }) => {
  const [slideAnim] = useState(new Animated.Value(20));
  const [fadeAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 50, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);
  
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.listItem,
          pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }
        ]}
      >
        <View style={[styles.itemIcon, { backgroundColor: '#8B5CF620' }]}>
          <IconSymbol name="circle.fill" size={20} color="#8B5CF6" />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{item.name}</Text>
          <Text style={styles.itemSubtitle}>{item.description}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: '#8B5CF620',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B5CF6',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  listContent: {
    padding: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 }
    }),
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
```

---

## Quick Checklist for AI

When refactoring any component, verify:
- [ ] Container background is #0F172A for dark and equvivalant for light mode
- [ ] Card backgrounds are #1E293B and equvivalant for light mode
- [ ] All colors from COLORS system
- [ ] All font sizes from TYPOGRAPHY
- [ ] All spacing from SPACING array
- [ ] All radius from RADIUS
- [ ] Platform-specific shadows
- [ ] Screen fade-in animation (600ms)
- [ ] Component scale animations (staggered 60ms)
- [ ] List item animations (staggered 50ms)
- [ ] Pressable feedback on all interactive elements
- [ ] LinearGradient for headers
- [ ] Proper icon containers with color + '20'
- [ ] Border radius: 16 for cards, 20 for buttons
- [ ] Padding: 20 for containers, 16 for cards

---

**This document contains all rules needed to convert any component to the new design system. Follow every rule strictly.**