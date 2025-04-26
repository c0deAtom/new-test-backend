'use client'

import { ButtonDownAero, ButtonIcon } from "@/components/Button";
import { Pencil, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { EventTable } from "./EventTable";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"


  

export default function HabitCard() {
const [showMenu, setShowMenu] = useState(false)
const [expand, setExpand] = useState(false)
const divRef = useRef<HTMLDivElement>(null);


useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (divRef.current && !divRef.current.contains(event.target as Node)) {
      setExpand(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);



  return (
    <Card>
      
    <CardHeader>
      <div className="ml-auto">
    <ButtonDownAero onClick={() => setShowMenu(prev => !prev)} />
      {showMenu && ( 
        <div className="absolute right-0 mt-2 w-36 rounded-md shadow-md bg-white ring-1 ring-black ring-opacity-5 z-20">
          <div className="py-1 flex flex-col">
            <button
              onClick={() => {console.log("clicked")}}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>

            <button
              onClick={() => {console.log("clicked")}}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
      <CardTitle>Card Title</CardTitle>
      <CardDescription>Card Description</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Card Content</p>
    </CardContent>
    <CardFooter>
      <p>Card Footer</p>
    
    
    </CardFooter>
    <div ref={divRef}>
    <div className="ml-58   ">
      <ButtonDownAero  onClick={() => (setExpand(prev => !prev))}></ButtonDownAero>
      
     
      </div >
    {expand && (
       <div className="mx-4 w-62 h-40 overflow-y-auto bg-gray-100 border rounded shadow">
      <EventTable />
     
     </div>
      )}
      </div>
  </Card>
  
  );
}
