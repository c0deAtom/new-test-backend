'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import HabitCard, { HabitCardSkeleton } from "@/components/HabitCard";
import { AnimatedHabitCard } from "@/components/AnimatedHabitCard";
import { Habit } from "@/lib/types";
import AddHabitForm from "@/components/AddHabitForm";
import { ButtonIcon } from "@/components/Button";

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [addNewHabit, setAddNewHabit] = useState(false);

  useEffect(() => {
    if (selectedHabit) {
      const updated = habits.find(h => h.id === selectedHabit.id);
      if (updated) {
        setSelectedHabit(updated);
      }
    }
  }, [habits]);

  const fetchHabits = async () => {
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
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>, habit: Habit) => {
    // Ignore clicks on elements inside interactive no-open containers
    if ((e.target as HTMLElement).closest('.no-open')) {
      return;
    }
    // Only open the full view if clicking directly on the card
    setSelectedHabit(habit);
  };

  return (
    <div className="">
       {/* Plus button to add a new habit */}
       <div className="flex ">
       <Button onClick={() => setAddNewHabit(true)} className="w-10 bg-gray-400">
          <Plus className="h-5 w-5" /> 
        </Button>
       
        </div>
      <div className="px-10 py-10 flex flex-wrap gap-21 min-h-screen">
        {loading ? (
          // Show 2 skeleton cards while loading
          Array.from({ length: 2 }).map((_, index) => (
            <HabitCardSkeleton key={index} />
          ))
        ) : (
          habits.map((habit) => (
            <div 
              key={habit.id}
              onClick={(e) => handleCardClick(e, habit)}
              className="cursor-pointer card-wrapper"
            >
              <div className="card-clickable-area">
                <HabitCard 
                  data={habit} 
                  onRefresh={fetchHabits} 
                />
              </div>
            </div>
          ))
        )}

        {/* Add new habit card */}
        {addNewHabit && (
          <div className="rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md shadow-6xl shadow-gray-900 hover:shadow-2xl hover:-translate-y-1 transform transition-all duration-300 h-80">
            <div className="bg-gradient-to-r from-gray-400 via-gray-400 to-gray-500 text-white flex flex-col gap-2 rounded-xl border py-4 px-6 w-80 h-92">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 mx-4">Add a New Habit</h2>
                <button 
                  onClick={() => setAddNewHabit(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <AddHabitForm 
                onSubmit={() => setAddNewHabit(false)} 
                onRefresh={fetchHabits} 
              />
            </div>
          </div>
        )}
      </div>
      <div className="w-full">
        <AnimatedHabitCard
          habit={selectedHabit!}
          isOpen={!!selectedHabit}
          onClose={() => setSelectedHabit(null)}
          onRefresh={fetchHabits}
        />
      </div>
    </div>
  );
}
