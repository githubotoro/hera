// Avatar utility functions

import { createAvatar } from '@dicebear/core';
import { shapes, identicon, bottts } from '@dicebear/collection';

export interface AvatarColors {
  background: string;
  foreground: string;
}

// Predefined color combinations for avatars
export const AVATAR_COLORS: AvatarColors[] = [
  { background: '#FF6B6B', foreground: '#FFFFFF' },
  { background: '#4ECDC4', foreground: '#FFFFFF' },
  { background: '#45B7D1', foreground: '#FFFFFF' },
  { background: '#96CEB4', foreground: '#FFFFFF' },
  { background: '#FFEAA7', foreground: '#2D3436' },
  { background: '#DDA0DD', foreground: '#FFFFFF' },
  { background: '#98D8C8', foreground: '#FFFFFF' },
  { background: '#F7DC6F', foreground: '#2D3436' },
  { background: '#BB8FCE', foreground: '#FFFFFF' },
  { background: '#85C1E9', foreground: '#FFFFFF' },
  { background: '#F8C471', foreground: '#2D3436' },
  { background: '#82E0AA', foreground: '#2D3436' },
  { background: '#F1948A', foreground: '#FFFFFF' },
  { background: '#85C1E9', foreground: '#FFFFFF' },
  { background: '#D7BDE2', foreground: '#2D3436' },
  { background: '#A9DFBF', foreground: '#2D3436' }
];

/**
 * Generate a deterministic hash from a string
 * @param str - The string to hash
 * @returns A numeric hash value
 */
export const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

/**
 * Get avatar colors based on user ID
 * @param userId - The user ID to generate colors for
 * @returns AvatarColors object with background and foreground colors
 */
export const getAvatarColors = (userId: string): AvatarColors => {
  const hash = hashString(userId);
  const colorIndex = hash % AVATAR_COLORS.length;
  return AVATAR_COLORS[colorIndex];
};

/**
 * Generate initials from user ID
 * @param userId - The user ID to generate initials from
 * @returns A string of initials (first 2 characters)
 */
export const getInitials = (userId: string): string => {
  return userId.substring(0, 2).toUpperCase();
};

/**
 * Generate a unique avatar seed based on user ID
 * @param userId - The user ID
 * @returns A numeric seed for avatar generation
 */
export const getAvatarSeed = (userId: string): number => {
  return hashString(userId);
};

/**
 * Generate DiceBear avatar with shapes style (cube-like)
 * @param userId - The user ID to use as seed
 * @param size - The size of the avatar
 * @returns Data URI of the generated avatar
 */
export const generateShapesAvatar = (userId: string, size: number = 150): string => {
  const avatar = createAvatar(shapes, {
    seed: userId,
    size: size,
    backgroundColor: ['b6e3f4', 'c0aede', 'ffdfbf', 'ffd5dc', 'ffffff'],
    radius: 0, // Sharp edges for cube-like appearance
    shape1: ['rectangle', 'rectangleFilled', 'polygon'],
    shape2: ['rectangle', 'rectangleFilled', 'polygon'],
    shape3: ['rectangle', 'rectangleFilled', 'polygon']
  });

  return avatar.toDataUri();
};

/**
 * Generate DiceBear avatar with identicon style (geometric patterns)
 * @param userId - The user ID to use as seed
 * @param size - The size of the avatar
 * @returns Data URI of the generated avatar
 */
export const generateIdenticonAvatar = (userId: string, size: number = 150): string => {
  const avatar = createAvatar(identicon, {
    seed: userId,
    size: size,
    backgroundColor: [
      'ff4f44', // red
      'ffa914', // orange
      'ffe014', // yellow
      '3ce155', // green
      '6ce0db', // mint
      '44d4ed', // teal
      '5acdfa', // cyan
      '148eff', // blue
      '6361f2', // indigo
      'cc65ff', // purple
      'ff4169', // pink
      'b69872' // brown
    ],
    radius: 0
  });

  return avatar.toDataUri();
};

/**
 * Generate DiceBear avatar with bottts style (robot-like)
 * @param userId - The user ID to use as seed
 * @param size - The size of the avatar
 * @returns Data URI of the generated avatar
 */
export const generateBotttsAvatar = (userId: string, size: number = 150): string => {
  const avatar = createAvatar(bottts, {
    seed: userId,
    size: size,
    backgroundColor: ['b6e3f4', 'c0aede', 'ffdfbf', 'ffd5dc', 'ffffff']
  });

  return avatar.toDataUri();
};
