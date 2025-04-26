"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer } from "recharts"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import HabitCard from "./HabitCard"
import { CrossCloseButton } from "./Button"

const data = [
  {
    goal: 400,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 239,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 349,
  },
]

export function HabitDrawer({openValue, onClose}) {
  const [goal, setGoal] = React.useState(350)
  console.log(openValue)


  function onClick(adjustment: number) {
    setGoal(Math.max(200, Math.min(400, goal + adjustment)))
  }

  return (
    <Drawer open={openValue}>
        
      <DrawerTrigger asChild>
        
     
      </DrawerTrigger>
      
      <DrawerContent>
        <div className="ml-auto mx-3">
      <CrossCloseButton className="ml-auto" onClick={() => onClose(false)}variant="outline">Cancel</CrossCloseButton>
      </div>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Habit Name</DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0 w-200">
            <HabitCard />
           
             
           </div>
          <DrawerFooter>
          
            <DrawerClose asChild>
            
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
