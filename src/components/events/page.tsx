
'use client'

import { useState, useEffect } from 'react';
import Events from "@/components/Events"
import Navbar from "@/app/component/Navbar"

import { Habit } from "@prisma/client"

export default function EventsHome() {

  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allEvents, setAllEvents] = useState<object[]>([]);
  const [newList, setNewList] = useState()


  const fetchHabits = async () => {
    console.log('ran')
    try {
      const response = await fetch('/api/habits');
      if (!response.ok) {
        throw new Error('Failed to fetch habits');
      }
      const data = await response.json();


      setHabits(data)

    

      



    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    const newEvent =  habits.flatMap(habit =>
      habit.events.map(event => ({
        ...event,
        habitName: habit.title,
      }))
    );
    console.log(newEvent)
    
    
    setAllEvents(newEvent)
  }, [habits]);



  const [selectedEvents, setSelectedEvents] = useState<string[]  >([]);

  const toggleSelect = (id: string) => {
   
    setSelectedEvents(prev =>
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    );
  };
  console.log(selectedEvents)

  const handleDelete = async () => {
    try {
      console.log("hit1")
      const res = await fetch('/api/habits/events/delete-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedEvents }),
      });
  
      const result = await res.json();
      console.log(result);
  
      // Optionally refresh UI
      fetchHabits();
    } catch (error) {
     
    }
  };
  



  return (

   
<>
        <Navbar />
      
      <div className="my-15 sticky top-0 bg-gray-600 z-50 shadow p-4 items-right flex">
        
        

       
          <button class="bg-blue-300 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow"
            onClick={handleDelete}>
            Delete Selected
          </button>
          <h1 className="text-3xl text-center mx-140 ">All events data</h1>
      </div>
       <div className='bg-gray-500'>
          <Events events={allEvents} toggle={toggleSelect} selected={selectedEvents}  />
          </div>
     </>
  )
}
