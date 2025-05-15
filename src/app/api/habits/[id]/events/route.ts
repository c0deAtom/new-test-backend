// app/api/habits/[id]/events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new event
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { type } = await request.json();
    const habitId = params.id;

    if (!habitId) {
      return NextResponse.json({ error: 'Habit ID is required' }, { status: 400 });
    }

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

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}

// Update an existing event
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const habitEventId = params.id;
    const body = await request.json();

    if (!habitEventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

// Delete an event
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id;
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }
    await prisma.habitEvent.delete({
      where: { id: eventId },
    });
    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
