'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Bot, User, RefreshCw, Plus, GripVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { StickyNoteCard } from '@/components/StickyNoteCard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function StudentPage() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<{ id: string, content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch('/api/notes');
        const data = await res.json();
        setNotes(data);
      } catch {
        setNotes([]);
      }
    };
    fetchNotes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    const userMessage: Message = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');

    // Check for the command to add a note
    if (prompt.toLowerCase().includes('add note')) {
      setNotes(prev => [...prev, { id: '', content: '' }]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const assistantMessage: Message = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'An error occurred while processing your request.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setPrompt('');
  };

  const handleAddCard = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '', tags: [] }),
      });
      const newNote = await res.json();
      setNotes(prev => [newNote, ...prev]);
    } catch {
      toast.error('Error creating note');
    }
  };

  const handleSaveNote = async (note: { id: string, content: string }, index: number) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: note.id, content: note.content, tags: [] }),
      });
      if (!res.ok) throw new Error('Failed to save note');
      toast.success('Note saved!');
    } catch {
      toast.error('Error saving note');
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-between ">
      <div className="flex flex-col w-full max-w-md">
        <Button onClick={handleAddCard} className=" w-10">
          <Plus className=" h-5 w-5" /> 
        </Button>
        <div className='flex grid grid-cols-3 w-250 gap-2 mt-4'> 
        {notes.map((note, index) => (
          <StickyNoteCard
            key={note.id}
            note={note}
            index={index}
            onChange={(value) => {
              const newNotes = [...notes];
              newNotes[index] = { ...note, content: value };
              setNotes(newNotes);
            }}
            onBlur={async () => {
              try {
                const res = await fetch('/api/notes', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: note.id, content: note.content, tags: [] }),
                });
                if (!res.ok) throw new Error('Failed to save note');
                toast.success('Note saved!');
              } catch {
                toast.error('Error saving note');
              }
            }}
          />
        ))}
        </div>
      </div>
      <Card className="w-100 h-full shadow-lg border border-muted bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
          <CardTitle className="text-xl font-semibold tracking-tight">Student AI Panel</CardTitle>
          <Button variant="ghost" size="icon" onClick={handleNewChat} title="New Chat">
            <RefreshCw className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div ref={scrollRef} className="h-[250px] overflow-y-auto px-1 mb-4">
            <div className="space-y-4">
              {messages.length === 0 && !loading && (
                <div className="text-center text-muted-foreground text-sm mt-20">Start a conversation with the AI assistant.</div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${message.role === 'assistant' ? 'bg-muted/60' : ''} p-2 rounded-lg`}
                >
                  <div className="mt-1">
                    {message.role === 'assistant' ? (
                      <Bot className="h-5 w-5 text-blue-500" />
                    ) : (
                      <User className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium mb-1 text-muted-foreground">
                      {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI is thinking...
                </div>
              )}
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              placeholder="Type your question..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px] text-black"
              disabled={loading}
            />
            <Button type="submit" className="w-full" disabled={loading || !prompt.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 