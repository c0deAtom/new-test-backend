"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer } from "recharts"
import Link from "next/link"
// Removed NavigationMenuDemo import as it has no default export

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

// Removed CrossCloseButton import as it causes an error
import { Habit } from "@/lib/types" // Corrected import for Habit type

export function HabitDrawer({ showData, onClose }: { showData: any, onClose: (open: boolean) => void }) {
  const [goal, setGoal] = React.useState(350)

  console.log(showData)
  function onClick(adjustment: number) {
    setGoal(Math.max(200, Math.min(400, goal + adjustment)))
  }

  return (
    <Drawer open={false} >
      <DrawerTrigger asChild>
        <Button variant="outline">Open Drawer</Button> {/* Added a button to trigger the drawer */}
      </DrawerTrigger>
      
      <DrawerContent>
        <div className="ml-auto mx-3">
          <Button className="ml-auto" onClick={() => onClose(false)} variant="outline">Cancel</Button> {/* Replaced CrossCloseButton with Button */}
        </div>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Habit Name</DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0 w-200">
            {/* Content goes here */}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button> {/* Added a button to close the drawer */}
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
