/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile } from '../types';
import { soundscape } from '../lib/audioAmbiance';
import { Volume2, VolumeX, MessageCircle, Wind, Plus, User, LogIn, Sparkles } from 'lucide-react';

interface NavbarProps {
  userProfile: UserProfile | null;
  onOpenShareModal: () => void;
  onOpenMessagesModal: () => void;
  onOpenBreathingModal: () => void;
  onOpenProfileModal: () => void;
  onOpenCheckinModal: () => void;
  todayCheckedIn: boolean;
  onLogin: () => void;
  activeConversationsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  onOpenShareModal,
  onOpenMessagesModal,
  onOpenBreathingModal,
  onOpenProfileModal,
  onOpenCheckinModal,
  todayCheckedIn,
  onLogin,
  activeConversationsCount,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [currentSound, setCurrentSound] = useState<string>('gentle_rain');
  const [showAudioDropdown, setShowAudioDropdown] = useState<boolean>(false);

  const toggleSound = (soundId?: string) => {
    const targetSound = soundId || currentSound;
    setCurrentSound(targetSound);
    const playing = soundscape.toggle(targetSound);
    setIsPlayingAudio(playing);
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-[2px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <span className="text-xl sm:text-2xl select-none group-hover:scale-110 transition-transform">🌌</span>
              </div>
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-300 bg-clip-text text-transparent">
                AuraEcho
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300">
                100% Anonymous
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-light hidden sm:block">
              Express freely · Receive warmth · Connect privately
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Ambient Soundscape Controller */}
          <div className="relative">
            <button
              onClick={() => setShowAudioDropdown(!showAudioDropdown)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isPlayingAudio
                  ? 'bg-purple-950/80 border-purple-500/50 text-purple-300 shadow-sm shadow-purple-500/20 animate-pulse'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
              title="Calming Ambience Soundscape"
            >
              {isPlayingAudio ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden md:inline">Playing Mood</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Soundscape</span>
                </>
              )}
            </button>

            {showAudioDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="font-semibold text-slate-200">Ambient Soundscapes</span>
                  {isPlayingAudio && (
                    <button
                      onClick={() => {
                        soundscape.stop();
                        setIsPlayingAudio(false);
                      }}
                      className="text-[11px] text-rose-400 hover:underline"
                    >
                      Mute
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {[
                    { id: 'gentle_rain', label: '🌧️ Gentle Rain' },
                    { id: 'ocean_tides', label: '🌊 Ocean Waves' },
                    { id: 'forest_wind', label: '🍃 Forest Breeze' },
                    { id: 'deep_drone', label: '🪐 Cosmic Drone' },
                    { id: 'warm_chimes', label: '✨ Warm Chimes' },
                  ].map(sound => (
                    <button
                      key={sound.id}
                      onClick={() => {
                        toggleSound(sound.id);
                        setShowAudioDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                        isPlayingAudio && currentSound === sound.id
                          ? 'bg-purple-900/40 text-purple-200 font-medium'
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                      }`}
                    >
                      <span>{sound.label}</span>
                      {isPlayingAudio && currentSound === sound.id && (
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Daily Emotional Pulse Button */}
          {userProfile && (
            <button
              onClick={onOpenCheckinModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                todayCheckedIn
                  ? 'bg-pink-950/40 border-pink-500/40 text-pink-300 hover:border-pink-400'
                  : 'bg-slate-900 border-pink-500/60 text-pink-200 hover:bg-pink-950/30 animate-pulse'
              }`}
              title="Daily Emotional Pulse Check-In"
            >
              <span className="text-xs">🌸</span>
              <span className="hidden sm:inline">Daily Pulse</span>
              {!todayCheckedIn && (
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
              )}
            </button>
          )}

          {/* Calming Breathing Sanctuary */}
          <button
            onClick={onOpenBreathingModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-950/30 transition-all cursor-pointer"
            title="Grounding Breathing Exercise"
          >
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Breathe</span>
          </button>

          {/* Direct Messages Icon */}
          <button
            onClick={onOpenMessagesModal}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-purple-300 hover:border-purple-500/40 hover:bg-purple-950/30 transition-all"
            title="Private 1-on-1 Messages"
          >
            <MessageCircle className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Echoes Chat</span>
            {activeConversationsCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-purple-600 text-white">
                {activeConversationsCount}
              </span>
            )}
          </button>

          {/* Share Emotion Action */}
          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Share Emotion</span>
          </button>

          {/* User Profile / Login */}
          {userProfile ? (
            <button
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all"
              title="My Anonymous Persona"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-sm"
                style={{ backgroundColor: `${userProfile.auraColor}20`, border: `2px solid ${userProfile.auraColor}` }}
              >
                {userProfile.avatarSymbol}
              </div>
              <span className="text-xs font-medium text-slate-200 hidden md:inline truncate max-w-[120px]">
                {userProfile.pseudonym}
              </span>
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-400" />
              <span>Enter Sanctuary</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
