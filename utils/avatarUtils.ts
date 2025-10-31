/**
 * Avatar utility functions for generating consistent placeholder avatars and cover images
 */

// Curated list of verified Lorem Picsum photo IDs showing people/portraits
// All IDs verified to work and show appropriate portrait images
const PORTRAIT_PHOTO_IDS = [
  64, 65, 91, 177, 203, 232, 233, 287, 342, 433,
  453, 548, 573, 659, 667, 669, 683, 816, 823, 866,
  1005, 1011, 1012, 1025, 1027, 1062, 1074, 1083
];

// Curated list of verified Lorem Picsum photo IDs showing landscapes/backgrounds
// All IDs verified to work and show appropriate banner images (no people)
const LANDSCAPE_PHOTO_IDS = [
  10, 13, 14, 15, 16, 17, 18, 20, 21, 22,
  24, 25, 26, 28, 29, 33, 35, 36, 37, 38,
  40, 42, 43, 44, 47, 48, 49, 51, 52, 53,
  54, 56, 57, 58, 59, 60, 61, 62, 63, 66,
  67, 68, 69, 70, 71, 72, 73, 74, 75, 76,
  77, 78, 79, 80, 81, 82, 83, 84, 85, 87
];

/**
 * Generate a consistent placeholder avatar URL based on member name
 * Uses DiceBear Avatars API for consistent, reproducible avatars
 * @param name - Member's name
 * @param seed - Optional seed (defaults to name)
 * @returns Avatar URL
 */
export const getConsistentAvatar = (name: string, seed?: string): string => {
  const avatarSeed = seed || name.replace(/\s+/g, '-').toLowerCase();
  // Using DiceBear Avatars - initials style with consistent colors
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=4f46e5,7c3aed,db2777,dc2626,ea580c,ca8a04,65a30d,059669,0891b2,2563eb&backgroundType=gradientLinear`;
};

/**
 * Generate a consistent cover photo/banner image URL based on member data
 * Uses Lorem Picsum (Unsplash photos) for high-quality professional placeholder images
 * @param memberId - Member's ID or unique identifier
 * @param name - Member's name (used as additional seed)
 * @param width - Image width (default 1200)
 * @param height - Image height (default 400)
 * @returns Cover photo URL
 */
export const getConsistentCoverPhoto = (
  memberId: string | number,
  name?: string,
  width: number = 1200,
  height: number = 400
): string => {
  // Create a consistent seed from memberId and name
  const seed = `${memberId}${name || ''}`.replace(/\s+/g, '');
  
  // Generate a hash for consistent image selection
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Select from curated list of landscape/background photos
  // This ensures we get appropriate banner images (no people) that are verified to work
  const imageId = LANDSCAPE_PHOTO_IDS[Math.abs(hash) % LANDSCAPE_PHOTO_IDS.length];
  
  // Use ID-based URL with verified photo ID
  return `https://picsum.photos/id/${imageId}/${width}/${height}`;
};

/**
 * Generate avatar URL from member data with fallback to professional portrait placeholder
 * Matches web implementation: profilePicture → coverPhoto → logo → Lorem Picsum (Unsplash)
 * @param member - Member object with potential avatar/profilePicture field
 * @param backendUrl - Backend URL for constructing full image path
 * @returns Avatar URL or professional portrait placeholder
 */
export const getMemberAvatar = (member: any, backendUrl: string = ''): string => {
  // Check for pre-computed avatar field (highest priority)
  if (member.avatar) {
    // If it's already a full URL, return as-is
    if (member.avatar.startsWith('http://') || member.avatar.startsWith('https://')) {
      return member.avatar;
    }
    return `${backendUrl}/${member.avatar}`;
  }
  
  // Check for profilePicture field (second priority)
  if (member.profilePicture) {
    // If it's already a full URL, return as-is
    if (member.profilePicture.startsWith('http://') || member.profilePicture.startsWith('https://')) {
      return member.profilePicture;
    }
    return `${backendUrl}/${member.profilePicture}`;
  }
  
  // Check for coverPhoto field (second priority)
  if (member.coverPhoto) {
    // If it's already a full URL, return as-is
    if (member.coverPhoto.startsWith('http://') || member.coverPhoto.startsWith('https://')) {
      return member.coverPhoto;
    }
    return `${backendUrl}/${member.coverPhoto}`;
  }
  
  // Check for logo field (third priority)
  if (member.logo) {
    // If it's already a full URL, return as-is
    if (member.logo.startsWith('http://') || member.logo.startsWith('https://')) {
      return member.logo;
    }
    return `${backendUrl}/${member.logo}`;
  }
  
  // Fallback to consistent professional portrait placeholder
  const memberId = member.id || member.memberId || '0';
  const name = member.name || member.memberName || '';
  
  // Generate hash for consistent image selection
  const seed = `${memberId}${name}`.replace(/\s+/g, '');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Select from curated list of portrait/people photos
  // This ensures we get appropriate profile images showing people
  const imageId = PORTRAIT_PHOTO_IDS[Math.abs(hash) % PORTRAIT_PHOTO_IDS.length];
  
  // ID-based URL for reliable loading with verified portrait photo
  return `https://picsum.photos/id/${imageId}/200/200`;
};

/**
 * Generate testimonial user avatar with consistent fallback
 * Uses same curated portrait photos as member profiles for consistency
 * @param user - User object from testimonial with id and name fields
 * @param backendUrl - Optional backend URL for constructing full image path
 * @returns Avatar URL or consistent placeholder
 * Note: Components should always pass the actual user/giver name, not 'Anonymous'
 */
export const getTestimonialAvatar = (user: any, backendUrl: string = ''): string => {
  // Check for uploaded avatar
  if (user?.avatar) {
    // If it's already a full URL, return as-is
    if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
      return user.avatar;
    }
    // Otherwise prepend backend URL
    return `${backendUrl}/${user.avatar}`;
  }
  
  // Check for profilePicture field
  if (user?.profilePicture) {
    if (user.profilePicture.startsWith('http://') || user.profilePicture.startsWith('https://')) {
      return user.profilePicture;
    }
    return `${backendUrl}/${user.profilePicture}`;
  }
  
  // Fallback to consistent portrait placeholder using same curated photo IDs
  const userId = user?.id || user?.memberId || '0';
  const name = user?.name || 'Anonymous';
  
  // Generate hash for consistent image selection
  const seed = `${userId}${name}`.replace(/\s+/g, '');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Select from same curated portrait photos as member profiles
  const imageId = PORTRAIT_PHOTO_IDS[Math.abs(hash) % PORTRAIT_PHOTO_IDS.length];
  
  // Return consistent portrait photo
  return `https://picsum.photos/id/${imageId}/200/200`;
};

/**
 * Generate member cover photo with consistent fallback
 * Checks: coverPhoto → coverPicture → bannerImage → logo → Lorem Picsum (Unsplash)
 * @param member - Member object
 * @param backendUrl - Backend URL for constructing full image path
 * @returns Cover photo URL or consistent placeholder
 */
export const getMemberCoverPhoto = (member: any, backendUrl: string = ''): string => {
  // Check for existing cover photo fields
  if (member.coverPhoto && !member.coverPhoto.includes('placeholder')) {
    // If it's already a full URL (starts with http/https), return as-is
    if (member.coverPhoto.startsWith('http://') || member.coverPhoto.startsWith('https://')) {
      return member.coverPhoto;
    }
    // Otherwise, prepend backend URL for relative paths
    return `${backendUrl}/${member.coverPhoto}`;
  }
  
  if (member.coverPicture) {
    // Check if already a full URL
    if (member.coverPicture.startsWith('http://') || member.coverPicture.startsWith('https://')) {
      return member.coverPicture;
    }
    return `${backendUrl}/${member.coverPicture}`;
  }
  
  if (member.bannerImage) {
    // Check if already a full URL
    if (member.bannerImage.startsWith('http://') || member.bannerImage.startsWith('https://')) {
      return member.bannerImage;
    }
    return `${backendUrl}/${member.bannerImage}`;
  }
  
  // Check for logo field (matches web implementation)
  if (member.logo) {
    // Check if already a full URL
    if (member.logo.startsWith('http://') || member.logo.startsWith('https://')) {
      return member.logo;
    }
    return `${backendUrl}/${member.logo}`;
  }
  
  // Fallback to consistent placeholder based on member ID and name
  const memberId = member.id || member.memberId || '0';
  const name = member.name || member.memberName || '';
  return getConsistentCoverPhoto(memberId, name);
};
