import { MobileStickyNoteCard } from '@/components/MobileStickyNoteCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader, Plus, Pause, Play, Square, Volume2, Settings, ChevronDown, Maximize2, X as CloseIcon, Check } from "lucide-react";
import React from 'react';
import { toast } from "sonner";
import { FullScreenNoteCard } from "./FullScreenNoteCard";

export interface Note {
  id: string;
  content: string;
  tags: { name: string }[];
}

interface NotePageProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  isAddingCard: boolean;
  handleAddCard: () => void;
  isPlaying: boolean;
  handlePauseAll: () => void;
  handleResumeAll: () => void;
  handlePlayAll: () => void;
  handleStopAll: () => void;
  currentPlayingTag: { noteId: string; tagIndex: number } | null;
  selectedTags: { noteId: string; tagIndex: number }[];
  setSelectedTags: React.Dispatch<React.SetStateAction<{ noteId: string; tagIndex: number }[]>>;
  tagRepeatCount: number;
  setTagRepeatCount: (n: number) => void;
  sequenceRepeatCount: number;
  setSequenceRepeatCount: (n: number) => void;
  notesView: 'icon' | 'list' | 'big';
  setNotesView: (v: 'icon' | 'list' | 'big') => void;
  notesSortBy: 'name' | 'createdAt';
  setNotesSortBy: (v: 'name' | 'createdAt') => void;
  openNotesSort: 'icon' | 'list' | 'big' | null;
  setOpenNotesSort: (v: 'icon' | 'list' | 'big' | null) => void;
  selectAllTagsForNote: (note: Note) => void;
  deselectAllTagsForNote: (note: Note) => void;
  isLoading: boolean;
  setCurrentAudio: (audio: HTMLAudioElement | null) => void;
  handleTagFinished: () => void;
}

export function NotePage({
  notes,
  setNotes,
  isAddingCard,
  handleAddCard,
  isPlaying,
  handlePauseAll,
  handleResumeAll,
  handlePlayAll,
  handleStopAll,
  currentPlayingTag,
  selectedTags,
  setSelectedTags,
  tagRepeatCount,
  setTagRepeatCount,
  sequenceRepeatCount,
  setSequenceRepeatCount,
  notesView,
  setNotesView,
  notesSortBy,
  setNotesSortBy,
  openNotesSort,
  setOpenNotesSort,
  selectAllTagsForNote,
  deselectAllTagsForNote,
  isLoading,
  setCurrentAudio,
  handleTagFinished,
}: NotePageProps) {
  // Loading states for optimistic updates
  const [processingNotes, setProcessingNotes] = React.useState<{
    [key: string]: {
      isDeleting?: boolean;
      isUpdating?: boolean;
      processingTags?: { [key: number]: boolean };
    };
  }>({});
  const [fullscreenNoteId, setFullscreenNoteId] = React.useState<string | null>(null);

  const sortedNotes = [...notes].sort((a, b) => {
    if (notesSortBy === 'name') return a.content.localeCompare(b.content);
    if (notesSortBy === 'createdAt') return 0; // Replace with actual date if available
    return 0;
  });

  const handleNoteDelete = async (noteId: string) => {
    // Optimistically remove the note
    setProcessingNotes(prev => ({ ...prev, [noteId]: { isDeleting: true } }));
    setNotes(prev => prev.filter(note => note.id !== noteId));

    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete note');
    } catch (error) {
      // Revert on error
      setNotes(prev => [...prev, notes.find(n => n.id === noteId)!]);
      toast.error('Failed to delete note');
    } finally {
      setProcessingNotes(prev => {
        const newState = { ...prev };
        delete newState[noteId];
        return newState;
      });
    }
  };

  const handleNoteUpdate = async (noteId: string, value: string, tags: string[]) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    // Optimistically update the note
    setProcessingNotes(prev => ({ ...prev, [noteId]: { isUpdating: true } }));
    setNotes(prev => prev.map(n => 
      n.id === noteId ? { ...n, content: value, tags: tags.map(name => ({ name })) } : n
    ));

    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteId, content: value, tags }),
      });
      if (!res.ok) throw new Error('Failed to update note');
    } catch (error) {
      // Revert on error
      setNotes(prev => prev.map(n => n.id === noteId ? note : n));
      toast.error('Failed to update note');
    } finally {
      setProcessingNotes(prev => {
        const newState = { ...prev };
        delete newState[noteId];
        return newState;
      });
    }
  };

  const handleTagAdd = async (noteId: string, newTag: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    // Optimistically add the tag
    setProcessingNotes(prev => ({
      ...prev,
      [noteId]: {
        ...prev[noteId],
        processingTags: { ...(prev[noteId]?.processingTags || {}), [note.tags.length]: true }
      }
    }));

    const updatedTags = [...note.tags.map(t => t.name), newTag];
    setNotes(prev => prev.map(n => 
      n.id === noteId ? { ...n, tags: updatedTags.map(name => ({ name })) } : n
    ));

    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteId, content: note.content, tags: updatedTags }),
      });
      if (!res.ok) throw new Error('Failed to add tag');
    } catch (error) {
      // Revert on error
      setNotes(prev => prev.map(n => n.id === noteId ? note : n));
      toast.error('Failed to add tag');
    } finally {
      setProcessingNotes(prev => {
        const newState = { ...prev };
        if (newState[noteId]?.processingTags) {
          delete newState[noteId].processingTags![note.tags.length];
        }
        return newState;
      });
    }
  };

  const handleTagDelete = async (noteId: string, deletedTagIndexes: number[]) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    // Optimistically remove the tags
    setProcessingNotes(prev => ({
      ...prev,
      [noteId]: {
        ...prev[noteId],
        processingTags: {
          ...(prev[noteId]?.processingTags || {}),
          ...deletedTagIndexes.reduce((acc, i) => {
            acc[i] = true;
            return acc;
          }, {} as { [key: number]: boolean })
        }
      }
    }));

    const updatedTags = note.tags.filter((_, idx) => !deletedTagIndexes.includes(idx)).map(t => t.name);
    setNotes(prev => prev.map(n => 
      n.id === noteId ? { ...n, tags: updatedTags.map(name => ({ name })) } : n
    ));

    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteId, content: note.content, tags: updatedTags }),
      });
      if (!res.ok) throw new Error('Failed to delete tags');
    } catch (error) {
      // Revert on error
      setNotes(prev => prev.map(n => n.id === noteId ? note : n));
      toast.error('Failed to delete tags');
    } finally {
      setProcessingNotes(prev => {
        const newState = { ...prev };
        deletedTagIndexes.forEach(i => delete newState[noteId].processingTags![i]);
        return newState;
      });
    }
  };

  const handleTagEdit = async (noteId: string, tagIndex: number, newValue: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    // Optimistically update the tag
    setProcessingNotes(prev => ({
      ...prev,
      [noteId]: {
        ...prev[noteId],
        processingTags: { ...(prev[noteId]?.processingTags || {}), [tagIndex]: true }
      }
    }));

    const updatedTags = note.tags.map((t, idx) => idx === tagIndex ? newValue : t.name);
    setNotes(prev => prev.map(n => 
      n.id === noteId ? { ...n, tags: updatedTags.map(name => ({ name })) } : n
    ));

    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteId, content: note.content, tags: updatedTags }),
      });
      if (!res.ok) throw new Error('Failed to edit tag');
    } catch (error) {
      // Revert on error
      setNotes(prev => prev.map(n => n.id === noteId ? note : n));
      toast.error('Failed to edit tag');
    } finally {
      setProcessingNotes(prev => {
        const newState = { ...prev };
        if (newState[noteId]?.processingTags) {
          delete newState[noteId].processingTags![tagIndex];
        }
        return newState;
      });
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex flex-row items-center justify-end mb-2 px-1 mt-6">
        <div className="mr-5 flex flex-row gap-0 items-center border border-gray-300 rounded overflow-hidden bg-white">
          {(['icoon', 'list', 'big'] as const).map(type => (
            <div key={type} className="relative">
              <div
                className={`w-14 h-7 flex items-center justify-center cursor-pointer text-xs border-0 ${notesView === type ? 'bg-yellow-200' : ''}`}
                onClick={() => setNotesView(type)}
                onContextMenu={e => { e.preventDefault(); setOpenNotesSort(type); }}
                onMouseLeave={() => setOpenNotesSort(null)}
                style={{ borderRight: type !== 'big' ? '1px solid #e5e7eb' : undefined }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </div>
              {openNotesSort === type && (
                <div className="absolute right-0 top-8 z-10 bg-white border rounded shadow text-xs w-20">
                  <div className="px-2 py-1 hover:bg-yellow-100 cursor-pointer" onClick={() => { setNotesSortBy('name'); setOpenNotesSort(null); }}>Sort by Name</div>
                  <div className="px-2 py-1 hover:bg-yellow-100 cursor-pointer" onClick={() => { setNotesSortBy('createdAt'); setOpenNotesSort(null); }}>Sort by Date</div>
                </div>
              )}
            </div>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className="w-14 h-7 flex items-center justify-center cursor-pointer text-xs border-0 bg-white hover:bg-yellow-100"
                style={{ borderLeft: '1px solid #e5e7eb' }}
              >
                Sort <ChevronDown className="ml-1 w-3 h-3" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-14 p-0">
              <DropdownMenuItem
                className={`text-xs ${notesSortBy === 'name' ? 'bg-yellow-100 font-bold' : ''}`}
                onClick={() => setNotesSortBy('name')}
              >
                Name
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`text-xs  ${notesSortBy === 'createdAt' ? 'bg-yellow-100 font-bold'  : ''}`}
                onClick={() => setNotesSortBy('createdAt')}
              >
                Date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="p-5 w-full   ">
        {notesView === 'list' ? (
          <div className="w-full flex flex-col gap-2">
            {sortedNotes.map((note) => (
              <Button
                key={note.id}
                variant="ghost"
                className="justify-start w-full px-3 py-2 rounded text-left text-base font-medium border bg-yellow-100 border-gray-200 hover:bg-yellow-300"
                onClick={() => setFullscreenNoteId(note.id)}
              >
              <div className='min-w-40'>
                {note.content} 
                </div>
                <div className="text-xs text-gray-500 overflow-y-auto scrollbar-hide">{note.tags.map(tag => tag.name).join(', ')}</div>
              </Button>
            ))}
          </div>
        ) : (
          <div className={
            notesView === 'big'
              ? 'w-full grid grid-cols-1 gap-3'
              : 'w-full grid grid-cols-2 gap-3'
          }>
            {sortedNotes.map((note, index) => (
              <MobileStickyNoteCard
                key={note.id}
                note={note}
                index={index}
                tags={note.tags.map(tag => tag.name)}
                onChange={(value: string, tags: string[]) => handleNoteUpdate(note.id, value, tags)}
                onDelete={() => handleNoteDelete(note.id)}
                onBlur={() => handleNoteUpdate(note.id, note.content, note.tags.map(t => t.name))}
                onTagSelection={(tagIndex: number, isSelected: boolean) => {
                  setSelectedTags(prev => {
                    if (isSelected) {
                      const newTags = [...prev, { noteId: note.id, tagIndex }];
                      return newTags
                        .filter((tag, i, arr) =>
                          arr.findIndex(t => t.noteId === tag.noteId && t.tagIndex === tag.tagIndex) === i
                        )
                        .sort((a, b) =>
                          a.noteId.localeCompare(b.noteId) || a.tagIndex - b.tagIndex
                        );
                    } else {
                      return prev.filter(tag => !(tag.noteId === note.id && tag.tagIndex === tagIndex));
                    }
                  });
                }}
                selectAllTags={() => selectAllTagsForNote(note)}
                deselectAllTags={() => deselectAllTagsForNote(note)}
                selectedTags={selectedTags.filter(tag => tag.noteId === note.id).map(tag => tag.tagIndex)}
                isPlayingAll={isPlaying && currentPlayingTag?.noteId === note.id}
                onStopPlaying={handleStopAll}
                currentPlayingTag={currentPlayingTag}
                onTagFinished={handleTagFinished}
                isPaused={!isPlaying}
                setCurrentAudio={setCurrentAudio}
                onTagAdd={(newTag: string) => handleTagAdd(note.id, newTag)}
                onTagDelete={(deletedTagIndexes: number[]) => {
                  setNotes(prevNotes =>
                    prevNotes.map(n =>
                      n.id === note.id
                        ? {
                            ...n,
                            tags: n.tags.filter((_, idx) => !deletedTagIndexes.includes(idx))
                          }
                        : n
                    )
                  );
                  deselectAllTagsForNote(note);
                }}
                onTagEdit={(tagIndex: number, newValue: string) => handleTagEdit(note.id, tagIndex, newValue)}
                view={notesView}
                isProcessing={processingNotes[note.id]}
                onOpenFullScreen={() => setFullscreenNoteId(note.id)}
              />
            ))}
          </div>
        )}
      </div>
      {/* Fullscreen overlay */}
      {fullscreenNoteId && (
        <FullScreenNoteCard
          note={notes.find(n => n.id === fullscreenNoteId)!}
          tags={notes.find(n => n.id === fullscreenNoteId)!.tags.map(tag => tag.name)}
          onClose={() => setFullscreenNoteId(null)}
          onChange={(value: string) => handleNoteUpdate(fullscreenNoteId, value, notes.find(n => n.id === fullscreenNoteId)!.tags.map(t => t.name))}
          onDelete={() => handleNoteDelete(fullscreenNoteId)}
          onBlur={() => handleNoteUpdate(fullscreenNoteId, notes.find(n => n.id === fullscreenNoteId)!.content, notes.find(n => n.id === fullscreenNoteId)!.tags.map(t => t.name))}
          onTagSelection={(tagIndex: number, isSelected: boolean) => {
            setSelectedTags(prev => {
              if (isSelected) {
                const newTags = [...prev, { noteId: fullscreenNoteId, tagIndex }];
                return newTags
                  .filter((tag, i, arr) =>
                    arr.findIndex(t => t.noteId === tag.noteId && t.tagIndex === tag.tagIndex) === i
                  )
                  .sort((a, b) =>
                    a.noteId.localeCompare(b.noteId) || a.tagIndex - b.tagIndex
                  );
              } else {
                return prev.filter(tag => !(tag.noteId === fullscreenNoteId && tag.tagIndex === tagIndex));
              }
            });
          }}
          selectAllTags={() => selectAllTagsForNote(notes.find(n => n.id === fullscreenNoteId)!)}
          deselectAllTags={() => deselectAllTagsForNote(notes.find(n => n.id === fullscreenNoteId)!)}
          selectedTags={selectedTags.filter(tag => tag.noteId === fullscreenNoteId).map(tag => tag.tagIndex)}
          isPlayingAll={isPlaying && currentPlayingTag?.noteId === fullscreenNoteId}
          onStopPlaying={handleStopAll}
          currentPlayingTag={currentPlayingTag}
          onTagFinished={handleTagFinished}
          isPaused={!isPlaying}
          setCurrentAudio={setCurrentAudio}
          onTagAdd={(newTag: string) => handleTagAdd(fullscreenNoteId, newTag)}
          onTagDelete={(deletedTagIndexes: number[]) => {
            setNotes(prevNotes =>
              prevNotes.map(n =>
                n.id === fullscreenNoteId
                  ? {
                      ...n,
                      tags: n.tags.filter((_, idx) => !deletedTagIndexes.includes(idx))
                    }
                  : n
              )
            );
            deselectAllTagsForNote(notes.find(n => n.id === fullscreenNoteId)!);
          }}
          onTagEdit={(tagIndex: number, newValue: string) => handleTagEdit(fullscreenNoteId, tagIndex, newValue)}
          view={notesView}
          isProcessing={processingNotes[fullscreenNoteId]}
        />
      )}
    </div>
  );
} 