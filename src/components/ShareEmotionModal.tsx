/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile, EMOTION_CATEGORIES } from '../types';
import { X, Sparkles, Send, Volume2, ShieldCheck, HelpCircle } from 'lucide-react';

interface ShareEmotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSubmit: (data: {
    category: string;
    intensity: number;
    title?: string;
    content: string;
    soundscape?: string;
  }) => Promise<void>;
}

export const ShareEmotionModal: React.FC<ShareEmotionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSubmit,
}) => {
  const [category, setCategory] = useState<string>(EMOTION_CATEGORIES[0].label);
  const [intensity, setIntensity] = useState<number>(3);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [soundscape, setSoundscape] = useState<string>('gentle_rain');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please express what you are feeling.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        category,
        intensity,
        title: title.trim() || undefined,
        content: content.trim(),
        soundscape,
      });
      // reset
      setTitle('');
      setContent('');
      onClose();
    } catch (err: unknown) {
      console.error('Submit error:', err);
      setError('Failed to share emotion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const intensityDescriptions = [
    'A quiet whisper in the background',
    'A gentle feeling that comes and goes',
    'A deep, palpable presence in your chest',
    'An intense emotion consuming your focus',
    'An overwhelming torrent taking your breath away',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Anonymous Release</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
            Share What Your Heart Is Holding
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Let your raw emotions out. No judgment, no real names, pure human resonance.
          </p>
        </div>

        {/* Anonymity Assurance Banner */}
        <div className="mb-6 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{
              backgroundColor: `${currentUser.auraColor}20`,
              border: `2px solid ${currentUser.auraColor}`,
            }}
          >
            {currentUser.avatarSymbol}
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">
                Posting as {currentUser.pseudonym}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <ShieldCheck className="w-3 h-3" /> Anonymous
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Your real email and Google identity remain 100% confidential.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Emotion Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. What emotion are you experiencing?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EMOTION_CATEGORIES.map(cat => {
                const isSelected = category === cat.label;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.label);
                      setSoundscape(cat.recommendedSound);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-purple-400/80 bg-purple-950/40 shadow-md shadow-purple-500/10'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xl mb-1">{cat.emoji}</div>
                    <div className="text-xs font-bold text-slate-200 truncate">{cat.label}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">{cat.tagline}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intensity Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                2. Intensity ({intensity}/5)
              </label>
              <span className="text-xs text-purple-300 font-medium">
                {intensityDescriptions[intensity - 1]}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={intensity}
              onChange={e => setIntensity(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Whisper</span>
              <span>Gentle</span>
              <span>Deep</span>
              <span>Intense</span>
              <span>Overwhelming</span>
            </div>
          </div>

          {/* Title (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              3. Caption or Headline <span className="text-slate-400 text-[10px] lowercase">(optional)</span>
            </label>
            <input
              type="text"
              maxLength={120}
              placeholder="e.g. 3 AM thoughts, or A quiet ache I couldn't say aloud"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-purple-500/80"
            />
          </div>

          {/* Emotion Journal Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                4. Your Heart's Expression
              </label>
              <span className="text-[11px] text-slate-400">{content.length}/2000</span>
            </div>
            <textarea
              required
              rows={5}
              maxLength={2000}
              placeholder="What feels heavy? What sparked joy? Tell your story in complete honesty. You are safe here..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-purple-500/80 resize-none"
            />
          </div>

          {/* Soundscape Atmosphere */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              5. Ambient Soundscape <span className="text-slate-400 text-[10px] lowercase">(others can listen while reading)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'gentle_rain', label: '🌧️ Gentle Rain' },
                { id: 'ocean_tides', label: '🌊 Ocean Tides' },
                { id: 'forest_wind', label: '🍃 Forest Wind' },
                { id: 'deep_drone', label: '🪐 Deep Drone' },
                { id: 'warm_chimes', label: '✨ Warm Chimes' },
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSoundscape(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                    soundscape === s.id
                      ? 'bg-purple-900/40 border-purple-500 text-purple-200 font-semibold'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Releasing Echo...' : 'Release Emotion'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
