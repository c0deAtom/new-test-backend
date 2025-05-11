import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { GripVertical, Pencil, Volume2, MoreVertical, Trash2, Check, X, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface StickyNoteCardProps {
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
  onRefresh?: () => void;
}

export function StickyNoteCardSkeleton() {
  return (
    <Card className="mb-4 mt-1 bg-yellow-100 shadow-md rounded-md min-h-90 w-80 aspect-square">
      <CardContent className="flex flex-col gap-2">
        <div className="text-gray-800 text-sm flex items-center justify-between">
          <div className="flex flex-raw w-full gap-2">
            <div className='flex flex-row gap-2 w-full'>
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-32" />
              <div className="ml-auto flex gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="flex flex-col gap-1 border border-gray-800 rounded-md p-1 overflow-y-auto h-50 w-full">
            {[1, 2, 3].map((_, idx) => (
              <Skeleton 
                key={idx}
                className={`h-8 rounded px-3 py-1 text-sm w-full ${
                  idx === 0 ? 'bg-red-100' : 
                  idx === 1 ? 'bg-green-100' : 'bg-blue-100'
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
      <hr className="border-t-2 border-gray-800" />
      <CardFooter>
        <div className='w-full'>
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
      </CardFooter>
    </Card>
  );
}

export function StickyNoteCard({ 
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
  onRefresh
}: StickyNoteCardProps) {
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
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  // Cleanup audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  // Handle playing new tag
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
      // Cleanup previous audio
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
      console.error('Error converting text to speech:', error);
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
    const newSelectedTags = selectedTags.includes(index)
      ? selectedTags.filter(i => i !== index)
      : [...selectedTags, index];
    setSelectedTags(newSelectedTags);
    onTagSelection?.(index, !selectedTags.includes(index));
  };

  const handleSave = async () => {
    if (!tagInput.trim() || !note.id) return;
    setLoading(true);
    setFeedback(null);
    try {
      const newTag = tagInput.trim();
      const updatedTags = tags.includes(newTag) ? tags : [...tags, newTag];
      
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: note.id, 
          content: note.content, 
          tags: updatedTags 
        }),
      });
      
      if (!res.ok) throw new Error('Failed to save tag');
      
      setTagInput('');
      setFeedback('Saved!');
      onRefresh?.();
    } catch (err) {
      setFeedback('Error saving');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedContent(e.target.value);
  };

  const saveContent = async () => {
    if (!note.id) return;
    setContentSaving(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: note.id, 
          content: editedContent,
          tags: tags 
        }),
      });
      if (!res.ok) throw new Error('Failed to update note');
      onChange(editedContent);
      setEditing(false);
      setFeedback('Saved!');
      onRefresh?.();
      setTimeout(() => setFeedback(null), 2000);
    } catch (err) {
      setFeedback('Error saving');
    } finally {
      setContentSaving(false);
    }
  };

  const handleEditTag = (index: number, currentTag: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingTagIndex(index);
    setEditingTagValue(currentTag);
  };

  const saveEditedTag = async () => {
    if (editingTagIndex === null || !note.id) return;
    
    setLoading(true);
    try {
      const updatedTags = [...tags];
      updatedTags[editingTagIndex] = editingTagValue.trim();
      
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: note.id, 
          content: note.content,
          tags: updatedTags 
        }),
      });
      
      if (!res.ok) throw new Error('Failed to update tag');
      
      setEditingTagIndex(null);
      setEditingTagValue('');
      setFeedback('Tag updated!');
      onRefresh?.();
      setTimeout(() => setFeedback(null), 2000);
    } catch (err) {
      setFeedback('Error updating tag');
    } finally {
      setLoading(false);
    }
  };

  const deleteTag = async () => {
    if (editingTagIndex === null || !note.id) return;
    
    setLoading(true);
    try {
      const updatedTags = tags.filter((_, index) => index !== editingTagIndex);
      
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: note.id, 
          content: note.content,
          tags: updatedTags 
        }),
      });
      
      if (!res.ok) throw new Error('Failed to delete tag');
      
      setEditingTagIndex(null);
      setEditingTagValue('');
      setFeedback('Tag deleted!');
      onRefresh?.();
      setTimeout(() => setFeedback(null), 2000);
    } catch (err) {
      setFeedback('Error deleting tag');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!note.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Failed to delete note');
      
      if (onDelete) {
        onDelete(note.id);
      }
      setFeedback('Note deleted!');
      onRefresh?.();
    } catch (err) {
      setFeedback('Error deleting note');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    const allIndices = tags.map((_, idx) => idx);
    setSelectedTags(allIndices);
    allIndices.forEach(idx => onTagSelection?.(idx, true));
  };

  const handleDeselectAll = () => {
    setSelectedTags([]);
    selectedTags.forEach(idx => onTagSelection?.(idx, false));
  };

  const handleDeleteSelectedTags = async () => {
    if (selectedTags.length === 0) return;
    
    setLoading(true);
    try {
      const updatedTags = tags.filter((_, index) => !selectedTags.includes(index));
      
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: note.id, 
          content: note.content,
          tags: updatedTags 
        }),
      });
      
      if (!res.ok) throw new Error('Failed to delete tags');
      
      setSelectedTags([]);
      setFeedback('Tags deleted!');
      onRefresh?.();
      setTimeout(() => setFeedback(null), 2000);
    } catch (err) {
      setFeedback('Error deleting tags');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card key={note.id} className="mb-4 mt-1 bg-yellow-100 shadow-md rounded-md min-h-90 w-80 aspect-square">
      <CardContent className="flex flex-col gap-2">
        <div className="text-gray-800 text-sm flex items-center justify-between">
          <div className="flex flex-raw w-full gap-2">
            {editing ? (
              <div className="flex flex-raw w-full gap-2">
                <input
                  value={editedContent}
                  onChange={handleContentChange}
                  className="p-2 mx-3 font-bold h-6 bg-transparent resize-none text-gray-800 "
                  autoFocus
                />
                <Button
                  className='p-1 h-5 flex items-center hover:bg-red-400 hover:text-blue-700'
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  <X className="h-4 w-4 mr-1" />
                  
                </Button>
                <Button 
                  className='p-1 h-5 flex items-center hover:bg-green-900 hover:text-white'
                  size="sm"
                  onClick={saveContent}
                  disabled={contentSaving}
                >
                  {contentSaving ? (
                    <>
                      <Loader className="h-4 w-4 mr-1 animate-spin" />
                      
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className='flex flex-row gap-2 w-full'>
                {selectedTags.length === tags.length ? (
                  <button
                    className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                    onClick={handleDeselectAll}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                    onClick={handleSelectAll}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <div className='px-2 w-50 overflow-y-auto font-bold'>
                  {note.content}
                </div>
                <div className='flex gap-2 items-center justify-center ml-auto'>
                  {selectedTags.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 w-6 text-xs"
                      onClick={handleDeleteSelectedTags}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-3 w-2 " />
                          
                        </>
                      )}
                    </Button>
                  )}
                  <Pencil 
                    className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700" 
                    onClick={() => setEditing(true)} 
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-4 w-4 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 w-6 h-4"
                        onClick={handleDeleteCard}
                      >
                        <Trash2 className="mr-2 h-2 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-center">
          <div className="flex flex-col gap-1 border border-gray-800 rounded-md p-1 overflow-y-auto h-50 w-full">
            {tags.map((tag, idx) => {
              const colors = ['bg-red-100', 'bg-green-100', 'bg-gray-200', 'bg-blue-100', 'bg-purple-100'];
              const colorClass = colors[idx % colors.length];
              const isSelected = selectedTags.includes(idx);
              const isCurrentlyPlaying = currentPlayingTag?.noteId === note.id && 
                                       currentPlayingTag?.tagIndex === idx && 
                                       !isPaused;
              return (
                <div
                  key={idx}
                  onClick={() => toggleTag(idx)}
                  className={`
                    ${colorClass} text-gray-800 rounded px-3 py-1 text-sm cursor-pointer 
                    transition-all duration-300 ease-in-out
                    ${expandedIndex === idx ? 'whitespace-normal break-words w-73' : 'whitespace-nowrap w-fit min-w-73'} 
                    shrink-0
                    ${isCurrentlyPlaying ? 'ring-2 ring-green-500 animate-pulse bg-gradient-to-r from-green-200 via-blue-200 to-purple-100' : ''}
                    ${isSelected && !isCurrentlyPlaying ? 'ring-2 ring-gray-400' : ''}
                  `}
                >
                  {editingTagIndex === idx ? (
                    <div className="flex flex-col gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                      <Textarea
                        value={editingTagValue}
                        onChange={(e) => setEditingTagValue(e.target.value)}
                        className="w-full min-h-6 bg-transparent border border-gray-200 resize-y text-gray-800 focus:ring-0 focus:outline-none whitespace-pre-wrap break-words overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button 
                         className='w-20 text-red-900  hover:text-blue-700'
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            saveEditedTag();
                          }}
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Save'}
                        </Button>
                        <Button 
                        className='w-20 text-red-900 hover:bg-red-900 hover:text-blue-700'
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTagIndex(null);
                            setEditingTagValue('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                         className='w-18 text-red-900 hover:bg-red-900 hover:text-blue-700'
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTag();
                          }}
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center ">
                      <button
                        className={`p-1 rounded-full ${isSelected ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                        onClick={(e) => toggleTagSelection(idx, e)}
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <div className='flex-1 ml-2'>
                        <span className='text-left flex-1'>{tag}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {expandedIndex === idx && (
                          <button
                            className="text-gray-500 hover:text-blue-600"
                            onClick={(e) => handleEditTag(idx, tag, e)}
                          >
                            <Pencil size={12} />
                          </button>
                        )}
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
      <CardFooter>
        <div className='w-full ' >
          <Textarea
            placeholder="Type here..."
            value={tagInput}
            onChange={handleTagInput}
            className="w-full h-26 bg-transparent border border-gray-500 rounded-md resize-y text-gray-800 focus:ring-0 focus:outline-none whitespace-pre-wrap break-words overflow-y-auto"
          />
          {feedback && (
            <span className={`text-xs top-0 ${feedback === 'Saved!' ? 'text-green-600' : 'text-red-600'}`}>{feedback}</span>
          )}
        </div>
        {tagInput && (
          <Button size="sm" className="w-full self-end mt-2 hover:bg-yellow-400" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}