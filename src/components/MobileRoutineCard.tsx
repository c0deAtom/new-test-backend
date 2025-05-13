'use client'

import { Pencil, Trash2, Check, X, MoreVertical, Loader } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Habit, HabitEvent } from "@/lib/types";
import { HabitDrawer } from "./HabitDrawer";
import { clsx } from 'clsx';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import React from "react"
import { motion } from 'framer-motion';

interface MobileRoutineCardProps {
  data: Habit;
  onRefresh: () => void;
  view?: 'icon' | 'list' | 'big';
  isProcessing?: {
    isDeleting?: boolean;
    isUpdating?: boolean;
    isCompleting?: boolean;
  };
  onDelete: () => Promise<void>;
  onUpdate: (updates: Partial<Habit>) => Promise<void>;
  onComplete: (completed: boolean) => Promise<void>;
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

  let comboColor = latestType === 'HIT' ? 'green' : 'red';

  if (comboCount >= 2) {
    const colorClass = comboColor === 'green' ? 'text-green-700' : 'text-red-700'; 
    return <div className={colorClass}>x{comboCount}</div>;
  }

  return null;
}

export function MobileRoutineCard({ data, onRefresh, view = 'icon', isProcessing, onDelete, onUpdate, onComplete }: MobileRoutineCardProps) {
  const [hitCount, setHitCount] = useState(0);
  const [slipCount, setSlipCount] = useState(0);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [confirmDeleteEvents, setConfirmDeleteEvents] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);
  const isHitDominant = hitCount >= slipCount;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [combo, setCombo] = useState<React.ReactNode>(null);
  const [reflectEvent, setReflectEvent] = useState<{ eventId: string; type: 'HIT'|'SLIP' } | null>(null);
  const [reflectionAnswer, setReflectionAnswer] = useState('');
  const [reflectParticles, setReflectParticles] = useState<{ id: string; char: string }[]>([]);
  const [hideReflectInput, setHideReflectInput] = useState(false);
  const [questionParticles, setQuestionParticles] = useState<{ id: string; char: string }[]>([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [localEvents, setLocalEvents] = useState<HabitEvent[]>(data.events || []);

  const reflectQuestion = reflectEvent
    ? reflectEvent.type === 'HIT'
      ? 'What   went   well   that   led   to        this   success?'
      : 'What  challenges  did  you  face?   Any   insights?'
    : '';

  useEffect(() => {
    const currentEvents = Array.isArray(data.events) ? data.events : [];
    const hits = currentEvents.filter(event => event.type === 'HIT').length;
    const slips = currentEvents.filter(event => event.type === 'SLIP').length;
    setHitCount(hits);
    setSlipCount(slips);
    const comboResult = calculateCombo(currentEvents);
    setCombo(comboResult);
  }, [data.events]);

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

  const dynamicBoxShadow = React.useMemo(() => {
    if (streakCount < 2 || !data.events?.length) return undefined;
    const sorted = [...data.events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latestType = sorted[0].type;
    const color = latestType === 'HIT' ? '34,197,94' : '239,68,68';
    const blur = 10 * streakCount;
    const spread = 5 * streakCount;
    return `0 0 ${blur}px ${spread}px rgba(${color}, 0.5)`;
  }, [streakCount, data.events]);

  async function handleDeleteHabitConfirmed(habitId: string) {
    try {
      const res = await fetch('/api/habits', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: habitId }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  }

  function recordEvent(type: 'HIT' | 'SLIP') {
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
    if (type === 'HIT') {
      setHitCount(prev => prev + 1);
    } else {
      setSlipCount(prev => prev + 1);
    }
    setIsFrozen(true);
    fetch(`/api/habits/${data.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
      .then(response => response.json())
      .then(newEvent => {
        setLocalEvents(prev => [newEvent, ...prev.filter(ev => ev.id !== tempId)]);
        onRefresh();
        setReflectEvent({ eventId: newEvent.id, type });
      })
      .catch(error => {
        console.error('Error recording event:', error);
        if (type === 'HIT') {
          setHitCount(prev => prev - 1);
        } else {
          setSlipCount(prev => prev - 1);
        }
        setLocalEvents(prev => prev.filter(ev => ev.id !== tempId));
      })
      .finally(() => {
        setIsFrozen(false);
      });
  }

  return (
    <Card
      style={dynamicBoxShadow ? { boxShadow: dynamicBoxShadow } : undefined}
      className={clsx(
        "mb-4 mt-1 bg-yellow-100 shadow-md rounded-md min-h-60 w-full max-w-md mx-auto aspect-square transition-all duration-300",
        view === 'big' && 'scale-105',
        view === 'list' && 'aspect-auto min-h-32',
        {
          "ring-2 ring-green-500": isHitDominant && combo && hitCount > slipCount,
          "ring-2 ring-red-500": !isHitDominant && combo && slipCount > hitCount,
        }
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-2 pt-2">
        <CardTitle className="text-base font-bold truncate max-w-[70%] text-gray-800">
          {data.name || <span className="text-gray-400">Untitled</span>}
        </CardTitle>
        <div className="flex items-center space-x-1 text-lg font-bold">
          {combo}
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
      <CardContent className="flex flex-col gap-2 p-2 pt-0 flex-1 justify-between">
        <div className="text-xs text-muted-foreground mb-1 min-h-[18px]">
          {data.microGoal || <span className="text-gray-300">No micro-goal set</span>}
        </div>
        <div className="flex flex-row gap-2 items-center justify-between w-full mt-1 mb-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-green-500 text-green-700 hover:bg-green-100 hover:text-green-800 h-8 px-2 text-xs"
            onClick={(e) => { e.stopPropagation(); recordEvent('HIT'); }}
            disabled={isFrozen}
          >
            <Check className="mr-1 h-4 w-4" /> Hit ({hitCount})
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-red-500 text-red-700 hover:bg-red-100 hover:text-red-800 h-8 px-2 text-xs"
            onClick={(e) => { e.stopPropagation(); recordEvent('SLIP'); }}
            disabled={isFrozen}
          >
            <X className="mr-1 h-4 w-4" /> Slip ({slipCount})
          </Button>
        </div>
        <div className="border-t pt-1 px-0 mt-1">
          <div className="flex items-center justify-between mb-1">
            <span className="h-6 text-[10px] font-medium text-muted-foreground">
              {isFrozen ? (
                <div className="absolute inset-0 mr-auto">
                  <div className="animate-spin rounded-full mx-10 my-2 h-3 w-3 border-t-2 border-b-2 border-gray-500"></div>
                </div>
              ) : (
                'Recent Activity'
              )}
            </span>
          </div>
          <ScrollArea className="h-16">
            <div className="space-y-0.5">
              {localEvents
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 3)
                .map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "flex items-center gap-1.5 py-1 text-[10px] rounded-sm hover:bg-muted/50 px-1 gap-6",
                      selectedEvents.includes(event.id) && "bg-muted"
                    )}
                  >
                    <span className={cn(
                      "h-5 w-20 inline-flex items-center rounded-sm px-1 py-0.5 font-medium min-w-[32px] justify-center",
                      event.type === 'HIT' 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    )}>
                      {event.type}
                    </span>
                    <span className="text-muted-foreground text-xs min-w-[70px]">
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
      <HabitDrawer 
        isOpen={isDrawerOpen} 
        setIsOpen={setIsDrawerOpen} 
        habitData={data} 
        onHabitUpdated={onRefresh} 
      />
    </Card>
  );
}