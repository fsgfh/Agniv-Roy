/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, UserProfile } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  X,
  Send,
  MessageCircle,
  ShieldCheck,
  ChevronLeft,
  Sparkles,
  Heart,
  Smile,
  Info,
} from 'lucide-react';
import { soundscape } from '../lib/audioAmbiance';

interface DirectMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  selectedConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
}

function timeAgo(dateString?: string): string {
  if (!dateString) return '';
  try {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  } catch {
    return '';
  }
}

export const DirectMessagesModal: React.FC<DirectMessagesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  selectedConversationId,
  onSelectConversation,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to all conversations where current user is participant1 or participant2
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const convRef = collection(db, 'conversations');
    const q1 = query(convRef, where('participant1Id', '==', currentUser.userId));
    const q2 = query(convRef, where('participant2Id', '==', currentUser.userId));

    let part1List: Conversation[] = [];
    let part2List: Conversation[] = [];

    const updateAll = () => {
      const combined = [...part1List, ...part2List];
      // remove duplicate ids
      const map = new Map<string, Conversation>();
      combined.forEach(c => map.set(c.id, c));
      const sorted = Array.from(map.values()).sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || a.createdAt).getTime();
        const timeB = new Date(b.lastMessageTime || b.createdAt).getTime();
        return timeB - timeA;
      });
      setConversations(sorted);

      // Default select first if none selected and exists
      if (!selectedConversationId && sorted.length > 0) {
        onSelectConversation(sorted[0].id);
      }
    };

    const unsub1 = onSnapshot(
      q1,
      snapshot => {
        part1List = [];
        snapshot.forEach(docSnap => part1List.push(docSnap.data() as Conversation));
        updateAll();
      },
      err => handleFirestoreError(err, OperationType.LIST, 'conversations')
    );

    const unsub2 = onSnapshot(
      q2,
      snapshot => {
        part2List = [];
        snapshot.forEach(docSnap => part2List.push(docSnap.data() as Conversation));
        updateAll();
      },
      err => handleFirestoreError(err, OperationType.LIST, 'conversations')
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, [isOpen, currentUser, selectedConversationId, onSelectConversation]);

  // Subscribe to messages of active conversation
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, 'conversations', selectedConversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: Message[] = [];
        snapshot.forEach(docSnap => list.push(docSnap.data() as Message));
        setMessages(list);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      err =>
        handleFirestoreError(err, OperationType.LIST, `conversations/${selectedConversationId}/messages`)
    );

    return () => unsubscribe();
  }, [selectedConversationId]);

  if (!isOpen) return null;

  const activeConversation = conversations.find(c => c.id === selectedConversationId);

  // Determine partner details
  const isPart1 = activeConversation?.participant1Id === currentUser.userId;
  const partnerPseudonym = isPart1
    ? activeConversation?.participant2Pseudonym
    : activeConversation?.participant1Pseudonym;
  const partnerAura = isPart1
    ? activeConversation?.participant2Aura || '#8B5CF6'
    : activeConversation?.participant1Aura || '#8B5CF6';
  const partnerAvatar = isPart1
    ? activeConversation?.participant2Avatar || '✨'
    : activeConversation?.participant1Avatar || '✨';

  const handleSendMessage = async (customText?: string) => {
    const messageText = customText || text;
    if (!messageText.trim() || !selectedConversationId || !activeConversation) return;

    setIsSending(true);
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const nowIso = new Date().toISOString();

      const messageData: Message = {
        id: messageId,
        conversationId: selectedConversationId,
        senderId: currentUser.userId,
        senderPseudonym: currentUser.pseudonym,
        senderAura: currentUser.auraColor,
        senderAvatar: currentUser.avatarSymbol,
        text: messageText.trim(),
        createdAt: nowIso,
      };

      const msgDocRef = doc(db, 'conversations', selectedConversationId, 'messages', messageId);
      await setDoc(msgDocRef, messageData);

      // Update parent conversation summary
      const convDocRef = doc(db, 'conversations', selectedConversationId);
      await updateDoc(convDocRef, {
        lastMessage: messageText.trim().slice(0, 500),
        lastMessageTime: nowIso,
        lastSenderId: currentUser.userId,
      });

      soundscape.playResonanceBell();
      if (!customText) setText('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `conversations/${selectedConversationId}/messages`);
    } finally {
      setIsSending(false);
    }
  };

  const icebreakers = [
    "I read your emotion post and wanted to say you're not alone 🤍",
    "I resonated so much with what you shared. Sending you quiet warmth ✨",
    "I'm here if you ever need a safe, anonymous friend to listen 🌌",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[88vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex overflow-hidden">
        
        {/* Left Sidebar: Conversations List */}
        <aside
          className={`w-full md:w-80 border-r border-slate-800 bg-slate-950/40 flex flex-col ${
            selectedConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-sm text-slate-100">Private Echoes</h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
              {conversations.length}
            </span>
          </div>

          {/* Privacy Note */}
          <div className="p-3 mx-3 my-2 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>End-to-End Anonymous: Real names or emails are never revealed.</span>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
            {conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-800/60 text-slate-400 mx-auto flex items-center justify-center text-xl mb-3">
                  💬
                </div>
                <p className="text-xs font-semibold text-slate-300">No conversations yet</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Click "Reach Out Privately" on any emotion card in the river to start a 1-on-1 dialogue.
                </p>
              </div>
            ) : (
              conversations.map(c => {
                const partnerIs1 = c.participant1Id !== currentUser.userId;
                const pPseudonym = partnerIs1 ? c.participant1Pseudonym : c.participant2Pseudonym;
                const pAura = partnerIs1 ? c.participant1Aura || '#8B5CF6' : c.participant2Aura || '#8B5CF6';
                const pAvatar = partnerIs1 ? c.participant1Avatar || '✨' : c.participant2Avatar || '✨';
                const isSelected = c.id === selectedConversationId;

                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectConversation(c.id)}
                    className={`w-full p-3.5 flex items-start gap-3 text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-purple-950/40 border-l-4 border-purple-500' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{
                        backgroundColor: `${pAura}20`,
                        border: `1.5px solid ${pAura}`,
                      }}
                    >
                      {pAvatar}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {pPseudonym}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {timeAgo(c.lastMessageTime || c.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {c.lastMessage || 'New connection started'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Pane: Active Chat Room */}
        <main
          className={`flex-1 flex flex-col bg-slate-900 ${
            !selectedConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => onSelectConversation(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white md:hidden"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                    style={{
                      backgroundColor: `${partnerAura}20`,
                      border: `1.5px solid ${partnerAura}`,
                    }}
                  >
                    {partnerAvatar}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-100">{partnerPseudonym}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-medium">
                        Encrypted Anon
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      1-on-1 Sanctuary · Say whatever is on your mind safely
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

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Intro welcome bubble */}
                <div className="text-center py-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-800/80 text-[11px] text-slate-400 border border-slate-700/60">
                    🔒 Connected anonymously with {partnerPseudonym}
                  </span>
                </div>

                {messages.length === 0 && (
                  <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 text-center max-w-md mx-auto">
                    <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-200">
                      Break the ice with empathy
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 mb-4">
                      Tap a kind message below or write your own thoughts:
                    </p>
                    <div className="space-y-2">
                      {icebreakers.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(prompt)}
                          className="w-full text-left p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-xs text-slate-300 hover:text-purple-200 transition-all cursor-pointer"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map(m => {
                  const isMine = m.senderId === currentUser.userId;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
                        {!isMine && (
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 mb-1"
                            style={{
                              backgroundColor: `${m.senderAura || partnerAura}20`,
                              border: `1px solid ${m.senderAura || partnerAura}`,
                            }}
                          >
                            {m.senderAvatar || partnerAvatar}
                          </div>
                        )}

                        <div
                          className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                            isMine
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs'
                              : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/70'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.text}</p>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {timeAgo(m.createdAt)}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/60">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    maxLength={1500}
                    placeholder={`Write an honest message to ${partnerPseudonym}...`}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !text.trim()}
                    className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-purple-600/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-3xl mb-4">
                🌌
              </div>
              <h3 className="text-base font-bold text-slate-100">Your Anonymous Conversations</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6">
                Connect deeply with other souls while protecting your real-life privacy. Select an existing conversation or reach out to someone from the emotion river.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition-colors"
              >
                Close & Return to River
              </button>
            </div>
          )}
        </main>

      </div>
    </div>
  );
};
