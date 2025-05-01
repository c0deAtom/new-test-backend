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

  const toggleSelect = (id: string) => {
    setSelectedEvents(prev =>
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    );
  };

  const handleDeleteSelectedEvents = async () => {
    if (selectedEvents.length === 0) return;
    try {
      const res = await fetch('/api/habits/events/delete-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedEvents }),
      });
      if (res.ok) {
        onRefresh();
        setSelectedEvents([]); // Clear selection
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

  const recordEvent = async (type: 'HIT' | 'SLIP') => {
     console.log("Recording event:", type, "for habit:", data.id);
    try {
      const response = await fetch(`/api/habits/${data.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      console.log("API Response:", response);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Failed to record event. Status:", response.status, "Body:", errorBody);
        throw new Error(`Failed to record event: ${response.statusText}`);
      }

      const newEvent = await response.json(); // Assuming API returns the created event

      // Trigger refresh after successful recording
      onRefresh();

      // Trigger question prompt if handler exists
      if (onTriggerQuestion) {
        if (newEvent && newEvent.id) {
          console.log(`Triggering question prompt for event ID: ${newEvent.id}...`);
          onTriggerQuestion(data.id, type, newEvent.id, data.name); // Pass eventId and name
        } else {
          console.warn("Could not get event ID from response, cannot trigger question.");
        }
      }

    } catch (error) {
      console.error('Error recording event:', error);
      // TODO: Show user feedback about the error
    }
  };


  return (
    <Card
      ref={divRef}
      style={ dynamicBoxShadow ? { boxShadow: dynamicBoxShadow } : undefined }
      className={clsx(
        "w-full max-w-sm transition-all duration-300 ",
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
        <div className="flex items-center space-x-1">
          {combo} {/* Display calculated combo */}
          {/* Edit/Delete Dropdown */} 
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
             <DropdownMenuContent align="end">
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
                    <AlertDialogContent>
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
                            onClick={() => handleDeleteHabitConfirmed(data.id)}
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
      </CardHeader>
      <CardContent className="pb-3">
        <div className="text-xs text-muted-foreground">
          {data.microGoal || 'No micro-goal set'}
        </div>
        <div className="flex justify-around items-center pt-4">
          {/* Hit Button */}
          <Button
            variant="outline"
            size="lg" // Make buttons larger
            className="flex-1 mr-2 border-green-500 text-green-700 hover:bg-green-100 hover:text-green-800"
            onClick={(e) => {
              e.stopPropagation(); 
              recordEvent('HIT');
            }}
          >
            <Check className="mr-2 h-5 w-5" /> Hit ({hitCount})
          </Button>

          {/* Slip Button */}
          <Button
            variant="outline"
            size="lg" // Make buttons larger
            className="flex-1 ml-2 border-red-500 text-red-700 hover:bg-red-100 hover:text-red-800"
            onClick={(e) => {
              e.stopPropagation();
              recordEvent('SLIP');
            }}
          >
             <X className="mr-2 h-5 w-5" /> Slip ({slipCount})
          </Button>
        </div>
      </CardContent>

      <CardContent className="border-t pt-2 px-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <span className="h-6 text-[10px] font-medium text-muted-foreground">Recent Activity</span>
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
        
        <ScrollArea className="h-24">
          <div className="space-y-0.5">
            {data.events
              ?.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 5)
              .map((event) => (
              <div
                key={event.id}
                className={cn(
                  "flex items-center gap-1.5 py-1 text-[10px] rounded-sm hover:bg-muted/50 px-1 gap-6",
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
            {(!data.events || data.events.length === 0) && (
              <div className="py-2 text-[10px] text-muted-foreground text-center">
                No events recorded
              </div>
            )}
          </div>
        </ScrollArea>
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
