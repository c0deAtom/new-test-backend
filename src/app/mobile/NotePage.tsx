import { MobileStickyNoteCard } from '@/components/MobileStickyNoteCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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
  isPlaying: boolean;
  handleStopAll: () => void;
  currentPlayingTag: { noteId: string; tagIndex: number } | null;
  setCurrentPlayingTag: React.Dispatch<React.SetStateAction<{ noteId: string; tagIndex: number } | null>>;
  selectedTags: { noteId: string; tagIndex: number }[];
  setSelectedTags: React.Dispatch<React.SetStateAction<{ noteId: string; tagIndex: number }[]>>;
  notesView: 'icon' | 'list' | 'big';
  setNotesView: (v: 'icon' | 'list' | 'big') => void;
  notesSortBy: 'name' | 'createdAt';
  setNotesSortBy: (v: 'name' | 'createdAt') => void;
  openNotesSort: 'icon' | 'list' | 'big' | null;
  setOpenNotesSort: (v: 'icon' | 'list' | 'big' | null) => void;
  selectAllTagsForNote: (note: Note) => void;
  deselectAllTagsForNote: (note: Note) => void;
  setCurrentAudio: (audio: HTMLAudioElement | null) => void;
  handleTagFinished: () => void;
}

export function NotePage({
  notes,
  setNotes,
  isPlaying,
  handleStopAll,
  currentPlayingTag,
  setCurrentPlayingTag,
  selectedTags,
  setSelectedTags,
  notesView,
  setNotesView,
  notesSortBy,
  setNotesSortBy,
  openNotesSort,
  setOpenNotesSort,
  selectAllTagsForNote,
  deselectAllTagsForNote,
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
      <div className="w-full flex flex-row items-center justify-end mb-2 px-1 mt-6 fixed   z-10">
        <div className="mr-5  flex flex-row gap-0 items-center border border-gray-300 rounded overflow-hidden bg-gray-300">
          {(['icon', 'list', 'big'] as const).map(type => (
            <div key={type} className="relative">
              <div
                className={`w-14 h-7 hover:bg-gray-200 flex items-center justify-center cursor-pointer text-xs border-0 ${notesView === type ? 'bg-yellow-100' : ''}`}
                onClick={() => setNotesView(type)}
                onContextMenu={e => { e.preventDefault(); setOpenNotesSort(type); }}
                onMouseLeave={() => setOpenNotesSort(null)}
                style={{ borderRight: type !== 'big' ? '1px solid #e5e7eb' : undefined }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </div>
              {openNotesSort === type && (
                <div className="absolute right-0 top-8 z-10 bg-white border rounded shadow text-xs w-20">
                  <div className="px-2 py-1 hover:bg-gray-100 cursor-pointer" onClick={() => { setNotesSortBy('name'); setOpenNotesSort(null); }}>Sort by Name</div>
                  <div className="px-2 py-1 hover:bg-gray-100 cursor-pointer" onClick={() => { setNotesSortBy('createdAt'); setOpenNotesSort(null); }}>Sort by Date</div>
                </div>
              )}
            </div>
          ))}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className="w-14 h-7 flex items-center justify-center cursor-pointer text-xs border-0 bg-gray-300 hover:bg-gray-200"
                style={{ borderLeft: '1px solid #e5e7eb' }}
              >
                Sort <ChevronDown className="ml-1 w-3 h-3" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-14 p-0">
              <DropdownMenuItem
                className={`text-xs  ${notesSortBy === 'name' ? 'bg-gray-100 font-bold' : ''}`}
                onClick={() => setNotesSortBy('name')}
              >
                Name
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`text-xs  ${notesSortBy === 'createdAt' ? 'bg-gray-100 font-bold' : ''}`}
                onClick={() => setNotesSortBy('createdAt')}
              >
                Date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="p-5 pt-16 w-full   ">
        {notesView === 'list' ? (
          <div className="w-full flex flex-col gap-2  ">
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
              : 'w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'
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
                    let newList;
                    if (isSelected) {
                      // Always remove if present, then add to end
                      const filtered = prev.filter(tag => !(tag.noteId === note.id && tag.tagIndex === tagIndex));
                      newList = [...filtered, { noteId: note.id, tagIndex }];
                    } else {
                      newList = prev.filter(tag => !(tag.noteId === note.id && tag.tagIndex === tagIndex));
                    }
                    console.log('selectedTags:', newList);
                    return newList;
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
                // Always remove if present, then add to end
                const filtered = prev.filter(tag => !(tag.noteId === fullscreenNoteId && tag.tagIndex === tagIndex));
                return [...filtered, { noteId: fullscreenNoteId, tagIndex }];
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
          view="big"
          isProcessing={processingNotes[fullscreenNoteId]}
        />
      )}
    </div>
  );
} 