/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const ADJECTIVES = [
  'Starlit', 'Gentle', 'Silent', 'Wandering', 'Velvet', 'Ethereal',
  'Mystic', 'Drifting', 'Solitary', 'Resilient', 'Luminous', 'Whispering',
  'Ocean', 'Ember', 'Golden', 'Autumn', 'Midnight', 'Quiet', 'Cosmic',
  'Hidden', 'Peaceful', 'Fragile', 'Radiant', 'Hollow', 'Serene'
];

const NOUNS = [
  'Wanderer', 'Echo', 'Raindrop', 'Sparrow', 'Nebula', 'Ember',
  'Horizon', 'Breeze', 'Willow', 'Tide', 'Comet', 'Solace',
  'Silhouette', 'Shadow', 'Melody', 'Haven', 'Voyager', 'Firefly',
  'Petal', 'Current', 'Compass', 'Meadow', 'Mist', 'Crest', 'Soul'
];

export const AURA_COLORS = [
  { name: 'Starlight Violet', hex: '#8B5CF6', bg: 'bg-violet-500', glow: 'shadow-violet-500/50' },
  { name: 'Deep Indigo', hex: '#6366F1', bg: 'bg-indigo-500', glow: 'shadow-indigo-500/50' },
  { name: 'Ocean Cyan', hex: '#06B6D4', bg: 'bg-cyan-500', glow: 'shadow-cyan-500/50' },
  { name: 'Aurora Teal', hex: '#14B8A6', bg: 'bg-teal-500', glow: 'shadow-teal-500/50' },
  { name: 'Forest Emerald', hex: '#10B981', bg: 'bg-emerald-500', glow: 'shadow-emerald-500/50' },
  { name: 'Golden Sol', hex: '#F59E0B', bg: 'bg-amber-500', glow: 'shadow-amber-500/50' },
  { name: 'Sunset Rose', hex: '#EC4899', bg: 'bg-pink-500', glow: 'shadow-pink-500/50' },
  { name: 'Velvet Crimson', hex: '#E11D48', bg: 'bg-rose-600', glow: 'shadow-rose-600/50' },
];

export const AVATAR_SYMBOLS = [
  '🌙', '🌊', '🕊️', '🌿', '🌌', '🕯️',
  '🦊', '🦋', '🪐', '☁️', '🧭', '🌸',
  '🍂', '✨', '🐾', '⚓', '⚡', '🗝️'
];

export function generateRandomPersona() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const randomNum = Math.floor(10 + Math.random() * 89);
  const pseudonym = `${adj} ${noun} #${randomNum}`;
  const aura = AURA_COLORS[Math.floor(Math.random() * AURA_COLORS.length)].hex;
  const symbol = AVATAR_SYMBOLS[Math.floor(Math.random() * AVATAR_SYMBOLS.length)];

  return {
    pseudonym,
    auraColor: aura,
    avatarSymbol: symbol,
    bio: 'Just another human soul sharing honest echoes in the dark.',
    openToMessages: true,
  };
}
