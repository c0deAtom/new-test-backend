import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const habit = await prisma.habit.findUnique({
      where: { id: params.id },
      include: {
        events: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    return NextResponse.json(habit);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch habit' }, { status: 500 });
  }
} 