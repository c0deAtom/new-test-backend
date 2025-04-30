import Image from "next/image";
import Navbar from "@/components/Navbar"

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto p-4">
        {/* Page content will go here */}
        <h1 className="text-2xl font-bold">Welcome to DayOne</h1>
        <p>This is the main content area.</p>
      </main>
    </>
  );
}
