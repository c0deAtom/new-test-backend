"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Plus, X, Volume2, Square, Pause, Play, Settings, Loader, ChevronLeft, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Habit } from "@/lib/types";
import { NotePage } from './NotePage';
import { HabitPage } from './HabitPage';
import TeacherPage from './TeacherPage';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

interface Note {
  id: string;
  content: string;
  tags: { name: string }[];
}

// --- Speak a single tag (audio, text, or image) ---
async function speakTag(
  tag: { noteId: string; tagIndex: number },
  notes: Note[],
  onStart: (audio: HTMLAudioElement | null) => void,
  onEnd: () => void,
  playbackId?: number,
  playbackIdRef?: React.MutableRefObject<number>
) {
  console.log('speakTag called for tag:', tag);
  const note = notes.find((n: Note) => n.id === tag.noteId);
  if (!note) { onEnd(); return; }
  const tagValue = note.tags[tag.tagIndex]?.name || '';
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(tagValue) || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(tagValue);
  const isAudio = /\.(webm|mp3|wav|m4a|ogg|aac)$/i.test(tagValue) || /^https?:\/\/.+\.(webm|mp3|wav|m4a|ogg|aac)$/i.test(tagValue);
  if (isImage) { onEnd(); return; }
  if (isAudio) {
    const isFullUrl = tagValue.startsWith('http');
    const isAudioPath = tagValue.startsWith('/audios/');
    const audioSrc = isFullUrl
      ? tagValue
      : isAudioPath
        ? tagValue
        : '/audios/' + tagValue;
    const audio = new Audio(audioSrc);
    if (typeof playbackId !== 'undefined' && playbackIdRef && playbackId !== playbackIdRef.current) return;
    onStart(audio);
    audio.onended = onEnd;
    audio.onerror = onEnd;
    audio.play();
    return;
  }
  // Text: TTS
  try {
    const isHindi = /[\u0900-\u097F]/.test(tagValue);
    const res = await fetch('/api/elevenlabs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: tagValue, voiceId: isHindi ? '21m00Tcm4TlvDq8ikWAM' : undefined }),
    });
    if (!res.ok) throw new Error('TTS failed');
    const audioBlob = await res.blob();
    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    if (typeof playbackId !== 'undefined' && playbackIdRef && playbackId !== playbackIdRef.current) {
      URL.revokeObjectURL(url);
      return;
    }
    onStart(audio);
    audio.onended = () => { URL.revokeObjectURL(url); onEnd(); };
    audio.onerror = () => { URL.revokeObjectURL(url); onEnd(); };
    audio.play();
  } catch { onEnd(); }
}

// --- Custom hook to control tag speaking flow ---
function useSpeakSelectedTagsFlow(
  selectedTags: { noteId: string; tagIndex: number }[],
  notes: Note[],
  isPlaying: boolean,
  setIsPlaying: (v: boolean) => void,
  setCurrentAudio: (audio: HTMLAudioElement | null) => void,
  setCurrentPlayingTag: (tag: { noteId: string; tagIndex: number } | null) => void
) {
  const stopRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSpeakingRef = useRef(false);

  // Always point to latest selectedTags and notes
  const selectedTagsRef = useRef(selectedTags);
  const notesRef = useRef(notes);
  useEffect(() => { selectedTagsRef.current = selectedTags; }, [selectedTags]);
  useEffect(() => { notesRef.current = notes; }, [notes]);

  // Track played tags
  const playedTagsRef = useRef<{ noteId: string; tagIndex: number }[]>([]);

  const stop = useCallback(() => {
    stopRef.current = true;
    setIsPlaying(false);
    setCurrentAudio(null);
    setCurrentPlayingTag(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    playedTagsRef.current = [];
    isSpeakingRef.current = false;
  }, [setIsPlaying, setCurrentAudio, setCurrentPlayingTag]);

  function playFromFirstUnplayed() {
    if (isSpeakingRef.current) return;
    stopRef.current = false;
    const tags = selectedTagsRef.current;
    const played = playedTagsRef.current;
    const nextIndex = tags.findIndex(
      tag => !played.some(pt => pt.noteId === tag.noteId && pt.tagIndex === tag.tagIndex)
    );
    if (nextIndex === -1) {
      stop();
      return;
    }
    next(nextIndex);
  }

  // Track current playing tag in a ref for navigation
  const currentPlayingTagRef = useRef<{ noteId: string; tagIndex: number } | null>(null);
  useEffect(() => { currentPlayingTagRef.current = null; }, [selectedTags]);

  // Track if navigation is manual
  const manualNavigationRef = useRef(false);

  // Add a playback session id to prevent race conditions
  const playbackIdRef = useRef(0);

  function next(idx: number) {
    const tags = selectedTagsRef.current;
    const notesList = notesRef.current;
    if (stopRef.current || idx >= tags.length) {
      stop();
      return;
    }
    // Always stop any current audio before starting new
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    isSpeakingRef.current = false; // Reset before starting new
    isSpeakingRef.current = true;
    setCurrentPlayingTag(tags[idx]);
    currentPlayingTagRef.current = tags[idx];
    playbackIdRef.current += 1; // Increment playback session
    const thisPlaybackId = playbackIdRef.current;
    const tag = tags[idx];
    speakTag(tag, notesList, (audio: HTMLAudioElement | null) => {
      if (thisPlaybackId !== playbackIdRef.current) return;
      audioRef.current = audio;
      setCurrentAudio(audio);
    }, () => {
      if (thisPlaybackId !== playbackIdRef.current) return;
      // Only add to playedTagsRef if still in selectedTags
      const currentTags = selectedTagsRef.current;
      if (currentTags.some(t => t.noteId === tag.noteId && t.tagIndex === tag.tagIndex)) {
        playedTagsRef.current.push({ noteId: tag.noteId, tagIndex: tag.tagIndex });
      }
      // Remove any played tags that are no longer in selectedTags
      playedTagsRef.current = playedTagsRef.current.filter(
        pt => currentTags.some(tag => tag.noteId === pt.noteId && tag.tagIndex === pt.tagIndex)
      );
      isSpeakingRef.current = false;
      if (manualNavigationRef.current) {
        manualNavigationRef.current = false;
        playFromFirstUnplayed();
        return;
      }
      playFromFirstUnplayed();
    }, thisPlaybackId, playbackIdRef);
  }

  const start = useCallback(() => {
    playedTagsRef.current = [];
    if (!selectedTagsRef.current.length) return;
    playFromFirstUnplayed();
    setIsPlaying(true);
  }, [setIsPlaying]);

  const update = useCallback(() => {
    if (!isPlaying || stopRef.current) return;
    if (isSpeakingRef.current) return;
    // Remove played tags that are no longer in the selectedTags array
    const tags = selectedTagsRef.current;
    playedTagsRef.current = playedTagsRef.current.filter(
      pt => tags.some(tag => tag.noteId === pt.noteId && tag.tagIndex === pt.tagIndex)
    );
    // If all tags have been played, stop
    const played = playedTagsRef.current;
    const nextIndex = tags.findIndex(
      tag => !played.some(pt => pt.noteId === tag.noteId && pt.tagIndex === tag.tagIndex)
    );
    if (nextIndex === -1) {
      stop();
      return;
    }
    // Otherwise, do nothing: current tag will finish, then playFromFirstUnplayed will resume
  }, [isPlaying, stop]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [setIsPlaying]);

  const resume = useCallback(() => {
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.play();
    }
  }, [setIsPlaying]);

  useEffect(() => {
    // Remove played tags that are no longer in selectedTags
    playedTagsRef.current = playedTagsRef.current.filter(
      pt => selectedTags.some(tag => tag.noteId === pt.noteId && tag.tagIndex === pt.tagIndex)
    );
  }, [selectedTags]);

  // Helper to get current tag index
  function getCurrentTagIndex() {
    const tags = selectedTagsRef.current;
    const currentTag = currentPlayingTagRef.current;
    if (!tags.length || !currentTag) return -1;
    return tags.findIndex(
      tag => tag.noteId === currentTag.noteId && tag.tagIndex === currentTag.tagIndex
    );
  }

  // Play next tag
  const playNextTag = useCallback(() => {
    const tags = selectedTagsRef.current;
    let idx = getCurrentTagIndex();
    if (idx === -1 && tags.length > 0) idx = 0; // fallback to first tag if not found
    if (isSpeakingRef.current && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      isSpeakingRef.current = false;
    }
    if (idx >= 0 && idx < tags.length - 1) {
      manualNavigationRef.current = true;
      next(idx + 1);
      setIsPlaying(true);
    }
  }, []);

  // Play previous tag
  const playPreviousTag = useCallback(() => {
    const tags = selectedTagsRef.current;
    let idx = getCurrentTagIndex();
    if (idx === -1 && tags.length > 0) idx = tags.length - 1; // fallback to last tag if not found
    if (isSpeakingRef.current && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      isSpeakingRef.current = false;
    }
    if (idx > 0) {
      manualNavigationRef.current = true;
      next(idx - 1);
      setIsPlaying(true);
    }
  }, []);

  return { start, stop, update, pause, resume, playNextTag, playPreviousTag };
}

export default function MobilePage() {
  // --- StudentPage state lifted up ---
  const [notes, setNotes] = useState<Note[]>([]);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [selectedTags, setSelectedTags] = useState<{ noteId: string; tagIndex: number }[]>([]);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tagRepeatCount, setTagRepeatCount] = useState(1);
  const [sequenceRepeatCount, setSequenceRepeatCount] = useState(1);
  const [currentTagRepeat, setCurrentTagRepeat] = useState(1);
  const [currentSequence, setCurrentSequence] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAddHabitForm, setShowAddHabitForm] = useState(false);
  const [routineView, setRoutineView] = useState<'icon' | 'list' | 'big'>('icon');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('name');
  const [notesView, setNotesView] = useState<'icon' | 'list' | 'big'>('icon');
  const [notesSortBy, setNotesSortBy] = useState<'name' | 'createdAt'>('name');
  const [openNotesSort, setOpenNotesSort] = useState<'icon' | 'list' | 'big' | null>(null);
  const [openRoutineSort, setOpenRoutineSort] = useState<'icon' | 'list' | 'big' | null>(null);
  const [pageAnimDirection, setPageAnimDirection] = useState<'left' | 'right'>('right');
  const [currentPlayingTag, setCurrentPlayingTag] = useState<{ noteId: string; tagIndex: number } | null>(null);

  // Move fetchHabits here so it's accessible everywhere
  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits');
      const data = await res.json();
      setHabits(
        data.map((habit: any) => ({
          id: habit.id,
          name: habit.name,
          completed: habit.completed ?? false,
          userId: habit.userId ?? '',
          goalType: habit.goalType ?? '',
          microGoal: habit.microGoal ?? '',
          triggers: habit.triggers ?? [],
          cravingNarrative: habit.cravingNarrative ?? '',
          resistanceStyle: habit.resistanceStyle ?? '',
          motivationOverride: habit.motivationOverride ?? '',
          reflectionDepthOverride: habit.reflectionDepthOverride ?? 0,
          hitDefinition: habit.hitDefinition ?? '',
          slipDefinition: habit.slipDefinition ?? '',
          events: Array.isArray(habit.events) ? habit.events : [],
          createdAt: habit.createdAt ?? '',
          updatedAt: habit.updatedAt ?? '',
        }))
      );
    } catch {
      setHabits([]);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/notes');
        const data = await res.json();
        setNotes(data);
      } catch {
        setNotes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotes();
  }, [refetchTrigger]);

  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, []);

  const handleAddCard = async () => {
    setIsAddingCard(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '', tags: [] }),
      });
      const newNote = await res.json();
      setNotes(prev => [newNote, ...prev]);
    } catch {
      // handle error
    } finally {
      setIsAddingCard(false);
    }
  };

  const flow = useSpeakSelectedTagsFlow(selectedTags, notes, isPlaying, setIsPlaying, setCurrentAudio, setCurrentPlayingTag);

  const handlePlayAll = () => {
    flow.start();
  };
  const handlePauseAll = () => {
    flow.pause();
  };
  const handleResumeAll = () => {
    flow.resume();
  };
  const handleStopAll = () => {
    flow.stop();
  };

  // On selectedTags change, update the flow
  useEffect(() => {
    flow.update();
  }, [selectedTags]);

  // --- End StudentPage state/handlers ---

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'routine' | 'teacher'>('notes');

  const selectAllTagsForNote = (note: Note) => {
    setSelectedTags(prev => {
      // Remove any tags for this note, then add all tags for this note
      const filtered = prev.filter(tag => tag.noteId !== note.id);
      const newTags = note.tags.map((_, idx) => ({ noteId: note.id, tagIndex: idx }));
      // Avoid duplicates
      const combined = [...filtered, ...newTags];
      // Remove any accidental duplicates (by value)
      return combined.filter((tag, idx, arr) =>
        arr.findIndex(t => t.noteId === tag.noteId && t.tagIndex === tag.tagIndex) === idx
      );
    });
  };

  const deselectAllTagsForNote = (note: Note) => {
    setSelectedTags(prev => prev.filter(tag => tag.noteId !== note.id));
  };

  const sortedHabits = [...habits].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  });

  const sortedNotes = [...notes].sort((a, b) => {
    if (notesSortBy === 'name') return a.content.localeCompare(b.content);
    if (notesSortBy === 'createdAt') return 0; // Replace with actual date if available
    return 0;
  });

  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/users/latest')
      .then(res => res.json())
      .then(data => setUserName(data.name));
  }, []);

  // Add this after the menu button and before the ml-auto div in the header:
  const pageNames = [
    { key: 'notes', label: 'Notes' },
    { key: 'routine', label: 'Routine' },
    { key: 'teacher', label: 'Learn' },
  ];
  const currentPageIdx = pageNames.findIndex(p => p.key === activeTab);
  const handleSwitchPage = (dir: 'left' | 'right') => {
    setPageAnimDirection(dir);
    let newIdx = dir === 'left' ? currentPageIdx - 1 : currentPageIdx + 1;
    if (newIdx < 0) newIdx = pageNames.length - 1;
    if (newIdx >= pageNames.length) newIdx = 0;
    setActiveTab(pageNames[newIdx].key as typeof activeTab);
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col relative ">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 right-0 w-full z-20 bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm flex items-center h-14">
        {!drawerOpen ?  (<Button variant="ghost" size="icon" className="ml-2 mr-2" onClick={() => setDrawerOpen(prev => !prev)}>
          <Menu className="h-8 w-8 size-lg text-gray-700 hover:text-gray-900" />
        </Button>) : (  
        <Button variant="ghost" size="icon" className="ml-2 mr-2"  onClick={() => setDrawerOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
        )}
        {/* Page Switcher - fixed/absolute center in navbar */}
        <div className="h-7 w-80 absolute left-44 top-[74] -translate-x-1/2 -translate-y-1/2 z-30 bg-gray-300 flex items-center justify-center gap-9 bg-gray-100 rounded px-3 py-1 shadow-sm">
          <Button variant="ghost" size="icon" className="h-6 w-7 hover:bg-yellow-100 " onClick={() => handleSwitchPage('left')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="relative min-w-[70px] flex items-center justify-center h-7 overflow-hidden">
            <AnimatePresence initial={false} custom={pageAnimDirection}>
              <motion.span
                key={pageNames[currentPageIdx].key}
                initial={{
                  x: pageAnimDirection === 'right' ? 40 : -40,
                  opacity: 0
                }}
                animate={{ x: 0, opacity: 1 }}
                exit={{
                  x: pageAnimDirection === 'right' ? -40 : 40,
                  opacity: 0
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30, duration: 0.3 }}
                className="absolute left-0 right-0 text-base font-semibold text-center"
              >
                {pageNames[currentPageIdx].label}
              </motion.span>
            </AnimatePresence>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-7 hover:bg-yellow-100 " onClick={() => handleSwitchPage('right')}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="ml-auto mr-6">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'notes' && (
              <motion.div
                key="notes-actions"
                className="flex gap-1 items-center"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  hidden: { opacity: 0, x: 40 },
                  visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
                }}
              >
                <motion.div variants={{ hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0 } }}>
                  <Button onClick={handleAddCard} className="w-9 h-9 p-0" disabled={isAddingCard}>
                    {isAddingCard ? <Loader className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                  </Button>
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0 } }}>
                     {/* Tag navigation buttons */}
                <Button
                  variant="ghost"
                  size="icon"
                 className="h-9 w-9 text-white bg-gray-500 hover:bg-gray-200"
                  onClick={() => flow.playPreviousTag()}
                  disabled={!currentAudio}
                  title="Previous Tag"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
             
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0 } }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-white bg-gray-500 hover:bg-gray-200"
                  onClick={() => flow.playNextTag()}
                  disabled={!currentAudio}
                  title="Next Tag"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>     </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0 } }}>
                  <Button
                    onClick={() => {
                      if (isPlaying) {
                        handlePauseAll();
                      } else if (currentAudio) {
                        handleResumeAll();
                      } else {
                        handlePlayAll();
                      }
                    }}
                    className={`w-9 h-9 p-0 ${isPlaying ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0 } }}>
                  <Button onClick={handleStopAll} className="w-9 h-9 p-0 bg-red-600 hover:bg-red-700 text-white" disabled={!currentAudio}>
                    <Square className="h-5 w-5" />
                  </Button>
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0 } }}>
                  <DropdownMenu open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button className="w-9 h-9 p-0 bg-gray-600 hover:bg-gray-400 text-white">
                        <Settings className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="p-2 space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Each Tag Repeats</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              className="w-20"
                              value={tagRepeatCount}
                              onChange={(e) => setTagRepeatCount(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                            <span className="text-sm text-gray-500">times</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Sequence Repeats</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              className="w-20"
                              value={sequenceRepeatCount}
                              onChange={(e) => setSequenceRepeatCount(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                            <span className="text-sm text-gray-500">times</span>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
            
              </motion.div>
            )}
            {activeTab === 'routine' && (
              <motion.div
                key="routine-actions"
                className="flex gap-1 items-center"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  hidden: { opacity: 0, x: 40 },
                  visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
                }}
              >
                <motion.div variants={{ hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0 } }}>
                  <Button onClick={() => setShowAddHabitForm(true)} className="w-9 h-9 p-0">
                    <Plus className="h-5 w-5" />
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Custom Left Drawer with navigation */}
      <div>
        <div
          className={`fixed left-0 right-0 top-14 bottom-0 z-40 transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={`fixed left-0 top-14 h-[calc(100vh-56px)] w-4/5 max-w-xs  bg-white shadow-lg z-50 flex flex-col transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-semibold text-lg">{userName}</span>
          
          </div>
          <div className=" flex flex-col gap-2 flex-1">
            <Button
              variant={activeTab === 'notes' ? 'default' : 'ghost'}
              className={`justify-start text-base rounded-none w-full flex items-center gap-2 transition-colors ${activeTab === 'notes' ? 'bg-yellow-100 text-yellow-900' : 'hover:bg-gray-100'}`}
              onClick={() => {
                setActiveTab('notes');
                setDrawerOpen(false);
              }}
            >
              <Plus className="h-5 w-5" />
              Notes
            </Button>
            <Button
              variant={activeTab === 'routine' ? 'default' : 'ghost'}
              className={`justify-start text-base rounded-none w-full flex items-center gap-2 transition-colors ${activeTab === 'routine' ? 'bg-yellow-100 text-yellow-900' : 'hover:bg-gray-100'}`}
              onClick={() => {
                setActiveTab('routine');
                setDrawerOpen(false);
              }}
            >
              <Menu className="h-5 w-5" />
              Routine
            </Button>
            <Button
              variant={activeTab === 'teacher' ? 'default' : 'ghost'}
              className={`justify-start text-base rounded-none w-full flex items-center gap-2 transition-colors ${activeTab === 'teacher' ? 'bg-yellow-100 text-yellow-900' : 'hover:bg-gray-100'}`}
              onClick={() => {
                setActiveTab('teacher');
                setDrawerOpen(false);
              }}
            >
              <Menu className="h-5 w-5" />
              AI
            </Button>
            <div className="flex-1" />
          </div>
        </aside>
      </div>

      {/* Main Content - Tabbed */}
      <main className="flex-1 flex flex-col items-center justify-top  pt-9">
        {activeTab === 'notes' && (
          <NotePage
            notes={notes}
            setNotes={setNotes}
            isPlaying={isPlaying}
            handleStopAll={handleStopAll}
            currentPlayingTag={currentPlayingTag}
            setCurrentPlayingTag={setCurrentPlayingTag}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            notesView={notesView}
            setNotesView={setNotesView}
            notesSortBy={notesSortBy}
            setNotesSortBy={setNotesSortBy}
            openNotesSort={openNotesSort}
            setOpenNotesSort={setOpenNotesSort}
            selectAllTagsForNote={selectAllTagsForNote}
            deselectAllTagsForNote={deselectAllTagsForNote}
            setCurrentAudio={setCurrentAudio}
            handleTagFinished={() => {}}
          />
        )}
        {activeTab === 'routine' && (
          <HabitPage
            habits={habits}
            sortBy={sortBy}
            setSortBy={setSortBy}
            routineView={routineView}
            setRoutineView={setRoutineView}
            openRoutineSort={openRoutineSort}
            setOpenRoutineSort={setOpenRoutineSort}
            showAddHabitForm={showAddHabitForm}
            setShowAddHabitForm={setShowAddHabitForm}
            fetchHabits={fetchHabits}
          />
        )}
        {activeTab === 'teacher' && <TeacherPage setRefetchTrigger={setRefetchTrigger} />}
      </main>
    </div>
  );
} 