import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, X as CloseIcon } from "lucide-react";
import AddHabitForm from "@/components/AddHabitForm";
import { MobileRoutineCard } from '@/components/MobileRoutineCard';
import React from 'react';
import { Habit } from '@/lib/types';
import { toast } from "sonner";

interface HabitPageProps {
  habits: Habit[];
  sortBy: 'name' | 'createdAt';
  setSortBy: (v: 'name' | 'createdAt') => void;
  routineView: 'icon' | 'list' | 'big';
  setRoutineView: (v: 'icon' | 'list' | 'big') => void;
  openRoutineSort: 'icon' | 'list' | 'big' | null;
  setOpenRoutineSort: (v: 'icon' | 'list' | 'big' | null) => void;
  showAddHabitForm: boolean;
  setShowAddHabitForm: (v: boolean) => void;
  fetchHabits: () => void;
}

export function HabitPage({
  habits,
  sortBy,
  setSortBy,
  routineView,
  setRoutineView,
  openRoutineSort,
  setOpenRoutineSort,
  showAddHabitForm,
  setShowAddHabitForm,
  fetchHabits,
}: HabitPageProps) {
  // Loading states for optimistic updates
  const [processingHabits, setProcessingHabits] = React.useState<{
    [key: string]: {
      isDeleting?: boolean;
      isUpdating?: boolean;
      isCompleting?: boolean;
    };
  }>({});

  const sortedHabits = [...habits].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  });

  const handleHabitDelete = async (habitId: string) => {
    // Optimistically remove the habit
    setProcessingHabits(prev => ({ ...prev, [habitId]: { isDeleting: true } }));
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    try {
      const res = await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete habit');
      fetchHabits(); // Refresh the list after successful deletion
    } catch (error) {
      toast.error('Failed to delete habit');
    } finally {
      setProcessingHabits(prev => {
        const newState = { ...prev };
        delete newState[habitId];
        return newState;
      });
    }
  };

  const handleHabitUpdate = async (habitId: string, updates: Partial<Habit>) => {
    // Optimistically update the habit
    setProcessingHabits(prev => ({ ...prev, [habitId]: { isUpdating: true } }));
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    try {
      const res = await fetch(`/api/habits/${habitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update habit');
      fetchHabits(); // Refresh the list after successful update
    } catch (error) {
      toast.error('Failed to update habit');
    } finally {
      setProcessingHabits(prev => {
        const newState = { ...prev };
        delete newState[habitId];
        return newState;
      });
    }
  };

  const handleHabitComplete = async (habitId: string, completed: boolean) => {
    // Optimistically update completion status
    setProcessingHabits(prev => ({ ...prev, [habitId]: { isCompleting: true } }));
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    try {
      const res = await fetch(`/api/habits/${habitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error('Failed to update habit completion');
      fetchHabits(); // Refresh the list after successful update
    } catch (error) {
      toast.error('Failed to update habit completion');
    } finally {
      setProcessingHabits(prev => {
        const newState = { ...prev };
        delete newState[habitId];
        return newState;
      });
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex flex-row items-center justify-end mb-2 px-1 mt-6">
        <div className="flex flex-row gap-0 items-center border border-gray-300 rounded overflow-hidden bg-white">
          {(['icon', 'list', 'big'] as const).map(type => (
            <div key={type} className="relative">
              <div
                className={`w-14 h-7 flex items-center justify-center cursor-pointer text-xs border-0 ${routineView === type ? 'bg-yellow-200' : ''}`}
                onClick={() => setRoutineView(type)}
                onContextMenu={e => { e.preventDefault(); setOpenRoutineSort(type); }}
                onMouseLeave={() => setOpenRoutineSort(null)}
                style={{ borderRight: type !== 'big' ? '1px solid #e5e7eb' : undefined }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </div>
              {openRoutineSort === type && (
                <div className="absolute right-0 top-8 z-10 bg-white border rounded shadow text-xs w-20">
                  <div className="px-2 py-1 hover:bg-yellow-100 cursor-pointer" onClick={() => { setSortBy('name'); setOpenRoutineSort(null); }}>Sort by Name</div>
                  <div className="px-2 py-1 hover:bg-yellow-100 cursor-pointer" onClick={() => { setSortBy('createdAt'); setOpenRoutineSort(null); }}>Sort by Date</div>
                </div>
              )}
            </div>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className="w-14 h-7 flex items-center justify-center cursor-pointer text-xs border-0 bg-white hover:bg-yellow-100"
                style={{ borderLeft: '1px solid #e5e7eb' }}
              >
                Sort <ChevronDown className="ml-1 w-3 h-3" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-13 p-0">
              <DropdownMenuItem
                className={`text-xs ${sortBy === 'name' ? 'bg-yellow-100 font-bold' : ''}`}
                onClick={() => setSortBy('name')}
              >
                Name
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`text-xs ${sortBy === 'createdAt' ? 'bg-yellow-100 font-bold' : ''}`}
                onClick={() => setSortBy('createdAt')}
              >
                Date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="p-5 w-full">
        {routineView === 'list' ? (
          <div className="w-full flex flex-col gap-2">
            {sortedHabits.map((habit) => (
              <Button
                key={habit.id}
                variant="ghost"
                className="justify-start w-full px-3 py-2 rounded text-left text-base font-medium border bg-yellow-100 border-gray-200 hover:bg-yellow-300"
                onClick={() => console.log(true)} // You may want to open a fullscreen modal for editing
              >
                <div className='min-w-40'>
                  {habit.name}
                </div>
                <div className="text-xs text-gray-500 overflow-y-auto scrollbar-hide">{habit.microGoal}</div>
              </Button>
            ))}
          </div>
        ) : (
          <div className={
            routineView === 'big'
              ? 'w-full grid grid-cols-1 gap-3'
              : 'w-full grid grid-cols-2 gap-3'
          }>
            {sortedHabits.map((habit) => (
              <MobileRoutineCard
                key={habit.id}
                data={habit}
                view={routineView}
                isProcessing={processingHabits[habit.id]}
                onDelete={() => handleHabitDelete(habit.id)}
                onUpdate={(updates) => handleHabitUpdate(habit.id, updates)}
                onComplete={(completed) => handleHabitComplete(habit.id, completed)}
                onRefresh={fetchHabits}
              />
            ))}
          </div>
        )}
      </div>
      {/* Add Habit Form Modal */}
      {showAddHabitForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="mb-4 mt-1 bg-yellow-100 shadow-md rounded-md min-h-60 w-full max-w-md mx-auto aspect-square flex flex-col justify-center relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={() => setShowAddHabitForm(false)}
              title="Close"
            >
              <CloseIcon className="h-5 w-5 text-gray-500 hover:text-red-600 transition-colors" />
            </Button>
            <AddHabitForm
              onSubmit={() => setShowAddHabitForm(false)}
              onRefresh={fetchHabits}
            />
          </div>
        </div>
      )}
    </div>
  );
} 