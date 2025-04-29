"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer } from "recharts"
import Link from "next/link"
import NavigationMenuDemo from "./Navbar"

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

import { CrossCloseButton } from "./Button"
import { Habit } from "./HabitCard"


export function HabitDrawer({showData}: Habit) {
  const [goal, setGoal] = React.useState(350)
 

console.log(showData)
  function onClick(adjustment: number) {
    setGoal(Math.max(200, Math.min(400, goal + adjustment)))
  }

  return (
    <Drawer open={false} >
        
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
