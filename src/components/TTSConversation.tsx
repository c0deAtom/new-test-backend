'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TTSConversation() {
  const [text, setText] = useState('');
  const [history, setHistory] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleSpeak = async () => {
    if (!text.trim()) return;
    // record user's text in chat
    setHistory((h) => [...h, { sender: 'user', text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('TTS failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
      }

      // record AI response
      setHistory((h) => [...h, { sender: 'ai', text: '🔊 Audio generated' }]);
    } catch (err) {
      console.error(err);
      setHistory((h) => [...h, { sender: 'ai', text: '❌ Error generating audio' }]);
    } finally {
      setLoading(false);
      setText('');
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Text → Speech</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {history.map((m, i) => (
            <div key={i} className={m.sender === 'user' ? 'text-right' : 'text-left'}>
              <span
                className={`inline-block px-3 py-1 rounded ${
                  m.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {m.text}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Type something..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSpeak()}
          />
          <Button onClick={handleSpeak} disabled={loading || !text.trim()}>
            {loading ? '⏳' : 'Speak'}
          </Button>
        </div>
        <audio ref={audioRef} className="w-full mt-2" controls />
      </CardContent>
    </Card>
  );
} 