import Image from "next/image";
import Navbar from "@/components/Navbar"
import HabitCard from "@/components/HabitCard";
import { ButtonIcon } from "@/components/Button";

export default function DashBoard() {
  return (
    <div >
   <Navbar />
   <div className="flex justify-center w-full h-full overflow-x-auto p-20 bg-gray-400">
   <div className="flex flex-wrap gap-4 justify-center border border-gray-300 rounded-lg p-4">
 

      <HabitCard />
      <HabitCard />
      <HabitCard />
   

    </div>
    <div className="flex flex-wrap gap-4 justify-center border border-gray-300 rounded-lg p-4 m-15 w-90 h-140">
 




</div>
   
   </div>
  
   </div>
  );
}
