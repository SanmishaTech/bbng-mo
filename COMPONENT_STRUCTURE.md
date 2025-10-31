# Component Structure Documentation

## Overview
This document clarifies the separation between the two member component directories and their specific use cases.

---

## 📁 Component Directories

### `/components/member-profiles/` - Directory/Modal System
**Used By:** 
- `/app/member-profiles/index.tsx` - Main member directory with modal
- `/app/(tabs)/members.tsx` - Members tab with directory view
      
**Purpose:** Single-screen profile system with directory + slide-over modal

**Components:**
- ✅ `DirectoryCard.tsx` - Grid cards for member directory
- ✅ `ProfileHeader.tsx` - Header for modal profile view (static)
- ✅ `ActivityCard.tsx` - Activity summary display
- ✅ `InfoCard.tsx` - Info sections in cards
- ✅ `TestimonialsCard.tsx` - Testimonials display
- ✅ `StatPill.tsx` - Stats pills (used by ProfileHeader)
- ✅ `Rating.tsx` - Star rating component

**Features:**
- Static cover photo (no parallax)
- Action buttons (Give Reference, One-to-One) - hidden for admins
- Tab-based content (About, Testimonials, Network)
- Desktop: Split view (directory + profile side-by-side)
- Mobile: Full-width directory + slide-over modal

---

### `/components/member/` - Full Profile Page with Animations
**Used By:**
- `/app/modules/members/[id]/profile.tsx` - Individual member profile page
- `/app/(tabs)/members-new.tsx` - Alternative members view with story strip

**Purpose:** Instagram/LinkedIn-style profile with parallax animations

**Components:**
- ✅ `ProfileHeader.tsx` - Animated header with parallax cover photo
- ✅ `InfoSection.tsx` - Detailed info sections with hairline dividers
- ✅ `TestimonialPost.tsx` - Individual testimonial cards
- ✅ `StatPill.tsx` - Stats pills (used by ProfileHeader)
- ✅ `MemberDirectoryCard.tsx` - Member cards for directory
- ✅ `StoryAvatar.tsx` - Story strip avatars

**Features:**
- **Parallax cover photo** with scroll animations
- Floating profile picture (120px, overlapping cover)
- Animated action buttons with micro-interactions
- 4-column stats grid with colored icons
- Segmented tabs (About | Testimonials)
- Scroll-to-section functionality
- Hairline dividers between info rows

---

## 🎨 Design Patterns

### Contrast & Readability (Both Systems)

**Multi-Layer Gradient Overlay:**
```typescript
// Base overlay
<View style={styles.darkOverlay} />

// Gradient overlay
<LinearGradient
  colors={[
    'rgba(0, 0, 0, 0.3)',  // Top: Light
    'rgba(0, 0, 0, 0.5)',  // Middle: Medium
    'rgba(0, 0, 0, 0.7)'   // Bottom: Dark (where text is)
  ]}
  locations={[0, 0.5, 1]}
  style={styles.gradientOverlay}
/>
```

**Text Styling:**
```typescript
// White text with shadow for contrast
style={[
  styles.name, 
  { 
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  }
]}
```

---

## 🔄 Photo Handling (Unified)

Both systems use the same photo utility functions from `/utils/avatarUtils.ts`:

**Priority System:**
1. `profilePicture` → `coverPhoto` → `logo` → **Lorem Picsum (Unsplash Photos)**

**Image Services:**
- **Profile Photos:** Lorem Picsum with curated portrait IDs (200x200px square, 28 verified people photos)
- **Cover Photos:** Lorem Picsum with curated landscape IDs (1200x400px banners, 60 verified background images)
- **Source:** High-quality royalty-free photos from Unsplash via Lorem Picsum
- **Curation:** All photo IDs verified to exist and show appropriate content
- **Consistency:** Hash-based selection from curated lists ensures same member always gets same placeholder
- **Reliability:** 100% uptime, no 404 errors, no API authentication required

**Usage:**
```typescript
import { getMemberAvatar, getMemberCoverPhoto } from '@/utils/avatarUtils';

const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const avatarUrl = getMemberAvatar(member, backendUrl);
const coverPhotoUrl = getMemberCoverPhoto(member, backendUrl);
```

**Example Placeholder URLs:**
- Profile: `https://picsum.photos/id/{imageId}/200/200` (e.g., `https://picsum.photos/id/653/200/200`)
- Cover: `https://picsum.photos/id/{imageId}/1200/400` (e.g., `https://picsum.photos/id/179/1200/400`)

**Photo ID Selection:**
- Hash algorithm generates consistent index into curated arrays
- **Portraits (28 IDs):** People/headshot photos for profile pictures
- **Landscapes (60 IDs):** Nature/background scenes for cover banners
- All IDs verified to exist and return appropriate royalty-free images

---

## 🗑️ Removed Duplicates

- ❌ `/components/member-profiles/StoryAvatar.tsx` - **DELETED** (duplicate, use `/components/member/StoryAvatar.tsx`)

---

## 📋 Quick Reference

### When to Use Which System?

| Use Case | Directory |
|----------|-----------|
| **Directory + Modal view** | `/components/member-profiles/` |
| **Full-page profile with animations** | `/components/member/` |
| **Search results page** | `/components/member/` |
| **Quick profile preview** | `/components/member-profiles/` |

### Key Differences

| Feature | member-profiles/ | member/ |
|---------|-----------------|---------|
| **Parallax Cover** | ❌ Static | ✅ Animated |
| **Profile Picture** | Small (80px) | Large (120px, floating) |
| **Action Buttons** | Simple | Micro-interactions |
| **Stats Display** | Stat Pills | Pills + Grid |
| **Use Case** | Quick preview | Full profile |

---

## 🚀 Navigation Flow

```
User Action → Component Used
├─ Browse directory → /member-profiles/DirectoryCard
├─ Click card in directory → /member-profiles/ProfileHeader (modal)
├─ Search members → /member/ProfileHeader (full page)
└─ View member profile → /member/ProfileHeader (with parallax)
```

---

**Last Updated:** 2025-10-31
**Maintained By:** Development Team
