'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line
} from 'recharts';
import { Pencil, Trash2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Habit, HabitEvent } from '@/lib/types';

interface DetailedHabitCardProps {
  data: Habit;
  onRefresh: () => void;
}

function calculateCombo(events: HabitEvent[]) {
  if (!events?.length) return null;
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  let latestType = sorted[0].type;
  let count = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].type === latestType) count++;
    else break;
  }
  if (count < 2) return null;
  const color = latestType === 'HIT' ? 'text-green-700' : 'text-red-700';
  return <span className={color}>{`x${count}`}</span>;
}

function prepareChartData(events: HabitEvent[]) {
  if (!events?.length) return [];
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  let cum = 0;
  return sorted.map((ev) => {
    cum += ev.type === 'HIT' ? 1 : -1;
    return { name: new Date(ev.timestamp).toLocaleDateString(), cumulative: cum };
  });
}

export default function DetailedHabitCard({ data, onRefresh }: DetailedHabitCardProps) {
  const [hitCount, setHitCount] = useState(0);
  const [slipCount, setSlipCount] = useState(0);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [confirmDeleteEvents, setConfirmDeleteEvents] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const evts = Array.isArray(data.events) ? data.events : [];
    setHitCount(evts.filter((e) => e.type === 'HIT').length);
    setSlipCount(evts.filter((e) => e.type === 'SLIP').length);
  }, [data.events]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        confirmDeleteEvents &&
        confirmRef.current &&
        !confirmRef.current.contains(event.target as Node)
      ) {
        setConfirmDeleteEvents(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [confirmDeleteEvents]);

  const combo = calculateCombo(data.events || []);
  const chartData = prepareChartData(data.events || []);
  const sortedEvents = [...(data.events || [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const toggleSelect = (id: string) => {
    setSelectedEvents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  async function handleDeleteSelectedEvents() {
    if (!selectedEvents.length) return;
    await fetch('/api/habits/events/delete-multiple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedEvents })
    });
    setSelectedEvents([]);
    onRefresh();
  }

  async function handleDeleteHabit() {
    await fetch('/api/habits', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: data.id })
    });
    onRefresh();
  }

  return (
    <Card
      className={cn('w-full max-w-sm transition-all duration-300 bg-gray-50', {
        'ring-2 ring-green-500': hitCount > slipCount,
        'ring-2 ring-red-500': slipCount > hitCount
      })}
    >
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{data.name}</CardTitle>
        <div className="flex items-center space-x-1">
          {combo}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-6 h-6">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {}}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleDeleteHabit}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Habit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="text-xs text-muted-foreground">{data.microGoal || 'No micro-goal set'}</div>
      </CardContent>
      <CardContent>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Line type="monotone" dataKey="cumulative" stroke="#8b5cf6" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <h4 className="text-sm font-medium">Goal Type</h4>
            <p>{data.goalType}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Resistance</h4>
            <p>{data.resistanceStyle}</p>
          </div>
          <div className="col-span-2">
            <h4 className="text-sm font-medium">Triggers</h4>
            <p>{data.triggers.join(', ')}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-2 px-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-muted-foreground">Recent Activity</span>
          {selectedEvents.length > 0 && (
            <div ref={confirmRef} onClick={(e) => e.stopPropagation()} className="flex items-center space-x-1">
              {confirmDeleteEvents ? (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-[10px] h-6"
                    onClick={() => {
                      handleDeleteSelectedEvents();
                      setConfirmDeleteEvents(false);
                    }}>
                    Yes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[10px] h-6"
                    onClick={() => setConfirmDeleteEvents(false)}>
                    No
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteEvents(true); }}>
                  <Trash2 className="mr-1 h-3 w-3" />
                  {selectedEvents.length}
                </Button>
              )}
            </div>
          )}
        </div>
        <ScrollArea className="h-24">
          <div className="space-y-0.5">
            {sortedEvents.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className={cn(
                  "flex items-center gap-1.5 py-1 text-[10px] rounded-sm hover:bg-muted/50 px-1",
                  selectedEvents.includes(event.id) && "bg-muted"
                )}>
                <Checkbox
                  className="h-3 w-3"
                  checked={selectedEvents.includes(event.id)}
                  onCheckedChange={() => toggleSelect(event.id)}
                />
                <span
                  className={cn(
                    "inline-flex items-center rounded-sm px-1 py-0.5 font-medium min-w-[32px] justify-center",
                    event.type === 'HIT' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                  {event.type}
                </span>
                <span className="text-muted-foreground min-w-[85px]">
                  {format(new Date(event.timestamp), 'MMM d, h:mm a')}
                </span>
              </div>
            ))}
            {sortedEvents.length === 0 && (
              <div className="py-2 text-[10px] text-muted-foreground text-center">
                No events recorded
              </div>
            )}
          </div>
        </ScrollArea>
      </CardFooter>
    </Card>
  );
} 