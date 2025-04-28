'use client'

import Image from "next/image";
import Navbar from "@/components/Navbar"
import HabitCard, { HabitEvent } from "@/components/HabitCard"
import { ButtonDownAero, ButtonIcon, CrossCloseButton } from "@/components/Button";
import { useState, useEffect, useRef } from "react";
import { Divide } from "lucide-react";
import AddHabitForm from "@/components/AddHabitForm";
import { HabitDrawer } from "@/components/HabitDrawer";

interface Habit {
  id: string;
  userId: string;
  name: string;
  goalType: string;
  microGoal: string;
  triggers: string[];
  cravingNarrative: string;
  resistanceStyle: string;
  motivationOverride: string;
  reflectionDepthOverride: number;
  hitDefinition: string;
  slipDefinition: string;
  event: HabitEvent
}

export default function Habits(data: Habit) {
    const [addNewHabit, setAddNewHabit] = useState<boolean>(false)
    const [isOpen, setIsOpen] = useState<boolean>(false)

   
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    // Function to toggle the cards when a card is clicked

    async function fetchHabits ()  {
      try {
        console.log("party")
        const res = await fetch('/api/habits');
        if (!res.ok) throw new Error('Failed to fetch habits');

        const data = await res.json();
        setHabits(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
     
  
      fetchHabits();
    }, []);
  
    if (loading) return <div>Loading habits...</div>;
    const toggleCards = (card) => {
      setIsBig(card);
    };
  


 
      

  return (
    <div>
   <Navbar />
   <div className="p-30 flex flex-wrap items-center gap-20 justify-center  bg-gray-400 h-full">
    
    { (

        habits.map((habit) => (
         
          <div onClick={() => setIsOpen(true)} key={habit.id} className="">
           <HabitCard data={habit} onRefresh={fetchHabits}/>
          </div>
         
        ))
      )}
   
   
 

   {addNewHabit && (
   <div className='bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-3 shadow-sm w-70 h-90'>
    <div className="ml-auto mx-3">
          <CrossCloseButton  onClick={() => (setAddNewHabit(false))}></CrossCloseButton>
          </div>
    <AddHabitForm onSubmit={() => setAddNewHabit(false)} onRefresh={fetchHabits}/></div>
    )}


<div className="flex my-40">
   <ButtonIcon  onClick={() => setAddNewHabit(true)}  />
   </div>







   </div >
   <div  >
 <HabitDrawer openValue={isOpen} onClose={setIsOpen} />
 </div>
   </div>
  );
}
