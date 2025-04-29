// app/api/habits/[id]/events/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new event
export async function POST(request: Request, { params }: any) {
  console.log('1111111');
  try {
    const { type } = await request.json();
    const habitId = params.id;

    const habit = await prisma.habit.findUnique({
      where: { id: habitId }
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const event = await prisma.habitEvent.create({
      data: {
        habitId,
        userId: habit.userId,
        type,
        mood: 'null', // temporary placeholder
      }
    });

    console.log('222222');
    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}

// Update an existing event
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const habitEventId = params.id;
    const body = await request.json();

    const { mood, intensity, reflectionNote, emotionTags } = body;

    const updatedEvent = await prisma.habitEvent.update({
      where: { id: habitEventId },
      data: {
        mood,
        intensity,
        reflectionNote,
        emotionTags,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

// Delete an event
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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
