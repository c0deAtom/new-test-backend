'use client';

import { useState, useEffect } from 'react';


import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
// import { Habit } from '@prisma/client'; // Removed unused import

type Event = {
  id: string;
  type: 'hit' | 'slip';
  notes: string | null;
  createdAt: string;
  habitName: string
};



export default function EventsTable({ events, toggle, selected, }: { events: Event[], toggle: (id: string) => void, selected: string[], }) {


   

  return (
<div>
    <Table className='text-1xl '>

      <TableCaption>A list of your recent Events.</TableCaption>
      <TableHeader className=''>
        <TableRow className=''>
         
        </TableRow>
      </TableHeader>
      <TableBody >
        {events.map((event: any) => (
          <TableRow key={event.id} className="" >
              <input className='mx-7 my-3 w-5 h-5'
                type="checkbox"
                checked={selected.includes(event.id)}
                onChange={() => toggle(event.id)}
              />
            
            <TableCell>{event.habitName || "—"}</TableCell>
            <TableCell>   <span
        className={
          event.type === "hit"
            ? "text-green-300 font-bold"
            : "text-red-400 font-bold"
        }
      >
        {event.type}
      </span></TableCell>
            <TableCell>{event.notes || "—"}</TableCell>

            <TableCell className="text-center">
              {new Date(event.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell><div >{event.id}</div></TableCell>
          </TableRow>
        ))}
      </TableBody>
     
    </Table>
    </div>
  );
}
