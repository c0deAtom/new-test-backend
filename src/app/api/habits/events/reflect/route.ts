import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// import { getAuth } from '@clerk/nextjs/server'; // Assuming Clerk for auth - Commented out

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // TODO: Implement proper authentication and authorization
  // const { userId } = getAuth(req); // Commented out
  // if (!userId) { // Commented out
  //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 }); // Commented out
  // } // Commented out

  try {
    const { eventId, reflectionNote } = await req.json();

    if (!eventId || typeof eventId !== 'string') {
      return NextResponse.json({ message: 'Event ID is required' }, { status: 400 });
    }
    if (typeof reflectionNote !== 'string') { // Allow empty string, but must be string
      return NextResponse.json({ message: 'Reflection note must be a string' }, { status: 400 });
    }

    // TODO: Add check to ensure the event belongs to the authenticated user

    const updatedEvent = await prisma.habitEvent.update({
      where: { id: eventId },
      data: {
        reflectionNote: reflectionNote.trim(),
      },
    });

    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error) {
    console.error("Error updating reflection note:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
} 