import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, MoreVertical, Trash2, Check, X, Loader, Maximize2, Mic, Image as ImageIcon, Play, Pause, StopCircle, Circle, Music, FileText, Waves } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface MobileStickyNoteCardProps {
  note: { id: string; content: string };
  index: number;
  tags: string[];
  onChange: (value: string, tags: string[]) => void;
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
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isTagInputFocused, setIsTagInputFocused] = useState(false);
  const [deletingTags, setDeletingTags] = useState<number[]>([]);
  const [pendingTags, setPendingTags] = useState<{ type: 'text'|'image'|'audio', name: string, url?: string }[]>([]);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioPaused, setAudioPaused] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [playingAudioIdx, setPlayingAudioIdx] = useState<number | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPlayingIdx, setAudioPlayingIdx] = useState<number | null>(null);
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement | null }>({});
  const [audioName, setAudioName] = useState('');
  const tagInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [allTagsExpanded, setAllTagsExpanded] = useState(false);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const handleTagInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTagInput(e.target.value);
    setFeedback(null);
  };

  // Add text tag
  const handleAddTag = async () => {
    if (!tagInput.trim() || !note.id) return;
    setIsAddingTag(true);
    setFeedback(null);
    const newTag = tagInput.trim();
    setPendingTags(prev => [...prev, { type: 'text', name: newTag }]);
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
      setPendingTags(prev => prev.filter(t => t.name !== newTag || t.type !== 'text'));
      setTimeout(() => setFeedback(null), 2000);
    } catch (err) {
      setFeedback('Error saving');
      setPendingTags(prev => prev.filter(t => t.name !== newTag || t.type !== 'text'));
      setTimeout(() => setFeedback(null), 2000);
    } finally {
      setIsAddingTag(false);
    }
  };

  // Add image tag (optimistic)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !note.id) return;
    setIsUploadingImage(true);
    setFeedback(null);
    const name = file.name.replace(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i, '').replace(/[^a-zA-Z ]+/g, ' ').replace(/ +/g, ' ').trim() || 'Image';
    setPendingTags(prev => [...prev, { type: 'image', name }]);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/images', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload image');
      const data = await res.json();
      const imageUrl = data.image?.url;
      if (imageUrl) {
        const updatedTags = tags.includes(imageUrl) ? tags : [...tags, imageUrl];
        const noteRes = await fetch('/api/notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: note.id, content: note.content, tags: updatedTags }),
        });
        if (!noteRes.ok) throw new Error('Failed to save image tag');
        setFeedback('Image tag added!');
        if (onTagAdd) onTagAdd(imageUrl);
      }
      setPendingTags(prev => prev.filter(pt => pt.name !== name || pt.type !== 'image'));
    } catch (err) {
      setFeedback('Error uploading image');
      setPendingTags(prev => prev.filter(pt => pt.name !== name || pt.type !== 'image'));
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  // Delete tag
  const handleDeleteTag = async (idx: number) => {
    if (!note.id) return;
    setDeletingTags(prev => [...prev, idx]);
    setFeedback(null);
    try {
      const updatedTags = tags.filter((_, i) => i !== idx);
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: note.id, content: note.content, tags: updatedTags }),
      });
      if (!res.ok) throw new Error('Failed to delete tag');
      setFeedback('Tag deleted!');
      if (onTagDelete) onTagDelete([idx]);
      setTimeout(() => setFeedback(null), 2000);
    } catch {
      setFeedback('Error deleting tag');
      setTimeout(() => setFeedback(null), 2000);
    } finally {
      setDeletingTags(prev => prev.filter(i => i !== idx));
    }
  };

  // Custom audio player state
  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Copy of StickyNoteCard UI, with minor mobile tweaks
  return (
    <Card
      key={note.id}
      className={
        (onClose
          ? 'fixed left-0 top-14 w-[100vw] h-[calc(100vh-56px)] max-w-none max-h-none z-50 bg-yellow-100 rounded-none shadow-none m-0 p-0 flex flex-col pt-3' // fullscreen below navbar with top padding
          : `mb-4 mt-5 bg-yellow-100 shadow-md rounded-md w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-7xl mx-auto aspect-square ` +
            (view === 'big' ? 'scale-105 min-h-[400px] h-170 mb-10 ' : '') +
            (view === 'icon' ? 'min-h-67 h-67 w-70 scale-95 ' : '') +
            (view === 'list' ? 'aspect-auto min-h-32 ' : '')
        )
      }
    >
      <CardContent className="flex flex-col gap-2 ">
        <div className="text-gray-800 text-sm flex items-center justify-between">
          <div className="flex flex-row w-full gap-2">
            {editing ? (
              <div className="flex flex-row w-full gap-2 h-4">
                <input
                  value={editedContent}
                  onChange={e => setEditedContent(e.target.value)}
                  className="p-2 mx-3 font-bold h-5  bg-transparent resize-none text-gray-800 text-base w-full"
                  autoFocus
                />
                <Button
                  className=' bg-gray-400  p-1 h-5 flex items-center hover:bg-red-400 hover:text-blue-700'
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  <X className="h-4 w-4 mr-1" />
                </Button>
                <Button 
                  className=' bg-gray-400 p-1 h-5 flex items-center hover:bg-green-500 hover:text-white'
                  size="sm"
                 
                  onClick={async () => {
                    setContentSaving(true);
                    setFeedback(null);
                    try {
                      const res = await fetch('/api/notes', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: note.id,
                          content: editedContent,
                          tags: tags,
                        }),
                      });
                      if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        throw new Error(errorData.details || 'Failed to update note');
                      }
                      onChange(editedContent, tags);
                      setEditing(false);
                      setFeedback('Saved!');
                      setTimeout(() => setFeedback(null), 2000);
                    } catch (err: any) {
                      setFeedback(err.message || 'Error saving');
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
              <div className='flex flex-row gap-2 w-full h-4'>
                <button
                  className={`p-1 rounded-full ${selectedTags.length === tags.length ? 'bg-green-500 text-white' : 'bg-blue-200 text-blue-700 hover:bg-blue-300'}`}
                  disabled={tags.length === 0}
                  onClick={() => {
                    if (selectedTags.length !== tags.length) {
                      selectAllTags();
                    } else {
                      deselectAllTags();
                    }
                  }}
                >
                  <Check className="h-4 w-5 mt-[-2]" />
                </button>
                <div className=' h-5 w-40 overflow-x-auto font-bold truncate  '>
                  <span className='text-sm text-top  '>{note.content}</span>
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
                   {/* Expand/Collapse All Tags Button */}
        {onClose && (
          <div className="flex justify-end w-full mb-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setAllTagsExpanded(v => !v)}
            >
              {allTagsExpanded ? 'Collapse All' : 'Expand All'}
            </Button>
          </div>
        )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-8 hover:bg-gray-400 "
                    onClick={() => setEditing(true)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  
                  <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-8 p-0 hover:bg-gray-400" title="More">
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
                          className="h-5 w-8 hover:bg-red-500"
                          onClick={onClose}
                          title="Close full screen"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : onOpenFullScreen ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-8 hover:bg-gray-400"
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
          <div className={`flex flex-col gap-1 border border-gray-800 rounded-md p-1 overflow-y-auto w-full transition-all duration-200  ${
            onClose
              ? 'h-[67vh]'
              : view === 'big'
                ? 'h-110'
                : isTagInputFocused
                  ? 'h-20'
                  : 'h-40'
          }`}>
            {[
              ...tags,
              ...pendingTags.map(pt => pt.type === 'text' ? pt.name : pt.url || pt.name)
            ].map((tag, idx, arr) => {
              const isPending = idx >= tags.length;
              const colors = ['bg-red-100', 'bg-green-100', 'bg-gray-200', 'bg-blue-100', 'bg-purple-100'];
              function hashString(str: string) {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                  hash = ((hash << 5) - hash) + str.charCodeAt(i);
                  hash |= 0;
                }
                return Math.abs(hash);
              }
              let colorIdx = hashString(tag) % colors.length;
              // Avoid repeating the same color as the previous tag
              if (idx > 0) {
                const prevTag = arr[idx - 1];
                let prevColorIdx = hashString(prevTag) % colors.length;
                if (colorIdx === prevColorIdx) {
                  colorIdx = (colorIdx + 1) % colors.length;
                }
              }
              const colorClass = colors[colorIdx];
              const isSelected = !isPending && selectedTags.includes(idx);
              const isCurrentlyPlaying = !isPending && currentPlayingTag?.noteId === note.id && currentPlayingTag?.tagIndex === idx && !audioPaused;
              const isDeleting = !isPending && deletingTags.includes(idx);
              const isEditingTag = editingTagIndex === idx && !isPending && !isDeleting;
              // For pending tags, get type and name
              let isImageTag = false, isAudioTag = false, pendingType = null, pendingName = '';
              if (isPending) {
                const pt = pendingTags[idx - tags.length];
                pendingType = pt.type;
                pendingName = pt.name;
                isImageTag = pt.type === 'image';
                isAudioTag = pt.type === 'audio';
              } else {
                isImageTag = /^\/uploads\/.+\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(tag) || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(tag);
                isAudioTag = /\.(webm|mp3|wav|m4a|ogg|aac)$/i.test(tag) || /^https?:\/\/.+\.(webm|mp3|wav|m4a|ogg|aac)$/i.test(tag);
              }
              // Replace expandedIndex logic with allTagsExpanded
              const expanded = allTagsExpanded || expandedIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={e => {
                    if ((e.target as HTMLElement).closest('.custom-audio-player')) return;
                    if (!allTagsExpanded) setExpandedIndex(expandedIndex === idx ? null : idx);
                  }}
                  className={
                    `${colorClass} text-gray-800 rounded px-1 py-1 text-sm w-full cursor-pointer transition-all duration-300 ease-in-out ` +
                    `${expanded ? 'whitespace-normal break-words w-fit' : 'whitespace-nowrap w-full min-w-fit '} ` +
                    `shrink-0 ` +
                    `${isCurrentlyPlaying ? 'border-4 border-blue-700 bg-blue-200 ring-2 ring-blue-400 animate-pulse' : ''} ` +
                    `${isSelected && !isCurrentlyPlaying ? 'ring-2 ring-gray-400' : ''} ` +
                    `${isDeleting ? 'opacity-0 scale-95' : ''} ` +
                    `${isPending ? 'opacity-50' : ''}`
                  }
                  style={{ wordBreak: expanded ? 'break-word' : undefined }}
                >
                  <div className="flex items-center gap-2">
                    {/* Tag selection button and wave icon if currently playing */}
                    {isEditingTag ? (
                      <textarea
                        value={editingTagValue}
                        autoFocus
                        className="border border-gray-400 rounded px-1 py-0.5 text-base font-medium w-full min-h-20 bg-white resize-none"
                        onChange={e => setEditingTagValue(e.target.value)}
                        onBlur={() => {
                          if (editingTagValue.trim() && editingTagValue !== tag) {
                            onTagEdit?.(idx, editingTagValue.trim());
                          }
                          setEditingTagIndex(null);
                          setEditingTagValue('');
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (editingTagValue.trim() && editingTagValue !== tag) {
                              onTagEdit?.(idx, editingTagValue.trim());
                            }
                            setEditingTagIndex(null);
                            setEditingTagValue('');
                          } else if (e.key === 'Escape') {
                            setEditingTagIndex(null);
                            setEditingTagValue('');
                          }
                        }}
                      />
                    ) : (
                      <>
                        <button
                          className={`p-1 rounded-full ${isSelected ? 'bg-green-500 text-white' : 'bg-blue-200 text-blue-700 hover:bg-blue-300'}`}
                          onClick={e => { e.stopPropagation(); if (!isPending) onTagSelection?.(idx, !isSelected); }}
                          disabled={isDeleting || isPending}
                        >
                          {isDeleting || isPending ? (
                            <Loader className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" color='blue' />
                          )}
                        </button>
                        {/* Only show type icon if not expanded */}
                        {!expanded && (
                          isAudioTag ? (
                            <Music className="h-4 w-4 text-blue-500" />
                          ) : isImageTag ? (
                            <ImageIcon className="h-4 w-4 text-purple-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-gray-500" />
                          )
                        )}
                        {tag}
                        {isCurrentlyPlaying && (
                          <Waves className="h-4 w-4 text-blue-500 animate-pulse ml-1" />
                        )}
                      </>
                    )}
                  </div>
                  {expanded && !isDeleting && !isPending && (
                    <div className=''>
                      {!isEditingTag && (
                        <button
                          className="text-gray-500 hover:text-blue-600"
                          onClick={e => { e.stopPropagation(); setEditingTagIndex(idx); setEditingTagValue(tag); }}
                        >
                          <Pencil size={15} className='ml-auto'/>
                        </button>
                      )}
                      {/* Show media for expanded audio/image tags */}
                      {isAudioTag && (
                        <audio controls src={tag.startsWith('http') ? tag : tag.startsWith('/audios/') ? tag : '/audios/' + tag} className="w-full mt-2" />
                      )}
                      {isImageTag && (
                        <img
                          src={tag}
                          alt="tag-img"
                          className="w-full max-h-48 object-contain mt-2 rounded cursor-pointer"
                          onClick={e => {
                            e.stopPropagation();
                            setModalImageUrl(tag);
                            setIsImageModalOpen(true);
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
      <hr className="border-t-2 border-gray-800" />
      <CardFooter className="flex flex-col gap-2  w-full">
        <div className='w-full flex flex-col flex-1 justify-end items-center'>
          <div className="relative w-full">
            {!showAudioRecorder && (
              <>
                <textarea
                  ref={tagInputRef}
                  placeholder="Type here..."
                  value={tagInput}
                  onChange={handleTagInput}
                  className={`flex-1 px-2 m-0 border border-gray-500 rounded-sm text-gray-800 focus:ring-0 focus:outline-none transition-all duration-200 resize-none pr-12 ${isTagInputFocused ? 'h-28 w-full text-lg text-top' : 'w-full h-8 text-base'}`}
                  onFocus={() => setIsTagInputFocused(true)}
                  onBlur={() => setIsTagInputFocused(false)}
                  disabled={isUploadingImage}
                />
                <div className="absolute right-2 bottom-2 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                     
                        className="h-7 w-8 p-0  mr-[-8]"
                        tabIndex={-1}
                      >
                        <span className="text-2xl">+</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top">
                      <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={isUploadingImage}>
                        <ImageIcon className="h-4 w-4 mr-2" /> Add Image
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowAudioRecorder(true)}>
                        <Mic className="h-4 w-4 mr-2" /> Record Audio
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
            <Input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
            {!showAudioRecorder ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                 
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={isUploadingImage}>
                    <ImageIcon className="h-4 w-4 mr-2" /> Add Image
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAudioRecorder(true)}>
                    <Mic className="h-4 w-4 mr-2" /> Record Audio
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="absolute right-1 top-4 -translate-y-1/2 flex flex-row items-center gap-1  p-1 h-10 max-h-10 overflow-x-auto overflow-y-hidden">
                {!isRecording && !audioBlob && (
                  <Button size="sm" className="h-6 w-30 px-2" onClick={async () => {
                    if (!navigator.mediaDevices) return;
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const recorder = new window.MediaRecorder(stream);
                    setMediaRecorder(recorder);
                    setAudioBlob(null);
                    setAudioUrl(null);
                    recorder.ondataavailable = (e) => {
                      setAudioBlob(e.data);
                      setAudioUrl(URL.createObjectURL(e.data));
                    };
                    recorder.start();
                    setIsRecording(true);
                    setAudioPaused(false);
                  }}>
                    <Mic className="h-4 w-4 mr-1" /> Start
                  </Button>
                )}
                {isRecording && !audioPaused && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center text-red-600 font-semibold animate-pulse">
                      <Circle className="h-3 w-3 mr-1 fill-red-600 text-red-600 animate-pulse" /> Recording...
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="relative flex items-center h-6 w-10 mr-2">
                        {/* Waveform animation */}
                        <span className="block h-4 w-1 bg-red-400 mx-0.5 animate-wave1 rounded-sm" />
                        <span className="block h-6 w-1 bg-red-500 mx-0.5 animate-wave2 rounded-sm" />
                        <span className="block h-3 w-1 bg-red-400 mx-0.5 animate-wave3 rounded-sm" />
                        <span className="block h-5 w-1 bg-red-500 mx-0.5 animate-wave1 rounded-sm" />
                        <span className="block h-2 w-1 bg-red-400 mx-0.5 animate-wave2 rounded-sm" />
                      </span>
                      <Button size="icon" variant="ghost" className="h-8 w-8 p-0" onClick={() => { mediaRecorder?.pause(); setAudioPaused(true); }} title="Pause">
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-8 w-8 p-0" onClick={() => {
                        mediaRecorder?.stop();
                        setIsRecording(false);
                        setAudioPaused(false);
                        setTimeout(() => {
                          setIsTagInputFocused(true);
                          tagInputRef.current?.focus();
                        }, 100);
                      }} title="Stop">
                        <StopCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <style jsx>{`
                      @keyframes wave1 { 0%,100%{height:0.75rem;} 50%{height:1.5rem;} }
                      @keyframes wave2 { 0%,100%{height:1.5rem;} 50%{height:0.5rem;} }
                      @keyframes wave3 { 0%,100%{height:1rem;} 50%{height:2rem;} }
                      .animate-wave1 { animation: wave1 1s infinite; }
                      .animate-wave2 { animation: wave2 1s infinite; }
                      .animate-wave3 { animation: wave3 1s infinite; }
                    `}</style>
                  </div>
                )}
                
                {isRecording && audioPaused && (
                  <div className="flex items-center gap-2 ">
                    <span className="flex items-center text-yellow-600 font-semibold">
                      <Pause className="h-3 w-3 mr-1" /> Paused
                    </span>
                    <Button size="icon" variant="ghost" className="h-8 w-8 p-0" onClick={() => { mediaRecorder?.resume(); setAudioPaused(false); }} title="Resume">
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8 p-0" onClick={() => { mediaRecorder?.stop(); setIsRecording(false); setAudioPaused(false); }} title="Stop">
                      <StopCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                
                {audioUrl && audioBlob && !isRecording && (
                  
                  <div>
                  
                  <div className="flex flex-col space-y-2 ">
                
                    <div className="flex flex-row items-start ">
                      <Input
                        className="h-6 w-40 mr-23 mt- border-black"
                        placeholder="Audio name..."
                        value={audioName}
                        onChange={e => setAudioName(e.target.value)}
                        maxLength={40}
                      />
                      <div className="flex gap-1 items-center absolute top-[-1] right-0">
                        <button className="mt-2  w-10 h-6 rounded-xl bg-gray-400 text-white hover:bg-green-500 transition-colors duration-200 shadow-sm flex items-center justify-center"
                        onClick={async () => {
                          if (!audioBlob || !note.id) return;
                          setAudioUploading(true);
                          setFeedback(null);
                          const name = audioName.trim() ? audioName.trim().replace(/[^a-zA-Z ]+/g, ' ').replace(/ +/g, ' ').trim() : `Audio`;
                          setPendingTags(prev => [...prev, { type: 'audio', name }]);
                          const fileName = name.replace(/[^a-zA-Z0-9-_]/g, '_') || `audio-${Date.now()}`;
                          const formData = new FormData();
                          formData.append('file', new File([audioBlob], `${fileName}.webm`));
                          try {
                            const res = await fetch('/api/audios', {
                              method: 'POST',
                              body: formData,
                            });
                            if (!res.ok) throw new Error('Failed to upload audio');
                            const data = await res.json();
                            const audioTagUrl = data.audio?.url;
                            if (audioTagUrl) {
                              const updatedTags = tags.includes(audioTagUrl) ? tags : [...tags, audioTagUrl];
                              const noteRes = await fetch('/api/notes', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: note.id, content: note.content, tags: updatedTags }),
                              });
                              if (!noteRes.ok) throw new Error('Failed to save audio tag');
                              setFeedback('Audio tag added!');
                              if (onTagAdd) onTagAdd(audioTagUrl);
                              setTimeout(() => setFeedback(null), 2000);
                            }
                            setShowAudioRecorder(false);
                            setAudioBlob(null);
                            setAudioUrl(null);
                            setAudioName('');
                            setPendingTags(prev => prev.filter(pt => pt.name !== name || pt.type !== 'audio'));
                            setTimeout(() => {
                              setIsTagInputFocused(true);
                              tagInputRef.current?.focus();
                            }, 100);
                          } catch (err) {
                            setFeedback('Error uploading audio');
                            setTimeout(() => setFeedback(null), 2000);
                            setPendingTags(prev => prev.filter(pt => pt.name !== name || pt.type !== 'audio'));
                          } finally {
                            setAudioUploading(false);
                          }
                        }} disabled={audioUploading}>
                          {audioUploading ? <Loader className=" animate-spin" color='black' /> : <Check className="h-6 w-6 hover:text-black" />}
                        </button>
                        <button className="mt-2  w-10 h-6 rounded-xl bg-gray-400 text-white hover:bg-red-500 transition-colors duration-200 shadow-sm flex items-center justify-center" onClick={() => { setShowAudioRecorder(false); setAudioBlob(null); setAudioUrl(null); setAudioName(''); }}>
                          <X className="h-6 w-6 hover:text-black" />
                        </button>
                        </div>
                    </div>
                  
                  </div>
                  
            
                   
                    </div>
                )}

                    
                {!isRecording && !audioBlob && (
                  <Button size="sm" variant="outline" className="h-6 w-30 px-2" onClick={() => setShowAudioRecorder(false)}>Cancel</Button>
                )}
              </div>
            )}
          </div>
          {audioUrl && audioBlob && !isRecording && (
<audio controls src={audioUrl} className="w-full h-9 mt-10 " style={{ minWidth: 80 }} />
)}
         
          {!showAudioRecorder && tagInput && (
            <div className="w-full flex justify-center mt-auto">
              <Button
                size="sm"
                className={`h-8 w-32 bg-gray-400 text-xs flex items-center justify-center ${view === 'big' || onClose ? 'mb-2' : ''}`}
                onClick={handleAddTag}
                disabled={isUploadingImage}
              >
                {isAddingTag ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </div>
          )}
          {feedback && (
            <span className={`text-xs top-0 ${feedback === 'Saved!' ? 'text-green-600' : 'text-red-600'}`}>{feedback}</span>
          )}
        </div>
      </CardFooter>
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="flex items-center justify-center bg-black p-0">
          {modalImageUrl && (
            <img src={modalImageUrl} alt="fullscreen-img" className="max-w-full max-h-screen object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}