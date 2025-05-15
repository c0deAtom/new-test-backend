'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatBox() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Find the index of the last assistant message
  const lastAssistantIdx = messages.length > 0
    ? messages.map(m => m.role).lastIndexOf('assistant')
    : -1;

  // Only use typewriter for the last assistant message
  const lastAssistantMsg = lastAssistantIdx !== -1 ? messages[lastAssistantIdx].content : '';
  useEffect(() => {
    if (lastAssistantIdx === -1) return;
    setTypewriterText('');
    let i = 0;
    const interval = setInterval(() => {
      setTypewriterText(t => t + lastAssistantMsg[i]);
      i++;
      if (i >= lastAssistantMsg.length) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [lastAssistantMsg, lastAssistantIdx]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, typewriterText]);

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
    } catch {
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
    <Card className="w-full max-w-lg min-h-[500px] bg-yellow-50 border-2 border-yellow-200 shadow-lg relative overflow-hidden" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, #fef9c3 0px, #fef9c3 31px, #fde68a 32px)' }}>
      <CardHeader className="flex flex-row items-center justify-between border-b pb-3 bg-yellow-100/80">
        <CardTitle className="text-xl font-bold tracking-tight text-yellow-900">Notebook AI</CardTitle>
        <Button variant="ghost" size="icon" onClick={handleNewChat} title="New Chat">
          <RefreshCw className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent>
        <div ref={scrollRef} className="h-80 overflow-y-auto px-2 mb-4">
          <div className="sticky top-5 z-10 bg-yellow-50/90 pb-2 pt-1 bg-yellow-100/80">
            <span className="text-lg font-bold text-blue-900 pl-1">Question:</span>
          </div>
          <div className="space-y-6">
            {messages.length === 0 && !loading && (
              <div className="text-center text-yellow-700 text-base mt-20">Start a conversation with your AI notebook.</div>
            )}
            {messages.map((message, index) => (
              <div key={index} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-lg ${message.role === 'user' ? 'text-blue-900' : 'text-green-900'}`}>{message.role === 'user' ? 'Q:' : 'A:'}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-yellow-700">{message.role === 'user' ? 'You' : 'AI Assistant'}</span>
                </div>
                <div className="pl-7 pr-2">
                  <span className="whitespace-pre-wrap text-base font-mono text-gray-800">
                    {message.role === 'assistant' && index === lastAssistantIdx
                      ? typewriterText
                      : message.content}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-base text-yellow-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI is thinking...
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-yellow-100/80 border-t pt-3">
        <form onSubmit={handleSubmit} className="flex gap-2 w-full items-end">
          <Textarea
            placeholder="Write your question..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[40px] max-h-24 flex-1 bg-yellow-50 border-0 border-b-2 border-yellow-300 rounded-none focus:ring-0 focus:outline-none text-base font-mono text-gray-900"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" className="h-10 px-6 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold shadow" disabled={loading || !prompt.trim()}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Ask'
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}