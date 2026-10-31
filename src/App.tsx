/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  where,
} from 'firebase/firestore';
import { auth, db, loginWithGoogle, handleFirestoreError, OperationType } from './lib/firebase';
import { EmotionPost, UserProfile, PrivateUserInfo, DailyCheckin } from './types';
import { generateRandomPersona } from './lib/personaGenerator';
import { Navbar } from './components/Navbar';
import { EmotionWeatherBar } from './components/EmotionWeatherBar';
import { EmotionCard } from './components/EmotionCard';
import { ShareEmotionModal } from './components/ShareEmotionModal';
import { CommentsDrawer } from './components/CommentsDrawer';
import { DirectMessagesModal } from './components/DirectMessagesModal';
import { BreathingModal } from './components/BreathingModal';
import { ProfileModal } from './components/ProfileModal';
import { DailyCheckinModal, getTodayDateString } from './components/DailyCheckinModal';
import { DailyCheckinPromptBanner } from './components/DailyCheckinPromptBanner';
import {
  Sparkles,
  ShieldCheck,
  Search,
  MessageCircle,
  Heart,
  Plus,
  LogIn,
  SlidersHorizontal,
  Flame,
  ArrowUpDown,
  Lock,
} from 'lucide-react';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Emotions Feed
  const [emotions, setEmotions] = useState<EmotionPost[]>([]);
  const [feedLoading, setFeedLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'resonant'>('newest');
  const [openToChatOnly, setOpenToChatOnly] = useState<boolean>(false);

  // Daily Check-ins & Pulse
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState<boolean>(false);

  // Modals & Drawers
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState<boolean>(false);
  const [isBreathingModalOpen, setIsBreathingModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [profileTab, setProfileTab] = useState<'persona' | 'trends' | 'history'>('persona');
  const [activeCommentsEmotion, setActiveCommentsEmotion] = useState<EmotionPost | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // User Reactions Map: emotionId -> string[] (reaction types)
  const [userReactionsMap, setUserReactionsMap] = useState<Record<string, string[]>>({});
  const [activeConversationsCount, setActiveConversationsCount] = useState<number>(0);

  // 1. Authentication Listener & Profile Setup
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            setUserProfile(userSnap.data() as UserProfile);
          } else {
            // First time login: generate unique anonymous persona
            const initialPersona = generateRandomPersona();
            const newProfile: UserProfile = {
              userId: currentUser.uid,
              pseudonym: initialPersona.pseudonym,
              auraColor: initialPersona.auraColor,
              avatarSymbol: initialPersona.avatarSymbol,
              bio: initialPersona.bio,
              openToMessages: true,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);

            // Save isolated private info (PII)
            const privateInfoRef = doc(db, 'users', currentUser.uid, 'private', 'info');
            const privateInfo: PrivateUserInfo = {
              userId: currentUser.uid,
              email: currentUser.email || 'anonymous@auraecho.internal',
              createdAt: new Date().toISOString(),
            };
            await setDoc(privateInfoRef, privateInfo);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
        }
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Check-ins Subscription for Logged-In User
  useEffect(() => {
    if (!userProfile) {
      setCheckins([]);
      return;
    }

    const checkinsRef = collection(db, 'users', userProfile.userId, 'checkins');
    const q = query(checkinsRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: DailyCheckin[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as DailyCheckin);
        });
        setCheckins(list);
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, `users/${userProfile.userId}/checkins`);
      }
    );

    return () => unsubscribe();
  }, [userProfile]);

  // Determine if user has checked in today
  const todayDateStr = getTodayDateString();
  const todayCheckin = checkins.find(c => c.date === todayDateStr) || null;

  // 3. Real-time Emotions Subscription (Public Anonymous Feed)
  useEffect(() => {
    if (!firebaseUser) {
      setEmotions([]);
      setFeedLoading(false);
      return;
    }

    setFeedLoading(true);
    const emotionsRef = collection(db, 'emotions');
    const q = query(emotionsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: EmotionPost[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as EmotionPost);
        });
        setEmotions(list);
        setFeedLoading(false);
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, 'emotions');
        setFeedLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  // 4. Track active conversations count for logged-in user
  useEffect(() => {
    if (!userProfile) {
      setActiveConversationsCount(0);
      return;
    }

    const convRef = collection(db, 'conversations');
    const q1 = query(convRef, where('participant1Id', '==', userProfile.userId));
    const q2 = query(convRef, where('participant2Id', '==', userProfile.userId));

    let p1Count = 0;
    let p2Count = 0;

    const unsub1 = onSnapshot(q1, snap => {
      p1Count = snap.size;
      setActiveConversationsCount(p1Count + p2Count);
    });
    const unsub2 = onSnapshot(q2, snap => {
      p2Count = snap.size;
      setActiveConversationsCount(p1Count + p2Count);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [userProfile]);

  // 5. Handle Create New Emotion Post
  const handleCreateEmotion = async (data: {
    category: string;
    intensity: number;
    title?: string;
    content: string;
    soundscape?: string;
  }) => {
    if (!userProfile) return;

    const emotionId = `emotion_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newEmotion: EmotionPost = {
      id: emotionId,
      authorId: userProfile.userId,
      authorPseudonym: userProfile.pseudonym,
      authorAuraColor: userProfile.auraColor,
      authorAvatarSymbol: userProfile.avatarSymbol,
      emotionCategory: data.category,
      intensity: data.intensity,
      title: data.title || undefined,
      content: data.content,
      soundscape: data.soundscape,
      supportCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = doc(db, 'emotions', emotionId);
      await setDoc(docRef, newEmotion);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `emotions/${emotionId}`);
    }
  };

  // 6. Handle Reaction on an Emotion Post
  const handleReaction = async (emotionId: string, reactionType: string) => {
    if (!userProfile) {
      handleLogin();
      return;
    }

    const reactionDocId = userProfile.userId;
    const reactionRef = doc(db, 'emotions', emotionId, 'reactions', reactionDocId);
    const emotionRef = doc(db, 'emotions', emotionId);

    try {
      const existingReaction = await getDoc(reactionRef);
      if (existingReaction.exists()) {
        const currentType = existingReaction.data()?.reactionType;
        if (currentType === reactionType) {
          // Toggle off
          await deleteDoc(reactionRef);
          await updateDoc(emotionRef, {
            supportCount: increment(-1),
          });
          setUserReactionsMap(prev => ({
            ...prev,
            [emotionId]: (prev[emotionId] || []).filter(r => r !== reactionType),
          }));
        } else {
          // Change reaction type
          await updateDoc(reactionRef, {
            reactionType,
            createdAt: new Date().toISOString(),
          });
          setUserReactionsMap(prev => ({
            ...prev,
            [emotionId]: [reactionType],
          }));
        }
      } else {
        // New reaction
        await setDoc(reactionRef, {
          id: reactionDocId,
          emotionId,
          userId: userProfile.userId,
          reactionType,
          createdAt: new Date().toISOString(),
        });
        await updateDoc(emotionRef, {
          supportCount: increment(1),
        });
        setUserReactionsMap(prev => ({
          ...prev,
          [emotionId]: [...(prev[emotionId] || []), reactionType],
        }));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `emotions/${emotionId}/reactions/${reactionDocId}`);
    }
  };

  // 7. Direct Message / Connect Action: Start or Resume 1-on-1 Chat
  const handleStartDirectMessage = async (
    authorId: string,
    authorPseudonym: string,
    authorAura: string,
    authorAvatar: string
  ) => {
    if (!userProfile) {
      handleLogin();
      return;
    }
    if (authorId === userProfile.userId) return;

    try {
      // Deterministic conversation ID for pair of users (sorted UIDs)
      const uids = [userProfile.userId, authorId].sort();
      const conversationId = `conv_${uids[0]}_${uids[1]}`;

      const convDocRef = doc(db, 'conversations', conversationId);
      const convSnap = await getDoc(convDocRef);

      if (!convSnap.exists()) {
        const isUser1 = userProfile.userId === uids[0];
        await setDoc(convDocRef, {
          id: conversationId,
          participant1Id: uids[0],
          participant2Id: uids[1],
          participant1Pseudonym: isUser1 ? userProfile.pseudonym : authorPseudonym,
          participant2Pseudonym: isUser1 ? authorPseudonym : userProfile.pseudonym,
          participant1Aura: isUser1 ? userProfile.auraColor : authorAura,
          participant2Aura: isUser1 ? authorAura : userProfile.auraColor,
          participant1Avatar: isUser1 ? userProfile.avatarSymbol : authorAvatar,
          participant2Avatar: isUser1 ? authorAvatar : userProfile.avatarSymbol,
          lastMessage: 'Anonymous connection established',
          lastMessageTime: new Date().toISOString(),
          lastSenderId: userProfile.userId,
          createdAt: new Date().toISOString(),
        });
      }

      setSelectedConversationId(conversationId);
      setIsMessagesModalOpen(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'conversations');
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleOpenTrends = () => {
    setProfileTab('trends');
    setIsProfileModalOpen(true);
  };

  // Filter & Search Logic
  const filteredEmotions = emotions
    .filter(e => {
      if (selectedCategory && e.emotionCategory !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesContent = e.content.toLowerCase().includes(query);
        const matchesTitle = e.title?.toLowerCase().includes(query) ?? false;
        const matchesPseudonym = e.authorPseudonym.toLowerCase().includes(query);
        if (!matchesContent && !matchesTitle && !matchesPseudonym) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'resonant') {
        const countA = (a.supportCount || 0) + (a.commentsCount || 0);
        const countB = (b.supportCount || 0) + (b.commentsCount || 0);
        return countB - countA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const myEmotions = emotions.filter(e => e.authorId === userProfile?.userId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* Navigation Bar */}
      <Navbar
        userProfile={userProfile}
        onOpenShareModal={() => (userProfile ? setIsShareModalOpen(true) : handleLogin())}
        onOpenMessagesModal={() => (userProfile ? setIsMessagesModalOpen(true) : handleLogin())}
        onOpenBreathingModal={() => setIsBreathingModalOpen(true)}
        onOpenProfileModal={() => {
          setProfileTab('persona');
          setIsProfileModalOpen(true);
        }}
        onOpenCheckinModal={() => (userProfile ? setIsCheckinModalOpen(true) : handleLogin())}
        todayCheckedIn={Boolean(todayCheckin)}
        onLogin={handleLogin}
        activeConversationsCount={activeConversationsCount}
      />

      {/* Main Sanctuary Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Daily Emotional Pulse Check-In Banner */}
        {userProfile && (
          <DailyCheckinPromptBanner
            todayCheckin={todayCheckin}
            currentUser={userProfile}
            onOpenCheckinModal={() => setIsCheckinModalOpen(true)}
            onOpenTrends={handleOpenTrends}
          />
        )}

        {/* Hero Banner with Anonymity Guarantee */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-purple-950/40 via-slate-900/60 to-slate-950/80 border border-purple-500/20 p-6 sm:p-10 mb-8 backdrop-blur-xl shadow-2xl">
          {/* Subtle Ambient Orbs */}
          <div className="absolute top-0 right-10 w-72 h-72 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero-Doxxing · 100% Anonymous Haven</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 leading-tight">
              Share Your Real Emotions. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300 bg-clip-text text-transparent">
                Never Reveal Your Identity.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 mb-6 leading-relaxed">
              Every day we bottle up feelings because of who we have to be. In AuraEcho, you are only an anonymous soul with a glowing aura. Express your deepest joy, ache, or anxiety freely, and connect with others in private 1-on-1 dialogues.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => (userProfile ? setIsShareModalOpen(true) : handleLogin())}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Share an Emotion Now</span>
              </button>

              {userProfile && (
                <button
                  onClick={() => setIsCheckinModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium bg-pink-950/50 border border-pink-500/40 hover:border-pink-400 text-pink-200 transition-colors cursor-pointer"
                >
                  <span>🌸</span>
                  <span>{todayCheckin ? "Update Today's Pulse" : 'Record Daily Pulse'}</span>
                </button>
              )}

              <button
                onClick={() => setIsBreathingModalOpen(true)}
                className="px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                Need to Breathe?
              </button>

              {!userProfile && (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-indigo-400" />
                  <span>Create Anonymous Account</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Not Logged In Prompt Notice if guest */}
        {!userProfile && !authLoading && (
          <div className="mb-8 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-900/60 flex items-center justify-center text-xl shrink-0">
                🔒
              </div>
              <div className="text-xs">
                <h4 className="font-semibold text-slate-100">
                  Join the Anonymous Sanctuary
                </h4>
                <p className="text-slate-400 mt-0.5">
                  Sign in to read community echoes, share your feelings, record daily pulses, and message other souls 1-on-1.
                </p>
              </div>
            </div>
            <button
              onClick={handleLogin}
              className="px-5 py-2 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              Sign In to Enter
            </button>
          </div>
        )}

        {/* Emotion Weather Bar & Filters */}
        {userProfile && (
          <EmotionWeatherBar
            emotions={emotions}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            openToChatOnly={openToChatOnly}
            onToggleOpenToChat={() => setOpenToChatOnly(!openToChatOnly)}
          />
        )}

        {/* Search & Sort Controls Bar */}
        {userProfile && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search emotions by keyword or feeling..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-purple-500/80"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
              </span>
              <button
                onClick={() => setSortBy('newest')}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  sortBy === 'newest'
                    ? 'bg-purple-950/70 border-purple-500/60 text-purple-200 font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy('resonant')}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  sortBy === 'resonant'
                    ? 'bg-purple-950/70 border-purple-500/60 text-purple-200 font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Most Resonant
              </button>
            </div>
          </div>
        )}

        {/* Emotions Feed Stream */}
        {authLoading || feedLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-12">
            {[1, 2, 3, 4].map(idx => (
              <div
                key={idx}
                className="h-64 rounded-3xl bg-slate-900/40 border border-slate-800/60 animate-pulse p-6"
              />
            ))}
          </div>
        ) : !userProfile ? (
          /* Preview screen for guest users */
          <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/30 border border-slate-800/60">
            <div className="w-16 h-16 rounded-full bg-purple-950/50 border border-purple-500/30 text-purple-300 mx-auto flex items-center justify-center text-2xl mb-4">
              🌌
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">
              The Anonymous Emotion River Awaits
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Create your anonymous pseudonym and aura to start sharing, reading, and connecting safely with other souls.
            </p>
            <button
              onClick={handleLogin}
              className="px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              Sign In with Google (Anonymous Persona Generated)
            </button>
          </div>
        ) : filteredEmotions.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/30 border border-slate-800/60">
            <div className="w-14 h-14 rounded-full bg-purple-950/40 text-purple-300 mx-auto flex items-center justify-center text-2xl mb-3">
              🍃
            </div>
            <h3 className="text-base font-bold text-slate-200">No echoes found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
              {searchQuery || selectedCategory
                ? 'Try adjusting your search query or emotion filter.'
                : 'The sanctuary is currently quiet. Be the brave soul to share the first echo.'}
            </p>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all cursor-pointer"
            >
              Release an Emotion
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredEmotions.map(emotion => (
              <EmotionCard
                key={emotion.id}
                emotion={emotion}
                currentUser={userProfile}
                onReact={handleReaction}
                onOpenComments={setActiveCommentsEmotion}
                onStartDirectMessage={handleStartDirectMessage}
                userReactions={userReactionsMap[emotion.id] || []}
              />
            ))}
          </div>
        )}

      </main>

      {/* Modals & Drawers */}
      {userProfile && (
        <>
          <DailyCheckinModal
            isOpen={isCheckinModalOpen}
            onClose={() => setIsCheckinModalOpen(false)}
            currentUser={userProfile}
            todayCheckin={todayCheckin}
            onSaved={savedCheckin => {
              setCheckins(prev => {
                const filtered = prev.filter(c => c.date !== savedCheckin.date);
                return [savedCheckin, ...filtered];
              });
            }}
          />

          <ShareEmotionModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            currentUser={userProfile}
            onSubmit={handleCreateEmotion}
          />

          <DirectMessagesModal
            isOpen={isMessagesModalOpen}
            onClose={() => setIsMessagesModalOpen(false)}
            currentUser={userProfile}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
          />

          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            currentUser={userProfile}
            onUpdateProfile={setUserProfile}
            myEmotions={myEmotions}
            checkins={checkins}
            onOpenCheckinModal={() => {
              setIsProfileModalOpen(false);
              setIsCheckinModalOpen(true);
            }}
            initialTab={profileTab}
          />
        </>
      )}

      <BreathingModal
        isOpen={isBreathingModalOpen}
        onClose={() => setIsBreathingModalOpen(false)}
      />

      <CommentsDrawer
        emotion={activeCommentsEmotion}
        onClose={() => setActiveCommentsEmotion(null)}
        currentUser={userProfile}
        onLoginPrompt={handleLogin}
      />

      {/* Floating Share Button on mobile */}
      {userProfile && (
        <button
          onClick={() => setIsShareModalOpen(true)}
          className="fixed bottom-6 right-6 sm:hidden z-40 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-600/40 flex items-center justify-center text-2xl active:scale-95 transition-transform"
          title="Share Emotion"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-900 py-8 px-4 text-center text-xs text-slate-400">
        <div className="max-w-md mx-auto space-y-2">
          <p className="flex items-center justify-center gap-1.5 font-medium text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Strict Zero-Doxxing Architecture · Privacy Guaranteed</span>
          </p>
          <p className="text-[11px]">
            AuraEcho is a non-judgmental emotional sanctuary. Real user emails and identifying data are never stored in public documents or shared with other members.
          </p>
        </div>
      </footer>

    </div>
  );
}
