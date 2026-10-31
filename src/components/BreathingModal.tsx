/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Wind, Heart, Sparkles } from 'lucide-react';
import { soundscape } from '../lib/audioAmbiance';

interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BreathingModal: React.FC<BreathingModalProps> = ({ isOpen, onClose }) => {
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [countdown, setCountdown] = useState<number>(4);

  useEffect(() => {
    if (!isOpen) return;

    let currentPhase: 'Inhale' | 'Hold' | 'Exhale' = 'Inhale';
    let count = 4;
    setPhase('Inhale');
    setCountdown(4);

    const timer = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        if (currentPhase === 'Inhale') {
          currentPhase = 'Hold';
          count = 7;
        } else if (currentPhase === 'Hold') {
          currentPhase = 'Exhale';
          count = 8;
        } else {
          currentPhase = 'Inhale';
          count = 4;
        }
        setPhase(currentPhase);
      }
      setCountdown(count);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const scaleClass =
    phase === 'Inhale'
      ? 'scale-125 duration-[4000ms]'
      : phase === 'Hold'
      ? 'scale-125 duration-1000'
      : 'scale-75 duration-[8000ms]';

  const phaseInstruction =
    phase === 'Inhale'
      ? 'Breathe in gentle calm...'
      : phase === 'Hold'
      ? 'Hold stillness in your heart...'
      : 'Release tension and heavy weight...';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 text-center flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
          <Wind className="w-3.5 h-3.5" />
          <span>Mindful Sanctuary</span>
        </div>

        <h3 className="text-xl font-bold text-slate-100 mb-1">Grounding Breath</h3>
        <p className="text-xs text-slate-400 mb-8 max-w-xs">
          Take a moment for yourself. Let the world slow down.
        </p>

        {/* Breathing Sphere */}
        <div className="relative w-56 h-56 flex items-center justify-center mb-8">
          {/* Animated Glow Rings */}
          <div
            className={`absolute inset-0 rounded-full bg-cyan-500/10 blur-2xl transition-transform ease-in-out ${scaleClass}`}
          />
          <div
            className={`absolute inset-4 rounded-full bg-gradient-to-tr from-cyan-500/30 to-purple-500/30 border border-cyan-400/40 shadow-2xl shadow-cyan-500/20 transition-transform ease-in-out ${scaleClass} flex items-center justify-center`}
          >
            <div className="text-center z-10">
              <span className="text-2xl font-black text-cyan-200 block tracking-tight">
                {phase}
              </span>
              <span className="text-3xl font-extrabold text-white">{countdown}s</span>
            </div>
          </div>
        </div>

        <p className="text-sm font-medium text-cyan-300 mb-6 italic">{phaseInstruction}</p>

        <button
          onClick={onClose}
          className="px-6 py-2 rounded-full text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
        >
          I Feel Grounded Now
        </button>
      </div>
    </div>
  );
};
