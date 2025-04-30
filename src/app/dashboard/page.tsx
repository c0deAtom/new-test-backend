'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import HabitCard from '@/components/HabitCard';
import Navbar from '@/components/Navbar';
import Questions from '@/components/Questions'
import Loading from '@/components/Loading';
import { Habit, HabitEvent } from '@/lib/types';

type CardId = 'A' | 'B'; // Define type for card identifier

export default function CardSwap ()  {
  const [isBig, setIsBig] = useState<CardId>('A'); // Use CardId type
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  

  const [habitId, setHabitId] = useState<string | null>(null);
  const [type, setType] = useState<"HIT" | "SLIP" | null>(null); // Allow null initially
  // Function to toggle the cards when a card is clicked

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits');
      if (!res.ok) throw new Error('Failed to fetch habits');

      const data = await res.json();
      setHabits(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
   
    fetchHabits();
  }, []);



  if (loading) return (<Loading />);
  const toggleCards = (card: CardId) => {
    setIsBig(card);
    // Reset habitId and type when toggling away from Questions (Card B)
    if (card === 'A') {
        setHabitId(null);
        setType(null);
    }
  };


  const getLatestEvents = (habit: Habit): HabitEvent[] => {
    const events = Array.isArray(habit.events) ? habit.events : [];
    // Parse timestamp string to Date for sorting
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Sort all habits by their most recent event timestamp
  const sortedHabits = habits
    .map(habit => {
      const latestEvent = getLatestEvents(habit)[0];
      // Parse timestamp string to Date for comparison, handle undefined latestEvent
      const latestEventTimestamp = latestEvent ? new Date(latestEvent.timestamp) : new Date(0); // Use epoch if no event
      return { ...habit, latestEventTimestamp }; // Store the Date object for sorting
    })
    .sort((a, b) => b.latestEventTimestamp.getTime() - a.latestEventTimestamp.getTime())
    .slice(0, 2);


  

  
  

  

  return (
    <div>
      <Navbar />
    <div className="flex justify-center items-center space-x-6 relative w-full h-screen bg-gray-400">
      {/* Card A */}
      <motion.div
        initial={{ scale: 1, opacity: 1, x: 0 }}
        animate={{
          scale: isBig === 'A' ? 2 : 1,  // When 'A' is big, scale it to 2
          x: isBig === 'A' ? 0 : -550,   // Move it to the left when not selected
          opacity: isBig === 'A' ? 1 : 0.7, // Reduce opacity for the small card
        }}
        transition={{  type: "tween", ease: "easeInOut", duration: 0.6}}
        onClick={() => toggleCards('A')}
        className=" w-130 h-100 bg-gray-800 px-20  text-lg text-white rounded-md cursor-pointer absolute transform -translate-x-40">
     <h1 className='py-2 px-8'> Recents Habits</h1>
     
      <div className="w-48 h-64 scale-40 flex items-center justify-center gap-8">
   
      { (
        sortedHabits.map((habit) => (
          <div key={habit.id} className="">
          <HabitCard 
  data={habit}
  onRefresh={fetchHabits}
  onTriggerQuestion={(habitId, eventType) => {
    setHabitId(habitId);
    setType(eventType);
    setIsBig('B'); // Swap to Questions card
  }}
/>
          </div>
        ))
      )}
   

  
  
</div>
    
      </motion.div>

      {/* Card B */}
      <motion.div
        initial={{ scale: 1, opacity: 1, x: 0 }}
        animate={{
          scale: isBig === 'B' ? 2 : 1,  // When 'B' is big, scale it to 2
          x: isBig === 'B' ? 0 : 690,   // Move it to the right when not selected
          opacity: isBig === 'B' ? 1 : 0.7, // Reduce opacity for the small card
        }}
        transition={{ duration: 0.9 }}
        onClick={() => toggleCards('B')}
        className="w-90 h-100 bg-gray-800 flex justify-center items-center text-lg text-white rounded-md cursor-pointer absolute -translate-x-20"
      >
       {/* Conditionally render Questions only when habitId and type are set */}
       {isBig === 'B' && habitId && type && (
         <Questions eventType={type} habitId={habitId} onComplete={() => toggleCards('A')} />
       )}
      </motion.div>
    </div>
    </div>
  );
};

