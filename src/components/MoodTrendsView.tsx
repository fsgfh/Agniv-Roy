/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DailyCheckin, EMOTION_CATEGORIES } from '../types';
import {
  TrendingUp,
  Calendar,
  Flame,
  Heart,
  BatteryCharging,
  Sparkles,
  Smile,
  BarChart2,
  Clock,
} from 'lucide-react';

interface MoodTrendsViewProps {
  checkins: DailyCheckin[];
  onOpenCheckinModal: () => void;
}

export const MoodTrendsView: React.FC<MoodTrendsViewProps> = ({
  checkins,
  onOpenCheckinModal,
}) => {
  const [timeRange, setTimeRange] = useState<'7' | '30'>('7');

  // Sort check-ins by date ascending for timeline analysis
  const sortedCheckins = [...checkins].sort((a, b) => a.date.localeCompare(b.date));

  // Filter based on selected time range
  const daysLimit = parseInt(timeRange, 10);
  const recentCheckins = sortedCheckins.slice(-daysLimit);

  // Compute Streak
  const computeStreak = (): number => {
    if (sortedCheckins.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const datesSet = new Set(sortedCheckins.map(c => c.date));

    // Check backwards from today or yesterday
    let checkDate = new Date(today);
    const dateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (!datesSet.has(dateStr(checkDate))) {
      // Check if checked in yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (datesSet.has(dateStr(checkDate))) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  };

  const streak = computeStreak();

  // Average mood score
  const avgMood = recentCheckins.length > 0
    ? (recentCheckins.reduce((acc, c) => acc + c.moodScore, 0) / recentCheckins.length).toFixed(1)
    : '0';

  // Category counts
  const categoryCounts: Record<string, number> = {};
  recentCheckins.forEach(c => {
    categoryCounts[c.emotionCategory] = (categoryCounts[c.emotionCategory] || 0) + 1;
  });

  const dominantCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Energy counts
  const energyCounts: Record<string, number> = {};
  recentCheckins.forEach(c => {
    const e = c.energyLevel || 'Balanced';
    energyCounts[e] = (energyCounts[e] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls & Time Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-pink-400" />
            <span>Emotional Trends & Pulse History</span>
          </h3>
          <p className="text-xs text-slate-400">
            Private longitudinal insights into your emotional wellbeing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setTimeRange('7')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                timeRange === '7' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Past 7 Days
            </button>
            <button
              onClick={() => setTimeRange('30')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                timeRange === '30' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Past 30 Days
            </button>
          </div>

          <button
            onClick={onOpenCheckinModal}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-xs transition-all cursor-pointer"
          >
            + Check-In
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Current Streak</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white">{streak} <span className="text-xs font-normal text-slate-400">days</span></div>
          <span className="text-[10px] text-slate-400">Daily check-in habit</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Avg Mood</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{avgMood} <span className="text-xs font-normal text-slate-400">/ 10</span></div>
          <span className="text-[10px] text-slate-400">Over {recentCheckins.length} check-ins</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Dominant State</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-purple-300 truncate mt-1">
            {dominantCategory}
          </div>
          <span className="text-[10px] text-slate-400">Most frequent feeling</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Logged</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{checkins.length}</div>
          <span className="text-[10px] text-slate-400">Lifetime check-ins</span>
        </div>
      </div>

      {/* Visual Mood Chart */}
      <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            <span>Mood Valence Trend (1 to 10)</span>
          </h4>
          <span className="text-[11px] text-slate-400">
            Higher score = more grounded / flourishing
          </span>
        </div>

        {recentCheckins.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">
            No check-in entries yet. Record your mood today to start visualizing trends.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Visual Bar Chart */}
            <div className="h-44 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-800 overflow-x-auto">
              {recentCheckins.map(c => {
                const heightPct = Math.max(10, (c.moodScore / 10) * 100);
                const categoryMeta = EMOTION_CATEGORIES.find(cat => cat.label === c.emotionCategory);
                const color = categoryMeta?.color || '#A855F7';
                const dayLabel = new Date(c.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });

                return (
                  <div key={c.id} className="flex-1 min-w-[36px] flex flex-col items-center gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-800 text-white text-[10px] py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-20 shadow-md">
                      {c.date}: {c.moodScore}/10 ({c.emotionCategory})
                    </div>

                    <span className="text-[10px] font-bold text-slate-300">{c.moodScore}</span>

                    {/* Bar */}
                    <div
                      className="w-full rounded-t-lg transition-all group-hover:brightness-125"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 12px ${color}40`,
                      }}
                    />

                    {/* Emoji */}
                    <span className="text-xs mt-1">{categoryMeta?.emoji || '✨'}</span>
                    {/* Date label */}
                    <span className="text-[9px] text-slate-400">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Emotion Categories Breakdown & Energy Distribution */}
      {recentCheckins.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Categories breakdown */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Emotional States Breakdown
            </h5>
            <div className="space-y-2.5">
              {Object.entries(categoryCounts).map(([catLabel, count]) => {
                const catMeta = EMOTION_CATEGORIES.find(c => c.label === catLabel);
                const pct = Math.round((count / recentCheckins.length) * 100);
                return (
                  <div key={catLabel} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <span>{catMeta?.emoji || '•'}</span>
                        <span>{catLabel}</span>
                      </span>
                      <span className="text-slate-400 font-semibold">{count}d ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: catMeta?.color || '#8B5CF6',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Energy Distribution */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
              <span>Energy Levels</span>
            </h5>
            <div className="space-y-2.5">
              {(['Low', 'Gentle', 'Balanced', 'High', 'Radiant'] as const).map(lvl => {
                const count = energyCounts[lvl] || 0;
                const pct = recentCheckins.length > 0 ? Math.round((count / recentCheckins.length) * 100) : 0;
                return (
                  <div key={lvl} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{lvl}</span>
                      <span className="text-slate-400 font-semibold">{count}d ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500/80"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Historical Entries Timeline */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Past Check-In Reflections</span>
        </h5>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {recentCheckins.length === 0 ? (
            <p className="text-xs text-slate-400">No reflections logged yet.</p>
          ) : (
            [...recentCheckins].reverse().map(c => {
              const catMeta = EMOTION_CATEGORIES.find(cat => cat.label === c.emotionCategory);
              const formattedDate = new Date(c.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{catMeta?.emoji || '✨'}</span>
                      <span className="font-semibold text-slate-200">{c.emotionCategory}</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/60 font-bold text-[10px]">
                        {c.moodScore}/10
                      </span>
                      {c.energyLevel && (
                        <span className="text-[10px] text-amber-300">
                          ⚡ {c.energyLevel}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{formattedDate}</span>
                  </div>

                  {c.reflection && (
                    <p className="text-slate-300 italic pl-5 border-l-2 border-slate-800">
                      "{c.reflection}"
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
