'use client';

import Link from 'next/link';
import * as React from "react";
import { useState } from 'react'; // Keep state for dropdown if needed, though DropdownMenu handles its own state.
import { User, LogOut, Settings, LayoutDashboard, Target } from 'lucide-react'; // Import icons

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"; // Import Shadcn NavigationMenu components

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Corrected import path

import { Button } from "@/components/ui/button"; // Import Shadcn Button

export default function Navbar() {
  // Dropdown state is handled by DropdownMenuTrigger/DropdownMenuContent

  return (
    <nav className="border-b px-4 py-2">
      <div className="max-w-screen-xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-lg font-semibold">
          Welcome {/* Or maybe an App Logo/Name */}
        </Link>

        <div className="flex items-center gap-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem asChild>
                <Link href="/dashboard" passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem asChild>
                <Link href="/habits" passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Target className="mr-2 h-4 w-4" /> Habits
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              {/* Add more navigation items here if needed */}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Profile Dropdown using Shadcn DropdownMenu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <User className="h-4 w-4" />
                <span className="sr-only">Open user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                 <Link href="/profile" className="flex items-center w-full">
                   <Settings className="mr-2 h-4 w-4" />
                   <span>Profile</span>
                 </Link>
              </DropdownMenuItem>
              {/* Add other items like Settings, Billing etc. if needed */}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/logout" className="flex items-center w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </Link>
              </DropdownMenuItem>
               <DropdownMenuSeparator />
               <DropdownMenuItem asChild>
                <Link href="/login" className="flex items-center w-full">
                  {/* Using LogOut icon temporarily, replace if a specific login icon is preferred */}
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log In</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </nav>
  );
}
