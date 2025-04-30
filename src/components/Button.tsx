"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { X } from "lucide-react";

export function ButtonIcon({ onClick }: { onClick?: () => void }) {
  return (
    <Button variant="outline" size="lg" onClick={onClick}>
      <Plus />
    </Button>
  )
}

export function ButtonDownAero({ onClick }: { onClick?: () => void }) {
  return (
    <Button 
      variant="no border" 
      size="icon" 
      onClick={onClick}
      className="w-8 h-8 p-0" // smaller size button
    >
      <ChevronDown className="w-4 h-4" /> {/* smaller down arrow */}
    </Button>
  )
}




export function CrossCloseButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="text-red-500 hover:bg-red-100 hover:text-red-700"
    >
      <X className="h-50 w-50" />
    </Button>
  );
}