"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export function ButtonIcon({ onClick }: { onClick?: () => void }) {
  return (
    <Button variant="outline" size="icon" onClick={onClick}>
      <Plus />
    </Button>
  )
}

export function ButtonDownAero({ onClick }: { onClick?: () => void }) {
  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={onClick}
      className="w-8 h-8 p-0" // smaller size button
    >
      <ChevronDown className="w-4 h-4" /> {/* smaller down arrow */}
    </Button>
  )
}