/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  userId: string;
  pseudonym: string;
  auraColor: string;
  avatarSymbol: string;
  bio?: string;
  openToMessages: boolean;
  createdAt: string;
}

export interface PrivateUserInfo {
  userId: string;
  email: string;
  createdAt: string;
}

export interface EmotionPost {
  id: string;
  authorId: string;
  authorPseudonym: string;
  authorAuraColor: string;
  authorAvatarSymbol: string;
  emotionCategory: string;
  intensity: number; // 1 to 5
  title?: string;
  content: string;
  soundscape?: string;
  supportCount?: number;
  commentsCount?: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  emotionId: string;
  authorId: string;
  authorPseudonym: string;
  authorAuraColor: string;
  authorAvatarSymbol: string;
  content: string;
  createdAt: string;
}

export interface Reaction {
  id: string;
  emotionId: string;
  userId: string;
  reactionType: 'not_alone' | 'warmth' | 'hear_you' | 'stay_strong' | 'felt_this';
  createdAt: string;
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  participant1Pseudonym: string;
  participant2Pseudonym: string;
  participant1Aura?: string;
  participant2Aura?: string;
  participant1Avatar?: string;
  participant2Avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastSenderId?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderPseudonym: string;
  senderAura?: string;
  senderAvatar?: string;
  text: string;
  createdAt: string;
}

export interface DailyCheckin {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  emotionCategory: string;
  moodScore: number; // 1 to 10
  energyLevel?: 'Low' | 'Gentle' | 'Balanced' | 'High' | 'Radiant';
  reflection?: string;
  createdAt: string;
}

export interface EmotionCategoryMeta {
  id: string;
  label: string;
  tagline: string;
  emoji: string;
  color: string;
  bgGlow: string;
  borderGlow: string;
  textColor: string;
  recommendedSound: string;
}

export const EMOTION_CATEGORIES: EmotionCategoryMeta[] = [
  {
    id: 'melancholy',
    label: 'Melancholy',
    tagline: 'Quiet rain, heavy heart, gentle sorrow',
    emoji: '🌧️',
    color: '#38BDF8',
    bgGlow: 'from-sky-950/40 via-sky-900/10 to-transparent',
    borderGlow: 'border-sky-500/30 hover:border-sky-400/60',
    textColor: 'text-sky-400',
    recommendedSound: 'gentle_rain',
  },
  {
    id: 'joy',
    label: 'Pure Joy & Gratitude',
    tagline: 'Sunlight through clouds, lightness of being',
    emoji: '✨',
    color: '#FBBF24',
    bgGlow: 'from-amber-950/40 via-amber-900/10 to-transparent',
    borderGlow: 'border-amber-500/30 hover:border-amber-400/60',
    textColor: 'text-amber-400',
    recommendedSound: 'warm_chimes',
  },
  {
    id: 'anxiety',
    label: 'Anxiety & Overwhelm',
    tagline: 'Fast pulse, racing mind, breathless weight',
    emoji: '🌪️',
    color: '#A855F7',
    bgGlow: 'from-purple-950/40 via-purple-900/10 to-transparent',
    borderGlow: 'border-purple-500/30 hover:border-purple-400/60',
    textColor: 'text-purple-400',
    recommendedSound: 'deep_drone',
  },
  {
    id: 'peace',
    label: 'Peace & Solitude',
    tagline: 'Calm waters, slowing down, breath released',
    emoji: '🍃',
    color: '#34D399',
    bgGlow: 'from-emerald-950/40 via-emerald-900/10 to-transparent',
    borderGlow: 'border-emerald-500/30 hover:border-emerald-400/60',
    textColor: 'text-emerald-400',
    recommendedSound: 'forest_wind',
  },
  {
    id: 'heartache',
    label: 'Heartache & Yearning',
    tagline: 'Missing someone, tender ache, unsaid words',
    emoji: '🥀',
    color: '#FB7185',
    bgGlow: 'from-rose-950/40 via-rose-900/10 to-transparent',
    borderGlow: 'border-rose-500/30 hover:border-rose-400/60',
    textColor: 'text-rose-400',
    recommendedSound: 'ocean_tides',
  },
  {
    id: 'hope',
    label: 'Fragile Hope',
    tagline: 'A distant light, choosing to believe tomorrow',
    emoji: '🌱',
    color: '#2DD4BF',
    bgGlow: 'from-teal-950/40 via-teal-900/10 to-transparent',
    borderGlow: 'border-teal-500/30 hover:border-teal-400/60',
    textColor: 'text-teal-400',
    recommendedSound: 'gentle_rain',
  },
  {
    id: 'exhaustion',
    label: 'Burnout & Numbness',
    tagline: 'No words left, weary bones, hollow quiet',
    emoji: '🌫️',
    color: '#94A3B8',
    bgGlow: 'from-slate-900/40 via-slate-800/10 to-transparent',
    borderGlow: 'border-slate-500/30 hover:border-slate-400/60',
    textColor: 'text-slate-400',
    recommendedSound: 'ocean_tides',
  },
  {
    id: 'passion',
    label: 'Creative Fire & Desire',
    tagline: 'Burning curiosity, spark of purpose, awakening',
    emoji: '🔥',
    color: '#F97316',
    bgGlow: 'from-orange-950/40 via-orange-900/10 to-transparent',
    borderGlow: 'border-orange-500/30 hover:border-orange-400/60',
    textColor: 'text-orange-400',
    recommendedSound: 'warm_chimes',
  },
];

export const REACTION_TYPES = [
  { id: 'not_alone', icon: '🤍', label: "You're not alone" },
  { id: 'warmth', icon: '🫂', label: 'Sending warmth' },
  { id: 'hear_you', icon: '🌊', label: 'I hear you' },
  { id: 'stay_strong', icon: '✨', label: 'Stay strong' },
  { id: 'felt_this', icon: '💭', label: 'Felt this deeply' },
] as const;
