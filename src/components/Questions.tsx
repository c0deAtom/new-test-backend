'use client'
import { useEffect, useState } from 'react';

interface QuestionsProps {
  eventType: 'HIT' | 'SLIP';
  habitId: string;
  onComplete: (card: string) => void | undefined; // optional if you want to refresh after save
}

export default function Questions({ eventType, habitId, onComplete }: QuestionsProps) {
  const [mood, setMood] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [reflectionNote, setReflectionNote] = useState('');
  const [emotionTags, setEmotionTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showing, setShowing] = useState<boolean>(false);



  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/habits/events`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          intensity,
          reflectionNote,
          emotionTags,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to save event');
      }

   
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
      onComplete('A')
      console.log(onComplete) 
    }
  };


  
  return (
   eventType && ( <div className="flex flex-col gap-4 p-6">
      <h2 className="text-xl">{eventType} Details</h2>

      <input
        type="text"
        placeholder="Mood (happy, sad, etc.)"
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        className="border p-2 rounded"
      />

      <input
        type="number"
        min={1}
        max={10}
        placeholder="Intensity (1-10)"
        value={intensity}
        onChange={(e) => setIntensity(parseInt(e.target.value))}
        className="border p-2 rounded"
      />

      <textarea
        placeholder="Reflection notes..."
        value={reflectionNote}
        onChange={(e) => setReflectionNote(e.target.value)}
        className="border p-2 rounded"
      />

      <input
        type="text"
        placeholder="Emotion tags (comma separated)"
        onChange={(e) => setEmotionTags(e.target.value.split(','))}
        className="border p-2 rounded"
      />

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="bg-blue-500 text-white p-2 rounded"
      >
        {submitting ? 'Saving...' : 'Save Event'}
      </button>
    </div>)
  );
}
