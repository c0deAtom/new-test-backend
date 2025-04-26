'use client'

import Image from "next/image";
import Navbar from "@/components/Navbar"
import HabitCard from "@/components/HabitCard"
import { ButtonIcon } from "@/components/Button";
import { useState } from "react";
import { Divide } from "lucide-react";
import AddHabitForm from "@/components/AddHabitForm";

export default function Habits() {
    const [addNewHabit, setAddNewHabit] = useState<boolean>(false)

  return (
    <div>
   <Navbar />
   <div className="p-30 flex flex-wrap gap-30 justify-center items-center ">
   <HabitCard />
   <HabitCard />
 

   {addNewHabit && (<AddHabitForm onSubmit={() => setAddNewHabit(false)}/>)}



   <ButtonIcon onClick={() => setAddNewHabit(true)} />






   </div>
   </div>
  );
}
