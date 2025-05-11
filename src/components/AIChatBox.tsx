 'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Bot, User, RefreshCw } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatBox() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
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

  return (
    <Card className="w-120 h-200 mt-13 shadow-lg border border-muted bg-gray-700">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
        <CardTitle className="text-xl font-semibold tracking-tight text-gray-200">Student AI Panel</CardTitle>
        <Button variant="ghost" size="icon" onClick={handleNewChat} title="New Chat">
          <RefreshCw className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent>
        <div ref={scrollRef} className="h-135 overflow-y-auto px-1 mb-4">
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
                  <p className="text-sm whitespace-pre-wrap text-gray-200">{message.content}</p>
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
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="space-y-2 w-full">
          <Textarea
            placeholder="Type your question..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[80px] text-gray-200 border border-gray-900"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" disabled={loading || !prompt.trim()}>
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
      </CardFooter>
    </Card>
  );
}