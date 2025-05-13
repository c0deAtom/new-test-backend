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
            timestamp: 'desc'
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Delete associated events first due to foreign key constraints
    await prisma.habitEvent.deleteMany({
      where: { habitId: params.id },
    });

    // Delete the habit
    await prisma.habit.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Habit deleted successfully" });
  } catch (error) {
    console.error("Error deleting habit:", error);
    return NextResponse.json({ error: "Failed to delete habit" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      goalType,
      microGoal,
      triggers,
      cravingNarrative,
      resistanceStyle,
      motivationOverride,
      reflectionDepthOverride,
      hitDefinition,
      slipDefinition
    } = body;

    // Validate required fields
    if (!params.id) {
      return NextResponse.json({ error: 'Habit ID is required' }, { status: 400 });
    }

    // Build update data object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (goalType !== undefined) updateData.goalType = goalType;
    if (microGoal !== undefined) updateData.microGoal = microGoal;
    if (triggers !== undefined && Array.isArray(triggers)) updateData.triggers = triggers;
    if (cravingNarrative !== undefined) updateData.cravingNarrative = cravingNarrative;
    if (resistanceStyle !== undefined) updateData.resistanceStyle = resistanceStyle;
    if (motivationOverride !== undefined) updateData.motivationOverride = motivationOverride;
    if (reflectionDepthOverride !== undefined) updateData.reflectionDepthOverride = reflectionDepthOverride;
    if (hitDefinition !== undefined) updateData.hitDefinition = hitDefinition;
    if (slipDefinition !== undefined) updateData.slipDefinition = slipDefinition;

    const updatedHabit = await prisma.habit.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedHabit, { status: 200 });
  } catch (error) {
    console.error('Error updating habit:', error);
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 });
  }
} 