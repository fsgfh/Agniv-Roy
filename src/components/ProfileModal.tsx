/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, EmotionPost, DailyCheckin } from '../types';
import { AURA_COLORS, AVATAR_SYMBOLS, generateRandomPersona } from '../lib/personaGenerator';
import { db, handleFirestoreError, OperationType, logoutUser } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { X, Sparkles, RefreshCw, ShieldCheck, LogOut, TrendingUp, User, Heart } from 'lucide-react';
import { MoodTrendsView } from './MoodTrendsView';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  myEmotions: EmotionPost[];
  checkins: DailyCheckin[];
  onOpenCheckinModal: () => void;
  initialTab?: 'persona' | 'trends' | 'history';
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  myEmotions,
  checkins,
  onOpenCheckinModal,
  initialTab = 'persona',
}) => {
  const [pseudonym, setPseudonym] = useState(currentUser.pseudonym);
  const [auraColor, setAuraColor] = useState(currentUser.auraColor);
  const [avatarSymbol, setAvatarSymbol] = useState(currentUser.avatarSymbol);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [openToMessages, setOpenToMessages] = useState(currentUser.openToMessages ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'persona' | 'trends' | 'history'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setPseudonym(currentUser.pseudonym);
      setAuraColor(currentUser.auraColor);
      setAvatarSymbol(currentUser.avatarSymbol);
      setBio(currentUser.bio || '');
      setOpenToMessages(currentUser.openToMessages ?? true);
    }
  }, [isOpen, initialTab, currentUser]);

  if (!isOpen) return null;

  const handleRandomize = () => {
    const random = generateRandomPersona();
    setPseudonym(random.pseudonym);
    setAuraColor(random.auraColor);
    setAvatarSymbol(random.avatarSymbol);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.userId);
      const updatedFields = {
        pseudonym: pseudonym.trim() || currentUser.pseudonym,
        auraColor,
        avatarSymbol,
        bio: bio.trim(),
        openToMessages,
      };
      await updateDoc(userDocRef, updatedFields);

      onUpdateProfile({
        ...currentUser,
        ...updatedFields,
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.userId}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await logoutUser();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 border-b border-slate-800 pb-3 mb-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('persona')}
            className={`text-xs sm:text-sm font-bold pb-2 border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'persona'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Anonymous Persona</span>
          </button>

          <button
            onClick={() => setActiveTab('trends')}
            className={`text-xs sm:text-sm font-bold pb-2 border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'trends'
                ? 'border-pink-500 text-pink-200'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-pink-400" />
            <span>Mood Trends & Pulse ({checkins.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`text-xs sm:text-sm font-bold pb-2 border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>My Echoes ({myEmotions.length})</span>
          </button>
        </div>

        {activeTab === 'trends' ? (
          <MoodTrendsView checkins={checkins} onOpenCheckinModal={onOpenCheckinModal} />
        ) : activeTab === 'persona' ? (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Live Persona Card Preview */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-transform hover:scale-105"
                  style={{
                    backgroundColor: `${auraColor}25`,
                    border: `2px solid ${auraColor}`,
                    boxShadow: `0 0 20px ${auraColor}35`,
                  }}
                >
                  {avatarSymbol}
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-100">{pseudonym}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1">{bio || 'No bio yet'}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 mt-1">
                    <ShieldCheck className="w-3 h-3" /> Anonymous Identity
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRandomize}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Generate new random poetic identity"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reroll</span>
              </button>
            </div>

            {/* Pseudonym Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Anonymous Pseudonym
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={pseudonym}
                onChange={e => setPseudonym(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Avatar Emblem Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Spirit Symbol
              </label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_SYMBOLS.map(sym => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setAvatarSymbol(sym)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all cursor-pointer ${
                      avatarSymbol === sym
                        ? 'bg-purple-950 border-purple-500 scale-110'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Aura Color Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Aura Glow
              </label>
              <div className="flex flex-wrap gap-2.5">
                {AURA_COLORS.map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setAuraColor(c.hex)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                      auraColor === c.hex ? 'scale-125 border-white shadow-md' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Bio Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Personal Tagline / Bio <span className="text-slate-400 text-[10px] lowercase">(optional)</span>
              </label>
              <textarea
                rows={2}
                maxLength={300}
                placeholder="A small reflection about yourself..."
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Direct Messages Opt-In Toggle */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Allow Anonymous Direct Messages
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Let others send you 1-on-1 private messages without seeing your real identity
                </span>
              </div>
              <input
                type="checkbox"
                checked={openToMessages}
                onChange={e => setOpenToMessages(e.target.checked)}
                className="w-5 h-5 rounded accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-full text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Persona'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {myEmotions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-400">You haven't shared any emotions yet.</p>
              </div>
            ) : (
              myEmotions.map(e => (
                <div
                  key={e.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300">{e.emotionCategory}</span>
                    <span className="text-[10px] text-slate-400">Intensity: {e.intensity}/5</span>
                  </div>
                  {e.title && <h5 className="text-sm font-semibold text-slate-200">{e.title}</h5>}
                  <p className="text-xs text-slate-400 line-clamp-2">{e.content}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
