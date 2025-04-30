'use client';

import Navbar from "@/components/Navbar";
import HabitCard from "@/components/HabitCard";
import { useState, useEffect } from "react";
import AddHabitForm from "@/components/AddHabitForm";
import { HabitDrawer } from "@/components/HabitDrawer";
import { ButtonIcon, CrossCloseButton } from "@/components/Button";
import Loading from "@/components/Loading";

interface HabitEvent {
  id: string;
  eventType: string;
  eventDate: string;
  habitId: string;
}

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
  event: HabitEvent;
}

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [addNewHabit, setAddNewHabit] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch habits from the API
  async function fetchHabits() {
    try {
      const res = await fetch('/api/habits');
      if (!res.ok) {
        throw new Error('Failed to fetch habits');
      }
      const data = await res.json();
      setHabits(data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHabits();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    
    <div className="bg-gray-400 py-5">
      <Navbar />
      <div className="px-50 py-10 flex flex-wrap  gap-10  bg-gray-400 min-h-screen">
        
        {habits.map((habit) => (
          <div 
            key={habit.id}
            onClick={() => setIsOpen(true)}
          >
            <HabitCard 
              data={habit} 
              onRefresh={fetchHabits} 
            />
          </div>
        ))}

        {/* Add new habit card */}
        {addNewHabit && (
          <div className=" rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md shadow-6xl shadow-gray-900 hover:shadow-2xl hover:-translate-y-1 transform transition-all duration-300 h-80">
          <div className="bg-gradient-to-r from-gray-400 via-gray-400 to-gray-500 text-white flex flex-col gap-2 rounded-xl border py-4 px-6 w-72 h-80">
            <div className=" flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 mx-4">Add a New Habit</h2>
              <CrossCloseButton onClick={() => setAddNewHabit(false)} /> 
                
            </div>
            <AddHabitForm 
              onSubmit={() => setAddNewHabit(false)} 
              onRefresh={fetchHabits} 
            />
          </div></div>
        )}

        {/* Plus button to add a new habit */}
        <div className="flex mt-10">
          <ButtonIcon onClick={() => setAddNewHabit(true)} />
        </div>
      </div>

      {/* Habit Drawer */}
     
    </div>
    
  );
}
