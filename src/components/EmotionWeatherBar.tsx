/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EMOTION_CATEGORIES, EmotionPost } from '../types';
import { Sparkles, Activity } from 'lucide-react';

interface EmotionWeatherBarProps {
  emotions: EmotionPost[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  openToChatOnly: boolean;
  onToggleOpenToChat: () => void;
}

export const EmotionWeatherBar: React.FC<EmotionWeatherBarProps> = ({
  emotions,
  selectedCategory,
  onSelectCategory,
  openToChatOnly,
  onToggleOpenToChat,
}) => {
  // Compute counts per category
  const categoryCounts = EMOTION_CATEGORIES.map(cat => {
    const count = emotions.filter(e => e.emotionCategory === cat.label || e.emotionCategory === cat.id).length;
    return { ...cat, count };
  });

  const totalEmotions = emotions.length;

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Community Heartbeat</h2>
            <p className="text-xs text-slate-400">
              {totalEmotions} shared echoes across our anonymous sanctuary
            </p>
          </div>
        </div>

        {/* Filter for open to chat */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleOpenToChat}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              openToChatOnly
                ? 'bg-purple-900/50 border-purple-500/60 text-purple-200 font-medium'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            💬 Open to Direct Messages
          </button>
          {selectedCategory && (
            <button
              onClick={() => onSelectCategory(null)}
              className="text-xs px-2.5 py-1 text-slate-400 hover:text-slate-200 underline"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Emotion Categories Filter Horizontal Scroll / Grid */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
            selectedCategory === null
              ? 'bg-white text-slate-950 border-white shadow-md shadow-white/10 font-semibold'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <span>All Emotions</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            {totalEmotions}
          </span>
        </button>

        {categoryCounts.map(cat => {
          const isSelected = selectedCategory === cat.label || selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(isSelected ? null : cat.label)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                isSelected
                  ? 'font-semibold border-purple-500/80 shadow-md text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
              style={{
                backgroundColor: isSelected ? `${cat.color}25` : undefined,
                borderColor: isSelected ? cat.color : undefined,
                color: isSelected ? '#ffffff' : undefined,
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              {cat.count > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded-full text-slate-300"
                  style={{ backgroundColor: `${cat.color}30` }}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
