/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DailyCheckin, UserProfile, EMOTION_CATEGORIES } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { X, Sparkles, Heart, Sun, BatteryCharging, CheckCircle2 } from 'lucide-react';
import { soundscape } from '../lib/audioAmbiance';

interface DailyCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  todayCheckin: DailyCheckin | null;
  onSaved: (checkin: DailyCheckin) => void;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DailyCheckinModal: React.FC<DailyCheckinModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  todayCheckin,
  onSaved,
}) => {
  const [category, setCategory] = useState<string>(todayCheckin?.emotionCategory || EMOTION_CATEGORIES[3].label);
  const [moodScore, setMoodScore] = useState<number>(todayCheckin?.moodScore || 7);
  const [energyLevel, setEnergyLevel] = useState<'Low' | 'Gentle' | 'Balanced' | 'High' | 'Radiant'>(
    todayCheckin?.energyLevel || 'Balanced'
  );
  const [reflection, setReflection] = useState<string>(todayCheckin?.reflection || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (todayCheckin) {
      setCategory(todayCheckin.emotionCategory);
      setMoodScore(todayCheckin.moodScore);
      setEnergyLevel(todayCheckin.energyLevel || 'Balanced');
      setReflection(todayCheckin.reflection || '');
    }
  }, [todayCheckin, isOpen]);

  if (!isOpen) return null;

  const todayDate = getTodayDateString();
  const formattedToday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const getScoreDescription = (score: number) => {
    if (score <= 2) return 'Very Heavy / In the Depths';
    if (score <= 4) return 'Low & Vulnerable';
    if (score <= 6) return 'Gentle & Managing';
    if (score <= 8) return 'Content & Grounded';
    return 'Radiant & Overflowing';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const checkinId = `checkin_${todayDate}`;
    const checkinData: DailyCheckin = {
      id: checkinId,
      userId: currentUser.userId,
      date: todayDate,
      emotionCategory: category,
      moodScore,
      energyLevel,
      reflection: reflection.trim() || undefined,
      createdAt: todayCheckin?.createdAt || new Date().toISOString(),
    };

    try {
      const checkinRef = doc(db, 'users', currentUser.userId, 'checkins', checkinId);
      await setDoc(checkinRef, checkinData, { merge: true });

      soundscape.playResonanceBell();
      onSaved(checkinData);
      onClose();
    } catch (err) {
      console.error('Failed to save daily check-in:', err);
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.userId}/checkins/${checkinId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-pink-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Daily Emotional Check-In</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
            {todayCheckin ? "Update Today's Pulse" : 'How Is Your Heart Today?'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {formattedToday} · Stored privately in your personal profile for trend analysis.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Primary Dominant Emotion */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. Dominant Emotion Right Now
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EMOTION_CATEGORIES.map(cat => {
                const isSelected = category === cat.label;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.label)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-purple-400 bg-purple-950/50 shadow-md shadow-purple-500/10'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-lg mb-0.5">{cat.emoji}</div>
                    <div className="text-xs font-bold text-slate-200 truncate">{cat.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Mood Valence Score Slider (1 to 10) */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>2. Overall Mood Score:</span>
                <span className="text-sm font-bold text-white px-2 py-0.5 rounded-lg bg-purple-950/80 border border-purple-500/40">
                  {moodScore} / 10
                </span>
              </label>
              <span className="text-xs text-purple-300 font-medium">
                {getScoreDescription(moodScore)}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={moodScore}
              onChange={e => setMoodScore(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
              <span>1 (Deep ache)</span>
              <span>5 (Neutral)</span>
              <span>10 (Flourishing)</span>
            </div>
          </div>

          {/* 3. Energy Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Energy Level</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {(['Low', 'Gentle', 'Balanced', 'High', 'Radiant'] as const).map(lvl => {
                const isSelected = energyLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setEnergyLevel(lvl)}
                    className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/50 border-amber-500/70 text-amber-200 font-semibold shadow-xs'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Optional One-Line Reflection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                4. Private Reflection / Gratitude <span className="text-slate-400 text-[10px] lowercase">(optional)</span>
              </label>
              <span className="text-[11px] text-slate-400">{reflection.length}/500</span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="What made you feel this way today? What are you grateful for, or what felt heavy?"
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Private to your eyes only
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving Pulse...' : todayCheckin ? 'Update Pulse' : 'Save Check-In'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
