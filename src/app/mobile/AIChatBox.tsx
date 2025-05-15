"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw } from "lucide-react";
import { Input } from '@/components/ui/input';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function MobileAIChatBox() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const [showInput, setShowInput] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setCurrentQuestion(prompt);
    setShowInput(false);
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
      if (i >= lastAssistantMsg.length) {
        clearInterval(interval);
        setTimeout(() => {
          setShowInput(true);
          setCurrentQuestion('');
        }, 600);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [lastAssistantMsg, lastAssistantIdx]);

  return (
    <Card className="w-full max-w-lg min-h-[500px] bg-yellow-50 border-2 border-yellow-200 shadow-lg relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-3 bg-yellow-100/80">
        <CardTitle className="text-xl font-bold tracking-tight text-yellow-900">Notebook AI</CardTitle>
        <Button variant="ghost" size="icon" onClick={handleNewChat} title="New Chat">
          <RefreshCw className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent>
        <div ref={scrollRef} className="h-80 overflow-y-auto px-2 mb-4 relative">
          {/* Lined paper effect: render lines as divs */}
          <div className="absolute left-0 top-3 w-full h-full pointer-events-none z-0">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="w-full border-b border-yellow-300"
                style={{ position: 'absolute', top: `${i * 32}px` }}
              />
            ))}
          </div>
          <div className="space-y-6 relative mt-4 ">
            {(() => {
              const pairs = [];
              for (let i = 0; i < messages.length; i++) {
                if (messages[i].role === 'user') {
                  const userMsg = messages[i];
                  const answerMsg = messages[i + 1] && messages[i + 1].role === 'assistant' ? messages[i + 1] : null;
                  pairs.push(
                    <div key={i} className="mb-8">
                      <div className="flex gap-2 pl-2 mt-5">
                        <span className="text-lg font-bold text-blue-600">Question:</span>
                        <span className="text-base font-mono text-gray-800 mt-1">{userMsg.content}</span>
                      </div>
                      {answerMsg && (i + 1 === lastAssistantIdx) ? (
                        <div className="flex gap-2 pl-2 ">
                          <span className="text-lg font-bold text-green-600 mt-1">Answer:</span>
                          <span className="text-base font-mono text-gray-800 text-left whitespace-pre-wrap mt-1 leading-8">
                            {typewriterText.length < answerMsg.content.length ? typewriterText : answerMsg.content}
                          </span>
                        </div>
                      ) : answerMsg ? (
                        <div className="flex gap-2 pl-2 pr-2 ">
                          <span className="text-lg font-bold text-green-600 mt-1">Answer:</span>
                          <span className="text-base font-mono text-gray-800 text-left whitespace-pre-wrap mt-1 leading-8">
                            {answerMsg.content}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    
                  );
                  if (answerMsg) i++; // skip the answer in the next loop
                }
              }
              return pairs;
            })()}
            <div className="">
            {showInput && (
              <form onSubmit={handleSubmit} className='flex items-center gap-4'>
                <span className="text-lg font-bold text-blue-600 pl-1 mt-">Question:</span>
                <input
                  placeholder="Write your question..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="border-none outline-none bg-transparent focus:outline-none focus:ring-0 w-96"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
              </form>
            )}
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-base text-yellow-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI is thinking...
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-yellow-100/80 border-t pt-3 flex justify-end">
        <Button type="button" onClick={handleSubmit} className="h-10 px-6 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold shadow" disabled={loading || !prompt.trim() || !showInput}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            'Ask'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 