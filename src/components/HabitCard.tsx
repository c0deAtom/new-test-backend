'use client'

// import { ButtonDownAero, ButtonIcon } from "@/components/Button"; // Removed custom button imports
import { Pencil, Trash2, Check, X, MoreVertical, Plus } from "lucide-react"; // Added icons
import { useState, useEffect, useRef } from "react";
import EventTable from "./events/Events";
import { Habit, HabitEvent } from "@/lib/types";
import { HabitDrawer } from "./HabitDrawer";
import { clsx } from 'clsx';
import { Button } from "@/components/ui/button"; // Use shadcn Button directly
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"; // For edit/delete actions
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
} from "@/components/ui/alert-dialog" // For delete confirmation
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import React from "react"
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';

function calculateCombo(events: HabitEvent[]) {
  if (!events || events.length === 0) return null;

  const sortedEvents = [...events].sort((a, b) => {
    // Timestamps are strings, parse them
    const timestampA = new Date(a.timestamp).getTime();
    const timestampB = new Date(b.timestamp).getTime();
    return timestampB - timestampA;
  });

  let latestType = sortedEvents[0].type;
  let comboCount = 1;

  // Loop through the events to find consecutive occurrences of the same type
  for (let i = 1; i < sortedEvents.length; i++) {
    if (sortedEvents[i].type === latestType) {
      comboCount++; // Increment the combo count for consecutive same type
    } else {
      break; // Break the loop if the type changes (streak is broken)
    }
  }

  // Determine combo color based on the event type
  let comboColor = latestType === 'HIT' ? 'green' : 'red'; // Assuming 'HIT' is green and 'SLIP' is red

  // Return JSX element if combo count is 2 or more
  if (comboCount >= 2) {
    // Ensure comboColor is a valid Tailwind text color class part
    const colorClass = comboColor === 'green' ? 'text-green-700' : 'text-red-700'; 
    return <div className={colorClass}>x{comboCount}</div>;
  }

  return null;
}

export default function HabitCard({ data, onRefresh, onTriggerQuestion }: {
  data: Habit;
  onRefresh: () => void;
  onTriggerQuestion?: (habitId: string, type: "HIT" | "SLIP", eventId: string, habitName: string) => void;
}) {
  // const [showMenu, setShowMenu] = useState(false) // Replaced by DropdownMenu
  const [expand, setExpand] = useState(false) // Keep expand state for now
  const divRef = useRef<HTMLDivElement>(null)
  const [hitCount, setHitCount] = useState(0);
  const [slipCount, setSlipCount] = useState(0);

  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [confirmDeleteEvents, setConfirmDeleteEvents] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);
  const isHitDominant = hitCount >= slipCount;
  const [mess, setMess] = useState("")
  // const [showConfirm, setShowConfirm] = useState(false); // Replaced by AlertDialog
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // State for edit drawer
  const [combo, setCombo] = useState<React.ReactNode>(null);
  // Inline reflection state
  const [reflectEvent, setReflectEvent] = useState<{ eventId: string; type: 'HIT'|'SLIP' } | null>(null);
  const [reflectionAnswer, setReflectionAnswer] = useState('');
  const [reflectParticles, setReflectParticles] = useState<{ id: string; char: string }[]>([]);
  const [hideReflectInput, setHideReflectInput] = useState(false);
  const [questionParticles, setQuestionParticles] = useState<{ id: string; char: string }[]>([]);
  const [showReflectQuestionText, setShowReflectQuestionText] = useState(false);
  // Particles for the inline question eruption
  const [questionRemoveTriggered, setQuestionRemoveTriggered] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);

  // Local events state for immediate UI updates
  const [localEvents, setLocalEvents] = useState<HabitEvent[]>(data.events || []);

  // Determine inline reflection question based on event type
  const reflectQuestion = reflectEvent
    ? reflectEvent.type === 'HIT'
      ? 'What   went   well   that   led   to        this   success?'
      : 'What  challenges  did  you  face?   Any   insights?'
    : '';

  const toggleSelect = (id: string) => {
    setSelectedEvents(prev =>
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    );
  };

  const handleDeleteSelectedEvents = async () => {
    if (selectedEvents.length === 0) return;
    // Immediately remove selected events from UI
    setLocalEvents(prev => prev.filter(ev => !selectedEvents.includes(ev.id)));
    // Clear selection
    setSelectedEvents([]);
    try {
      const res = await fetch('/api/habits/events/delete-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedEvents }),
      });
      if (res.ok) {
        onRefresh();
      } else {
        console.error("Failed to delete events");
      }
    } catch (error) {
      console.error('Error deleting events:', error);
    }
  };

  useEffect(() => {
    const currentEvents = Array.isArray(data.events) ? data.events : [];
    const hits = currentEvents.filter(event => event.type === 'HIT').length;
    const slips = currentEvents.filter(event => event.type === 'SLIP').length;
    setHitCount(hits);
    setSlipCount(slips);
    const comboResult = calculateCombo(currentEvents);
    setCombo(comboResult);
  }, [data.events]);

  // Compute numeric combo streak for shading
  const streakCount = React.useMemo(() => {
    if (!data.events || data.events.length === 0) return 0;
    const sorted = [...data.events].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    let count = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].type === sorted[0].type) count++;
      else break;
    }
    return count;
  }, [data.events]);

  // Compute dynamic boxShadow based on combo streak
  const dynamicBoxShadow = React.useMemo(() => {
    // Only apply if there's a streak of at least 2
    if (streakCount < 2 || !data.events?.length) return undefined;
    // Determine latest event type for shadow color
    const sorted = [...data.events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latestType = sorted[0].type;
    const color = latestType === 'HIT' ? '34,197,94' : '239,68,68';
    const blur = 10 * streakCount;
    const spread = 5 * streakCount;
    return `0 0 ${blur}px ${spread}px rgba(${color}, 0.5)`;
  }, [streakCount, data.events]);

  // Detect clicks outside the confirm button group to cancel confirmation
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (confirmDeleteEvents && confirmRef.current && !confirmRef.current.contains(event.target as Node)) {
        setConfirmDeleteEvents(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [confirmDeleteEvents]);

  useEffect (() => { setReflectionAnswer('')}, [reflectEvent])

  // Renamed handleDelete to handleDeleteHabitConfirmed to avoid conflict
  async function handleDeleteHabitConfirmed(habitId: string) {
    try {
      const res = await fetch('/api/habits', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: habitId }),
      });
      if (res.ok) {
        console.log('Habit deleted successfully');
        onRefresh();
      } else {
        const errorData = await res.json();
        console.error('Failed to delete habit:', errorData.message);
      }
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  }

  // Spawn a particle for each new character in inline reflection
  const createReflectParticle = (char: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    setReflectParticles(prev => [...prev, { id, char }]);
  };

  const handleReflectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const added = newValue.slice(reflectionAnswer.length);
    added.split('').forEach(c => createReflectParticle(c));
    setReflectionAnswer(newValue);
  };

  const handleReflectSubmit = async () => {
    if (!reflectEvent || !reflectionAnswer.trim()) return;
    try {
      const res = await fetch('/api/habits/events/reflect', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: reflectEvent.eventId, reflectionNote: reflectionAnswer })
      });
      if (!res.ok) throw new Error('Failed to save reflection');
      // hide the input field and clear particles
      setHideReflectInput(true);
      setTimeout(() => {
        setReflectParticles([]);
        setQuestionParticles([]);
        setHideReflectInput(false);
        setReflectEvent(null);
        onRefresh();
      }, 300);
    } catch (error) {
      console.error('Reflection error:', error);
    }
  };

  // Modify the event recorder to open inline reflection
  function recordEvent(type: 'HIT' | 'SLIP') {
    // Prevent triggering multiple reflection questions
    if (reflectEvent) return;
    // Optimistic UI: add a temporary event
    const tempId = 'temp-' + Date.now();
    const tempEvent: HabitEvent = {
      id: tempId,
      habitId: data.id,
      userId: data.userId,
      type,
      timestamp: new Date().toISOString(),
      emotionTags: [],
      isReversal: false
    };
    setLocalEvents(prev => [tempEvent, ...prev]);
    // Optimistically update hit/slip count
    if (type === 'HIT') {
      setHitCount(prev => prev + 1);
    } else {
      setSlipCount(prev => prev + 1);
    }
    // disable buttons while request is in-flight
    setIsFrozen(true);
    fetch(`/api/habits/${data.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(errBody => {
            console.error("Failed to record event. Status:", response.status, "Body:", errBody);
            throw new Error(`Failed to record event: ${response.statusText}`);
          });
        }
        return response.json();
      })
      .then(newEvent => {
        // Replace temporary event with persisted event
        setLocalEvents(prev => [newEvent, ...prev.filter(ev => ev.id !== tempId)]);
        // refresh datax
        onRefresh();
        // Directly set reflectEvent without triggering question
        setReflectEvent({ eventId: newEvent.id, type });
      })
      .catch(error => {
        console.error('Error recording event:', error);
        // Revert the optimistic update in case of error
        if (type === 'HIT') {
          setHitCount(prev => prev - 1);
        } else {
          setSlipCount(prev => prev - 1);
        }
        // Remove temporary event on error
        setLocalEvents(prev => prev.filter(ev => ev.id !== tempId));
      })
      .finally(() => {
        // re-enable buttons
        setIsFrozen(false);
      });
  }

  // Emit question particles on panel open
  const emitQuestionParticles = () => {
    setQuestionParticles([]);
    reflectQuestion.split('').forEach((char: string) => {
      setQuestionParticles(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, char }]);
    });
  };

  // Emit question particles on panel open
  useEffect(() => {
    if (reflectEvent) {
      emitQuestionParticles();
    } else {
      setQuestionParticles([]);
    }
  }, [reflectEvent, reflectQuestion]);

  // Show static question after animation completes
  useEffect(() => {
    if (reflectEvent) {
      setShowReflectQuestionText(false);
      const timer = setTimeout(() => setShowReflectQuestionText(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowReflectQuestionText(false);
    }
  }, [reflectEvent, reflectQuestion]);

  // Sync local events when data.events prop changes
  useEffect(() => {
    setLocalEvents(data.events || []);
  }, [data.events]);

  return (
    <Card
      ref={divRef}
      style={ dynamicBoxShadow ? { boxShadow: dynamicBoxShadow } : undefined }
      className={clsx(
        "w-80 transition-all duration-300",
        {
          "ring-2 ring-green-500": isHitDominant && combo && hitCount > slipCount,
          "ring-2 ring-red-500": !isHitDominant && combo && slipCount > hitCount,
        }
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {data.name}
        </CardTitle>
        <div className="flex items-center space-x-1 text-2xl font-bold">
          {combo} {/* Display calculated combo */}
          {/* Edit/Delete Dropdown */} 
          <div className="no-open">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-6 h-6"
                  onClick={(e) => e.stopPropagation()}
                >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Habit options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDrawerOpen(true);
                  }}
                >
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                 {/* Delete Habit Confirmation */} 
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem 
                            onSelect={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            className="text-red-600 focus:text-red-700 focus:bg-red-100"
                        >
                           <Trash2 className="mr-2 h-4 w-4" />
                           <span>Delete Habit</span>
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the habit
                            '{data.name}' and all its associated events.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteHabitConfirmed(data.id);
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="text-xs text-muted-foreground">
          {data.microGoal || 'No micro-goal set'}
        </div>
        <div className="no-open flex justify-around items-center pt-4 ">
          {/* Hit Button */}
          <Button
            variant="outline"
            size="lg"
            className="flex-1 mr-2 border-green-500 text-green-700 hover:bg-green-100 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={(e) => { e.stopPropagation(); recordEvent('HIT'); }}
            disabled={isFrozen || !!reflectEvent}
          >
           
            <Check className="mr-2 h-5 w-5" /> Hit ({hitCount})
          </Button>
<div className="w-4">
  {isFrozen && (
    <div className="flex items-center justify-center">
      <div
        className={`animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 ${
          reflectEvent?.type === 'HIT' ? 'border-green-500' : 'border-red-500'
        }`}
      ></div>
    </div>
  )}
</div>

          {/* Slip Button */}
          <Button
            variant="outline"
            size="lg"
            className="flex-1 ml-2 border-red-500 text-red-700 hover:bg-red-100 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={(e) => { e.stopPropagation(); recordEvent('SLIP'); }}
            disabled={isFrozen || !!reflectEvent}
          >
             <X className="mr-2 h-5 w-5" /> Slip ({slipCount})
          </Button>
        </div>

      <div className="w-full h-18">
        {/* Inline reflection input */}
        {reflectEvent && (
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: 0 }}
            className="relative overflow-visible w-full  rounded  no-open"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Combined particle vault */}
            <div className="relative w-60 h-12 overflow-visible">
              {/* Reflect input particles */}
             
              {/* Question text */}
              <div className="flex flex-wrap justify-center relative z-10">
                {questionParticles.map((p) => (
                  <motion.span
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="inline-block mx-[1px] text-sm font-bold text-yellow-900"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {p.char}
                  </motion.span>
                ))}
              </div>
            </div>
            {!hideReflectInput && (
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  id="inline-reflect"
                  value={reflectionAnswer}
                  onChange={handleReflectChange}
                  className="w-50 border rounded-md px-3  text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  onClick={(e) => e.stopPropagation()}
                />
                {reflectionAnswer.trim() ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-1 py-1 text-xs font-medium w-9 text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => {
                      handleReflectSubmit();
                      // Clear the textarea after submit
                    }}
                  >
                    OK
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-1 py-1 text-xs font-medium text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => {
                      setTimeout(() => {
                        setReflectParticles([]);
                        setQuestionParticles([]);
                        setHideReflectInput(false);
                        setReflectEvent(null);
                        onRefresh();
                      }, 300);
                    }}
                  >
                    Skip
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}
        </div>
      </CardContent>

      <CardContent className="border-t pt-2 px-3 relative" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <span className="h-6 text-[10px] font-medium text-muted-foreground"> {isFrozen ? (
            <div className="absolute inset-0 mr-auto">
              <div className="animate-spin rounded-full mx-10 my-2 h-3 w-3 border-t-2 border-b-2 border-gray-500"></div>
            </div>
          ) : (
            'Recent Activity'
          )}
        </span>
          {selectedEvents.length > 0 && (
            <div ref={confirmRef} onClick={(e) => e.stopPropagation()} className="h-6 flex items-center space-x-1">
              {confirmDeleteEvents ? (
                <>
                  <Button variant="destructive" size="sm" className="text-[10px] h-6" onClick={() => { handleDeleteSelectedEvents(); setConfirmDeleteEvents(false); }}>Yes</Button>
                  <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={() => setConfirmDeleteEvents(false)}>No</Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteEvents(true); }}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  {selectedEvents.length}
                </Button>
              )}
            </div>
          )}
        </div>
        
        <div className="relative">
         
            <ScrollArea className="h-28">
              <div className="space-y-0.5">
                {localEvents
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 3)
                  .map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "flex items-center gap-1.5 py-1 text-[10px] rounded-sm hover:bg-muted/50 px-1 gap-6 ",
                      selectedEvents.includes(event.id) && "bg-muted"
                    )}
                  >
                    <Checkbox
                      className="h-3 w-3"
                      checked={selectedEvents.includes(event.id)}
                      onCheckedChange={() => {
                        setSelectedEvents(prev =>
                          prev.includes(event.id)
                            ? prev.filter(id => id !== event.id)
                            : [...prev, event.id]
                        )
                      }}
                    />
                    <span className={cn(
                      "h-5 w-20 inline-flex items-center rounded-sm px-1 py-0.5 font-medium min-w-[32px] justify-center",
                      event.type === 'HIT' 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    )}>
                      {event.type}
                    </span>
                    <span className="text-muted-foreground text-lg min-w-[85px]">
                      {format(new Date(event.timestamp), 'MMM d, h:mm a')}
                    </span>
                  </div>
                ))}
                {localEvents.length === 0 && (
                  <div className="py-2 text-[10px] text-muted-foreground text-center">
                    No events recorded
                  </div>
                )}
              </div>
            </ScrollArea>
         
         
        </div>
      </CardContent>

      {/* Edit Drawer */}
       <HabitDrawer 
        isOpen={isDrawerOpen} 
        setIsOpen={setIsDrawerOpen} 
        habitData={data} 
        onHabitUpdated={onRefresh} 
      />
    </Card>
  );
}
