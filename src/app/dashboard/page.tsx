
'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import HabitCard from '@/components/HabitCard';
import NavigationMenuDemo from '@/components/Navbar';
import Habit from '../habit/page';
import Questions from '@/components/Questions'
import Loading from '@/components/Loading';
interface Habit {
  id: string;
  userId: string;
  name: string;
  goalType: string;
  microGoal: string;
  triggers: string[];
  cravingNarrative: string;
  resistanceStyle: string;
  motivationOverride: string;
  reflectionDepthOverride: number;
  hitDefinition: string;
  slipDefinition: string;
  events: HabitEvent
}

export interface HabitEvent {
  id: string;                   
  habitId: string;            
  userId: string;             
  type: "HIT" | "SLIP";       
  timestamp: Date;            
  mood?: string;            
  intensity?: number;       
  reflectionNote?: string;  
  emotionTags: string[];    
  aiPromptUsed?: string;   
  isReversal: boolean;        
}

export default function CardSwap ()  {
  const [isBig, setIsBig] = useState('A'); // Track which card is currently big
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  

  const [habitId, setHabitId] = useState<string | null>(null);
const [type, setType] = useState<"HIT" | "SLIP" | "">("");
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
  const toggleCards = (card) => {
    setIsBig(card);
  };


  

  
  

  

  return (
    <div>
      <NavigationMenuDemo />
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
        className=" w-130 h-100 bg-gray-800 flex justify-center items-center text-lg text-white rounded-md cursor-pointer absolute transform -translate-x-40">
      <div className="w-48 h-64 scale-40 flex items-center justify-center gap-8">
   
      { (
        habits.map((habit) => (
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
       <Questions eventType={type} habitId={habitId} onComplete={toggleCards} />
      </motion.div>
    </div>
    </div>
  );
};

