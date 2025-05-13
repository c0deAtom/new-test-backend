import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { Navbar } from "@/components/Navbar"

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { habitId: string } }) {
  const habitId = params.habitId;
  const body = await req.json();

  try {
    const newEvent = await prisma.habitEvent.create({
      data: {
        habitId: habitId,
        userId: body.userId,
        type: body.type, // 'HIT' or 'SLIP'
        timestamp: new Date(),
        mood: body.mood,
        intensity: body.intensity,
        reflectionNote: body.reflectionNote,
        emotionTags: body.emotionTags,
        aiPromptUsed: body.aiPromptUsed || null,
        isReversal: body.isReversal || false,
      },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to create HabitEvent' }, { status: 500 });
  }
}
