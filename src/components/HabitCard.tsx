'use client'

import { ButtonDownAero, ButtonIcon } from "@/components/Button";
import { Pencil, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { EventTable } from "./EventTable";
import { HabitEvent } from "@/app/dashboard/page";
import { HabitDrawer } from "./HabitDrawer";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"


  export type Habit = {
    id: string;
    userId: string;
    name: string;
    goalType?: string;              // "reduce" | "eliminate" (optional)
    microGoal?: string;
    triggers: string[];             // array of strings like ['evening', 'stress']
    cravingNarrative?: string;
    resistanceStyle?: string;
    motivationOverride?: string;
    reflectionDepthOverride?: number;
    hitDefinition?: string;
    slipDefinition?: string;
    createdAt: string;              // usually ISO date string from server
    updatedAt: string;
    events: HabitEvent

  };
  
  

export default function HabitCard({ data, onRefresh, onTriggerQuestion }: { 
  data: Habit;
  onRefresh: () => void;
  onTriggerQuestion?: (habitId: string, type: "HIT" | "SLIP") => void;

})  {
const [showMenu, setShowMenu] = useState(false)
const [expand, setExpand] = useState(false)
const divRef = useRef<HTMLDivElement>(null)
const [hitCount, setHitCount] = useState(0);
const [slipCount, setSlipCount] = useState(0);

const [selectedEvents, setSelectedEvents] = useState<string[]  >([]);


const toggleSelect = (id: string) => {
   
  setSelectedEvents(prev =>
    prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
  );
};

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
    onRefresh();
  } catch (error) {
   
  }
};


useEffect(() => {
  // Count hits and slips from events
  const hits = data.events.filter(event => event.type === 'hit').length;
  const slips = data.events.filter(event => event.type === 'slip').length;
  setHitCount(hits);
  setSlipCount(slips);
}, [data.events]);

useEffect(() => {
  onRefresh()
}, [expand])



useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (divRef.current && !divRef.current.contains(event.target as Node)) {
      setExpand(false);
      setShowMenu(false)
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);



async function handleDeleteHabit(habitId: string) {
  
  const confirmed = confirm('Are you sure you want to delete this habit?');
  if (!confirmed) return;

  try {
    console.log("sdddd")
    const res = await fetch('/api/habits', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: habitId }),
    });

    

   

    if (res.ok) {
      console.log('Habit deleted successfully');
      onRefresh()

   
    
      
      // Optionally, refresh the habits list here
    } else {
      const errorData = await res.json();
      console.error('Failed to delete habit:', errorData.message);
    }
  } catch (error) {
    console.error('Error deleting habit:', error);
  }
}






const recordEvent = async (type: 'hit' | 'slip') => {
  console.log("htislip")
  try {

    
    // Show random message based on type
   

    console.log("tested")

    const response = await fetch(`/api/habits/${data.id}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }),
    });
    console.log(response)
   
   
    if (!response.ok) {
      throw new Error('Failed to record event');
    }

    // Update counts immediately
    if (type === 'hit') {
      setHitCount(prev => prev + 1);
      onTriggerQuestion(data.id, "HIT")
      
      
    } else {
      setSlipCount(prev => prev + 1);
      onTriggerQuestion(data.id, "SLIP")
      
    }

    

    

    // Hide message after 3 seconds
    setTimeout(() => {
     
    }, 3000);
  } catch (error) {
    console.error('Error recording event:', error);
  }
};





  return (
    <Card>
      
      
      <CardHeader>
      



        <div className="ml-auto">
          <button
            onClick={() => handleDeleteHabit(data.id)} 
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
          
          </button>
          </div>
    


      <CardTitle>{data.name}</CardTitle>
    
     
      <CardDescription></CardDescription>
     
    </CardHeader>
    <CardContent>
   
   
      <p>Card Content</p>
    </CardContent>
   
    <CardFooter className="flex justify-between">
       
       <div className="flex flex-col items-center">
         <button
           onClick={(e) => {
             e.stopPropagation(); // Prevents the card click event
             recordEvent('hit');
           }}

           className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
         >
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
           </svg>
         </button>
         <span className="mt-3 text-2xl font-bold text-green-700">{hitCount}</span>
         <span className="text-sm text-gray-500">Hits</span>
       </div>

      

       <div className="flex flex-col items-center">
         <button
           onClick={(e) => {
             e.stopPropagation();
             recordEvent('slip');
           }}
           className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
         >
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
           </svg>
         </button>
         <span className="mt-3 text-2xl font-bold text-red-700">{slipCount}</span>
         <span className="text-sm text-gray-500">Slips</span>
       </div>
       
       
   

   
    
    
    </CardFooter>
    
    <div ref={divRef}>
   
    <div className=" flex items-center justify-between ">
    {expand && ( <button className="flex items-center gap-2 px-10 py-2 text-sm text-red-600 hover:bg-red-100"
            onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </button>)
     }
     <div className="ml-auto p-4">
      <ButtonDownAero onClick={(e: any) => {
      e.stopPropagation(); // ⬅️ this stops the div click
      setExpand(prev => !prev)
    }}></ButtonDownAero>
    </div>

     
      </div >
    {expand && (
       <div className="mx-4 w-62 h-40 overflow-y-auto bg-gray-100 border rounded shadow">
      <EventTable eventData={data.events} toggle={toggleSelect} selected={selectedEvents}/>
     
     </div>
      )}
      </div>
     
       
      
  </Card>
  
  );
}
