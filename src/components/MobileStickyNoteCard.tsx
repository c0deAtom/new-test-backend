import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Pencil, Volume2, MoreVertical, Trash2, Check, X, Loader, Maximize2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface MobileStickyNoteCardProps {
  note: { id: string; content: string };
  index: number;
  tags: string[];
  onChange: (value: string) => void;
  onBlur: () => void;
  onDelete?: (id: string) => void;
  onTagSelection?: (tagIndex: number, isSelected: boolean) => void;
  isPlayingAll?: boolean;
  onStopPlaying?: () => void;
  currentPlayingTag?: { noteId: string; tagIndex: number } | null;
  onTagFinished?: () => void;
  isPaused?: boolean;
  setCurrentAudio: (audio: HTMLAudioElement | null) => void;
  onTagAdd?: (newTag: string) => void;
  onTagDelete?: (deletedTagIndexes: number[]) => void;
  onTagEdit?: (tagIndex: number, newValue: string) => void;
  selectedTags: number[];
  selectAllTags: () => void;
  deselectAllTags: () => void;
  view?: 'icon' | 'list' | 'big';
  isProcessing?: {
    isDeleting?: boolean;
    isUpdating?: boolean;
    processingTags?: { [key: number]: boolean };
  };
  onOpenFullScreen?: () => void;
  onClose?: () => void;
}

export function MobileStickyNoteCard({ 
  note, 
  index, 
  tags,
  onChange, 
  onBlur, 
  onDelete,
  onTagSelection,
  isPlayingAll,
  onStopPlaying,
  currentPlayingTag,
  onTagFinished,
  isPaused,
  setCurrentAudio,
  onTagAdd,
  onTagDelete,
  onTagEdit,
  selectedTags,
  selectAllTags,
  deselectAllTags,
  view = 'icon',
  isProcessing,
  onOpenFullScreen,
  onClose,
}: MobileStickyNoteCardProps) {
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(note.content);
  const [contentSaving, setContentSaving] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isTagInputFocused, setIsTagInputFocused] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [deletingTags, setDeletingTags] = useState<number[]>([]);
  const [pendingTags, setPendingTags] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (isPlayingAll && currentPlayingTag?.noteId === note.id) {
      const tagToPlay = tags[currentPlayingTag.tagIndex];
      if (tagToPlay && currentPlayingTag.tagIndex !== currentPlayingIndex) {
        playTag(tagToPlay, currentPlayingTag.tagIndex);
      }
    }
  }, [isPlayingAll, currentPlayingTag, tags]);

  const playTag = async (tag: string, tagIndex: number) => {
    try {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setCurrentAudio(null);
      setCurrentPlayingIndex(tagIndex);
      const isHindi = /[\u0900-\u097F]/.test(tag);
      const response = await fetch('/api/elevenlabs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: tag,
          voiceId: isHindi ? '21m00Tcm4TlvDq8ikWAM' : undefined
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to convert text to speech');
      }
      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      const newAudio = new Audio(url);
      setCurrentAudio(newAudio);
      newAudio.onended = () => {
        URL.revokeObjectURL(url);
        setAudioUrl(null);
        setCurrentPlayingIndex(null);
        setCurrentAudio(null);
        if (onTagFinished) onTagFinished();
      };
      newAudio.onerror = () => {
        setIsPlaying(false);
        setCurrentPlayingIndex(null);
        setTtsError('Error playing audio');
        URL.revokeObjectURL(url);
        setAudioUrl(null);
        setCurrentAudio(null);
        if (onStopPlaying) onStopPlaying();
      };
      await newAudio.play();
    } catch (error) {
      setIsPlaying(false);
      setCurrentPlayingIndex(null);
      setTtsError(error instanceof Error ? error.message : 'Failed to convert text to speech');
      setCurrentAudio(null);
      if (onStopPlaying) onStopPlaying();
    }
  };

  const handleTagInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTagInput(e.target.value);
    setFeedback(null);
  };

  const toggleTag = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const toggleTagSelection = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSelected = selectedTags.includes(index);
    onTagSelection?.(index, !isSelected);
  };

  // Copy of StickyNoteCard UI, with minor mobile tweaks
  return (
    <Card key={note.id} className={
      `mb-4 mt-1 bg-yellow-100 shadow-md rounded-md w-full max-w-md mx-auto aspect-square ` +
      (view === 'big' ? 'scale-105 min-h-[400px] h-170 mb-10 ' : '') +
      (view === 'icon' ? 'min-h-67 h-67 w-70 scale-95 ' : '') +
      (view === 'list' ? 'aspect-auto min-h-32 ' : '')
    }>
      <CardContent className="flex flex-col gap-2 ">
        <div className="text-gray-800 text-sm flex items-center justify-between">
          <div className="flex flex-row w-full gap-2">
            {editing ? (
              <div className="flex flex-row w-full gap-2">
                <input
                  value={editedContent}
                  onChange={e => setEditedContent(e.target.value)}
                  className="p-2 mx-3 font-bold h-8 bg-transparent resize-none text-gray-800 text-base w-full"
                  autoFocus
                />
                <Button
                  className='p-1 h-8 flex items-center hover:bg-red-400 hover:text-blue-700'
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  <X className="h-4 w-4 mr-1" />
                </Button>
                <Button 
                  className='p-1 h-8 flex items-center hover:bg-green-900 hover:text-white'
                  size="sm"
                  onClick={async () => {
                    setContentSaving(true);
                    try {
                      const res = await fetch('/api/notes', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: note.id, content: editedContent, tags }),
                      });
                      if (!res.ok) throw new Error('Failed to update note');
                      onChange(editedContent);
                      setEditing(false);
                      setFeedback('Saved!');
                      if (onTagEdit) onTagEdit(index, editedContent);
                      setTimeout(() => setFeedback(null), 2000);
                    } catch {
                      setFeedback('Error saving');
                    } finally {
                      setContentSaving(false);
                    }
                  }}
                  disabled={contentSaving}
                >
                  {contentSaving ? <Loader className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                </Button>
              </div>
            ) : (
              <div className='flex flex-row gap-2 w-full'>
                {selectedTags.length === tags.length ? (
                  <button
                    className={`p-1 rounded-full ${tags.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'}`}
                    onClick={deselectAllTags}
                    disabled={tags.length === 0}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    className={`p-1 rounded-full ${tags.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
                    onClick={selectAllTags}
                    disabled={tags.length === 0}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <div className='px-2 w-40 overflow-y-auto font-bold text-base truncate'>
                  {note.content}
                </div>
                <div className='flex  items-center justify-center ml-auto '>
                  {selectedTags.length > 0 && (
                    <button
                     
                      
                      className="h-8 w-8 ml-auto"
                      onClick={async () => {
                        if (selectedTags.length === 0) return;
                        setDeletingTags(selectedTags);
                        const updatedTags = tags.filter((_, idx) => !selectedTags.includes(idx));
                        try {
                          const res = await fetch('/api/notes', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: note.id, content: note.content, tags: updatedTags }),
                          });
                          if (!res.ok) throw new Error('Failed to delete tags');
                          setFeedback('Tags deleted!');
                          if (onTagDelete) onTagDelete(selectedTags);
                          deselectAllTags();
                          setTimeout(() => setFeedback(null), 2000);
                        } catch {
                          setFeedback('Error deleting tags');
                        } finally {
                          setDeletingTags([]);
                        }
                      }}
                      disabled={deletingTags.length > 0}
                    >
                      {deletingTags.length > 0 ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditing(true)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 p-0" title="More">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!showDeleteDialog ? (
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 w-8 h-4"
                          onClick={e => { e.preventDefault(); setShowDeleteDialog(true); }}
                        >
                          <Trash2 className=" h-2 w-4" /> 
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem
                            className="text-gray-600 focus:text-gray-600 w-6 h-4 "
                            onClick={e => { e.preventDefault(); setShowDeleteDialog(false); setDropdownOpen(false); }}
                          >
                            <X className=" h-2 w-4 " color='red' /> No
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-green-600 focus:text-green-600 w-6 h-4"
                            onClick={e => { e.preventDefault(); onDelete?.(note.id); setShowDeleteDialog(false); setDropdownOpen(false); }}
                          >
                            <Check className=" h-2 w-4" color='green'/> Yes
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {!editing && (
                    <>
                      {onClose ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={onClose}
                          title="Close full screen"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : onOpenFullScreen ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={onOpenFullScreen}
                          title="Open full screen"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-center">
          <div className={`flex flex-col gap-1 border border-gray-800 rounded-md p-1 overflow-y-auto w-full transition-all duration-200 ${view === 'big' ? 'h-110' : isTagInputFocused ? 'h-20' : 'h-40'}`}>
            {[...tags, ...pendingTags].map((tag, idx, arr) => {
              const isPending = idx >= tags.length;
              const colors = ['bg-red-100', 'bg-green-100', 'bg-gray-200', 'bg-blue-100', 'bg-purple-100'];
              const isSelected = !isPending && selectedTags.includes(idx);
              const isCurrentlyPlaying = currentPlayingTag?.noteId === note.id && currentPlayingTag?.tagIndex === idx && !isPaused;
              const isDeleting = !isPending && deletingTags.includes(idx);
              const isEditingTag = editingTagIndex === idx && !isPending && !isDeleting;
              return (
                <div
                  key={idx}
                  onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                  className={
                    `${colors[idx % colors.length]} text-gray-800 rounded px-3 py-1 text-sm w-full cursor-pointer transition-all duration-300 ease-in-out ` +
                    `${expandedIndex === idx ? 'whitespace-normal break-words w-fit' : 'whitespace-nowrap w-full min-w-fit '} ` +
                    `shrink-0 ` +
                    `${isCurrentlyPlaying ? 'ring-2 ring-green-500 animate-pulse bg-gradient-to-r from-green-200 via-blue-200 to-purple-100' : ''} ` +
                    `${isSelected && !isCurrentlyPlaying ? 'ring-2 ring-gray-400' : ''} ` +
                    `${isDeleting ? 'opacity-0 scale-95' : ''} ` +
                    `${isPending ? 'opacity-50' : ''}`
                  }
                  style={{ wordBreak: expandedIndex === idx ? 'break-word' : undefined }}
                >
                  {isEditingTag ? (
                    <div className="flex flex-raw gap-2 w-full " onClick={e => e.stopPropagation()}>
                       
                        <div className="flex items-center flex-col gap-2 mt-1">
                        <Button
                          className={`p-1 rounded-full w-4 h-8 ${loading ? 'bg-green-700 text-white' : 'bg-green-500 text-white hover:bg-green-600'}`}
                          size="icon"
                          onClick={async e => {
                            e.stopPropagation();
                            if (editingTagIndex === null || !note.id) return;
                            setLoading(true);
                            try {
                              const updatedTags = [...tags];
                              updatedTags[editingTagIndex] = editingTagValue.trim();
                              const res = await fetch('/api/notes', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: note.id, content: note.content, tags: updatedTags }),
                              });
                              if (!res.ok) throw new Error('Failed to update tag');
                              setEditingTagIndex(null);
                              setEditingTagValue('');
                              setFeedback('Tag updated!');
                              if (onTagEdit) onTagEdit(editingTagIndex, editingTagValue.trim());
                              setTimeout(() => setFeedback(null), 2000);
                            } catch {
                              setFeedback('Error updating tag');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading}
                        >
                          {loading ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        </Button>
                        <Button
                            className="p-1 w-4 h-8 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
                          size="icon"
                          onClick={e => {
                            e.stopPropagation();
                            setEditingTagIndex(null);
                            setEditingTagValue('');
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <Button
                          className={`p-1 w-4 h-8 rounded-full ${loading ? 'bg-red-700 text-white' : 'bg-red-500 text-white hover:bg-red-600'}`}
                          size="icon"
                          onClick={async e => {
                            e.stopPropagation();
                            if (editingTagIndex === null || !note.id) return;
                            setLoading(true);
                            try {
                              const updatedTags = tags.filter((_, i) => i !== editingTagIndex);
                              const res = await fetch('/api/notes', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: note.id, content: note.content, tags: updatedTags }),
                              });
                              if (!res.ok) throw new Error('Failed to delete tag');
                              setEditingTagIndex(null);
                              setEditingTagValue('');
                              setFeedback('Tag deleted!');
                              if (onTagDelete) onTagDelete([editingTagIndex]);
                              setTimeout(() => setFeedback(null), 2000);
                            } catch {
                              setFeedback('Error deleting tag');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                       
                        
                      <textarea
                        value={editingTagValue}
                        onChange={e => setEditingTagValue(e.target.value)}
                        className="w-full   h-40 bg-transparent border border-gray-200 resize-y text-gray-800 focus:ring-0 focus:outline-none whitespace-pre-wrap break-words overflow-y-auto rounded-sm px-1 "
                        autoFocus
                        style={{ wordBreak: expandedIndex === idx ? 'break-word' : undefined }}
                      />
                     
                    </div>
                  ) : (
                    <div className="flex items-top ">
                        <div className='flex flex-col items-center gap-1'>
                      <button
                        className={`p-1 rounded-full ${isSelected ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                        onClick={e => { e.stopPropagation(); if (!isPending) onTagSelection?.(idx, !isSelected); }}
                        disabled={isDeleting || isPending}
                      >
                        {isDeleting || isPending ? (
                          <Loader className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                          
                        )}
                      </button>
                      {expandedIndex === idx && !isDeleting && !isPending && (
                        <div className=''>
                          <button
                            className="text-gray-500 hover:text-blue-600"
                            onClick={e => { e.stopPropagation(); setEditingTagIndex(idx); setEditingTagValue(tag); }}
                          >
                            <Pencil size={15} className='ml-auto'/>
                          </button>
                          </div>
                        )}
                        </div>
                      <div className='flex-1 ml-2'>
                        <span className={expandedIndex === idx ? 'break-words whitespace-normal w-full max-w-full' : 'truncate whitespace-nowrap'}>{tag}</span>
                      </div>
                      <div className="flex items-center gap-1">
                    
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
      <hr className="border-t-2 border-gray-800" />
      <CardFooter className="flex flex-col gap-2 w-full">
        <div className='w-full'>
          <div className="relative w-full">
            <textarea
              placeholder="Type here..."
              value={tagInput}
              onChange={handleTagInput}
              className={`flex-1 px-2 m-0 border border-gray-500 rounded-sm text-gray-800 focus:ring-0 focus:outline-none transition-all duration-200 resize-none ${isTagInputFocused ? 'h-28 w-full text-lg text-top' : 'w-full h-8 text-base'}`}
              onFocus={() => setIsTagInputFocused(true)}
              onBlur={() => setIsTagInputFocused(false)}
            />
           
          </div>
          {tagInput && (
              <Button
                size="sm"
                className=  {` w-full h-5 text-xs ${view === 'big' ? 'mx-98' : ' h-7 h-5 text-xs'}`}
                onClick={async () => {
                  if (!tagInput.trim() || !note.id) return;
                  setIsAddingTag(true);
                  setFeedback(null);
                  const newTag = tagInput.trim();
                  setPendingTags(prev => [...prev, newTag]);
                  setTagInput('');
                  try {
                    const updatedTags = tags.includes(newTag) ? tags : [...tags, newTag];
                    const res = await fetch('/api/notes', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: note.id, content: note.content, tags: updatedTags }),
                    });
                    if (!res.ok) throw new Error('Failed to save tag');
                    setFeedback('Saved!');
                    if (onTagAdd) onTagAdd(newTag);
                    setPendingTags(prev => prev.filter(t => t !== newTag));
                  } catch (err) {
                    setFeedback('Error saving');
                    setPendingTags(prev => prev.filter(t => t !== newTag));
                  } finally {
                    setIsAddingTag(false);
                  }
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
          {feedback && (
            <span className={`text-xs top-0 ${feedback === 'Saved!' ? 'text-green-600' : 'text-red-600'}`}>{feedback}</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}