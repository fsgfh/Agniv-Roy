/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Verification test suite demonstrating Dirty Dozen security constraints
export interface SecurityTestScenario {
  name: string;
  payload: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const dirtyDozenSecurityTests: SecurityTestScenario[] = [
  {
    name: 'Spoofed author UID on EmotionPost',
    payload: {
      id: 'post_1',
      authorId: 'victim_user_99',
      authorPseudonym: 'StarlitSoul',
      authorAuraColor: '#6366f1',
      authorAvatarSymbol: '🌙',
      emotionCategory: 'Melancholy',
      intensity: 3,
      content: 'Testing unauthorized spoofing',
      createdAt: new Date().toISOString()
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: 'Unauthenticated user trying to write emotion',
    payload: {
      id: 'post_anon_hack',
      authorId: 'unauth_user',
      authorPseudonym: 'Hacker',
      authorAuraColor: '#ff0000',
      authorAvatarSymbol: '💀',
      emotionCategory: 'Joy',
      intensity: 1,
      content: 'Bypassing auth',
      createdAt: new Date().toISOString()
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: 'Snooping on another user private info',
    payload: {
      userId: 'target_victim_user',
      email: 'victim@example.com',
      createdAt: new Date().toISOString()
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: 'Payload bloat attack (oversized content > 2000 chars)',
    payload: {
      id: 'post_bloat',
      authorId: 'valid_user',
      authorPseudonym: 'ValidUser',
      authorAuraColor: '#6366f1',
      authorAvatarSymbol: '✨',
      emotionCategory: 'Hope',
      intensity: 2,
      content: 'A'.repeat(5000),
      createdAt: new Date().toISOString()
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    name: 'Non-participant eavesdropping on private conversation messages',
    payload: {
      conversationId: 'conv_between_A_and_B',
      readerId: 'intruder_C'
    },
    expectedResult: 'PERMISSION_DENIED'
  }
];
