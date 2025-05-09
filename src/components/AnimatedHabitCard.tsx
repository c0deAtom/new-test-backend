'use client';

import { motion, AnimatePresence } from 'framer-motion';
import HabitCard from './HabitCard';
import { CrossCloseButton } from './Button';
import { Habit, HabitEvent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface AnimatedHabitCardProps {
  habit: Habit;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

function calculateCombo(events: HabitEvent[]) {
  if (!events || events.length === 0) return null;

  const sortedEvents = [...events].sort((a, b) => {
    const timestampA = new Date(a.timestamp).getTime();
    const timestampB = new Date(b.timestamp).getTime();
    return timestampB - timestampA;
  });

  let latestType = sortedEvents[0].type;
  let comboCount = 1;

  for (let i = 1; i < sortedEvents.length; i++) {
    if (sortedEvents[i].type === latestType) {
      comboCount++;
    } else {
      break;
    }
  }

  const colorClass = latestType === 'HIT' ? 'text-green-700' : 'text-red-700';
  return comboCount >= 2 ? <div className={colorClass}>x{comboCount}</div> : null;
}

function prepareChartData(events: HabitEvent[]) {
  if (!events || events.length === 0) return [];
  
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return sortedEvents.map((event, index) => ({
    name: new Date(event.timestamp).toLocaleDateString(),
    value: event.type === 'HIT' ? 1 : -1,
    cumulative: sortedEvents.slice(0, index + 1).reduce((sum, e) => 
      sum + (e.type === 'HIT' ? 1 : -1), 0
    ),
  }));
}

export function AnimatedHabitCard({ habit, isOpen, onClose, onRefresh }: AnimatedHabitCardProps) {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [confirmDeleteEvents, setConfirmDeleteEvents] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(() => ({
    name: habit?.name || '',
    goalType: habit?.goalType || '',
    microGoal: habit?.microGoal || '',
    triggers: habit?.triggers?.join(', ') || '',
    resistanceStyle: habit?.resistanceStyle || '',
    cravingNarrative: habit?.cravingNarrative || '',
    motivationOverride: habit?.motivationOverride || '',
    reflectionDepthOverride: habit?.reflectionDepthOverride?.toString() || '',
    hitDefinition: habit?.hitDefinition || '',
    slipDefinition: habit?.slipDefinition || '',
  }));

  useEffect(() => {
    if (habit) {
      setEditForm({
        name: habit.name,
        goalType: habit.goalType,
        microGoal: habit.microGoal,
        triggers: habit.triggers.join(', '),
        resistanceStyle: habit.resistanceStyle,
        cravingNarrative: habit.cravingNarrative || '',
        motivationOverride: habit.motivationOverride || '',
        reflectionDepthOverride: habit.reflectionDepthOverride?.toString() || '',
        hitDefinition: habit.hitDefinition || '',
        slipDefinition: habit.slipDefinition || '',
      });
    }
  }, [habit]);

  const handleDeleteEvents = async () => {
    if (selectedEvents.length === 0) return;
    
    try {
      const response = await fetch(`/api/habits/${habit.id}/events`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventIds: selectedEvents }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete events');
      }

      toast.success(`Successfully deleted ${selectedEvents.length} events`);
      setSelectedEvents([]);
      onRefresh();
    } catch (error) {
      console.error('Error deleting events:', error);
      toast.error('Failed to delete events');
    }
  };

  const handleDeleteHabit = async () => {
    try {
      const response = await fetch(`/api/habits/${habit.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete habit');
      }

      toast.success('Habit deleted successfully');
      onClose();
      onRefresh();
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast.error('Failed to delete habit');
    }
  };

  const handleEditHabit = async () => {
    try {
      const response = await fetch(`/api/habits/${habit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          goalType: editForm.goalType,
          microGoal: editForm.microGoal,
          triggers: editForm.triggers.split(',').map(t => t.trim()).filter(Boolean),
          resistanceStyle: editForm.resistanceStyle,
          cravingNarrative: editForm.cravingNarrative,
          motivationOverride: editForm.motivationOverride,
          reflectionDepthOverride: editForm.reflectionDepthOverride
            ? parseInt(editForm.reflectionDepthOverride, 10)
            : undefined,
          hitDefinition: editForm.hitDefinition,
          slipDefinition: editForm.slipDefinition,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update habit');
      }

      setIsEditing(false);
      onRefresh();
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const chartData = prepareChartData(habit?.events || []);
  const combo = calculateCombo(habit?.events || []);

  // Toggle event selection
  const toggleSelect = (id: string) => {
    setSelectedEvents(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Hide confirmation buttons on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (confirmDeleteEvents && confirmRef.current && !confirmRef.current.contains(event.target as Node)) {
        setConfirmDeleteEvents(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [confirmDeleteEvents]);

  if (!habit) return null;

  return (
    <div className=''>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={onClose}
            />
            
            <motion.div
              initial={{ x: '100vw', scale: 1 }}
              animate={{ x: '50%', scale: 1 }}
              exit={{ x: '100vw', scale: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="fixed top-1/2 left-1/5 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-240 bg-gradient-to-br from-green-200 to-pink-300 text-white shadow-lg z-50 rounded-xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold text-gray-800">{habit.name}</h2>
                    {combo && <span className="px-3 py-1 text-bold text-gray-800 text-3xl">{combo}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-blue-50 hover:bg-blue-100"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="bg-red-50 hover:bg-red-100">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            Delete Habit
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{habit.name}" and all its events.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteHabit}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <CrossCloseButton onClick={onClose} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    {isEditing ? (
                      <>
                        <div className="grid gap-1 p-2 bg-gray-700 rounded-md ">
                          <Label htmlFor="name" className="text-xs">Name</Label>
                          <Input
                            id="name"
                            className="text-xs"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1 p-2 bg-gray-700 rounded-md">
                          <Label htmlFor="goalType" className="text-xs">Goal Type</Label>
                          <Input
                            id="goalType"
                            className="text-xs"
                            value={editForm.goalType}
                            onChange={(e) => setEditForm({ ...editForm, goalType: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1 p-2 bg-gray-700 rounded-md">
                          <Label htmlFor="microGoal" className="text-xs">Micro Goal</Label>
                          <Input
                            id="microGoal"
                            className="text-xs"
                            value={editForm.microGoal}
                            onChange={(e) => setEditForm({ ...editForm, microGoal: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1 p-2 bg-gray-700 rounded-md">
                          <Label htmlFor="triggers" className="text-xs">Triggers</Label>
                          <Textarea
                            id="triggers"
                            className="text-xs"
                            value={editForm.triggers}
                            onChange={(e) => setEditForm({ ...editForm, triggers: e.target.value })}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="font-medium text-white mb-2">Progress</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} itemStyle={{ color: '#fff' }} />
                            <Line type="monotone" dataKey="cumulative" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </>
                    )}
                  </div>
                  <div className="space-y-4">
                    {isEditing ? (
                      <>
                        <div className="grid gap-1 p-2 bg-gray-700 rounded-md">
                          <Label htmlFor="resistanceStyle" className="text-xs">Resistance Style</Label>
                          <Input
                            id="resistanceStyle"
                            className="text-xs"
                            value={editForm.resistanceStyle}
                            onChange={(e) => setEditForm({ ...editForm, resistanceStyle: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1 p-2 bg-gray-700 rounded-md">
                          <Label htmlFor="cravingNarrative" className="text-xs">Craving Narrative</Label>
                          <Textarea
                            id="cravingNarrative"
                            className="text-xs"
                            value={editForm.cravingNarrative}
                            onChange={(e) => setEditForm({ ...editForm, cravingNarrative: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1 p-2 bg-gray-700 rounded-md">
                          <Label htmlFor="motivationOverride" className="text-xs">Motivation Override</Label>
                          <Textarea
                            id="motivationOverride"
                            className="text-xs"
                            value={editForm.motivationOverride}
                            onChange={(e) => setEditForm({ ...editForm, motivationOverride: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1 p-2 bg-gray-700 rounded-md">
                          <Label htmlFor="reflectionDepthOverride" className="text-xs">Reflection Depth</Label>
                          <Input
                            id="reflectionDepthOverride"
                            type="number"
                            className="text-xs"
                            value={editForm.reflectionDepthOverride}
                            onChange={(e) => setEditForm({ ...editForm, reflectionDepthOverride: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1 p-2 bg-gray-700 rounded-md">
                          <Label htmlFor="hitDefinition" className="text-xs">Hit Definition</Label>
                          <Textarea
                            id="hitDefinition"
                            className="text-xs"
                            value={editForm.hitDefinition}
                            onChange={(e) => setEditForm({ ...editForm, hitDefinition: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1 p-2 bg-gray-700 rounded-md">
                          <Label htmlFor="slipDefinition" className="text-xs">Slip Definition</Label>
                          <Textarea
                            id="slipDefinition"
                            className="text-xs"
                            value={editForm.slipDefinition}
                            onChange={(e) => setEditForm({ ...editForm, slipDefinition: e.target.value })}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 className="text-sm font-medium text-white">Goal Type</h4>
                        <p className="text-gray-200">{habit.goalType}</p>
                        <h4 className="text-sm font-medium text-white mt-2">Micro Goal</h4>
                        <p className="text-gray-200">{habit.microGoal}</p>
                        <h4 className="text-sm font-medium text-white mt-2">Triggers</h4>
                        <p className="text-gray-200">{habit.triggers.join(', ')}</p>
                        <h4 className="text-sm font-medium text-white mt-2">Resistance Style</h4>
                        <p className="text-gray-200">{habit.resistanceStyle}</p>
                      </>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div className="flex justify-end gap-2 p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // reset form and exit edit mode
                        setEditForm({
                          name: habit.name,
                          goalType: habit.goalType,
                          microGoal: habit.microGoal,
                          triggers: habit.triggers.join(', '),
                          resistanceStyle: habit.resistanceStyle,
                          cravingNarrative: habit.cravingNarrative || '',
                          motivationOverride: habit.motivationOverride || '',
                          reflectionDepthOverride: habit.reflectionDepthOverride?.toString() || '',
                          hitDefinition: habit.hitDefinition || '',
                          slipDefinition: habit.slipDefinition || '',
                        });
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleEditHabit}>
                      Save
                    </Button>
                  </div>
                )}
                <div className="p-4 bg-gray-700 rounded-lg">
                  <h3 className="font-medium text-white mb-2">Recent Activity</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedEvents.length > 0 && (
                      <div ref={confirmRef} onClick={(e) => e.stopPropagation()} className="flex items-center space-x-1 mb-2">
                        {confirmDeleteEvents ? (
                          <>
                            <Button variant="destructive" size="sm" onClick={() => { handleDeleteEvents(); setConfirmDeleteEvents(false); }}>Yes</Button>
                            <Button variant="outline" size="sm" onClick={() => setConfirmDeleteEvents(false)}>No</Button>
                          </>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setConfirmDeleteEvents(true); }}>
                            <Trash2 className="mr-1 h-4 w-4 text-red-600" />
                            Delete Selected ({selectedEvents.length})
                          </Button>
                        )}
                      </div>
                    )}
                    {habit.events.map((event) => (
                      <div key={event.id} className={cn(
                        "p-3 rounded-lg flex items-center justify-between",
                        selectedEvents.includes(event.id)
                          ? "bg-gray-600 border-gray-500"
                          : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                      )}>
                        <div>
                          <span className={cn(
                            "inline-block px-2 py-1 rounded-full text-sm font-medium",
                            event.type === 'HIT' ? "bg-green-600 text-green-200" : "bg-red-600 text-red-200"
                          )}>
                            {event.type}
                          </span>
                          <span className="text-gray-300 ml-2 text-sm">{new Date(event.timestamp).toLocaleString()}</span>
                        </div>
                        <Checkbox checked={selectedEvents.includes(event.id)} onCheckedChange={() => toggleSelect(event.id)} className="text-blue-400" />
                      </div>
                    ))}
                    {habit.events.length === 0 && (
                      <p className="text-center text-sm text-gray-400">No events recorded</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
} 