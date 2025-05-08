'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Bot, User, RefreshCw, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function StudentPage() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    const userMessage: Message = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');

    // Check for the command to add a note
    if (prompt.toLowerCase().includes('add note')) {
      setNotes(prev => [...prev, '']);
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

  const handleAddCard = () => {
    setNotes(prev => [...prev, '']);
  };

  return (
    <div className="min-h-screen flex items-start justify-between bg-muted/50 p-4">
      <div className="flex flex-col w-full max-w-md">
        <Button onClick={handleAddCard} className="mb-4">
          <Plus className="mr-2 h-5 w-5" /> Add Card
        </Button>
        {notes.map((note, index) => (
          <Card key={index} className="mb-4">
            <CardContent>
              <Textarea
                placeholder="New note..."
                value={note}
                onChange={(e) => {
                  const newNotes = [...notes];
                  newNotes[index] = e.target.value;
                  setNotes(newNotes);
                }}
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="w-full max-w-sm shadow-lg border border-muted bg-white">
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
              className="min-h-[80px]"
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