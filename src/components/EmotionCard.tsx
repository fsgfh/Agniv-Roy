/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EmotionPost, UserProfile, EMOTION_CATEGORIES, REACTION_TYPES } from '../types';
import { soundscape } from '../lib/audioAmbiance';
import { MessageSquare, Send, Volume2, Sparkles, HeartHandshake, ShieldCheck } from 'lucide-react';

interface EmotionCardProps {
  emotion: EmotionPost;
  currentUser: UserProfile | null;
  onReact: (emotionId: string, reactionType: string) => void;
  onOpenComments: (emotion: EmotionPost) => void;
  onStartDirectMessage: (authorId: string, authorPseudonym: string, authorAura: string, authorAvatar: string) => void;
  userReactions: string[]; // List of reaction types the current user has given to this emotion
}

function timeAgo(dateString: string): string {
  try {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return 'A while ago';
  } catch {
    return 'Recently';
  }
}

export const EmotionCard: React.FC<EmotionCardProps> = ({
  emotion,
  currentUser,
  onReact,
  onOpenComments,
  onStartDirectMessage,
  userReactions,
}) => {
  const [isPlayingAmbiance, setIsPlayingAmbiance] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryMeta = EMOTION_CATEGORIES.find(
    c => c.label.toLowerCase() === emotion.emotionCategory.toLowerCase() || c.id === emotion.emotionCategory.toLowerCase()
  ) || EMOTION_CATEGORIES[0];

  const isAuthor = currentUser?.userId === emotion.authorId;

  const handlePlaySound = () => {
    if (emotion.soundscape) {
      const playing = soundscape.toggle(emotion.soundscape);
      setIsPlayingAmbiance(playing);
    }
  };

  const handleReactionClick = (reactionId: string) => {
    soundscape.playResonanceBell();
    onReact(emotion.id, reactionId);
  };

  const intensityLabel = [
    'Whisper',
    'Gentle',
    'Deep',
    'Intense',
    'Overwhelming'
  ][emotion.intensity - 1] || 'Felt';

  return (
    <article className="relative group rounded-3xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 p-5 sm:p-6 backdrop-blur-xl transition-all duration-300 shadow-xl hover:shadow-2xl overflow-hidden flex flex-col justify-between">
      
      {/* Subtle Aura ambient glow on top corner */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-all group-hover:opacity-30"
        style={{ backgroundColor: emotion.authorAuraColor || categoryMeta.color }}
      />

      <div>
        {/* Author Anonymous Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar Emblem with Aura Ring */}
            <div
              className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-xl select-none transition-transform group-hover:scale-105"
              style={{
                backgroundColor: `${emotion.authorAuraColor}20`,
                boxShadow: `0 0 16px ${emotion.authorAuraColor}30`,
                border: `2px solid ${emotion.authorAuraColor}`,
              }}
            >
              {emotion.authorAvatarSymbol || '✨'}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm sm:text-base text-slate-100">
                  {emotion.authorPseudonym}
                </span>
                {isAuthor && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60 font-medium">
                    You
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{timeAgo(emotion.createdAt)}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Anonymous
                </span>
              </div>
            </div>
          </div>

          {/* Emotion category & intensity */}
          <div className="flex flex-col items-end gap-1">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: `${categoryMeta.color}18`,
                borderColor: `${categoryMeta.color}40`,
                color: categoryMeta.color,
              }}
            >
              <span>{categoryMeta.emoji}</span>
              <span>{categoryMeta.label}</span>
            </span>

            {/* Intensity meter */}
            <div className="flex items-center gap-1 px-1" title={`Intensity: ${intensityLabel} (${emotion.intensity}/5)`}>
              <span className="text-[10px] text-slate-400 mr-1">{intensityLabel}</span>
              {[1, 2, 3, 4, 5].map(step => (
                <div
                  key={step}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    step <= emotion.intensity
                      ? 'bg-amber-400 shadow-xs shadow-amber-400'
                      : 'bg-slate-700/80'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Emotion Title & Content */}
        {emotion.title && (
          <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-2 leading-snug">
            {emotion.title}
          </h3>
        )}

        <div className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal mb-4 whitespace-pre-line">
          {emotion.content.length > 320 && !isExpanded ? (
            <>
              {emotion.content.slice(0, 320)}...
              <button
                onClick={() => setIsExpanded(true)}
                className="ml-1 text-purple-400 hover:text-purple-300 text-xs font-semibold underline cursor-pointer"
              >
                Read more
              </button>
            </>
          ) : (
            emotion.content
          )}
          {isExpanded && emotion.content.length > 320 && (
            <button
              onClick={() => setIsExpanded(false)}
              className="ml-2 text-purple-400 hover:text-purple-300 text-xs font-semibold underline cursor-pointer"
            >
              Show less
            </button>
          )}
        </div>

        {/* Attached Soundscape Player Bar (if provided) */}
        {emotion.soundscape && (
          <div className="mb-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-purple-400" />
              <span>Listen to the author's soundscape</span>
            </div>
            <button
              onClick={handlePlaySound}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                isPlayingAmbiance
                  ? 'bg-purple-900/60 border-purple-500 text-purple-200'
                  : 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-300'
              }`}
            >
              {isPlayingAmbiance ? 'Stop Ambiance' : 'Play Sound'}
            </button>
          </div>
        )}
      </div>

      {/* Footer Actions: Empathy Reactions & Direct Connect */}
      <div className="pt-3 border-t border-slate-800/80 mt-2">
        {/* Reactions List */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3">
          {REACTION_TYPES.map(reaction => {
            const hasReacted = userReactions.includes(reaction.id);
            return (
              <button
                key={reaction.id}
                onClick={() => handleReactionClick(reaction.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all active:scale-95 border cursor-pointer ${
                  hasReacted
                    ? 'bg-purple-950/70 border-purple-500/70 text-purple-200 shadow-sm shadow-purple-500/20'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
                title={reaction.label}
              >
                <span>{reaction.icon}</span>
                <span className="hidden sm:inline text-[11px]">{reaction.label}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Bar: Supportive Comments & 1-on-1 Message button */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => onOpenComments(emotion)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-purple-300 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-800/40"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Supportive words {emotion.commentsCount ? `(${emotion.commentsCount})` : ''}</span>
          </button>

          {/* 1-on-1 Anonymous Message Button */}
          {!isAuthor && (
            <button
              onClick={() =>
                onStartDirectMessage(
                  emotion.authorId,
                  emotion.authorPseudonym,
                  emotion.authorAuraColor,
                  emotion.authorAvatarSymbol
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-900/60 to-purple-900/60 hover:from-indigo-600 hover:to-purple-600 text-purple-200 hover:text-white border border-purple-500/40 hover:border-purple-400 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Send a private anonymous direct message to this person"
            >
              <Send className="w-3 h-3" />
              <span>Reach Out Privately</span>
            </button>
          )}
        </div>
      </div>

    </article>
  );
};
