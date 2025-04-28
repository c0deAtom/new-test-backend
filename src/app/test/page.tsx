'use client'

import Image from "next/image";
import Navbar from "@/components/Navbar"
import HabitCard from "@/components/HabitCard"
import { ButtonDownAero, ButtonIcon, CrossCloseButton } from "@/components/Button";
import { useState, useEffect, useRef } from "react";
import { Divide } from "lucide-react";
import AddHabitForm from "@/components/AddHabitForm";
import { HabitDrawer } from "@/components/HabitDrawer";

export default function Habits() {
    const [addNewHabit, setAddNewHabit] = useState<boolean>(false)
    const [isOpen, setIsOpen] = useState<boolean>(false)

    const handleCreateHabit = async () => {
      if (!name) return;
  
      try {
        const res = await fetch("/api/habits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, userId: "some-user-id" }),
        });
  
        if (!res.ok) throw new Error("Failed to create");
  
        const newHabit = await res.json();
        console.log("Habit Created:", newHabit);
        setTitle(""); // clear input
      } catch (error) {
        console.error(error);
      }
    };


 
      

  return (
    <div>
   <Navbar />
   <div className="p-30 flex flex-wrap gap-30 justify-center  bg-gray-400 h-200">
    <div onClick={() => setIsOpen(true)}>
   <HabitCard />
   </div>
   <HabitCard />
 

   {addNewHabit && (
   <div className='bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-3 shadow-sm w-70 h-90'>
    <div className="ml-auto mx-3">
          <CrossCloseButton  onClick={() => (setAddNewHabit(false))}></CrossCloseButton>
          </div>
    <AddHabitForm onSubmit={() => setAddNewHabit(false)}/></div>
    )}


<div className="flex my-40">
   <ButtonIcon  onClick={() => setAddNewHabit(true)}  />
   </div>







   </div >
   <div  >
 <HabitDrawer openValue={isOpen} onClose={setIsOpen}/>
 </div>
   </div>
  );
}
