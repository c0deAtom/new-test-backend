// components/HabitCard.tsx
'use client'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react";

export default function HabitCard({ habit, onAdd, onRemove }: any) {
  const [hitCount, setHitCount] = useState(0);
  const [slipCount, setSlipCount] = useState(0);
  const [showMessage, setShowMessage] = useState<string | null>();

  useEffect(() => {
    // Count hits and slips from events
    const hits = habit.events.filter(event => event.type === 'hit').length;
    const slips = habit.events.filter(event => event.type === 'slip').length;
    setHitCount(hits);
    setSlipCount(slips);
  }, [habit.events]);

  const getRandomItem = (array: string[]) => {
    return array[Math.floor(Math.random() * array.length)];
  };

  //Record Events (hit slip)
  const recordEvent = async (type: 'hit' | 'slip') => {
    console.log("htislip")
    try {
      // Show random message based on type
      if (type === 'hit' && habit.positiveCues.length > 0) {
        setShowMessage(`- ${getRandomItem(habit.positiveCues)} -`);
      } else if (type === 'slip' && habit.negativeTriggers.length > 0) {
        setShowMessage(`${getRandomItem(habit.negativeTriggers)}`);
      }

      console.log("tested")

      const response = await fetch(`/api/habits/${habit.id}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });
      console.log(response)
      onAdd()
      if (!response.ok) {
        throw new Error('Failed to record event');
      }

      // Update counts immediately
      if (type === 'hit') {
        setHitCount(prev => prev + 1);
      } else {
        setSlipCount(prev => prev + 1);
      }

      // Hide message after 3 seconds
      setTimeout(() => {
        setShowMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error recording event:', error);
    }
  };


  return (
    <div className="bg-slate-800/50 rounded-lg border from-purple-500 to-pink-500 border-purple-500/30 p-4 relative overflow-hidden">
    <div className="text-sm text-slate-400 mb-2">Habit Tracker</div>
    <Card className="w-full max-w-sm shadow-lg bg-gray-400">

      <CardHeader>
        <div className="flex space-x-3 ml-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(habit.id);
            }}
            className="text-red-600 hover:text-red-800 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <CardTitle className="text-blue-500">{habit.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-medium">{showMessage || ' '}</p>
        <p className="text-sm text-gray-700">Type: {habit.type}</p>
        <p className="text-xs text-gray-500">Notes: {habit.notes || "No notes"}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
       
          <div className="flex flex-col items-center">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevents the card click event
                recordEvent('hit');
              }}

              className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <span className="mt-3 text-2xl font-bold text-green-700">{hitCount}</span>
            <span className="text-sm text-gray-500">Hits</span>
          </div>

          <div className="flex flex-col items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                recordEvent('slip');
              }}
              className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span className="mt-3 text-2xl font-bold text-red-700">{slipCount}</span>
            <span className="text-sm text-gray-500">Slips</span>
          </div>
      

      </CardFooter>
    </Card>
    </div>
  )

}

