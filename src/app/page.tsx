'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StudentPage from "./student/page";
import HabitsPage from "./habits/page";
import { AIChatBox } from "@/components/AIChatBox";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-4">
        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="habits">Routine</TabsTrigger>
          </TabsList>
          <TabsContent value="student" className="mt-4">
            <StudentPage />
          </TabsContent>
          <TabsContent value="habits" className="mt-4">
            <HabitsPage />
          </TabsContent>
        </Tabs>
      </div>
      <div className="w-[400px] mr-15 ">
        <AIChatBox />
      </div>
    </div>
  );
}
