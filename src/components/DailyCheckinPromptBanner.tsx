/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DailyCheckin, UserProfile, EMOTION_CATEGORIES } from '../types';
import { Sparkles, Heart, CheckCircle2, ArrowRight, BarChart2, X } from 'lucide-react';

interface DailyCheckinPromptBannerProps {
  todayCheckin: DailyCheckin | null;
  currentUser: UserProfile;
  onOpenCheckinModal: () => void;
  onOpenTrends: () => void;
}

export const DailyCheckinPromptBanner: React.FC<DailyCheckinPromptBannerProps> = ({
  todayCheckin,
  currentUser,
  onOpenCheckinModal,
  onOpenTrends,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const categoryMeta = todayCheckin
    ? EMOTION_CATEGORIES.find(c => c.label === todayCheckin.emotionCategory)
    : null;

  return (
    <div className="w-full mb-6 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900/80 to-indigo-950/50 border border-purple-500/30 p-4 sm:p-5 backdrop-blur-md shadow-lg relative overflow-hidden transition-all">
      {/* Background glow element */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-pink-500/10 blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side Message */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl shrink-0">
            {todayCheckin ? categoryMeta?.emoji || '✨' : '🌸'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Daily Emotional Pulse
              </span>
              {todayCheckin ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Recorded for Today
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 font-medium animate-pulse">
                  Prompt for Today
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-200 font-medium mt-0.5">
              {todayCheckin
                ? `You're feeling ${todayCheckin.emotionCategory} (${todayCheckin.moodScore}/10) · Energy: ${todayCheckin.energyLevel || 'Balanced'}`
                : `Take a quiet moment, ${currentUser.pseudonym}. How is your heart holding up today?`}
            </p>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:self-center pl-13 sm:pl-0">
          {todayCheckin ? (
            <>
              <button
                onClick={onOpenTrends}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-purple-500/60 text-slate-200 hover:text-white transition-all cursor-pointer"
              >
                <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
                <span>View Trends</span>
              </button>
              <button
                onClick={onOpenCheckinModal}
                className="text-xs text-purple-400 hover:text-purple-300 underline px-2 py-1"
              >
                Edit Check-In
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onOpenCheckinModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-md shadow-pink-600/25 transition-all active:scale-95 cursor-pointer"
              >
                <span>Record Mood (30s)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                title="Snooze for now"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
