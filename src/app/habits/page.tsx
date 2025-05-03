'use client';

import HabitCard from "@/components/HabitCard";
import { useState, useEffect } from "react";
import AddHabitForm from "@/components/AddHabitForm";
import { ButtonIcon, CrossCloseButton } from "@/components/Button";
import Loading from "@/components/Loading";
import { AnimatedHabitCard } from "@/components/AnimatedHabitCard";
import { Habit } from "@/lib/types";

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [addNewHabit, setAddNewHabit] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  useEffect(() => {
    if (selectedHabit) {
      const updated = habits.find(h => h.id === selectedHabit.id);
      if (updated) {
        setSelectedHabit(updated);
      }
    }
  }, [habits]);

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

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>, habit: Habit) => {
    // Ignore clicks on elements inside interactive no-open containers
    if ((e.target as HTMLElement).closest('.no-open')) {
      return;
    }
    // Only open the full view if clicking directly on the card
    // and not on any of its interactive children
    setSelectedHabit(habit);
  };

  return (
    <div className="py-5">
      <div className="px-50 py-10 flex flex-wrap gap-25 min-h-screen">
        {habits.map((habit) => (
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
        ))}

        {/* Add new habit card */}
        {addNewHabit && (
          <div className="rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md shadow-6xl shadow-gray-900 hover:shadow-2xl hover:-translate-y-1 transform transition-all duration-300 h-80">
            <div className="bg-gradient-to-r from-gray-400 via-gray-400 to-gray-500 text-white flex flex-col gap-2 rounded-xl border py-4 px-6 w-72 h-80">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 mx-4">Add a New Habit</h2>
                <CrossCloseButton onClick={() => setAddNewHabit(false)} /> 
              </div>
              <AddHabitForm 
                onSubmit={() => setAddNewHabit(false)} 
                onRefresh={fetchHabits} 
              />
            </div>
          </div>
        )}

        {/* Plus button to add a new habit */}
        <div className="flex mt-10">
          <ButtonIcon onClick={() => setAddNewHabit(true)} />
        </div>
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
