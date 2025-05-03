'use client'

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HabitCard from '@/components/HabitCard';
import { Habit } from '@/lib/types';
import AddHabitForm from '@/components/AddHabitForm';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import Chat from '@/components/Chat';

// Define animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

const swipeVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0
  })
};

export default function Dashboard() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sorted habits by latest event timestamp
  const sortedHabits = useMemo(() => {
    return [...habits]
      .sort((a, b) => {
        const aTime = a.events?.[0] ? new Date(a.events[0].timestamp).getTime() : 0;
        const bTime = b.events?.[0] ? new Date(b.events[0].timestamp).getTime() : 0;
        return bTime - aTime;
      });
  }, [habits]);

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits');
      if (!res.ok) throw new Error('Failed to fetch habits');
      const data = await res.json();
      const habitsWithSortedEvents = data.map((habit: Habit) => ({
        ...habit,
        events: habit.events?.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || [],
      }));
      setHabits(habitsWithSortedEvents);
      setCurrentIndex(0);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load habits.");
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  // Navigate to previous habit
  const prev = () => {
    if (sortedHabits.length === 0) return;
    setCurrentIndex((idx) => (idx - 1 + sortedHabits.length) % sortedHabits.length);
  };
  // Navigate to next habit
  const next = () => {
    if (sortedHabits.length === 0) return;
    setCurrentIndex((idx) => (idx + 1) % sortedHabits.length);
  };

  return (
    <div className="container mx-20 p-4 md:p-6 lg:p-8 min-h-screen ">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Single habit carousel */}
        <div className="relative w-full max-w-sm flex justify-center">
          {/* Prev button */}
          <Button
            variant="ghost"
            className="absolute left-0 top-1/2 -translate-y-1/2 hover:bg-transparent w-8 h-8 group"
            onClick={prev}
            disabled={sortedHabits.length <= 1}
          >
            <ChevronLeft className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
          </Button>

          {/* Habit card with motion on change */}
          <AnimatePresence initial={false} custom={currentIndex} mode="wait">
            {sortedHabits.length > 0 && (
              <motion.div
                key={sortedHabits[currentIndex].id}
                custom={currentIndex}
                variants={swipeVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                className="flex justify-center h-105"
              >
                <HabitCard
                  data={sortedHabits[currentIndex]}
                  onRefresh={fetchHabits}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next button */}
          <Button
            variant="ghost"
            className="absolute right-0 top-1/2 -translate-y-1/2 hover:bg-transparent w-8 h-8 group"
            onClick={next}
            disabled={sortedHabits.length <= 1}
          >
            <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
          </Button>
        </div>
        {/* Chat panel */}
        <div className="w-full max-w-md mx-auto">
          <Chat />
        </div>
      </div>
      {/* Add new habit button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="w-15 h-10 m-14 rounded-full flex items-center justify-center"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Add Habit Animated Modal styled like AnimatedHabitCard */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 "
              onClick={() => setIsAddModalOpen(false)}
            />
            {/* Slide-in Panel from right to left-1/5 */}
            <motion.div
              initial={{ x: '100vw', scale: 1 }}
              animate={{ x: '50%', scale: 1 }}
              exit={{ y: '50vw', scale: 1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="fixed top-1/2 left-100 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[900px] bg-gray-800 text-white shadow-lg z-50 rounded-xl overflow-hidden"
            >
              <div className="">
                <AddHabitForm onSubmit={() => setIsAddModalOpen(false)} onRefresh={fetchHabits} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
