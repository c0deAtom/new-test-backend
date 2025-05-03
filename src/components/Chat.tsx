'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Message = {
  sender: 'user' | 'system';
  text: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // State to hold the latest user's name (fallbacks to 'Guest')
  const [userName, setUserName] = useState<string>('Guest');

  // Fetch latest user on mount
  useEffect(() => {
    fetch('/api/users/latest')
      .then((res) => res.json())
      .then((data) => {
        if (data.name) {
          setUserName(data.name);
        }
      })
      .catch(() => {
        // keep default
      });
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const userMessage: Message = { sender: 'user', text: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text }),
      });
      if (!res.ok) throw new Error('Failed to fetch chat response');
      const data = await res.json();
      const systemMessage: Message = { sender: 'system', text: data.message };
      setMessages((prev) => [...prev, systemMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'system', text: 'Error: Could not connect to the chat system.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <Card className="w-full h-[500px] grid grid-rows-[auto_1fr_auto] overflow-hidden">
      <CardHeader className="px-4 py-2 border-b flex-none">
        <CardTitle>{userName.split(' ')[0]} {"From"} {new Date().getFullYear() + 2}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto p-4 flex flex-col gap-2"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-4 py-2 rounded-lg max-w-xs break-words ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="px-4 py-2 rounded-lg bg-muted text-muted-foreground">Typing...</div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="px-4 py-2 border-t flex-none">
        <div className="flex items-center space-x-2 w-full">
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
            Send
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 