/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EmotionPost, UserProfile, Comment } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { X, Send, MessageSquare, ShieldCheck, Heart } from 'lucide-react';
import { soundscape } from '../lib/audioAmbiance';

interface CommentsDrawerProps {
  emotion: EmotionPost | null;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLoginPrompt: () => void;
}

function timeAgo(dateString: string): string {
  try {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return 'Recently';
  }
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  emotion,
  onClose,
  currentUser,
  onLoginPrompt,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!emotion) return;
    const commentsRef = collection(db, 'emotions', emotion.id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: Comment[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as Comment);
        });
        setComments(list);
      },
      error => {
        handleFirestoreError(error, OperationType.GET, `emotions/${emotion.id}/comments`);
      }
    );

    return () => unsubscribe();
  }, [emotion]);

  if (!emotion) return null;

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onLoginPrompt();
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const commentData: Comment = {
        id: commentId,
        emotionId: emotion.id,
        authorId: currentUser.userId,
        authorPseudonym: currentUser.pseudonym,
        authorAuraColor: currentUser.auraColor,
        authorAvatarSymbol: currentUser.avatarSymbol,
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
      };

      const commentDocRef = doc(db, 'emotions', emotion.id, 'comments', commentId);
      await setDoc(commentDocRef, commentData);

      // Increment commentsCount on the emotion
      const emotionDocRef = doc(db, 'emotions', emotion.id);
      await updateDoc(emotionDocRef, {
        commentsCount: increment(1),
      });

      soundscape.playResonanceBell();
      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `emotions/${emotion.id}/comments`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100">Supportive Words</h3>
              <p className="text-xs text-slate-400">
                Echo from <span className="text-purple-300 font-medium">{emotion.authorPseudonym}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emotion Context Snippet */}
        <div className="p-4 mx-4 mt-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
          <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider block mb-1">
            Original Emotion:
          </span>
          <p className="italic line-clamp-3">"{emotion.content}"</p>
        </div>

        {/* Comments Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comments.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-purple-950/50 border border-purple-500/20 text-purple-300 mx-auto flex items-center justify-center text-xl mb-3">
                🤍
              </div>
              <p className="text-sm font-semibold text-slate-300">No words shared yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Be the first to send a gentle message of support and warmth.
              </p>
            </div>
          ) : (
            comments.map(c => (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700/60 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                      style={{
                        backgroundColor: `${c.authorAuraColor}20`,
                        border: `1.5px solid ${c.authorAuraColor}`,
                      }}
                    >
                      {c.authorAvatarSymbol}
                    </div>
                    <span className="text-xs font-semibold text-slate-200">
                      {c.authorPseudonym}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-9">
                  {c.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Input Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          {currentUser ? (
            <form onSubmit={handleSendComment} className="flex items-center gap-2">
              <input
                type="text"
                maxLength={800}
                placeholder="Leave an anonymous kind word..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-full bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="p-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={onLoginPrompt}
              className="w-full py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              Sign In Anonymously to Leave Words
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
