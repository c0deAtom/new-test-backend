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


 
      

  return (
    <div>
   <Navbar />
   <div className="p-30 flex flex-wrap gap-30 justify-center items-center ">
    <div onClick={() => setIsOpen(true)}>
   <HabitCard />
   </div>
   <HabitCard />
 

   {addNewHabit && (
   <div className='bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-3 shadow-sm w-70 h-70'>
    <div className="ml-auto mx-3">
          <CrossCloseButton  onClick={() => (setAddNewHabit(false))}></CrossCloseButton>
          </div>
    <AddHabitForm onSubmit={() => setAddNewHabit(false)}/></div>
    )}



   <ButtonIcon onClick={() => setAddNewHabit(true)}  />








   </div >
   <div  >
 <HabitDrawer openValue={isOpen} onClose={setIsOpen}/>
 </div>
   </div>
  );
}
