import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { GripVertical, Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface StickyNoteCardProps {
  note: { id: string; content: string };
  index: number;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function StickyNoteCard({ note, index, onChange, onBlur }: StickyNoteCardProps) {
  const [tagInput, setTagInput] = useState('');
  const [savedTag, setSavedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(note.content);
  const [contentSaving, setContentSaving] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');

  // Fetch tags for this note on mount and after save
  useEffect(() => {
    const fetchNoteTags = async () => {
      if (!note.id) return;
      try {
        const res = await fetch(`/api/notes`);
        if (!res.ok) throw new Error('Failed to fetch notes');
        const notes = await res.json();
        const thisNote = notes.find((n: any) => n.id === note.id);
        if (thisNote && Array.isArray(thisNote.tags)) {
          setNoteTags(thisNote.tags.map((tag: any) => tag.name || tag));
        } else {
          setNoteTags([]);
        }
      } catch {
        setNoteTags([]);
      }
    };
    fetchNoteTags();
  }, [note.id, savedTag]);

  // When typing, update tagInput
  const handleTagInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTagInput(e.target.value);
    setSavedTag(null);
    setFeedback(null);
  };

  const toggleTag = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // On save, update this note's tags
  const handleSave = async () => {
    if (!tagInput.trim() || !note.id) return;
    setLoading(true);
    setFeedback(null);
    try {
      // Fetch current tags for this note
      const res = await fetch(`/api/notes`);
      const notes = await res.json();
      const thisNote = notes.find((n: any) => n.id === note.id);
      let currentTags: string[] = [];
      if (thisNote && Array.isArray(thisNote.tags)) {
        currentTags = thisNote.tags.map((tag: any) => tag.name || tag);
      }
      // Add new tag if not duplicate
      const newTag = tagInput.trim();
      const updatedTags = currentTags.includes(newTag)
        ? currentTags
        : [...currentTags, newTag];
      // Update note with new tags
      const putRes = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: note.id, content: note.content, tags: updatedTags }),
      });
      if (!putRes.ok) throw new Error('Failed to save tag');
      setSavedTag(newTag);
      setTagInput('');
      setFeedback('Saved!');
    } catch (err) {
      setFeedback('Error saving');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
          tags: noteTags 
        }),
      });
      if (!res.ok) throw new Error('Failed to update note');
      onChange(editedContent);
      setEditing(false);
      setFeedback('Saved!');
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
      const updatedTags = [...noteTags];
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
      
      setNoteTags(updatedTags);
      setEditingTagIndex(null);
      setEditingTagValue('');
      setFeedback('Tag updated!');
      setTimeout(() => setFeedback(null), 2000);
    } catch (err) {
      setFeedback('Error updating tag');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card key={note.id} className="mb-4 mt-1 bg-yellow-100 shadow-md rounded-md min-h-80 w-80 aspect-square">
      <CardContent className="flex flex-col gap-2">
        <div className="text-gray-800 text-sm flex items-center">
          {editing ? (
            <div className="flex flex-raw w-full gap-2">
              <Textarea
                value={editedContent}
                onChange={handleContentChange}
                className="p-1 bg-transparent border-none resize-none text-gray-800 focus:ring-0 focus:outline-none"
                autoFocus
              />
              
                
                <Button 
                  size="sm"
                  onClick={saveContent}
                  disabled={contentSaving}
                >
                  {contentSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            
          ) : (
            <div className='  flex flex-row gap-2'>
            <div className='  px-2 w-50  overflow-y-auto font-bold'>
              {note.content}
              </div>
              <Pencil className="ml-2 h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700" onClick={() => setEditing(true)} />
            </div>
          )}
        </div>
        <div className="flex justify-center ">
  <div className="flex flex-col gap-1 border border-gray-200 rounded-md p-1 overflow-y-auto h-40 w-full">
  {noteTags.map((tag, idx) => {
    const colors = ['bg-red-100', 'bg-green-100', 'bg-gray-200', 'bg-blue-100', 'bg-purple-100'];
    const colorClass = colors[idx % colors.length];
    return (
      <div
        key={idx}
        onClick={() => toggleTag(idx)}
        className={`
          ${colorClass} text-gray-800 rounded px-3 py-1 text-sm cursor-pointer 
          transition-all duration-300 ease-in-out
          ${expandedIndex === idx ? 'whitespace-normal break-words w-73' : 'whitespace-nowrap w-fit min-w-73'} 
          shrink-0
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
              className='w-40 '
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
            </div>
          </div>
        ) : (
          <>
            {tag}
            {expandedIndex === idx && (
              <button
                className="mt-1 ml-2 text-gray-500 hover:text-blue-600"
                onClick={(e) => handleEditTag(idx, tag, e)}
              >
                <Pencil size={12} />
              </button>
            )}
          </>
        )}
      </div>
    );
  })}
  </div>
</div>

       
      </CardContent>
      <CardFooter>
      <div className='w-full ' >
        <Textarea
          placeholder="Type here..."
          value={tagInput}
          onChange={handleTagInput}
          className="w-full h-26 bg-transparent border border-gray-200 rounded-md resize-y text-gray-800 focus:ring-0 focus:outline-none whitespace-pre-wrap break-words overflow-y-auto"
 />{feedback && (
    <span className={`text-xs  ${feedback === 'Saved!' ? 'text-green-600' : 'text-red-600'}`}>{feedback}</span>
  )}
        </div>
        {tagInput && (
          <Button size="sm" className="w-full self-end mt-5" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        )}
        
      </CardFooter>
    </Card>
  );
}