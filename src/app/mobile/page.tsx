"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Plus, X, Volume2, Square, Pause, Play, Settings, Loader, ChevronDown } from "lucide-react";
import { MobileStickyNoteCard } from '@/components/MobileStickyNoteCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from "@/components/ui/card";
import { MobileRoutineCard } from '@/components/MobileRoutineCard';
import AddHabitForm from "@/components/AddHabitForm";
import { Habit } from "@/lib/types";
import { NotePage } from './NotePage';
import { HabitPage } from './HabitPage';

interface Note {
  id: string;
  content: string;
  tags: { name: string }[];
}

export default function MobilePage() {
  // --- StudentPage state lifted up ---
  const [notes, setNotes] = useState<Note[]>([]);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [selectedTags, setSelectedTags] = useState<{ noteId: string; tagIndex: number }[]>([]);
  const [currentPlayingTag, setCurrentPlayingTag] = useState<{ noteId: string; tagIndex: number } | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tagRepeatCount, setTagRepeatCount] = useState(1);
  const [sequenceRepeatCount, setSequenceRepeatCount] = useState(1);
  const [currentTagRepeat, setCurrentTagRepeat] = useState(1);
  const [currentSequence, setCurrentSequence] = useState(1);
  const [currentPlayingTagIndex, setCurrentPlayingTagIndex] = useState<number | null>(null);
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

  const handlePlayAll = () => {
    if (selectedTags.length === 0) return;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      setCurrentAudio(null);
    }
    setIsPlaying(true);
    setCurrentTagRepeat(1);
    setCurrentSequence(1);
    const firstTag = selectedTags[0];
    setCurrentPlayingTag(null);
    setTimeout(() => setCurrentPlayingTag(firstTag), 0);
  };
  const handlePauseAll = () => {
    if (currentAudio) currentAudio.pause();
    setIsPlaying(false);
  };
  const handleResumeAll = () => {
    if (!currentPlayingTag) return;
    if (currentAudio) {
      currentAudio.play();
      setIsPlaying(true);
    } else {
      const currentTag = { ...currentPlayingTag };
      setCurrentPlayingTag(null);
      setTimeout(() => setCurrentPlayingTag(currentTag), 0);
      setIsPlaying(true);
    }
  };
  const handleStopAll = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      setCurrentAudio(null);
    }
    setIsPlaying(false);
    setCurrentPlayingTag(null);
    setCurrentTagRepeat(1);
    setCurrentSequence(1);
  };

  // Robust repeat/sequence play logic
  const handleTagFinished = () => {
    if (!isPlaying || currentPlayingTag == null) return;
    const tagIndices = selectedTags
      .filter(tag => tag.noteId === currentPlayingTag.noteId)
      .map(tag => tag.tagIndex);
    const sortedTagIndices = [...tagIndices].sort((a, b) => a - b);
    const currentIndex = sortedTagIndices.indexOf(currentPlayingTag.tagIndex);

    // If we haven't reached the repeat count for current tag
    if (currentTagRepeat < tagRepeatCount) {
      setCurrentTagRepeat(prev => prev + 1);
      // Force a re-render of the current tag to restart audio
      setCurrentPlayingTag({ ...currentPlayingTag });
      setCurrentPlayingTagIndex(currentPlayingTag.tagIndex);
      return;
    }

    // Reset tag repeat counter for next tag
    setCurrentTagRepeat(1);

    // If there are more tags in the sequence
    if (currentIndex < sortedTagIndices.length - 1) {
      const nextTagIndex = sortedTagIndices[currentIndex + 1];
      setCurrentPlayingTag({ noteId: currentPlayingTag.noteId, tagIndex: nextTagIndex });
      setCurrentPlayingTagIndex(nextTagIndex);
      return;
    }

    // If we've finished all tags in the sequence
    handleStopAll();
  };

  // Robust Select All/Deselect All for all notes
  const handleSelectAll = (noteId: string, tags: string[]) => {
    setSelectedTags(
      tags.map((_, idx) => ({ noteId, tagIndex: idx }))
    );
  };

  const handleDeselectAll = (noteId: string, tags: string[]) => {
    setSelectedTags(prev => prev.filter(tag => tag.noteId !== noteId));
  };

  // --- End StudentPage state/handlers ---

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'routine'>('notes');

  const selectAllTagsForNote = (note: Note) => {
    setSelectedTags(note.tags.map((_, idx) => ({ noteId: note.id, tagIndex: idx })));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col relative ">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 right-0 w-full z-20 bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm flex items-center h-14">
        <Button variant="ghost" size="icon" className="ml-2 mr-2" onClick={() => setDrawerOpen(prev => !prev)}>
          <Menu className="h-8 w-8 size-lg text-gray-700 hover:text-gray-900" />
        </Button>
        <div className="ml-auto mr-6">
        {/* Action buttons for Notes tab */}
        {activeTab === 'notes' && (
          <div className="flex gap-1 items-center">
            <Button onClick={handleAddCard} className="w-9 h-9 p-0" disabled={isAddingCard}>
              {isAddingCard ? <Loader className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            </Button>
            {currentPlayingTag ? (
              <Button onClick={isPlaying ? handlePauseAll : handleResumeAll} className={`w-9 h-9 p-0 ${isPlaying ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white`}>
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
            ) : (
              <Button onClick={handlePlayAll} className="w-9 h-9 p-0 bg-green-600 hover:bg-green-700 text-white" disabled={selectedTags.length === 0}>
                <Volume2 className="h-5 w-5" />
              </Button>
            )}
            <Button onClick={handleStopAll} className="w-9 h-9 p-0 bg-red-600 hover:bg-red-700 text-white" disabled={!currentPlayingTag}>
              <Square className="h-5 w-5" />
            </Button>
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
          </div>
        )}
        {activeTab === 'routine' && (
          <div className="flex gap-1 items-center">
            <Button onClick={() => setShowAddHabitForm(true)} className="w-9 h-9 p-0">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        )}
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
            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
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
            <div className="flex-1" />
          </div>
        </aside>
      </div>

      {/* Main Content - Tabbed */}
      <main className="flex-1 flex flex-col items-center justify-top  pt-9">
        {activeTab === 'notes' ? (
          <NotePage
            notes={notes}
            setNotes={setNotes}
            isAddingCard={isAddingCard}
            handleAddCard={handleAddCard}
            isPlaying={isPlaying}
            handlePauseAll={handlePauseAll}
            handleResumeAll={handleResumeAll}
            handlePlayAll={handlePlayAll}
            handleStopAll={handleStopAll}
            currentPlayingTag={currentPlayingTag}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            tagRepeatCount={tagRepeatCount}
            setTagRepeatCount={setTagRepeatCount}
            sequenceRepeatCount={sequenceRepeatCount}
            setSequenceRepeatCount={setSequenceRepeatCount}
            notesView={notesView}
            setNotesView={setNotesView}
            notesSortBy={notesSortBy}
            setNotesSortBy={setNotesSortBy}
            openNotesSort={openNotesSort}
            setOpenNotesSort={setOpenNotesSort}
            selectAllTagsForNote={selectAllTagsForNote}
            deselectAllTagsForNote={deselectAllTagsForNote}
            isLoading={isLoading}
            setCurrentAudio={setCurrentAudio}
            handleTagFinished={handleTagFinished}
          />
        ) : (
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
      </main>
    </div>
  );
} 