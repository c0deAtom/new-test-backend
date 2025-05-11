'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Volume2, Square, Pause, Play, Settings } from "lucide-react";
import { toast } from "sonner";
import { StickyNoteCard, StickyNoteCardSkeleton } from '@/components/StickyNoteCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Note {
  id: string;
  content: string;
  tags: { name: string }[];
}

export default function StudentPage() {
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
  const [isLoading, setIsLoading] = useState(true);

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

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, []);

  const handleAddCard = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '', tags: [] }),
      });
      const newNote = await res.json();
      setNotes(prev => [newNote, ...prev]);
      toast.success('New note added!');
    } catch {
      toast.error('Error creating note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete note');
      toast.success('Note deleted!');
      setRefetchTrigger(prev => prev + 1);
    } catch {
      toast.error('Error deleting note');
    }
  };

  const handleTagSelection = (noteId: string, tagIndex: number, isSelected: boolean) => {
    setSelectedTags(prev => {
      if (isSelected) {
        return [...prev, { noteId, tagIndex }];
      } else {
        return prev.filter(tag => !(tag.noteId === noteId && tag.tagIndex === tagIndex));
      }
    });
  };

  const playCurrentTag = () => {
    if (!currentPlayingTag) return;
    
    // Clean up any existing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
    }
    
    // Set the current tag to play
    setCurrentPlayingTag(currentPlayingTag);
  };

  const handleTagFinished = () => {
    if (!isPlaying || !currentPlayingTag) return;
    
    const currentIndex = selectedTags.findIndex(
      tag => tag.noteId === currentPlayingTag.noteId && tag.tagIndex === currentPlayingTag.tagIndex
    );

    // If we haven't reached the repeat count for current tag
    if (currentTagRepeat < tagRepeatCount) {
      setCurrentTagRepeat(prev => prev + 1);
      // Force a re-render of the current tag to restart audio
      const currentTag = { ...currentPlayingTag };
      setCurrentPlayingTag(null);
      setTimeout(() => setCurrentPlayingTag(currentTag), 0);
      return;
    }

    // Reset tag repeat counter for next tag
    setCurrentTagRepeat(1);

    // If there are more tags in the sequence
    if (currentIndex < selectedTags.length - 1) {
      const nextTag = selectedTags[currentIndex + 1];
      setCurrentPlayingTag(null);
      setTimeout(() => setCurrentPlayingTag(nextTag), 0);
      return;
    }

    // If we've finished all tags in the sequence
    handleStopAll();
  };

  const handlePlayAll = () => {
    if (selectedTags.length === 0) {
      toast.error('No tags selected to play');
      return;
    }
    
    // Clean up any existing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      setCurrentAudio(null);
    }
    
    setIsPlaying(true);
    setCurrentTagRepeat(1);
    setCurrentSequence(1);
    
    // Start with the first tag
    const firstTag = selectedTags[0];
    setCurrentPlayingTag(null);
    setTimeout(() => setCurrentPlayingTag(firstTag), 0);
  };

  const handlePauseAll = () => {
    if (currentAudio) {
      currentAudio.pause();
    }
    setIsPlaying(false);
  };

  const handleResumeAll = () => {
    if (!currentPlayingTag) return;
    
    if (currentAudio) {
      currentAudio.play();
      setIsPlaying(true);
    } else {
      // If audio was cleared but we have a current tag, restart it
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

  return (
    <div className="w-full">
      <div className="flex flex-col">
        <div className="flex gap-2 items-center">
          <Button onClick={handleAddCard} className="w-10 bg-gray-400">
            <Plus className="h-5 w-5" /> 
          </Button>
          {currentPlayingTag ? (
            <Button 
              onClick={isPlaying ? handlePauseAll : handleResumeAll} 
              className={`w-10 ${isPlaying ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
          ) : (
            <Button 
              onClick={handlePlayAll} 
              className="w-10 bg-green-600 hover:bg-green-700"
              disabled={selectedTags.length === 0}
            >
              <Volume2 className="h-5 w-5" />
            </Button>
          )}
          <Button 
            onClick={handleStopAll} 
            className="w-10 bg-red-600 hover:bg-red-700"
            disabled={!currentPlayingTag}
          >
            <Square className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-10 bg-gray-600 hover:bg-gray-400">
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
        <div className='flex grid grid-cols-3 w-250 gap-2 mt-4'> 
          {isLoading ? (
            // Show 2 skeleton cards while loading
            Array.from({ length: 2 }).map((_, index) => (
              <StickyNoteCardSkeleton key={index} />
            ))
          ) : (
            notes.map((note, index) => (
              <StickyNoteCard
                key={note.id}
                note={note}
                index={index}
                tags={note.tags.map(tag => tag.name)}
                onChange={(value) => {
                  const newNotes = [...notes];
                  newNotes[index] = { ...note, content: value };
                  setNotes(newNotes);
                }}
                onDelete={() => handleDeleteNote(note.id)}
                onBlur={async () => {
                  try {
                    const res = await fetch('/api/notes', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: note.id, content: note.content, tags: note.tags.map(t => t.name) }),
                    });
                    if (!res.ok) throw new Error('Failed to save note');
                    toast.success('Note saved!');
                  } catch {
                    toast.error('Error saving note');
                  }
                }}
                onTagSelection={(tagIndex, isSelected) => handleTagSelection(note.id, tagIndex, isSelected)}
                isPlayingAll={isPlaying}
                onStopPlaying={handleStopAll}
                currentPlayingTag={currentPlayingTag}
                onTagFinished={handleTagFinished}
                isPaused={!isPlaying}
                setCurrentAudio={setCurrentAudio}
                onRefresh={() => {
                  setRefetchTrigger(prev => prev + 1);
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
} 