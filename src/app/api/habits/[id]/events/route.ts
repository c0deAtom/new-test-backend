import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: any
) {
  console.log('1111111')
  try {
    const { type } = await request.json();
    const habitId = params.id;

    // Get the habit to get the userId
    const habit = await prisma.habit.findUnique({
      where: { id: habitId }
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }
    // Create a new event
    const event = await prisma.habitEvent.create({
      data: {
        habitId,
        userId: habit.userId,
        type,
        mood: 'null'
      }
    });
    console.log('222222')
    console.log(NextResponse.json(event))

    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
} 



// app/api/habits/[id]/events/route.ts




export async function DELETE(
  
  request: Request,
  { params }: { params: { id: string } }
) {
 
  try {
   
    const { id: eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    await prisma.habitEvent.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}